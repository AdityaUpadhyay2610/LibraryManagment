// backend/services/transactionService.js
// Handles book issuing, returning, and renewals inside PostgreSQL database transactions.
// Uses row locks (SELECT ... FOR UPDATE) to prevent race conditions (e.g. concurrent issues of the last copy).

const { pool } = require('../db/pool');
const config = require('../config');
const fineService = require('./fineService');
const emailService = require('./emailService');

/**
 * Format a Date object to "dd-MMM-yyyy HH:mm" for user-friendly emails.
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  const d = new Date(date);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(d.getDate()).padStart(2, '0');
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}-${month}-${year} ${hours}:${minutes}`;
}

/**
 * Issues a book to a student.
 * Performs checks: student validity, unpaid fines, max active loans limit, duplicate active loan, and stock availability.
 * @param {Object} params
 * @param {string} [params.studentUsername] - Student username
 * @param {number} [params.studentId] - Student user ID
 * @param {string} [params.bookTitle] - Book title
 * @param {number} [params.bookId] - Book ID
 */
async function issueBook({ studentUsername, studentId, bookTitle, bookId }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Locate student
    let studentResult;
    if (studentId) {
      studentResult = await client.query('SELECT * FROM app_user WHERE id = $1', [studentId]);
    } else {
      studentResult = await client.query('SELECT * FROM app_user WHERE username = $1', [studentUsername]);
    }

    if (studentResult.rows.length === 0) {
      const err = new Error('Student username not found');
      err.status = 400;
      throw err;
    }
    const student = studentResult.rows[0];

    // 2. Check for unpaid fines
    const fineCheck = await client.query(
      `SELECT COALESCE(SUM(fine), 0) AS total_unpaid
       FROM "transaction"
       WHERE student_id = $1 AND fine_paid = false AND fine > 0`,
      [student.id]
    );
    const totalUnpaidFines = parseFloat(fineCheck.rows[0].total_unpaid || 0);
    if (totalUnpaidFines > 0) {
      const err = new Error(`Student has unpaid fines of ₹${totalUnpaidFines.toFixed(2)}. Please clear fines before issuing new books.`);
      err.status = 400;
      throw err;
    }

    // 3. Check active loan limit (max 3 books by default)
    const activeLoansCheck = await client.query(
      `SELECT COUNT(*) AS active_count
       FROM "transaction"
       WHERE student_id = $1 AND return_date IS NULL`,
      [student.id]
    );
    const activeCount = parseInt(activeLoansCheck.rows[0].active_count, 10);
    if (activeCount >= config.MAX_BOOKS_PER_STUDENT) {
      const err = new Error(`Borrowing limit reached: Student already holds ${activeCount} active book(s) (maximum allowed: ${config.MAX_BOOKS_PER_STUDENT}).`);
      err.status = 400;
      throw err;
    }

    // 4. Locate and LOCK book row to prevent race conditions
    let bookResult;
    if (bookId) {
      bookResult = await client.query('SELECT * FROM book WHERE id = $1 FOR UPDATE', [bookId]);
    } else {
      bookResult = await client.query('SELECT * FROM book WHERE title = $1 FOR UPDATE', [bookTitle]);
    }

    if (bookResult.rows.length === 0) {
      const err = new Error('Book title not found');
      err.status = 400;
      throw err;
    }
    const book = bookResult.rows[0];

    // 5. Prevent duplicate borrowing of the same book
    const duplicateCheck = await client.query(
      `SELECT id FROM "transaction"
       WHERE student_id = $1 AND book_id = $2 AND return_date IS NULL`,
      [student.id, book.id]
    );
    if (duplicateCheck.rows.length > 0) {
      const err = new Error('Student already has an active borrowed copy of this book.');
      err.status = 400;
      throw err;
    }

    // 6. Check stock availability
    if (book.copies <= 0) {
      const err = new Error('No copies of this book are available');
      err.status = 400;
      throw err;
    }

    // 7. Calculate issue date and due date (+7 days)
    const issueDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + config.LOAN_DAYS);

    // 8. Insert new transaction record
    const insertTransResult = await client.query(
      `INSERT INTO "transaction" (student_id, book_id, issue_date, due_date, fine, fine_paid, renew_count)
       VALUES ($1, $2, $3, $4, 0, false, 0)
       RETURNING *`,
      [student.id, book.id, issueDate, dueDate]
    );
    const newTransaction = insertTransResult.rows[0];

    // 9. Decrement available book copies
    await client.query(
      'UPDATE book SET copies = copies - 1 WHERE id = $1',
      [book.id]
    );

    // 10. If student had an active reservation for this book, mark it fulfilled
    await client.query(
      `UPDATE reservation SET status = 'FULFILLED'
       WHERE student_id = $1 AND book_id = $2 AND status IN ('WAITING', 'READY')`,
      [student.id, book.id]
    );

    await client.query('COMMIT');

    // 11. Send notification email asynchronously (safe, non-blocking)
    if (student.email) {
      const subject = `📚 Library Notification: Book Issued - ${book.title}`;
      const body = `Dear ${student.full_name || student.username},\n\n` +
        `We are pleased to inform you that the following book has been successfully issued to your library account. Please find the transaction details below:\n\n` +
        `📖 BOOK DETAILS\n` +
        `-----------------------------------------------------\n` +
        `Title         : ${book.title}\n` +
        `Author        : ${book.author || 'N/A'}\n` +
        `Issue Date    : ${formatDate(issueDate)}\n` +
        `Due Date      : ${formatDate(dueDate)}\n` +
        `-----------------------------------------------------\n\n` +
        `⚠️ TERMS & CONDITIONS\n` +
        `1. Please ensure the book is returned on or before the Due Date mentioned above.\n` +
        `2. Late Returns will incur a fine of ₹${config.FINE_PER_DAY.toFixed(2)} per day.\n` +
        `3. Please maintain the book in good condition to avoid damage charges.\n\n` +
        `Thank you for using our library services.\n\n` +
        `Best Regards,\n` +
        `Library Management Team`;

      emailService.sendEmail(student.email, subject, body).catch(() => {});
    }

    return {
      transaction: {
        ...newTransaction,
        student: {
          id: student.id,
          username: student.username,
          fullName: student.full_name,
          email: student.email,
        },
        book: {
          id: book.id,
          title: book.title,
          author: book.author,
          imageUrl: book.image_url,
        },
      },
      book,
      student,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Returns a borrowed book.
 * Computes overdue fine, restores book copies, and notifies next student on the waitlist.
 * @param {number} transId - Transaction ID
 * @param {number} [requestingUserId] - ID of user making request (for student self-return check)
 * @param {boolean} [isAdmin=false] - Whether the caller is an Admin
 */
async function returnBook(transId, requestingUserId = null, isAdmin = false) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Lock transaction row
    const transResult = await client.query(
      `SELECT t.*, u.username, u.full_name, u.email, b.title, b.author
       FROM "transaction" t
       JOIN app_user u ON t.student_id = u.id
       JOIN book b ON t.book_id = b.id
       WHERE t.id = $1
       FOR UPDATE OF t`,
      [transId]
    );

    if (transResult.rows.length === 0) {
      const err = new Error('Transaction not found');
      err.status = 404;
      throw err;
    }
    const t = transResult.rows[0];

    // 2. Ownership check for student return
    if (!isAdmin && requestingUserId && t.student_id !== requestingUserId) {
      const err = new Error('Unauthorized to return this book transaction');
      err.status = 403;
      throw err;
    }

    // 3. Check if already returned
    if (t.return_date) {
      const err = new Error('Book already returned');
      err.status = 400;
      throw err;
    }

    const returnDate = new Date();
    const { fine } = fineService.calculateFine(t.due_date, returnDate);

    // 4. Update transaction
    await client.query(
      `UPDATE "transaction"
       SET return_date = $1, fine = $2, fine_paid = ($2 = 0)
       WHERE id = $3`,
      [returnDate, fine, transId]
    );

    // 5. Increment book copies (with lock)
    const bookResult = await client.query(
      'UPDATE book SET copies = copies + 1 WHERE id = $1 RETURNING *',
      [t.book_id]
    );
    const updatedBook = bookResult.rows[0];

    // 6. Check waitlist (reservations) for this book
    const reservationResult = await client.query(
      `SELECT r.*, u.full_name, u.email
       FROM reservation r
       JOIN app_user u ON r.student_id = u.id
       WHERE r.book_id = $1 AND r.status = 'WAITING'
       ORDER BY r.created_at ASC
       LIMIT 1
       FOR UPDATE OF r`,
      [t.book_id]
    );

    if (reservationResult.rows.length > 0) {
      const nextReservation = reservationResult.rows[0];
      await client.query(
        "UPDATE reservation SET status = 'READY' WHERE id = $1",
        [nextReservation.id]
      );

      // Email the next student on the waitlist
      if (nextReservation.email) {
        const subject = `🎉 Good news! Your reserved book "${t.title}" is ready!`;
        const body = `Dear ${nextReservation.full_name},\n\n` +
          `A copy of "${t.title}" has just been returned to the library and is now reserved for you!\n` +
          `Please visit the library counter to have it issued to your account.\n\n` +
          `Best Regards,\nLibrary Management Team`;

        emailService.sendEmail(nextReservation.email, subject, body).catch(() => {});
      }
    }

    await client.query('COMMIT');

    return {
      fine,
      returnDate,
      book: updatedBook,
      transaction: t,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Renews a borrowed book by extending its due date by LOAN_DAYS.
 * Allowed up to 2 times, provided it is not overdue and no other student is waiting on a reservation.
 * @param {number} transId - Transaction ID
 * @param {number} studentId - Student user ID
 */
async function renewBook(transId, studentId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Lock transaction row
    const transResult = await client.query(
      `SELECT t.*, b.title
       FROM "transaction" t
       JOIN book b ON t.book_id = b.id
       WHERE t.id = $1
       FOR UPDATE OF t`,
      [transId]
    );

    if (transResult.rows.length === 0) {
      const err = new Error('Transaction not found');
      err.status = 404;
      throw err;
    }
    const t = transResult.rows[0];

    // 2. Ownership check
    if (t.student_id !== studentId) {
      const err = new Error('You can only renew your own borrowed books.');
      err.status = 403;
      throw err;
    }

    // 3. Check already returned
    if (t.return_date) {
      const err = new Error('Cannot renew a book that has already been returned.');
      err.status = 400;
      throw err;
    }

    // 4. Overdue check: cannot renew if already past due date
    if (new Date(t.due_date).getTime() < Date.now()) {
      const err = new Error('Cannot renew an overdue book. Please return the book and clear any late fees.');
      err.status = 400;
      throw err;
    }

    // 5. Renewal limit check (max 2 renewals)
    if (t.renew_count >= 2) {
      const err = new Error('Renewal limit reached: You can renew a book at most 2 times.');
      err.status = 400;
      throw err;
    }

    // 6. Reservation waitlist check: cannot renew if someone is waiting
    const reservationCheck = await client.query(
      `SELECT id FROM reservation
       WHERE book_id = $1 AND status = 'WAITING'`,
      [t.book_id]
    );
    if (reservationCheck.rows.length > 0) {
      const err = new Error('Cannot renew: Another student is currently waiting in the reservation list for this book.');
      err.status = 400;
      throw err;
    }

    // 7. Extend due date by LOAN_DAYS
    const currentDue = new Date(t.due_date);
    const newDueDate = new Date(currentDue.getTime() + config.LOAN_DAYS * 24 * 60 * 60 * 1000);
    const newRenewCount = t.renew_count + 1;

    const updateResult = await client.query(
      `UPDATE "transaction"
       SET due_date = $1, renew_count = $2
       WHERE id = $3
       RETURNING *`,
      [newDueDate, newRenewCount, transId]
    );

    await client.query('COMMIT');

    return {
      message: `Book renewed successfully. New due date is ${formatDate(newDueDate)}.`,
      transaction: updateResult.rows[0],
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  issueBook,
  returnBook,
  renewBook,
  formatDate,
};
