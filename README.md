# 📚 Library Management System

> **Course:** Backend Development Fundamentals (CSE2D-Group-02)  
> **Faculty:** Mr. Siva Sai Teja Chintakrindi  
> **Repository Ready:** Full Node.js + Express + SQLite REST API with Foreign Keys, SQL JOINs, Input Validation, and Group Twist Search.

---

## 👥 Team Members & Viva Ownership Matrix

To facilitate clear individual attribution during viva presentations and code defense, the codebase is modularly partitioned across distinct files:

| Member Name | Student ID | Viva File Ownership | Key Technical Responsibilities |
| :--- | :--- | :--- | :--- |
| **Prakash Choudhary** | `252U1R1202` | `server.js`<br>`middleware/validate.js` | Express app configuration, CORS, route mounting, centralized error handling, and robust input validation middleware (HTTP 400). |
| **R Ashruth Rayudu** | `252U1R1212` | `db.js` | SQLite initialization, Foreign Key enforcement (`PRAGMA foreign_keys = ON;`), relational schema creation, and database auto-seeding logic. |
| **Paidi Sunhith Reddy** | `252U1R1174` | `routes/books.js` | Books CRUD operations, query parameter handling, and implementation of the case-insensitive Group Twist search rule. |
| **Nirupadish Gouda** | `252U1R1169` | `routes/readers.js`<br>`routes/loans.js` | Readers CRUD, multi-table SQL JOIN queries, atomic book checkout/return transactions, and availability toggle logic. |

---

## 🛠️ Technology Stack

- **Runtime:** Node.js (v18+)
- **Module System:** CommonJS (`require` / `module.exports`)
- **Web Framework:** Express.js (`v4.19+`)
- **Database:** SQLite (`library.db`)
- **Database Drivers:** `sqlite3` (C++ SQLite driver) + `sqlite` (Promise/async-await wrapper)
- **Middleware:** `cors` (Cross-Origin Resource Sharing), `express.json()` (Body Parser)
- **Testing & Verification:** Postman Collection v2.1 + Google Chrome Browser Verification

---

## 🗄️ Database Architecture & Relational Schema

Foreign key enforcement is enabled immediately upon database connection via `PRAGMA foreign_keys = ON;`.

```
  +------------------+         +------------------+         +------------------+
  |     READERS      |         |      LOANS       |         |      BOOKS       |
  +------------------+         +------------------+         +------------------+
  | id (PK, INT)     |<--------| reader_id (FK)   |         | id (PK, INT)     |
  | name (TEXT)      |         | book_id (FK)     |-------->| name (TEXT)      |
  | email (TEXT, UNQ)|         | loan_date (TEXT) |         | genre (TEXT)     |
  +------------------+         | return_date(TEXT)|         | available (INT)  |
                               +------------------+         +------------------+
```

### Table Definitions

1. **`readers` Table:**
   - `id`: `INTEGER PRIMARY KEY AUTOINCREMENT`
   - `name`: `TEXT NOT NULL`
   - `email`: `TEXT NOT NULL UNIQUE`

2. **`books` Table:**
   - `id`: `INTEGER PRIMARY KEY AUTOINCREMENT`
   - `name`: `TEXT NOT NULL`
   - `genre`: `TEXT NOT NULL`
   - `available`: `INTEGER DEFAULT 1` (`1` = Available on shelf, `0` = Borrowed on active loan)

3. **`loans` Table:**
   - `id`: `INTEGER PRIMARY KEY AUTOINCREMENT`
   - `reader_id`: `INTEGER NOT NULL`, `FOREIGN KEY(reader_id) REFERENCES readers(id) ON DELETE CASCADE`
   - `book_id`: `INTEGER NOT NULL`, `FOREIGN KEY(book_id) REFERENCES books(id) ON DELETE RESTRICT`
   - `loan_date`: `TEXT NOT NULL` (ISO format `YYYY-MM-DD`)
   - `return_date`: `TEXT NULL` (`NULL` represents an active loan; date string represents completed return)

### Auto-Seeded Initial Data
On the first server launch, `db.js` automatically populates the tables if empty:
- **12 diverse books** across multiple genres (Classic Fiction, Computer Science, Historical Fiction, Software Engineering, Science Fiction, Self-Help, Data Science, Dystopian Fiction, Philosophical Fiction, History).
- **5 registered readers** (Aarav Sharma, Diya Nair, Rohan Verma, Ananya Reddy, Kabir Das).
- **4 initial loans** (3 active loans for Books 2, 5, and 10 whose `available` is set to `0`, and 1 completed returned loan for Book 1).

