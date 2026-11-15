/**
 * PageTurn Library REST API - Validation Middleware
 * Course: Backend Development Fundamentals (CSE2D-Group-02)
 * Module Owner: Prakash Choudhary (252U1R1202)
 */

/**
 * Validates payload for creating or updating a Book.
 * Required fields: name (string, non-blank), genre (string, non-blank).
 */
function validateBook(req, res, next) {
  const { name, genre, available } = req.body;

  if (name === undefined || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({
      error: "Missing or invalid required field 'name': must be a non-empty string."
    });
  }

  if (genre === undefined || typeof genre !== 'string' || genre.trim() === '') {
    return res.status(400).json({
      error: "Missing or invalid required field 'genre': must be a non-empty string."
    });
  }

  if (available !== undefined && available !== null) {
    if (available !== 0 && available !== 1 && available !== true && available !== false) {
      return res.status(400).json({
        error: "Invalid field 'available': must be 1 (available) or 0 (unavailable)."
      });
    }
  }

  next();
}

/**
 * Validates payload for creating or updating a Reader.
 * Required fields: name (string, non-blank), email (valid email string).
 */
function validateReader(req, res, next) {
  const { name, email } = req.body;

  if (name === undefined || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({
      error: "Missing or invalid required field 'name': must be a non-empty string."
    });
  }

  if (email === undefined || typeof email !== 'string' || email.trim() === '') {
    return res.status(400).json({
      error: "Missing or invalid required field 'email': must be a non-empty string."
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({
      error: "Invalid format for field 'email': please provide a valid email address (e.g. user@example.com)."
    });
  }

  next();
}

/**
 * Validates payload for issuing a Loan.
 * Required fields: reader_id (positive integer), book_id (positive integer).
 */
function validateLoan(req, res, next) {
  const { reader_id, book_id, loan_date } = req.body;

  if (reader_id === undefined || isNaN(Number(reader_id)) || !Number.isInteger(Number(reader_id)) || Number(reader_id) <= 0) {
    return res.status(400).json({
      error: "Missing or invalid required field 'reader_id': must be a positive integer."
    });
  }

  if (book_id === undefined || isNaN(Number(book_id)) || !Number.isInteger(Number(book_id)) || Number(book_id) <= 0) {
    return res.status(400).json({
      error: "Missing or invalid required field 'book_id': must be a positive integer."
    });
  }

  if (loan_date !== undefined && loan_date !== null && typeof loan_date === 'string') {
    if (loan_date.trim() === '' || isNaN(Date.parse(loan_date.trim()))) {
      return res.status(400).json({
        error: "Invalid field 'loan_date': must be a valid date string (e.g. YYYY-MM-DD)."
      });
    }
  }

  next();
}

/**
 * Validates that the URL route param :id is a positive integer.
 */
function validateId(req, res, next) {
  const { id } = req.params;
  const numId = Number(id);

  if (isNaN(numId) || !Number.isInteger(numId) || numId <= 0) {
    return res.status(400).json({
      error: "Invalid parameter 'id': route ID must be a positive integer."
    });
  }

  next();
}

module.exports = {
  validateBook,
  validateReader,
  validateLoan,
  validateId
};

