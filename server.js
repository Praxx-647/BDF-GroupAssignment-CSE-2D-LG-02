/**
 * PageTurn Library REST API - Main Application Server
 * Course: Backend Development Fundamentals (CSE2D-Group-02)
 * Faculty: Mr. Siva Sai Teja Chintakrindi
 * Module Owner: Prakash Choudhary (252U1R1202)
 *
 * Members:
 * - Prakash Choudhary (252U1R1202)
 * - R Ashruth Rayudu (252U1R1212)
 * - Paidi Sunhith Reddy (252U1R1174)
 * - Nirupadish Gouda (252U1R1169)
 */

const express = require('express');
const cors = require('cors');
const { initDb } = require('./db');

const booksRouter = require('./routes/books');
const readersRouter = require('./routes/readers');
const loansRouter = require('./routes/loans');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON body parsing
app.use(cors());
app.use(express.json());

// Request logger for demo & viva tracing
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

// Root / Welcome Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    project: "PageTurn Library REST API",
    course: "Backend Development Fundamentals - CSE2D-Group-02",
    faculty: "Mr. Siva Sai Teja Chintakrindi",
    team: [
      { name: "Prakash Choudhary", id: "252U1R1202", role: "Server & Middleware Architecture" },
      { name: "R Ashruth Rayudu", id: "252U1R1212", role: "Database Design, Schema & Seeding" },
      { name: "Paidi Sunhith Reddy", id: "252U1R1174", role: "Books CRUD & Twist Rule Search" },
      { name: "Nirupadish Gouda", id: "252U1R1169", role: "Readers & Loans Transaction Management" }
    ],
    endpoints: {
      books: {
        list_all: "GET /books",
        search_twist: "GET /books?q=:keyword",
        get_by_id: "GET /books/:id",
        create: "POST /books",
        update: "PUT /books/:id",
        delete: "DELETE /books/:id"
      },
      readers: {
        list_all: "GET /readers",
        get_by_id: "GET /readers/:id",
        create: "POST /readers",
        update: "PUT /readers/:id",
        delete: "DELETE /readers/:id"
      },
      loans: {
        list_joined: "GET /loans",
        get_by_id: "GET /loans/:id",
        issue_loan: "POST /loans",
        return_book: "PUT /loans/:id/return"
      }
    },
    twist_rule: "GET /books?q=word performs case-insensitive substring search on name or genre. If 0 matches, returns { books: [], message: 'Nothing found' }"
  });
});

// Mount Routes
app.use('/books', booksRouter);
app.use('/readers', readersRouter);
app.use('/loans', loansRouter);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    error: `Cannot ${req.method} ${req.originalUrl} - Route not found on PageTurn Library API.`
  });
});

// Centralized Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error'
  });
});

// Start server if run directly
let serverInstance = null;

async function startServer(port = PORT) {
  try {
    await initDb();
    return new Promise((resolve) => {
      serverInstance = app.listen(port, () => {
        console.log(`====================================================`);
        console.log(`  PageTurn Library API (CSE2D-Group-02) running!     `);
        console.log(`  Port: http://localhost:${port}                      `);
        console.log(`  Faculty: Mr. Siva Sai Teja Chintakrindi            `);
        console.log(`====================================================`);
        resolve(serverInstance);
      });
    });
  } catch (error) {
    console.error('Failed to initialize database or start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = {
  app,
  startServer
};