---

## 🌪️ Group Twist Rule Implementation

The endpoint `GET /books?q=:word` implements the Group Twist search rule:

1. **Case-Insensitive Search:**
   Uses SQL:
   ```sql
   SELECT id, name, genre, available
   FROM books
   WHERE LOWER(name) LIKE ? OR LOWER(genre) LIKE ?
   ORDER BY id ASC;
   ```
   with `%${q.trim().toLowerCase()}%`.
2. **Matches Found:**
   Returns HTTP `200 OK` with an array of matching book objects.
3. **Zero Matches Found:**
   Returns HTTP `200 OK` with:
   ```json
   {
     "books": [],
     "message": "Nothing found"
   }
   ```

### Verification of Mandatory Twist Test Cases

| Test Case | Request | HTTP Status | Expected Result | Actual Result |
| :--- | :--- | :---: | :--- | :--- |
| **Test 1** | `GET /books?q=book` | `200 OK` | Array of 5 books matching `"book"` in title/genre | `"The Jungle Book"`, `"Textbook of Algorithms"`, `"The Book Thief"`, `"Clean Code: A Handbook of Agile Software"`, `"Notebook of a Data Scientist"` |
| **Test 2** | `GET /books?q=BOOK` | `200 OK` | Exact same 5 books as Test 1 | Identical match verification (case-insensitivity verified) |
| **Test 3** | `GET /books?q=zzz` | `200 OK` | Empty array with custom message | `{"books": [], "message": "Nothing found"}` |

---

## 📡 Complete REST API Endpoint Reference

### 1. Books (`/books`) — Managed by Paidi Sunhith Reddy
| Method | Route | Description | Status Codes |
| :--- | :--- | :--- | :---: |
| `GET` | `/books` | Retrieve all books catalog | `200` |
| `GET` | `/books?q=:word` | Group Twist case-insensitive search by name or genre | `200` |
| `GET` | `/books/:id` | Retrieve single book by primary key ID | `200`, `400`, `404` |
| `POST` | `/books` | Create a new book (`{ name, genre, available }`) | `201`, `400` |
| `PUT` | `/books/:id` | Update an existing book's details | `200`, `400`, `404` |
| `DELETE` | `/books/:id` | Delete a book (blocked if actively loaned out) | `200`, `400`, `404` |

### 2. Readers (`/readers`) — Managed by Nirupadish Gouda
| Method | Route | Description | Status Codes |
| :--- | :--- | :--- | :---: |
| `GET` | `/readers` | Retrieve all registered readers | `200` |
| `GET` | `/readers/:id` | Retrieve single reader by primary key ID | `200`, `400`, `404` |
| `POST` | `/readers` | Register new reader (`{ name, email }`) | `201`, `400` |
| `PUT` | `/readers/:id` | Update reader information | `200`, `400`, `404` |
| `DELETE` | `/readers/:id` | Delete reader (blocked if reader holds active loans) | `200`, `400`, `404` |

### 3. Loans (`/loans`) — Managed by Nirupadish Gouda & Prakash Choudhary
| Method | Route | Description | Status Codes |
| :--- | :--- | :--- | :---: |
| `GET` | `/loans` | **SQL JOIN query** returning loans with `reader_name` & `book_name` | `200` |
| `GET` | `/loans/:id` | Retrieve single loan record with joined reader and book names | `200`, `400`, `404` |
| `POST` | `/loans` | Issue loan (`{ reader_id, book_id, loan_date }`), sets `available = 0` | `201`, `400`, `404` |
| `PUT` | `/loans/:id/return` | Return book (`{ return_date }`), sets `available = 1` | `200`, `400`, `404` |

---

## 🚀 Installation & Execution Guide

