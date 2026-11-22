const bcrypt = require('bcryptjs');
const xlsx = require('xlsx');
const { pool } = require('../db/pool');
const transactionService = require('../services/transactionService');
const fineService = require('../services/fineService');

async function viewDashboard(req, res) {
  const booksResult = await pool.query(`
    SELECT id, title, author, isbn, category, copies, total_copies AS "totalCopies", image_url AS "imageUrl", created_at AS "createdAt"
    FROM book
    ORDER BY id ASC
  `);
  const books = booksResult.rows;

  const usersResult = await pool.query(`
    SELECT id, username, full_name AS "fullName", role, branch, academic_year AS "year", email, created_at AS "createdAt"
    FROM app_user
    ORDER BY id ASC
  `);
  const users = usersResult.rows;

  const transResult = await pool.query(`
    SELECT 
      t.id, t.issue_date AS "issueDate", t.due_date AS "dueDate", t.return_date AS "returnDate",
      t.fine, t.fine_paid AS "finePaid", t.renew_count AS "renewCount",
      u.id AS student_id, u.username AS student_username, u.full_name AS student_full_name,
      u.role AS student_role, u.branch AS student_branch, u.academic_year AS student_year, u.email AS student_email,
      b.id AS book_id, b.title AS book_title, b.author AS book_author, b.copies AS book_copies, b.image_url AS book_image_url
    FROM "transaction" t
    JOIN app_user u ON t.student_id = u.id
    JOIN book b ON t.book_id = b.id
    ORDER BY t.id DESC
  `);

  const transactions = transResult.rows.map((r) => ({
    id: r.id,
    student: {
      id: r.student_id,
      username: r.student_username,
      fullName: r.student_full_name,
      role: r.student_role,
      branch: r.student_branch,
      year: r.student_year,
      email: r.student_email,
    },
    book: {
      id: r.book_id,
      title: r.book_title,
      author: r.book_author,
      copies: r.book_copies,
      imageUrl: r.book_image_url,
    },
    issueDate: r.issueDate,
    dueDate: r.dueDate,
    returnDate: r.returnDate,
    fine: r.fine !== null ? parseFloat(r.fine) : 0.0,
    finePaid: r.finePaid,
    renewCount: r.renewCount,
  }));

  const statBooks = books.reduce((sum, b) => sum + (b.copies || 0), 0);
  const statIssued = transactions.filter((t) => t.returnDate === null).length;
  const statStudents = users.filter((u) => u.role === 'ROLE_STUDENT').length;
  const statFines = transactions.reduce((sum, t) => sum + (t.fine || 0), 0);

  const branchList = [...new Set(users.map((u) => u.branch).filter((b) => b && b !== 'N/A'))];
  const yearList = [...new Set(users.map((u) => u.year).filter((y) => y && y !== 'N/A'))];

  return res.status(200).json({
    statBooks,
    statIssued,
    statStudents,
    statFines,
    transactions,
    books,
    users,
    branchList,
    yearList,
  });
}

async function issueBook(req, res) {
  const { studentUsername, studentId, bookTitle, bookId } = req.body;
  const result = await transactionService.issueBook({
    studentUsername,
    studentId,
    bookTitle,
    bookId,
  });

  return res.status(200).json({
    message: 'Book issued successfully',
    transaction: result.transaction,
  });
}

async function returnBook(req, res) {
  const transId = parseInt(req.params.transId, 10);
  const result = await transactionService.returnBook(transId, null, true);

  return res.status(200).json({
    message: 'Book returned successfully',
    fine: result.fine,
  });
}

async function addStudent(req, res) {
  const { username, password, fullName, branch, year, email, role } = req.body;

  const existing = await pool.query('SELECT id FROM app_user WHERE username = $1', [username]);
  if (existing.rows.length > 0) {
    return res.status(400).json({ message: 'Username is already taken' });
  }

  const assignedRole = (role === 'ROLE_ADMIN' || role === 'ADMIN') ? 'ROLE_ADMIN' : 'ROLE_STUDENT';
  const hashedPassword = await bcrypt.hash(password, 10);
  const insertResult = await pool.query(
    `INSERT INTO app_user (username, password, role, full_name, branch, academic_year, email)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, username, full_name AS "fullName", role, branch, academic_year AS "year", email, created_at AS "createdAt"`,
    [username, hashedPassword, assignedRole, fullName, branch || 'N/A', year || 'N/A', email || null]
  );

  return res.status(200).json({
    message: assignedRole === 'ROLE_ADMIN' ? 'Administrator account created successfully' : 'Student account created successfully',
    student: insertResult.rows[0],
    user: insertResult.rows[0],
  });
}

