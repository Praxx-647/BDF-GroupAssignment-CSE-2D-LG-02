/**
 * PageTurn Library REST API - Database Module
 * Course: Backend Development Fundamentals (CSE2D-Group-02)
 * Module Owner: R Ashruth Rayudu (252U1R1212)
 */

const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

const DB_FILE = path.join(__dirname, 'library.db');

let dbInstance = null;

/**
 * Initializes and returns the SQLite database connection.
 * Enforces Foreign Keys and creates schema tables + seeds initial records if empty.
 */
async function initDb(dbPath = DB_FILE) {
  if (dbInstance) {
    return dbInstance;
  }

  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Enforce foreign key constraints in SQLite
  await db.run('PRAGMA foreign_keys = ON;');

  // Create 'readers' table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS readers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE
    );
  `);

  // Create 'books' table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      genre TEXT NOT NULL,
      available INTEGER DEFAULT 1
    );
  `);

  // Create 'loans' table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS loans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reader_id INTEGER NOT NULL,
      book_id INTEGER NOT NULL,
      loan_date TEXT NOT NULL,
      return_date TEXT,
      FOREIGN KEY(reader_id) REFERENCES readers(id) ON DELETE CASCADE,
      FOREIGN KEY(book_id) REFERENCES books(id) ON DELETE RESTRICT
    );
  `);

  // Auto-seed data on first startup if tables are empty
  await seedDatabase(db);

  dbInstance = db;
  return db;
}

/**
 * Seeds books, readers, and loans if their respective tables are empty.
 */
async function seedDatabase(db) {
  // 1. Seed Books
  const booksCount = await db.get('SELECT COUNT(*) AS count FROM books;');
  if (booksCount.count === 0) {
    const books = [
      ['The Jungle Book', 'Classic Fiction', 1],
      ['Textbook of Algorithms', 'Computer Science', 0],
      ['The Book Thief', 'Historical Fiction', 1],
      ['Clean Code: A Handbook of Agile Software', 'Software Engineering', 1],
      ['Dune', 'Science Fiction', 0],
      ['Atomic Habits', 'Self-Help', 1],
      ['The Pragmatic Programmer', 'Software Engineering', 1],
      ['Notebook of a Data Scientist', 'Data Science', 1],
      ['1984', 'Dystopian Fiction', 1],
      ['Designing Data-Intensive Applications', 'Computer Science', 0],
      ['The Alchemist', 'Philosophical Fiction', 1],
      ['Sapiens: A Brief History of Humankind', 'History', 1]
    ];

    const stmt = await db.prepare('INSERT INTO books (name, genre, available) VALUES (?, ?, ?);');
    for (const book of books) {
      await stmt.run(book);
    }
    await stmt.finalize();
    console.log(`[DB] Successfully seeded ${books.length} initial books.`);
  }

  // 2. Seed Readers
  const readersCount = await db.get('SELECT COUNT(*) AS count FROM readers;');
  if (readersCount.count === 0) {
    const readers = [
      ['Aarav Sharma', 'aarav.sharma@example.com'],
      ['Diya Nair', 'diya.nair@example.com'],
      ['Rohan Verma', 'rohan.verma@example.com'],
      ['Ananya Reddy', 'ananya.reddy@example.com'],
      ['Kabir Das', 'kabir.das@example.com']
    ];

    const stmt = await db.prepare('INSERT INTO readers (name, email) VALUES (?, ?);');
    for (const reader of readers) {
      await stmt.run(reader);
    }
    await stmt.finalize();
    console.log(`[DB] Successfully seeded ${readers.length} initial readers.`);
  }

  // 3. Seed Loans (3 active loans for available=0 books, 1 returned loan)
  const loansCount = await db.get('SELECT COUNT(*) AS count FROM loans;');
  if (loansCount.count === 0) {
    const loans = [
      // Active loan: Reader 1 borrowed Book 2 ("Textbook of Algorithms")
      [1, 2, '2026-03-01', null],
      // Active loan: Reader 2 borrowed Book 5 ("Dune")
      [2, 5, '2026-03-05', null],
      // Active loan: Reader 3 borrowed Book 10 ("Designing Data-Intensive Applications")
      [3, 10, '2026-03-10', null],
      // Returned loan: Reader 4 borrowed Book 1 ("The Jungle Book") and returned it
      [4, 1, '2026-02-15', '2026-02-28']
    ];

    const stmt = await db.prepare('INSERT INTO loans (reader_id, book_id, loan_date, return_date) VALUES (?, ?, ?, ?);');
    for (const loan of loans) {
      await stmt.run(loan);
    }
    await stmt.finalize();
    console.log(`[DB] Successfully seeded ${loans.length} initial loan records.`);
  }
}

/**
 * Returns the active database instance.
 */
async function getDb() {
  if (!dbInstance) {
    return await initDb();
  }
  return dbInstance;
}

module.exports = {
  initDb,
  getDb
};