### 1. Prerequisites
Ensure [Node.js](https://nodejs.org/) (version 18 or newer) and `npm` are installed.

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Server
```bash
npm start
```
The server will start on `http://localhost:3000`. On first launch, `library.db` is created and populated automatically.

---

## 📮 Postman Collection Setup

The repository includes a pre-configured Postman collection v2.1 at:
[`postman/PageTurn_Library.postman_collection.json`](postman/PageTurn_Library.postman_collection.json)

### How to Import:
1. Open **Postman**.
2. Click **Import** (top left).
3. Drag and drop `postman/PageTurn_Library.postman_collection.json` or browse to the file.
4. The collection will import with a pre-configured collection variable `baseUrl = http://localhost:3000`.
5. Run the requests individually or use the **Collection Runner** to execute the entire suite sequentially.

---

## 📸 Screenshots & API Verification

The following screenshots capture live verification in Google Chrome (including address bar queries and Chrome DevTools console execution):

### 1. Catalog Overview — List All Books (`GET /books`)
Fetches all 12 seeded books with titles, genres, and availability status directly in Chrome.
![01-get-books](docs/screenshots/01-get-books.png)

---

### 2. Book Creation — Add New Title (`POST /books`)
Creates a new book record with input validation and returns HTTP 201 Created.
![02-post-book-success](docs/screenshots/02-post-book-success.png)

---

### 3. Input Validation Error — Missing Required Field (`POST /books`)
Submits a payload missing the mandatory `name` field; validation middleware halts execution and returns HTTP 400 Bad Request with descriptive message.
![03-post-book-validation-error](docs/screenshots/03-post-book-validation-error.png)

---

### 4. Multi-Table SQL JOIN — Loan History (`GET /loans`)
Executes a 3-table SQL JOIN linking `loans`, `readers`, and `books`, providing `reader_name` and `book_name` alongside loan dates.
![04-get-loans-join](docs/screenshots/04-get-loans-join.png)

---

### 5. Group Twist Test 1 — Search `"book"` (`GET /books?q=book`)
Case-insensitive search matching 5 books containing `"book"` in either title or genre (including `"Handbook"` and `"Notebook"`).
![05-twist-test1-q-book](docs/screenshots/05-twist-test1-q-book.png)

---

### 6. Group Twist Test 2 — Search `"BOOK"` (`GET /books?q=BOOK`)
Verifies case-insensitivity: querying uppercase `"BOOK"` returns the exact same 5 records as Test 1.
![06-twist-test2-q-BOOK](docs/screenshots/06-twist-test2-q-BOOK.png)

---

### 7. Group Twist Test 3 — Search `"zzz"` (`GET /books?q=zzz`)
Queries an unmatched keyword; confirms twist rule requirement returning HTTP 200 with `{ "books": [], "message": "Nothing found" }`.
![07-twist-test3-q-zzz](docs/screenshots/07-twist-test3-q-zzz.png)

---

### 8. Issue Loan & Availability Toggle (`POST /loans`)
Issues an available book (`Atomic Habits`, ID: 6) to Reader (ID: 5), atomically creating a loan and updating `available = 0`.
![08-post-loan-issue](docs/screenshots/08-post-loan-issue.png)

---

### 9. Return Book & Restore Availability (`PUT /loans/2/return`)
Marks an active loan as returned by recording `return_date` and resets the book's `available` flag back to `1`.
![09-put-loan-return](docs/screenshots/09-put-loan-return.png)

---

### 10. Readers Registry (`GET /readers`)
Retrieves all registered library members with their names and unique email addresses.
![10-get-readers](docs/screenshots/10-get-readers.png)

---

## 🏛️ Project Directory Structure

```
c:\BDF Group Assignment
├── package.json
├── server.js
├── db.js
├── middleware/
│   └── validate.js
├── routes/
│   ├── books.js
│   ├── readers.js
│   └── loans.js
├── postman/
│   └── PageTurn_Library.postman_collection.json
├── docs/
│   └── screenshots/
│       ├── 01-get-books.png
│       ├── 02-post-book-success.png
│       ├── 03-post-book-validation-error.png
│       ├── 04-get-loans-join.png
│       ├── 05-twist-test1-q-book.png
│       ├── 06-twist-test2-q-BOOK.png
│       ├── 07-twist-test3-q-zzz.png
│       ├── 08-post-loan-issue.png
│       ├── 09-put-loan-return.png
│       └── 10-get-readers.png
├── library.db (created on first run)
├── .gitignore
└── README.md
```

---

## 🎓 Academic Submission Statement

This project was developed for **Backend Development Fundamentals** under the instruction of **Mr. Siva Sai Teja Chintakrindi**. All code, database schemas, and documentation were created by **CSE2D-Group-02**:
- **Prakash Choudhary** (`252U1R1202`)
- **R Ashruth Rayudu** (`252U1R1212`)
- **Paidi Sunhith Reddy** (`252U1R1174`)
- **Nirupadish Gouda** (`252U1R1169`)