async function addBook(req, res) {
  const { title, author, copies, imageUrl, isbn, category } = req.body;

  const copiesNum = parseInt(copies, 10) || 1;
  const insertResult = await pool.query(
    `INSERT INTO book (title, author, copies, total_copies, image_url, isbn, category)
     VALUES ($1, $2, $3, $3, $4, $5, $6)
     RETURNING id, title, author, copies, total_copies AS "totalCopies", image_url AS "imageUrl", isbn, category`,
    [title, author || 'Unknown', copiesNum, imageUrl || null, isbn || null, category || 'General']
  );

  return res.status(200).json({
    message: 'Book added successfully',
    book: insertResult.rows[0],
  });
}

async function editBook(req, res) {
  const { id } = req.params;
  const { title, author, copies, imageUrl, isbn, category } = req.body;

  const existing = await pool.query('SELECT * FROM book WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    return res.status(404).json({ message: 'Book not found' });
  }

  const current = existing.rows[0];
  const newTitle = title || current.title;
  const newAuthor = author !== undefined ? author : current.author;
  const newCopies = copies !== undefined ? parseInt(copies, 10) : current.copies;
  const newImage = imageUrl !== undefined ? imageUrl : current.image_url;
  const newIsbn = isbn !== undefined ? isbn : current.isbn;
  const newCategory = category !== undefined ? category : current.category;

  const updateResult = await pool.query(
    `UPDATE book
     SET title = $1, author = $2, copies = $3, image_url = $4, isbn = $5, category = $6
     WHERE id = $7
     RETURNING id, title, author, copies, total_copies AS "totalCopies", image_url AS "imageUrl", isbn, category`,
    [newTitle, newAuthor, newCopies, newImage, newIsbn, newCategory, id]
  );

  return res.status(200).json({
    message: 'Book updated successfully',
    book: updateResult.rows[0],
  });
}

async function deleteBook(req, res) {
  const { id } = req.params;

  const bookCheck = await pool.query('SELECT * FROM book WHERE id = $1', [id]);
  if (bookCheck.rows.length === 0) {
    return res.status(404).json({ message: 'Book not found' });
  }

  // don't delete if copies are currently borrowed
  const activeLoans = await pool.query(
    'SELECT COUNT(*) FROM "transaction" WHERE book_id = $1 AND return_date IS NULL',
    [id]
  );
  if (parseInt(activeLoans.rows[0].count, 10) > 0) {
    return res.status(400).json({
      message: 'Cannot delete book with active loans. Please ensure all borrowed copies are returned first.',
    });
  }

  await pool.query('DELETE FROM "transaction" WHERE book_id = $1', [id]);
  await pool.query('DELETE FROM reservation WHERE book_id = $1', [id]);
  await pool.query('DELETE FROM book WHERE id = $1', [id]);

  return res.status(200).json({ message: 'Book deleted successfully' });
}

async function getStudents(req, res) {
  const { search } = req.query;
  const params = ['ROLE_STUDENT'];
  let where = 'WHERE role = $1';

  if (search && search.trim()) {
    params.push(`%${search.trim()}%`);
    where += ` AND (username ILIKE $2 OR full_name ILIKE $2 OR branch ILIKE $2 OR email ILIKE $2)`;
  }

  const query = `
    SELECT id, username, full_name AS "fullName", role, branch, academic_year AS "year", email, created_at AS "createdAt"
    FROM app_user
    ${where}
    ORDER BY id ASC
  `;
  const result = await pool.query(query, params);
  return res.status(200).json(result.rows);
}

