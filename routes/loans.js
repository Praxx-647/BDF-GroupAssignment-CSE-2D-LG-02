/**
 * PageTurn Library REST API - Loans Route Module
 * Course: Backend Development Fundamentals (CSE2D-Group-02)
 * Module Owner: Nirupadish Gouda (252U1R1169)
 */

const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { validateLoan, validateId } = require('../middleware/validate');

/**
 * GET /loans
 * Multi-table SQL JOIN query returning loan history with reader and book names.
 */
router.get('/', async (req, res, next) => {
  try {
    const db = await getDb();
    const query = `
      SELECT 
        loans.id,
        readers.name AS reader_name,
        books.name AS book_name,
        loans.loan_date,
        loans.return_date
      FROM loans
      JOIN readers ON loans.reader_id = readers.id
      JOIN books ON loans.book_id = books.id
      ORDER BY loans.id ASC;
    `;
    const loans = await db.all(query);
    return res.status(200).json(loans);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /loans/:id
 * Retrieves a single loan record with joined details.
 */
router.get('/:id', validateId, async (req, res, next) => {
  try {
    const db = await getDb();
    const { id } = req.params;

    const query = `
      SELECT 
        loans.id,
        loans.reader_id,
        loans.book_id,
        readers.name AS reader_name,
        books.name AS book_name,
        loans.loan_date,
        loans.return_date
      FROM loans
      JOIN readers ON loans.reader_id = readers.id
      JOIN books ON loans.book_id = books.id
      WHERE loans.id = ?;
    `;
    const loan = await db.get(query, [id]);
    if (!loan) {
      return res.status(404).json({ error: `Loan record with ID ${id} not found.` });
    }

    return res.status(200).json(loan);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /loans
 * Issues a new book loan to a reader.
 * Validates existence of reader and book, checks book availability,
 * creates the loan record, and sets book available = 0.
 */
router.post('/', validateLoan, async (req, res, next) => {
  try {
    const db = await getDb();
    const { reader_id, book_id, loan_date } = req.body;

    // Verify Reader exists
    const reader = await db.get('SELECT id, name FROM readers WHERE id = ?;', [reader_id]);
    if (!reader) {
      return res.status(404).json({ error: `Reader with ID ${reader_id} does not exist.` });
    }

    // Verify Book exists
    const book = await db.get('SELECT id, name, available FROM books WHERE id = ?;', [book_id]);
    if (!book) {
      return res.status(404).json({ error: `Book with ID ${book_id} does not exist.` });
    }

    // Check availability
    if (book.available === 0) {
      return res.status(400).json({
        error: `Book '${book.name}' (ID: ${book_id}) is currently unavailable and already on loan.`
      });
    }

    // Default loan_date to today (YYYY-MM-DD) if not provided
    const issueDate = loan_date && loan_date.trim() !== ''
      ? loan_date.trim()
      : new Date().toISOString().split('T')[0];

    // Create loan and update book status in a transaction
    await db.run('BEGIN TRANSACTION;');
    try {
      const loanInsert = await db.run(
        'INSERT INTO loans (reader_id, book_id, loan_date, return_date) VALUES (?, ?, ?, NULL);',
        [reader_id, book_id, issueDate]
      );

      await db.run('UPDATE books SET available = 0 WHERE id = ?;', [book_id]);
      await db.run('COMMIT;');

      const createdLoan = await db.get(`
        SELECT 
          loans.id,
          loans.reader_id,
          readers.name AS reader_name,
          loans.book_id,
          books.name AS book_name,
          loans.loan_date,
          loans.return_date
        FROM loans
        JOIN readers ON loans.reader_id = readers.id
        JOIN books ON loans.book_id = books.id
        WHERE loans.id = ?;
      `, [loanInsert.lastID]);

      return res.status(201).json({
        message: 'Loan issued successfully.',
        loan: createdLoan
      });
    } catch (txErr) {
      await db.run('ROLLBACK;');
      throw txErr;
    }
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /loans/:id/return
 * Marks an active loan as returned.
 * Updates return_date and restores book available = 1.
 */
router.put('/:id/return', validateId, async (req, res, next) => {
  try {
    const db = await getDb();
    const { id } = req.params;
    const { return_date } = req.body;

    const loan = await db.get('SELECT * FROM loans WHERE id = ?;', [id]);
    if (!loan) {
      return res.status(404).json({ error: `Loan record with ID ${id} not found.` });
    }

    if (loan.return_date !== null && loan.return_date !== '') {
      return res.status(400).json({
        error: `Loan record with ID ${id} has already been returned on ${loan.return_date}.`
      });
    }

    const returnDateStr = return_date && typeof return_date === 'string' && return_date.trim() !== ''
      ? return_date.trim()
      : new Date().toISOString().split('T')[0];

    await db.run('BEGIN TRANSACTION;');
    try {
      await db.run('UPDATE loans SET return_date = ? WHERE id = ?;', [returnDateStr, id]);
      await db.run('UPDATE books SET available = 1 WHERE id = ?;', [loan.book_id]);
      await db.run('COMMIT;');

      const updatedLoan = await db.get(`
        SELECT 
          loans.id,
          loans.reader_id,
          readers.name AS reader_name,
          loans.book_id,
          books.name AS book_name,
          loans.loan_date,
          loans.return_date
        FROM loans
        JOIN readers ON loans.reader_id = readers.id
        JOIN books ON loans.book_id = books.id
        WHERE loans.id = ?;
      `, [id]);

      return res.status(200).json({
        message: 'Book returned successfully.',
        loan: updatedLoan
      });
    } catch (txErr) {
      await db.run('ROLLBACK;');
      throw txErr;
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;

