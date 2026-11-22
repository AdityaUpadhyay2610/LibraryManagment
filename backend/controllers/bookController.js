// backend/controllers/bookController.js
// Handles book search, filtering, and catalog listings for both Admins and Students.

const { pool } = require('../db/pool');

/**
 * GET /api/books
 * Retrieves books with optional search query, category filter, availability filter, and pagination.
 */
async function getBooks(req, res) {
  const { search, category, available, page = 1, limit = 10 } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
  const offset = (pageNum - 1) * limitNum;

  const whereClauses = [];
  const params = [];

  // Search by title, author, or ISBN
  if (search && search.trim()) {
    params.push(`%${search.trim()}%`);
    whereClauses.push(`(title ILIKE $${params.length} OR author ILIKE $${params.length} OR isbn ILIKE $${params.length})`);
  }

  // Filter by category
  if (category && category.trim()) {
    params.push(category.trim());
    whereClauses.push(`category = $${params.length}`);
  }

  // Filter only books with available copies
  if (available === 'true' || available === true) {
    whereClauses.push(`copies > 0`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Count total matching items
  const countQuery = `SELECT COUNT(*) AS total FROM book ${whereSql}`;
  const countResult = await pool.query(countQuery, params);
  const total = parseInt(countResult.rows[0].total, 10);

  // Fetch page data
  params.push(limitNum);
  const limitIdx = params.length;
  params.push(offset);
  const offsetIdx = params.length;

  const dataQuery = `
    SELECT id, title, author, isbn, category, copies, total_copies, image_url AS "imageUrl", created_at AS "createdAt"
    FROM book
    ${whereSql}
    ORDER BY id ASC
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;
  const booksResult = await pool.query(dataQuery, params);

  return res.status(200).json({
    books: booksResult.rows,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum) || 1,
  });
}

/**
 * GET /api/books/:id
 * Retrieves details for a specific book.
 */
async function getBookById(req, res) {
  const { id } = req.params;
  const result = await pool.query(
    'SELECT id, title, author, isbn, category, copies, total_copies, image_url AS "imageUrl", created_at AS "createdAt" FROM book WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Book not found' });
  }

  return res.status(200).json(result.rows[0]);
}

/**
 * GET /api/books/categories
 * Returns a list of all distinct book categories.
 */
async function getCategories(req, res) {
  const result = await pool.query(
    'SELECT DISTINCT category FROM book WHERE category IS NOT NULL AND category != \'\' ORDER BY category ASC'
  );
  const categories = result.rows.map((r) => r.category);
  return res.status(200).json(categories);
}

module.exports = {
  getBooks,
  getBookById,
  getCategories,
};
