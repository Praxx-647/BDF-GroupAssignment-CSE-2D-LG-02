/**
 * PageTurn Library REST API - Books Route Module
 * Course: Backend Development Fundamentals (CSE2D-Group-02)
 * Module Owner: Paidi Sunhith Reddy (252U1R1174)
 */

const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { validateBook, validateId } = require('../middleware/validate');

/**
 * GET /books
 * Supports Group Twist Rule search via ?q=keyword
 * or retrieves all books when no query is present.
 */
router.get('/', async (req, res, next) => {
  try {
    const db = await getDb();
    const { q } = req.query;

    // --- Group Twist Rule: Case-insensitive search on name or genre ---
    if (q !== undefined) {
      const searchTerm = `%${q.trim().toLowerCase()}%`;
      const query = `
        SELECT id, name, genre, available
        FROM books
        WHERE LOWER(name) LIKE ? OR LOWER(genre) LIKE ?
        ORDER BY id ASC;
      `;
      const matches = await db.all(query, [searchTerm, searchTerm]);

      if (matches.length > 0) {
        return res.status(200).json(matches);
      } else {
        return res.status(200).json({
          books: [],
          message: "Nothing found"
        });
      }
    }

    // Default: Retrieve all books
    const allBooks = await db.all('SELECT id, name, genre, available FROM books ORDER BY id ASC;');
    return res.status(200).json(allBooks);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /books/:id
 * Retrieves a single book by ID.
 */
router.get('/:id', validateId, async (req, res, next) => {
  try {
    const db = await getDb();
    const { id } = req.params;

    const book = await db.get('SELECT id, name, genre, available FROM books WHERE id = ?;', [id]);
    if (!book) {
      return res.status(404).json({ error: `Book with ID ${id} not found.` });
    }

    return res.status(200).json(book);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /books
 * Creates a new book entry.
 */
router.post('/', validateBook, async (req, res, next) => {
  try {
    const db = await getDb();
    const { name, genre, available } = req.body;

    // Default availability is 1 unless explicitly specified as 0
    const isAvailable = available !== undefined ? (Number(available) === 0 || available === false ? 0 : 1) : 1;

    const result = await db.run(
      'INSERT INTO books (name, genre, available) VALUES (?, ?, ?);',
      [name.trim(), genre.trim(), isAvailable]
    );

    const newBook = await db.get('SELECT id, name, genre, available FROM books WHERE id = ?;', [result.lastID]);

    return res.status(201).json({
      message: 'Book created successfully.',
      book: newBook
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /books/:id
 * Updates an existing book.
 */
router.put('/:id', validateId, validateBook, async (req, res, next) => {
  try {
    const db = await getDb();
    const { id } = req.params;
    const { name, genre, available } = req.body;

    const existingBook = await db.get('SELECT id FROM books WHERE id = ?;', [id]);
    if (!existingBook) {
      return res.status(404).json({ error: `Book with ID ${id} not found.` });
    }

    const isAvailable = available !== undefined ? (Number(available) === 0 || available === false ? 0 : 1) : 1;

    await db.run(
      'UPDATE books SET name = ?, genre = ?, available = ? WHERE id = ?;',
      [name.trim(), genre.trim(), isAvailable, id]
    );

    const updatedBook = await db.get('SELECT id, name, genre, available FROM books WHERE id = ?;', [id]);

    return res.status(200).json({
      message: 'Book updated successfully.',
      book: updatedBook
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /books/:id
 * Deletes a book if it exists and is not actively borrowed on loan.
 */
router.delete('/:id', validateId, async (req, res, next) => {
  try {
    const db = await getDb();
    const { id } = req.params;

    const existingBook = await db.get('SELECT id, name FROM books WHERE id = ?;', [id]);
    if (!existingBook) {
      return res.status(404).json({ error: `Book with ID ${id} not found.` });
    }

    // Check if actively borrowed
    const activeLoan = await db.get('SELECT id FROM loans WHERE book_id = ? AND return_date IS NULL;', [id]);
    if (activeLoan) {
      return res.status(400).json({
        error: `Cannot delete book '${existingBook.name}' because it is currently on an active loan (Loan ID: ${activeLoan.id}).`
      });
    }

    // Safe to delete loans history for this book or let FK constraint handle it
    await db.run('DELETE FROM loans WHERE book_id = ?;', [id]);
    await db.run('DELETE FROM books WHERE id = ?;', [id]);

    return res.status(200).json({
      message: 'Book deleted successfully.',
      id: Number(id)
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

