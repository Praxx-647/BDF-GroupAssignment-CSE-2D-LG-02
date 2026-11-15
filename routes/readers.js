/**
 * PageTurn Library REST API - Readers Route Module
 * Course: Backend Development Fundamentals (CSE2D-Group-02)
 * Module Owner: Nirupadish Gouda (252U1R1169)
 */

const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { validateReader, validateId } = require('../middleware/validate');

/**
 * GET /readers
 * Retrieves all registered readers.
 */
router.get('/', async (req, res, next) => {
  try {
    const db = await getDb();
    const readers = await db.all('SELECT id, name, email FROM readers ORDER BY id ASC;');
    return res.status(200).json(readers);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /readers/:id
 * Retrieves a single reader by ID.
 */
router.get('/:id', validateId, async (req, res, next) => {
  try {
    const db = await getDb();
    const { id } = req.params;

    const reader = await db.get('SELECT id, name, email FROM readers WHERE id = ?;', [id]);
    if (!reader) {
      return res.status(404).json({ error: `Reader with ID ${id} not found.` });
    }

    return res.status(200).json(reader);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /readers
 * Registers a new reader.
 */
router.post('/', validateReader, async (req, res, next) => {
  try {
    const db = await getDb();
    const { name, email } = req.body;
    const cleanEmail = email.trim().toLowerCase();

    // Check unique email constraint
    const existing = await db.get('SELECT id FROM readers WHERE LOWER(email) = ?;', [cleanEmail]);
    if (existing) {
      return res.status(400).json({
        error: `Reader with email '${email.trim()}' already exists.`
      });
    }

    const result = await db.run(
      'INSERT INTO readers (name, email) VALUES (?, ?);',
      [name.trim(), cleanEmail]
    );

    const newReader = await db.get('SELECT id, name, email FROM readers WHERE id = ?;', [result.lastID]);

    return res.status(201).json({
      message: 'Reader registered successfully.',
      reader: newReader
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /readers/:id
 * Updates an existing reader's information.
 */
router.put('/:id', validateId, validateReader, async (req, res, next) => {
  try {
    const db = await getDb();
    const { id } = req.params;
    const { name, email } = req.body;
    const cleanEmail = email.trim().toLowerCase();

    const existingReader = await db.get('SELECT id FROM readers WHERE id = ?;', [id]);
    if (!existingReader) {
      return res.status(404).json({ error: `Reader with ID ${id} not found.` });
    }

    // Verify email is not already taken by another reader
    const duplicateEmail = await db.get(
      'SELECT id FROM readers WHERE LOWER(email) = ? AND id != ?;',
      [cleanEmail, id]
    );
    if (duplicateEmail) {
      return res.status(400).json({
        error: `Email '${email.trim()}' is already in use by another reader.`
      });
    }

    await db.run(
      'UPDATE readers SET name = ?, email = ? WHERE id = ?;',
      [name.trim(), cleanEmail, id]
    );

    const updatedReader = await db.get('SELECT id, name, email FROM readers WHERE id = ?;', [id]);

    return res.status(200).json({
      message: 'Reader updated successfully.',
      reader: updatedReader
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /readers/:id
 * Deletes a reader if they have no active book loans.
 */
router.delete('/:id', validateId, async (req, res, next) => {
  try {
    const db = await getDb();
    const { id } = req.params;

    const existingReader = await db.get('SELECT id, name FROM readers WHERE id = ?;', [id]);
    if (!existingReader) {
      return res.status(404).json({ error: `Reader with ID ${id} not found.` });
    }

    // Check for active loans
    const activeLoan = await db.get('SELECT id FROM loans WHERE reader_id = ? AND return_date IS NULL;', [id]);
    if (activeLoan) {
      return res.status(400).json({
        error: `Cannot delete reader '${existingReader.name}' because they have an active unreturned book loan (Loan ID: ${activeLoan.id}).`
      });
    }

    // Safe to delete loans history for this reader
    await db.run('DELETE FROM loans WHERE reader_id = ?;', [id]);
    await db.run('DELETE FROM readers WHERE id = ?;', [id]);

    return res.status(200).json({
      message: 'Reader deleted successfully.',
      id: Number(id)
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