async function editStudent(req, res) {
  const { id } = req.params;
  const { username, fullName, branch, year, email, password, role } = req.body;

  const existing = await pool.query('SELECT * FROM app_user WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    return res.status(404).json({ message: 'User not found' });
  }

  const current = existing.rows[0];

  let newUsername = current.username;
  if (username && username.trim() !== current.username) {
    const checkUsername = await pool.query('SELECT id FROM app_user WHERE username = $1 AND id != $2', [username.trim(), id]);
    if (checkUsername.rows.length > 0) {
      return res.status(400).json({ message: 'Username is already taken by another user.' });
    }
    newUsername = username.trim();
  }

  const newName = fullName !== undefined && fullName.trim() !== '' ? fullName.trim() : current.full_name;
  const newBranch = branch !== undefined ? branch : current.branch;
  const newYear = year !== undefined ? year : current.academic_year;
  const newEmail = email !== undefined ? email.trim() : current.email;
  const newRole = (role === 'ROLE_ADMIN' || role === 'ADMIN')
    ? 'ROLE_ADMIN'
    : (role === 'ROLE_STUDENT' || role === 'STUDENT' ? 'ROLE_STUDENT' : current.role);

  let newPassword = current.password;
  if (password && password.trim().length >= 6) {
    newPassword = await bcrypt.hash(password.trim(), 10);
  }

  const updateResult = await pool.query(
    `UPDATE app_user
     SET username = $1, full_name = $2, branch = $3, academic_year = $4, email = $5, password = $6, role = $7
     WHERE id = $8
     RETURNING id, username, full_name AS "fullName", role, branch, academic_year AS "year", email`,
    [newUsername, newName, newBranch, newYear, newEmail, newPassword, newRole, id]
  );

  return res.status(200).json({
    message: 'User profile updated successfully',
    student: updateResult.rows[0],
    user: updateResult.rows[0],
  });
}

async function resetStudentPassword(req, res) {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.trim().length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
  }

  const existing = await pool.query('SELECT id FROM app_user WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    return res.status(404).json({ message: 'User not found' });
  }

  const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);
  await pool.query('UPDATE app_user SET password = $1 WHERE id = $2', [hashedPassword, id]);

  return res.status(200).json({ message: 'Password reset successfully' });
}

async function deleteStudent(req, res) {
  const { id } = req.params;

  if (req.session && req.session.user && req.session.user.id === parseInt(id, 10)) {
    return res.status(400).json({ message: 'You cannot delete your own active admin account.' });
  }

  const existing = await pool.query('SELECT id, role FROM app_user WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    return res.status(404).json({ message: 'User not found' });
  }

  // don't delete if student still has books borrowed
  const activeLoans = await pool.query(
    'SELECT COUNT(*) FROM "transaction" WHERE student_id = $1 AND return_date IS NULL',
    [id]
  );
  if (parseInt(activeLoans.rows[0].count, 10) > 0) {
    return res.status(400).json({
      message: 'Cannot delete student who currently holds unreturned books.',
    });
  }

  await pool.query('DELETE FROM app_user WHERE id = $1', [id]);
  return res.status(200).json({ message: 'User deleted successfully' });
}

async function payFine(req, res) {
  const { id } = req.params;

  const transCheck = await pool.query('SELECT * FROM "transaction" WHERE id = $1', [id]);
  if (transCheck.rows.length === 0) {
    return res.status(404).json({ message: 'Transaction not found' });
  }

  await pool.query('UPDATE "transaction" SET fine_paid = true WHERE id = $1', [id]);
  return res.status(200).json({ message: 'Fine marked as paid successfully' });
}

async function getOverdueReport(req, res) {
  const query = `
    SELECT 
      t.id, t.issue_date AS "issueDate", t.due_date AS "dueDate",
      u.id AS "studentId", u.username AS "studentUsername", u.full_name AS "studentName", u.email AS "studentEmail",
      b.id AS "bookId", b.title AS "bookTitle", b.author AS "bookAuthor"
    FROM "transaction" t
    JOIN app_user u ON t.student_id = u.id
    JOIN book b ON t.book_id = b.id
    WHERE t.return_date IS NULL AND t.due_date < NOW()
    ORDER BY t.due_date ASC
  `;
  const result = await pool.query(query);

  const overdueList = result.rows.map((row) => {
    const { daysLate, fine } = fineService.calculateFine(row.dueDate, new Date());
    return {
      ...row,
      daysLate,
      estimatedFine: fine,
    };
  });

  return res.status(200).json(overdueList);
}

