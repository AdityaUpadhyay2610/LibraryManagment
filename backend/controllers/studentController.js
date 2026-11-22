const { pool } = require('../db/pool');
const transactionService = require('../services/transactionService');
const { sanitizeUser } = require('./authController');

async function dashboard(req, res) {
  const studentId = req.session.user.id;

  const userResult = await pool.query('SELECT * FROM app_user WHERE id = $1', [studentId]);
  if (userResult.rows.length === 0) {
    return res.status(401).json({ message: 'User session not found' });
  }
  const user = sanitizeUser(userResult.rows[0]);

  const myTransResult = await pool.query(`
    SELECT 
      t.id, t.issue_date AS "issueDate", t.due_date AS "dueDate", t.return_date AS "returnDate",
      t.fine, t.fine_paid AS "finePaid", t.renew_count AS "renewCount",
      b.id AS book_id, b.title AS book_title, b.author AS book_author,
      b.copies AS book_copies, b.image_url AS book_image_url, b.isbn AS book_isbn, b.category AS book_category
    FROM "transaction" t
    JOIN book b ON t.book_id = b.id
    WHERE t.student_id = $1
    ORDER BY t.return_date NULLS FIRST, t.id DESC
  `, [studentId]);

  const myBooks = myTransResult.rows.map((r) => ({
    id: r.id,
    issueDate: r.issueDate,
    dueDate: r.dueDate,
    returnDate: r.returnDate,
    fine: r.fine !== null ? parseFloat(r.fine) : 0.0,
    finePaid: r.finePaid,
    renewCount: r.renewCount,
    book: {
      id: r.book_id,
      title: r.book_title,
      author: r.book_author,
      copies: r.book_copies,
      imageUrl: r.book_image_url,
      isbn: r.book_isbn,
      category: r.book_category,
    },
  }));

  const catalogResult = await pool.query(`
    SELECT id, title, author, isbn, category, copies, total_copies AS "totalCopies", image_url AS "imageUrl"
    FROM book
    ORDER BY id ASC
  `);
  const catalog = catalogResult.rows;

  return res.status(200).json({
    user,
    myBooks,
    catalog,
  });
}

async function returnBook(req, res) {
  const transId = parseInt(req.params.transId, 10);
  const studentId = req.session.user.id;

  const result = await transactionService.returnBook(transId, studentId, false);

  return res.status(200).json({
    message: 'Book returned successfully',
    fine: result.fine,
  });
}

async function renewBook(req, res) {
  const transId = parseInt(req.params.transId, 10);
  const studentId = req.session.user.id;

  const result = await transactionService.renewBook(transId, studentId);
  return res.status(200).json(result);
}

async function reserveBook(req, res) {
  const bookId = parseInt(req.params.bookId, 10);
  const studentId = req.session.user.id;

  const bookCheck = await pool.query('SELECT * FROM book WHERE id = $1', [bookId]);
  if (bookCheck.rows.length === 0) {
    return res.status(404).json({ message: 'Book not found' });
  }

  const book = bookCheck.rows[0];

  // only allow reservation when out of stock
  if (book.copies > 0) {
    return res.status(400).json({
      message: 'Copies are currently available in the library! You can borrow it directly without placing a reservation.',
    });
  }

  // check if student already has a pending reservation
  const existingReservation = await pool.query(
    'SELECT id FROM reservation WHERE student_id = $1 AND book_id = $2 AND status IN (\'WAITING\', \'READY\')',
    [studentId, bookId]
  );
  if (existingReservation.rows.length > 0) {
    return res.status(400).json({ message: 'You already have an active reservation for this book.' });
  }

  // check if student currently holds a copy
  const currentLoan = await pool.query(
    'SELECT id FROM "transaction" WHERE student_id = $1 AND book_id = $2 AND return_date IS NULL',
    [studentId, bookId]
  );
  if (currentLoan.rows.length > 0) {
    return res.status(400).json({ message: 'You already currently have an active borrowed copy of this book.' });
  }

  const insertResult = await pool.query(
    `INSERT INTO reservation (student_id, book_id, status)
     VALUES ($1, $2, 'WAITING')
     RETURNING *`,
    [studentId, bookId]
  );

  return res.status(200).json({
    message: 'Book reserved successfully! You will be notified by email when a copy is returned.',
    reservation: insertResult.rows[0],
  });
}

async function cancelReservation(req, res) {
  const reservationId = parseInt(req.params.id, 10);
  const studentId = req.session.user.id;

  const resCheck = await pool.query(
    'SELECT * FROM reservation WHERE id = $1 AND student_id = $2',
    [reservationId, studentId]
  );
  if (resCheck.rows.length === 0) {
    return res.status(404).json({ message: 'Reservation not found.' });
  }

  await pool.query(
    "UPDATE reservation SET status = 'CANCELLED' WHERE id = $1",
    [reservationId]
  );

  return res.status(200).json({ message: 'Reservation cancelled successfully' });
}

async function getMyReservations(req, res) {
  const studentId = req.session.user.id;
  const result = await pool.query(`
    SELECT r.id, r.status, r.created_at AS "createdAt",
           b.id AS book_id, b.title AS book_title, b.author AS book_author, b.image_url AS book_image_url
    FROM reservation r
    JOIN book b ON r.book_id = b.id
    WHERE r.student_id = $1
    ORDER BY r.id DESC
  `, [studentId]);

  return res.status(200).json(result.rows);
}

async function getMyFines(req, res) {
  const studentId = req.session.user.id;
  const result = await pool.query(`
    SELECT t.id, t.issue_date AS "issueDate", t.due_date AS "dueDate", t.return_date AS "returnDate",
           t.fine, t.fine_paid AS "finePaid",
           b.title AS book_title
    FROM "transaction" t
    JOIN book b ON t.book_id = b.id
    WHERE t.student_id = $1 AND t.fine > 0
    ORDER BY t.fine_paid ASC, t.id DESC
  `, [studentId]);

  const unpaidFines = result.rows
    .filter((r) => !r.finePaid)
    .reduce((sum, r) => sum + parseFloat(r.fine || 0), 0);

  return res.status(200).json({
    totalUnpaidFines: parseFloat(unpaidFines.toFixed(2)),
    records: result.rows,
  });
}

async function getMyHistory(req, res) {
  const studentId = req.session.user.id;
  const result = await pool.query(`
    SELECT t.id, t.issue_date AS "issueDate", t.due_date AS "dueDate", t.return_date AS "returnDate",
           t.fine, t.fine_paid AS "finePaid", t.renew_count AS "renewCount",
           b.id AS book_id, b.title AS book_title, b.author AS book_author, b.image_url AS book_image_url
    FROM "transaction" t
    JOIN book b ON t.book_id = b.id
    WHERE t.student_id = $1
    ORDER BY t.id DESC
  `, [studentId]);

  return res.status(200).json(result.rows);
}

module.exports = {
  dashboard,
  returnBook,
  renewBook,
  reserveBook,
  cancelReservation,
  getMyReservations,
  getMyFines,
  getMyHistory,
};
