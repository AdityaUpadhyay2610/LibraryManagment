# Library Management System

A production-grade **Library Management System** built with **Node.js + Express.js + PostgreSQL** on the backend and **React + Vite** on the frontend.

---

## 📁 Project Architecture & Layout

The project contains only two clean folders:

```
LibraryManagment/
├── backend/                  # Pure Node.js + Express + PostgreSQL (CommonJS, zero ORM)
│   ├── server.js             # Starts server, mounts session, middleware, appAPI, cron
│   ├── appAPI.js             # All API routes declared in one place
│   ├── config.js             # Single place for dotenv and validated environment variables
│   ├── .env.example          # Sample environment template
│   ├── package.json
│   ├── db/
│   │   ├── pool.js           # Shared pg Pool
│   │   ├── schema.sql        # PostgreSQL tables, constraints & indexes
│   │   ├── seed.js           # Seed data (Admin, Student, Books)
│   │   └── migrateFromMySql.js # MySQL migration script
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── adminController.js
│   │   ├── studentController.js
│   │   └── bookController.js
│   ├── services/
│   │   ├── emailService.js        # Nodemailer notifications (Gmail SMTP / simulated)
│   │   ├── notificationService.js # Daily node-cron overdue notices & reminders
│   │   ├── fineService.js         # Overdue fine calculation logic
│   │   └── transactionService.js  # Issue, return, renew with DB transactions & row locks
│   ├── middleware/
│   │   ├── auth.js           # Session auth & role checks (ADMIN / STUDENT)
│   │   ├── tokenBucket.js    # Custom Token Bucket rate limiter
│   │   ├── leakyBucket.js    # Custom Leaky Bucket rate limiter + login lockout
│   │   ├── validate.js       # Input validation middleware
│   │   └── errorHandler.js   # 404 & centralized error handler
│   ├── utils/
│   │   └── asyncHandler.js   # Async controller error wrapper
│   └── tests/
│       ├── auth.test.js      # Auth & role testing (Jest + Supertest)
│       └── rateLimiter.test.js # Token & Leaky bucket algorithm tests
├── frontend/                 # React + Vite application
├── .gitignore
└── README.md
```

---

## ⚡ Quick Start Setup Guide

### 1. Prerequisites
- **Node.js** (v18 or higher) & **npm**
- **PostgreSQL** (v14 or higher)

### 2. Create the PostgreSQL Database
Open PostgreSQL CLI (`psql`) or pgAdmin and run:
```sql
CREATE DATABASE library_db;
```

### 3. Backend Setup
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Copy the sample environment file and configure your credentials:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` if your PostgreSQL username or password differs:*
   ```env
   PORT=8080
   NODE_ENV=development
   CLIENT_ORIGIN=http://localhost:5173
   DATABASE_URL=postgresql://postgres:password@localhost:5432/library_db
   SESSION_SECRET=your_secure_session_secret
   MAIL_USER=
   MAIL_PASS=
   LOAN_DAYS=7
   FINE_PER_DAY=10
   MAX_BOOKS_PER_STUDENT=3
   TOKEN_BUCKET_CAPACITY=60
   TOKEN_BUCKET_REFILL_PER_SEC=1
   LEAKY_BUCKET_CAPACITY=5
   LEAKY_BUCKET_LEAK_PER_SEC=0.2
   ```
3. Install backend dependencies:
   ```bash
   npm install
   ```
4. Initialize the PostgreSQL schema and seed sample data:
   ```bash
   npm run db:init
   ```
   *Default seed credentials created:*
   - **Admin:** `admin_user` / `admin123`
   - **Student:** `student_rahul` / `rahul123`
   - **Sample Books:** *Java Programming* (5 copies), *Spring Boot in Action* (2 copies)

5. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend starts at `http://localhost:8080`.

### 4. Frontend Setup
1. Open a new terminal and navigate to `frontend`:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🛡️ Custom Rate Limiting Algorithms

Both algorithms are handcrafted without external rate-limiting packages:

### 1. Token Bucket (`middleware/tokenBucket.js`)
- **How it works:** Each user has a bucket of tokens (e.g. 60). Requests consume 1 token. Tokens refill lazily based on elapsed time at `refillPerSecond`.
- **Purpose:** Allows bursts of traffic for quick page navigation while preventing sustained abuse.
- **Applied to:** Global `/api` routes, catalog search, and dashboards.

### 2. Leaky Bucket (`middleware/leakyBucket.js`)
- **How it works:** Requests fill a bucket of capacity (queue size). Water steadily leaks out at `leakRatePerSecond`. If water exceeds capacity, requests are rejected with **HTTP 429**.
- **Purpose:** Smooths bursts into a constant, controlled outflow rate.
- **Applied to:** High-risk actions like login, admin registration, and issuing/adding users.

| Route / Group | Algorithm | Capacity | Rate | Rejection Action |
|---|---|---|---|---|
| All `/api` routes (except `/health`) | Token Bucket | 60 | 1 token / sec | HTTP 429 with `Retry-After` |
| `POST /api/auth/login` | Leaky Bucket | 5 | 0.2 units / sec | HTTP 429 with `Retry-After` |
| `POST /api/auth/register-admin` | Leaky Bucket | 5 | 0.2 units / sec | HTTP 429 with `Retry-After` |
| `POST /api/admin/issue-book` | Leaky Bucket | 10 | 0.5 units / sec | HTTP 429 with `Retry-After` |
| `POST /api/admin/add-student` | Leaky Bucket | 5 | 0.2 units / sec | HTTP 429 with `Retry-After` |
| **Login Lockout Policy** | Attempt Tracker | 5 attempts | 15-minute lock | HTTP 429 until window expires |

---

## 🧪 Running Automated Tests