async function getStatsReport(req, res) {
  const totalBooksRes = await pool.query('SELECT COALESCE(SUM(copies), 0) AS total_available, COALESCE(SUM(total_copies), 0) AS total_inventory FROM book');
  const activeLoansRes = await pool.query('SELECT COUNT(*) AS active_count FROM "transaction" WHERE return_date IS NULL');
  const overdueLoansRes = await pool.query('SELECT COUNT(*) AS overdue_count FROM "transaction" WHERE return_date IS NULL AND due_date < NOW()');
  const finesRes = await pool.query('SELECT COALESCE(SUM(fine), 0) AS collected FROM "transaction" WHERE fine_paid = true');
  const unpaidFinesRes = await pool.query('SELECT COALESCE(SUM(fine), 0) AS pending FROM "transaction" WHERE fine_paid = false AND fine > 0');

  const popularBooksRes = await pool.query(`
    SELECT b.id, b.title, b.author, COUNT(t.id) AS borrow_count
    FROM "transaction" t
    JOIN book b ON t.book_id = b.id
    GROUP BY b.id, b.title, b.author
    ORDER BY borrow_count DESC
    LIMIT 5
  `);

  const branchUsageRes = await pool.query(`
    SELECT u.branch, COUNT(t.id) AS borrow_count
    FROM "transaction" t
    JOIN app_user u ON t.student_id = u.id
    WHERE u.branch IS NOT NULL AND u.branch != 'N/A'
    GROUP BY u.branch
    ORDER BY borrow_count DESC
  `);

  return res.status(200).json({
    totalAvailableCopies: parseInt(totalBooksRes.rows[0].total_available, 10),
    totalInventoryCopies: parseInt(totalBooksRes.rows[0].total_inventory, 10),
    activeLoans: parseInt(activeLoansRes.rows[0].active_count, 10),
    overdueLoans: parseInt(overdueLoansRes.rows[0].overdue_count, 10),
    finesCollected: parseFloat(finesRes.rows[0].collected),
    finesPending: parseFloat(unpaidFinesRes.rows[0].pending),
    popularBooks: popularBooksRes.rows,
    branchUsage: branchUsageRes.rows,
  });
}

async function getTransactions(req, res) {
  const { status, from, to, page = 1, limit = 15 } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 15));
  const offset = (pageNum - 1) * limitNum;

  const where = [];
  const params = [];

  if (status === 'active') {
    where.push('t.return_date IS NULL');
  } else if (status === 'returned') {
    where.push('t.return_date IS NOT NULL');
  } else if (status === 'overdue') {
    where.push('t.return_date IS NULL AND t.due_date < NOW()');
  }

  if (from) {
    params.push(from);
    where.push(`t.issue_date >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    where.push(`t.issue_date <= $${params.length}`);
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  const countQuery = `SELECT COUNT(*) AS total FROM "transaction" t ${whereSql}`;
  const countRes = await pool.query(countQuery, params);
  const total = parseInt(countRes.rows[0].total, 10);

  params.push(limitNum);
  const limitIdx = params.length;
  params.push(offset);
  const offsetIdx = params.length;

  const dataQuery = `
    SELECT 
      t.id, t.issue_date AS "issueDate", t.due_date AS "dueDate", t.return_date AS "returnDate",
      t.fine, t.fine_paid AS "finePaid", t.renew_count AS "renewCount",
      u.id AS student_id, u.username AS student_username, u.full_name AS student_full_name,
      b.id AS book_id, b.title AS book_title, b.author AS book_author
    FROM "transaction" t
    JOIN app_user u ON t.student_id = u.id
    JOIN book b ON t.book_id = b.id
    ${whereSql}
    ORDER BY t.id DESC
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;
  const result = await pool.query(dataQuery, params);

  return res.status(200).json({
    transactions: result.rows,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum) || 1,
  });
}

async function exportTransactionsCsv(req, res) {
  const query = `
    SELECT 
      t.id, u.username AS student_username, u.full_name AS student_name,
      b.title AS book_title, b.isbn,
      t.issue_date, t.due_date, t.return_date, t.fine, t.fine_paid
    FROM "transaction" t
    JOIN app_user u ON t.student_id = u.id
    JOIN book b ON t.book_id = b.id
    ORDER BY t.id DESC
  `;
  const result = await pool.query(query);

  const headers = ['Transaction ID', 'Student Username', 'Student Name', 'Book Title', 'ISBN', 'Issue Date', 'Due Date', 'Return Date', 'Fine (INR)', 'Fine Paid'];
  const rows = [headers.join(',')];

  for (const r of result.rows) {
    const row = [
      r.id,
      `"${r.student_username || ''}"`,
      `"${(r.student_name || '').replace(/"/g, '""')}"`,
      `"${(r.book_title || '').replace(/"/g, '""')}"`,
      `"${r.isbn || ''}"`,
      r.issue_date ? new Date(r.issue_date).toISOString() : '',
      r.due_date ? new Date(r.due_date).toISOString() : '',
      r.return_date ? new Date(r.return_date).toISOString() : 'Active',
      r.fine !== null ? parseFloat(r.fine).toFixed(2) : '0.00',
      r.fine_paid ? 'YES' : 'NO',
    ];
    rows.push(row.join(','));
  }

  const csvContent = rows.join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
  return res.status(200).send(csvContent);
}

