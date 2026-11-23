const { pool } = require('../db/pool');
const config = require('../config');
const fineService = require('./fineService');
const emailService = require('./emailService');

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

async function issueBook({ studentUsername, studentId, bookTitle, bookId, rentalDays }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // find student
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

    // check unpaid fines
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

    // check active loan limit
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

    // lock book row to avoid concurrent issue race conditions
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

    // cannot borrow same book twice concurrently
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

    if (book.copies <= 0) {
      const err = new Error('No copies of this book are available');
      err.status = 400;
      throw err;
    }

    const issueDate = new Date();
    const dueDate = new Date();
    const days = rentalDays ? parseInt(rentalDays, 10) : config.LOAN_DAYS;
    dueDate.setDate(dueDate.getDate() + days);

    const insertTransResult = await client.query(
      `INSERT INTO "transaction" (student_id, book_id, issue_date, due_date, fine, fine_paid, renew_count)
       VALUES ($1, $2, $3, $4, 0, false, 0)
       RETURNING *`,
      [student.id, book.id, issueDate, dueDate]
    );
    const newTransaction = insertTransResult.rows[0];

    await client.query(
      'UPDATE book SET copies = copies - 1 WHERE id = $1',
      [book.id]
    );

    // mark any waiting reservation as fulfilled
    await client.query(
      `UPDATE reservation SET status = 'FULFILLED'
       WHERE student_id = $1 AND book_id = $2 AND status IN ('WAITING', 'READY')`,
      [student.id, book.id]
    );

    await client.query('COMMIT');

    // send confirmation email
    if (student.email) {
      const subject = `Library Notification: Book Issued - ${book.title}`;
      const body = `Dear ${student.full_name || student.username},\n\n` +
        `The following book has been issued to your library account:\n\n` +
        `Title: ${book.title}\n` +
        `Author: ${book.author || 'N/A'}\n` +
        `Issue Date: ${formatDate(issueDate)}\n` +
        `Due Date: ${formatDate(dueDate)}\n\n` +
        `Please return the book on or before the due date to avoid late fines.\n\n` +
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

async function returnBook(transId, requestingUserId = null, isAdmin = false) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // lock transaction row
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

    // students can only return their own books
    if (!isAdmin && requestingUserId && t.student_id !== requestingUserId) {
      const err = new Error('Unauthorized to return this book transaction');
      err.status = 403;
      throw err;
    }

    if (t.return_date) {
      const err = new Error('Book already returned');
      err.status = 400;
      throw err;
    }

    const returnDate = new Date();
    const { fine } = fineService.calculateFine(t.due_date, returnDate);

    await client.query(
      `UPDATE "transaction"
       SET return_date = $1, fine = $2, fine_paid = ($2 = 0)
       WHERE id = $3`,
      [returnDate, fine, transId]
    );

    const bookResult = await client.query(
      'UPDATE book SET copies = copies + 1 WHERE id = $1 RETURNING *',
      [t.book_id]
    );
    const updatedBook = bookResult.rows[0];

    // check if someone is waiting in reservations
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

      if (nextReservation.email) {
        const subject = `Your reserved book "${t.title}" is ready`;
        const body = `Dear ${nextReservation.full_name},\n\n` +
          `A copy of "${t.title}" has been returned to the library and is now reserved for you.\n` +
          `Please visit the library counter to have it issued.\n\n` +
          `Library Management Team`;

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

async function renewBook(transId, studentId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // lock transaction row
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

    if (t.student_id !== studentId) {
      const err = new Error('You can only renew your own borrowed books.');
      err.status = 403;
      throw err;
    }

    if (t.return_date) {
      const err = new Error('Cannot renew a book that has already been returned.');
      err.status = 400;
      throw err;
    }

    if (new Date(t.due_date).getTime() < Date.now()) {
      const err = new Error('Cannot renew an overdue book. Please return the book and clear any late fees.');
      err.status = 400;
      throw err;
    }

    // max 2 renewals
    if (t.renew_count >= 2) {
      const err = new Error('Renewal limit reached: You can renew a book at most 2 times.');
      err.status = 400;
      throw err;
    }

    // cannot renew if waitlist is active
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