Run Jest & Supertest suites:
```bash
cd backend
npm test
```
All 13 integration tests for Token Bucket bursts, Leaky Bucket throttling, Login Lockout, and Session/Role authorization will execute.

To manually trigger overdue and reminder emails:
```bash
cd backend
npm run notify:test
```

---

## 📡 API Reference & cURL Examples

Cookie sessions are maintained across requests. Use `-c cookies.txt -b cookies.txt` in cURL to persist session state.

### 1. System Health
#### Health Check (Not rate-limited)
```bash
curl -X GET http://localhost:8080/api/health
```

---

### 2. Authentication (`/api/auth`)
#### Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"username":"admin_user","password":"admin123"}'
```

#### Register Admin
```bash
curl -X POST http://localhost:8080/api/auth/register-admin \
  -H "Content-Type: application/json" \
  -d '{"username":"admin_two","password":"securepassword123","fullName":"Assistant Librarian"}'
```

#### Get Current Session
```bash
curl -X GET http://localhost:8080/api/auth/me -b cookies.txt
```

#### Logout
```bash
curl -X POST http://localhost:8080/api/auth/logout -b cookies.txt -c cookies.txt
```

#### Change Password
```bash
curl -X PUT http://localhost:8080/api/auth/change-password \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"oldPassword":"admin123","newPassword":"newadminpassword123"}'
```

---

### 3. Book Catalog (`/api/books`)
#### Search, Filter & Paginate Books
```bash
curl -X GET "http://localhost:8080/api/books?search=Java&available=true&page=1&limit=10"
```

#### Get Book Categories
```bash
curl -X GET http://localhost:8080/api/books/categories
```

#### Get Book by ID
```bash
curl -X GET http://localhost:8080/api/books/1
```

---

### 4. Admin Management (`/api/admin`)
*(Requires login with `ROLE_ADMIN`)*

#### Admin Dashboard
```bash
curl -X GET http://localhost:8080/api/admin/dashboard -b cookies.txt
```

#### Issue a Book
```bash
curl -X POST http://localhost:8080/api/admin/issue-book \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"studentUsername":"student_rahul","bookTitle":"Java Programming"}'
```

#### Return a Book
```bash
curl -X POST http://localhost:8080/api/admin/return-book/1 -b cookies.txt
```

#### Add New Book
```bash
curl -X POST http://localhost:8080/api/admin/add-book \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"title":"Clean Code","author":"Robert C. Martin","copies":3,"isbn":"978-0132350884","category":"Software Engineering"}'
```

#### Edit Book
```bash
curl -X PUT http://localhost:8080/api/admin/books/1 \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"title":"Java Programming (2nd Edition)","author":"James Gosling","copies":6}'
```

#### Safe Delete Book
```bash
curl -X DELETE http://localhost:8080/api/admin/delete-book/3 -b cookies.txt
```

#### Add Student
```bash
curl -X POST http://localhost:8080/api/admin/add-student \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"username":"student_priya","password":"priyapassword123","fullName":"Priya Patel","branch":"IT","year":"2nd Year","email":"priya@student.edu"}'
```

#### Edit Student ID Profile & Details
```bash
curl -X PUT http://localhost:8080/api/admin/students/2 \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"username":"rahul_updated","fullName":"Rahul K. Sharma","branch":"CSE","year":"4th Year","email":"rahul.new@student.edu"}'
```

#### Admin Reset Student Password
```bash
curl -X POST http://localhost:8080/api/admin/students/2/reset-password \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"newPassword":"newstudentpass123"}'
```

#### Bulk Import Books (Excel / CSV, 50+ Books)
```bash
curl -X POST http://localhost:8080/api/admin/import/books \
  -b cookies.txt \
  -F "file=@books_list.xlsx"
```

#### Download 50-Book Template (.xlsx)
```bash
curl -X GET http://localhost:8080/api/admin/templates/books.xlsx \
  -b cookies.txt -o books_template_50.xlsx
```

#### Bulk Import Students with Passwords (Excel / CSV)
```bash
curl -X POST http://localhost:8080/api/admin/import/students \
  -b cookies.txt \
  -F "file=@students_list.xlsx"
```

#### Download 50-Student Template (.xlsx)
```bash
curl -X GET http://localhost:8080/api/admin/templates/students.xlsx \
  -b cookies.txt -o students_template_50.xlsx
```

#### Mark Fine as Paid
```bash
curl -X POST http://localhost:8080/api/admin/transactions/1/pay-fine -b cookies.txt
```

#### Overdue Loans Report
```bash
curl -X GET http://localhost:8080/api/admin/overdue -b cookies.txt
```

#### Library Usage Analytics Stats
```bash
curl -X GET http://localhost:8080/api/admin/stats -b cookies.txt
```

#### Export Transactions as CSV
```bash
curl -X GET http://localhost:8080/api/admin/export/transactions.csv -b cookies.txt -o transactions.csv
```

---

### 5. Student Portal (`/api/student`)
*(Requires login with `ROLE_STUDENT`)*

#### Student Dashboard
```bash
curl -X GET http://localhost:8080/api/student/dashboard -b cookies.txt
```

#### Return Own Book
```bash
curl -X POST http://localhost:8080/api/student/return-book/1 -b cookies.txt
```

#### Renew Book (+7 Days)
```bash
curl -X POST http://localhost:8080/api/student/renew/1 -b cookies.txt
```

#### Reserve Out-of-Stock Book
```bash
curl -X POST http://localhost:8080/api/student/reserve/2 -b cookies.txt
```

#### View My Fines
```bash
curl -X GET http://localhost:8080/api/student/fines -b cookies.txt
```

#### View My Loan History
```bash
curl -X GET http://localhost:8080/api/student/history -b cookies.txt
```