const SAMPLE_BOOKS = [
  { Title: 'Clean Code', Author: 'Robert C. Martin', Copies: 5, ISBN: '978-0132350884', Category: 'Software Engineering' },
  { Title: 'Introduction to Algorithms', Author: 'Thomas H. Cormen', Copies: 4, ISBN: '978-0262033848', Category: 'Computer Science' },
  { Title: 'JavaScript: The Good Parts', Author: 'Douglas Crockford', Copies: 3, ISBN: '978-0596517748', Category: 'Web Development' },
];

async function importBooksExcel(req, res) {
  if (!req.file || !req.file.buffer) {
    return res.status(400).json({ message: 'Please upload an Excel (.xlsx, .xls) or CSV file.' });
  }

  const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return res.status(400).json({ message: 'The uploaded spreadsheet is empty.' });
  }

  const rawRows = xlsx.utils.sheet_to_json(workbook.Sheets[firstSheetName], { defval: '' });
  if (rawRows.length === 0) {
    return res.status(400).json({ message: 'No data rows found in the spreadsheet.' });
  }

  let importedCount = 0;
  let updatedCount = 0;
  const errors = [];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const rowNum = i + 2;

      const title = (row['Title'] || row['title'] || row['Book Title'] || row['book_title'] || '').toString().trim();
      const author = (row['Author'] || row['author'] || row['Author Name'] || 'Unknown').toString().trim();
      const copiesRaw = row['Copies'] !== undefined && row['Copies'] !== '' ? row['Copies'] : (row['copies'] || row['Total Copies'] || 1);
      const copies = Math.max(1, parseInt(copiesRaw, 10) || 1);
      const isbn = (row['ISBN'] || row['isbn'] || '').toString().trim() || null;
      const category = (row['Category'] || row['category'] || 'General').toString().trim();
      const imageUrl = (row['Image'] || row['imageUrl'] || row['image_url'] || '').toString().trim() || null;

      if (!title) {
        errors.push(`Row ${rowNum}: Title is required. Skipped.`);
        continue;
      }

      // check if book already exists by isbn or title+author
      let existingBook = null;
      if (isbn) {
        const checkIsbn = await client.query('SELECT * FROM book WHERE isbn = $1', [isbn]);
        if (checkIsbn.rows.length > 0) {
          existingBook = checkIsbn.rows[0];
        }
      }

      if (!existingBook) {
        const checkTitle = await client.query(
          'SELECT * FROM book WHERE LOWER(title) = LOWER($1) AND LOWER(author) = LOWER($2)',
          [title, author]
        );
        if (checkTitle.rows.length > 0) {
          existingBook = checkTitle.rows[0];
        }
      }

      if (existingBook) {
        await client.query(
          `UPDATE book
           SET copies = copies + $1, total_copies = total_copies + $1,
               category = COALESCE(NULLIF($2, 'General'), category),
               image_url = COALESCE($3, image_url)
           WHERE id = $4`,
          [copies, category, imageUrl, existingBook.id]
        );
        updatedCount += 1;
      } else {
        await client.query(
          `INSERT INTO book (title, author, copies, total_copies, isbn, category, image_url)
           VALUES ($1, $2, $3, $3, $4, $5, $6)`,
          [title, author, copies, isbn, category, imageUrl]
        );
        importedCount += 1;
      }
    }

    await client.query('COMMIT');

    return res.status(200).json({
      message: `Successfully processed ${rawRows.length} books: ${importedCount} added, ${updatedCount} updated.`,
      totalRows: rawRows.length,
      importedCount,
      updatedCount,
      errorCount: errors.length,
      errors: errors.slice(0, 10),
    });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function importStudentsExcel(req, res) {
  if (!req.file || !req.file.buffer) {
    return res.status(400).json({ message: 'Please upload an Excel (.xlsx, .xls) or CSV file.' });
  }

  const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return res.status(400).json({ message: 'The uploaded spreadsheet is empty.' });
  }

  const rawRows = xlsx.utils.sheet_to_json(workbook.Sheets[firstSheetName], { defval: '' });
  if (rawRows.length === 0) {
    return res.status(400).json({ message: 'No student data rows found in the spreadsheet.' });
  }

  let importedCount = 0;
  let skippedCount = 0;
  const errors = [];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const rowNum = i + 2;

      const username = (row['Username'] || row['username'] || row['Student ID'] || row['student_id'] || '').toString().trim();
      const password = (row['Password'] || row['password'] || 'student123').toString().trim();
      const fullName = (row['FullName'] || row['fullName'] || row['Full Name'] || row['Name'] || row['name'] || username).toString().trim();
      const rawRole = (row['Role'] || row['role'] || row['User Role'] || row['user_role'] || 'ROLE_STUDENT').toString().trim().toUpperCase();
      const role = (rawRole === 'ROLE_ADMIN' || rawRole === 'ADMIN' || rawRole === 'ADMINISTRATOR') ? 'ROLE_ADMIN' : 'ROLE_STUDENT';
      const branch = (row['Branch'] || row['branch'] || row['Course'] || 'N/A').toString().trim();
      const year = (row['Year'] || row['year'] || row['Academic Year'] || row['academic_year'] || 'N/A').toString().trim();
      const email = (row['Email'] || row['email'] || '').toString().trim() || null;

      if (!username) {
        errors.push(`Row ${rowNum}: Student Username / ID is missing. Skipped.`);
        continue;
      }

      const existingUser = await client.query('SELECT id FROM app_user WHERE username = $1', [username]);
      if (existingUser.rows.length > 0) {
        skippedCount += 1;
        errors.push(`Row ${rowNum}: Username "${username}" already exists. Skipped.`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      await client.query(
        `INSERT INTO app_user (username, password, role, full_name, branch, academic_year, email)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [username, hashedPassword, role, fullName, branch, year, email]
      );
      importedCount += 1;
    }

    await client.query('COMMIT');

    return res.status(200).json({
      message: `Successfully processed ${rawRows.length} students: ${importedCount} registered, ${skippedCount} skipped.`,
      totalRows: rawRows.length,
      importedCount,
      skippedCount,
      errorCount: errors.length,
      errors: errors.slice(0, 10),
    });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

function downloadBooksTemplate(req, res) {
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet(SAMPLE_BOOKS);
  xlsx.utils.book_append_sheet(wb, ws, 'Books_Template');

  const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename="books_import_template.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  return res.status(200).send(buffer);
}

function downloadStudentsTemplate(req, res) {
  const sampleUsers = [
    {
      Username: 'student_rahul',
      Password: 'Password@123',
      FullName: 'Rahul Sharma',
      Role: 'ROLE_STUDENT',
      Branch: 'Computer Science',
      AcademicYear: '3rd Year',
      Email: 'rahul@college.edu',
    },
    {
      Username: 'admin_vikram',
      Password: 'AdminPass@123',
      FullName: 'Vikram Patel',
      Role: 'ROLE_ADMIN',
      Branch: 'Administration',
      AcademicYear: 'Staff',
      Email: 'vikram.admin@college.edu',
    },
    {
      Username: 'student_ananya',
      Password: 'Password@456',
      FullName: 'Ananya Iyer',
      Role: 'ROLE_STUDENT',
      Branch: 'Information Technology',
      AcademicYear: '2nd Year',
      Email: 'ananya@college.edu',
    },
  ];

  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet(sampleUsers);
  xlsx.utils.book_append_sheet(wb, ws, 'Users_Template');

  const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename="users_import_template.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  return res.status(200).send(buffer);
}

module.exports = {
  viewDashboard,
  issueBook,
  returnBook,
  addStudent,
  addBook,
  editBook,
  deleteBook,
  getStudents,
  editStudent,
  resetStudentPassword,
  deleteStudent,
  payFine,
  getOverdueReport,
  getStatsReport,
  getTransactions,
  exportTransactionsCsv,
  importBooksExcel,
  importStudentsExcel,
  downloadBooksTemplate,
  downloadStudentsTemplate,
};
