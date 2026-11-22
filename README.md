# 📚 Library Management System

A modern, production-grade **Library Management System** built with **Node.js, Express.js, and PostgreSQL** on the backend and **React + Vite** on the frontend.

Designed with clean architecture, plain parameterized SQL queries via `pg` (no heavy ORM overhead), session-based authentication stored in PostgreSQL, hand-crafted rate limiters (Token Bucket and Leaky Bucket), automated background overdue notifications, and bulk Excel data importers for books and users.

---

## 📑 Table of Contents
1. [Architecture & System Flow](#-architecture--system-flow)
2. [Key Features](#-key-features)
3. [Project Directory Layout](#-project-directory-layout)
4. [Security & Credentials Policy](#-security--credentials-policy)
5. [Prerequisites & Environment Configuration](#-prerequisites--environment-configuration)
6. [Getting Started (Quick Setup)](#-getting-started-quick-setup)
7. [Database Schema & Architecture](#-database-schema--architecture)
8. [Rate Limiting Algorithms](#-rate-limiting-algorithms)
9. [Bulk Excel Import Specification](#-bulk-excel-import-specification)
10. [Comprehensive API Reference](#-comprehensive-api-reference)
11. [Automated Testing & Health Checks](#-automated-testing--health-checks)

---

## 🏗️ Architecture & System Flow

```
                      +---------------------------------------+
                      |       Client (React + Vite)           |
                      |  - Dark/Light Theme                   |
                      |  - Instant Hydration (< 1ms)          |
                      |  - Role-based Views (Admin / Student) |
                      +-------------------+-------------------+
                                          |
                                          | HTTP (credentials: include)
                                          v
                      +-------------------+-------------------+
                      |      Express.js Backend Server        |
                      |                                       |
                      |  1. Security (Helmet, CORS)           |
                      |  2. Token Bucket Rate Limiter         |
                      |  3. Leaky Bucket on Sensitive Routes  |
                      |  4. PostgreSQL Session Store          |
                      |  5. Centralized appAPI Routes         |
                      +-------------------+-------------------+
                                          |
                +-------------------------+-------------------------+
                |                                                   |
                v                                                   v
+---------------+-------------------+             +-----------------+-----------------+
|  PostgreSQL Database (pg Pool)    |             |  Background Services & Cron       |
|  - Raw Parameterized Queries      |             |  - Daily 10:00 AM Overdue Checks  |
|  - Pessimistic Row Locking        |             |  - 2-Day Due Reminders            |
|    (SELECT ... FOR UPDATE)        |             |  - Transactional Emails           |
|  - Relational Schema & Indexes    |             |  - Nodemailer SMTP                |
+-----------------------------------+             +-----------------------------------+
```

---

## ✨ Key Features

- **Role-Based Access Control (RBAC)**: Secure separation between Administrator (`ROLE_ADMIN`) and Student (`ROLE_STUDENT`) operations using HTTP-only session cookies.
- **Controlled User Registration**: Public self-registration is closed. Only administrators can create accounts and assign roles.
- **Concurrency & Race Condition Prevention**: Book issues and returns execute within ACID PostgreSQL database transactions (`BEGIN`, `COMMIT`, `ROLLBACK`) with pessimistic row locking (`SELECT ... FOR UPDATE`).
- **Custom Rate Limiting**:
  - **Token Bucket**: Regulates high-volume traffic across all endpoints while supporting bursts.
  - **Leaky Bucket**: Strictly throttles authentication and sensitive write endpoints.
  - **Account Lockout**: Automatically locks an account for 15 minutes after 5 consecutive failed login attempts.
- **Bulk Data Importers**:
  - Bulk book importer with duplicate ISBN updating.
  - Bulk user importer supporting explicit role assignment (`ROLE_STUDENT` or `ROLE_ADMIN`) and automatic bcrypt password hashing.
  - Interactive visual Excel spreadsheet guides built directly into the UI.
- **Automated Overdue & Reminders**: Background cron job checks overdue loans daily at 10:00 AM, automatically calculating overdue fines (₹10/day) and sending notification emails.
- **Reporting & Auditing**: Real-time stats dashboard, overdue loan audit trail, and one-click CSV export.

---

## 📁 Project Directory Layout

The workspace is strictly partitioned into two root directories:

```
LibraryManagment/
├── backend/                       # Node.js + Express + PostgreSQL Backend
│   ├── server.js                  # Application entry point, middlewares & graceful shutdown
│   ├── appAPI.js                  # Single router declaring all API routes
│   ├── config.js                  # Centralized configuration & environment validation
│   ├── .env.example               # Sanitized template for environment variables
│   ├── package.json
│   ├── db/
│   │   ├── pool.js                # Shared PostgreSQL connection pool with auto-SSL support
│   │   ├── schema.sql             # SQL table definitions, constraints, and indexes
│   │   ├── seed.js                # Initial database seeder
│   │   └── migrateFromMySql.js    # Data migration utility from legacy databases
│   ├── controllers/
│   │   ├── authController.js      # Login, session validation, logout, and password management
│   │   ├── adminController.js     # Admin dashboard, users, books, stats, and bulk imports
│   │   ├── studentController.js   # Student dashboard, self-return, renewals, and reservations
│   │   └── bookController.js      # Public search, category listing, and catalog queries
│   ├── services/
│   │   ├── emailService.js        # Nodemailer transport & email formatting
│   │   ├── notificationService.js # Node-cron job for overdue notices & loan reminders
│   │   ├── fineService.js         # Centralized overdue fee computation
│   │   └── transactionService.js  # ACID transactions with row-level locks
│   ├── middleware/
│   │   ├── auth.js                # Session validation & RBAC (requireLogin, requireRole)
│   │   ├── tokenBucket.js         # Token Bucket rate limiter middleware
│   │   ├── leakyBucket.js         # Leaky Bucket rate limiter & login lockout tracker
│   │   ├── validate.js            # Input sanitization and payload validation
│   │   ├── upload.js              # Multer in-memory file parser for spreadsheets
│   │   └── errorHandler.js        # 404 handler and centralized error dispatcher
│   ├── utils/
│   │   └── asyncHandler.js        # Asynchronous exception wrapper
│   └── tests/
│       ├── auth.test.js           # Auth & access control test suite (Jest + Supertest)
│       └── rateLimiter.test.js    # Rate limiting verification tests
├── frontend/                      # React + Vite Frontend Application
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── App.jsx                # Application root with instant session hydration
│       ├── services/              # API communication client (fetch wrapper)
│       ├── application/           # Contexts (AuthContext, AdminContext, StudentContext)
│       ├── domain/                # Constants and business definitions
│       └── presentation/          # Components, theme styling, and view pages
├── .gitignore                     # Git ignore rules (strictly blocks all .env variants)
└── README.md                      # Complete system documentation
```

---

## 🔒 Security & Credentials Policy

> **IMPORTANT SECURITY DIRECTIVE**  
> Under no circumstances should actual credentials, connection strings, session secrets, or SMTP passwords be committed to version control.

The root `.gitignore` enforces strict ignoring of all environment and secret files:

```gitignore
.env
.env.*
*.env
!.env.example
backend/.env
backend/.env.*
!backend/.env.example
frontend/.env
frontend/.env.*
!frontend/.env.example
```

- **Environment Template**: All variable definitions are documented in `backend/.env.example` with non-functional placeholder values.
- **Passwords**: Passwords stored in the database are hashed with bcrypt (salt rounds: 10).
- **Session Security**: Session cookies are marked `httpOnly`, use `sameSite: 'lax'`, and enable `secure` in production environments.

---

## ⚙️ Prerequisites & Environment Configuration

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **PostgreSQL**: v14 or higher (or cloud providers such as **Neon PostgreSQL**, **Supabase**, or **AWS RDS**)

### Backend Configuration (`backend/.env`)

Copy `backend/.env.example` to `backend/.env`:

```bash
cp backend/.env.example backend/.env
```

Populate the variables with your environment values:

```ini
PORT=8080
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173

# PostgreSQL connection string (supports local or cloud providers like Neon/Supabase)
DATABASE_URL=postgresql://username:password@hostname:5432/dbname?sslmode=require

# Strong random secret key for session cookies
SESSION_SECRET=your_random_64_character_session_secret

# Optional: Nodemailer SMTP credentials (leave blank for simulated local logging)
MAIL_USER=
MAIL_PASS=

# Business Rules
LOAN_DAYS=7
FINE_PER_DAY=10
MAX_BOOKS_PER_STUDENT=3

# Rate Limiter Thresholds
TOKEN_BUCKET_CAPACITY=60
TOKEN_BUCKET_REFILL_PER_SEC=1
LEAKY_BUCKET_CAPACITY=5
LEAKY_BUCKET_LEAK_PER_SEC=0.2
```

---

## 🚀 Getting Started (Quick Setup)

### 1. Database Initialization
Run the initialization script from the `backend` directory to create the tables, indexes, and initial default accounts:

```bash
cd backend
npm install
npm run db:init
```

*Default Seed Credentials:*
- **Administrator**: `admin_user` / `admin123`
- **Student**: `student_rahul` / `student123`

### 2. Start Backend Server
```bash
cd backend
npm run dev
```
The backend starts at `http://localhost:8080`.

### 3. Start Frontend Application
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🗄️ Database Schema & Architecture

The database utilizes standard PostgreSQL relational tables with explicit foreign keys and optimized indexes:

```sql
-- 1. User Table (Students & Administrators)
CREATE TABLE app_user (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ROLE_ADMIN', 'ROLE_STUDENT')),
    full_name VARCHAR(150),
    branch VARCHAR(100),
    academic_year VARCHAR(50),
    email VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Book Catalog Table
CREATE TABLE book (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255),
    isbn VARCHAR(50) UNIQUE,
    category VARCHAR(100),
    copies INT NOT NULL CHECK (copies >= 0),
    total_copies INT NOT NULL CHECK (total_copies >= 0),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Loan Transaction Table
CREATE TABLE transaction (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    book_id INT NOT NULL REFERENCES book(id) ON DELETE RESTRICT,
    issue_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    return_date TIMESTAMP WITH TIME ZONE,
    fine NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    fine_paid BOOLEAN NOT NULL DEFAULT FALSE,
    renew_count INT NOT NULL DEFAULT 0
);

-- 4. Reservation Waitlist Table
CREATE TABLE reservation (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    book_id INT NOT NULL REFERENCES book(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('WAITING', 'READY', 'CANCELLED', 'FULFILLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🚦 Rate Limiting Algorithms

| Target Route / Action | Algorithm | Capacity | Rate | Rejection Action |
|---|---|---|---|---|
| All `/api` routes (except `/health`) | **Token Bucket** | 60 tokens | 1.0 token / sec | `HTTP 429` with `Retry-After` header |
| `POST /api/auth/login` | **Leaky Bucket** | 5 units | 0.2 units / sec | `HTTP 429` with `Retry-After` header |
| `POST /api/admin/issue-book` | **Leaky Bucket** | 10 units | 0.5 units / sec | `HTTP 429` with `Retry-After` header |
| `POST /api/admin/add-student` | **Leaky Bucket** | 5 units | 0.2 units / sec | `HTTP 429` with `Retry-After` header |
| **Login Lockout Policy** | In-Memory Tracker | 5 attempts | 15-minute lock | `HTTP 429` until lockout period expires |

---

## 📊 Bulk Excel Import Specification

Both importers support `.xlsx`, `.xls`, and `.csv` formats.

### 1. User & Student Import Format
Administrators can define individual user roles directly in the spreadsheet:

| Column Header | Required? | Accepted Values | Description |
|---|---|---|---|
| `Username` | **Yes** | Alphanumeric string | Unique user ID / login handle |
| `Password` | **Yes** | String (min 6 chars) | Plaintext password (auto-hashed with bcrypt) |
| `FullName` | **Yes** | String | Full display name |
| `Role` | No | `ROLE_STUDENT` or `ROLE_ADMIN` | Account role (defaults to `ROLE_STUDENT`) |
| `Branch` | No | String (e.g. `Computer Science`) | Department or branch |
| `AcademicYear` | No | String (e.g. `3rd Year`, `Staff`) | Academic classification |
| `Email` | No | Valid email address | Used for loan and overdue notices |

### 2. Book Import Format
Supports initial catalog creation and incremental stock updates:

| Column Header | Required? | Description |
|---|---|---|
| `Title` | **Yes** | Book title |
| `Author` | **Yes** | Author name |
| `Copies` | **Yes** | Number of copies available |
| `ISBN` | No | Unique ISBN (existing ISBNs update stock automatically) |
| `Category` | No | Subject classification (e.g. `Programming`, `Mathematics`) |

---

## 📡 Comprehensive API Reference

All requests and responses use JSON (`Content-Type: application/json`) unless handling file uploads or CSV exports.  
Authentication state is maintained via cookie sessions (`credentials: 'include'`).

### 1. System Health
#### `GET /api/health`
Returns system status, database connectivity, and uptime. (Not rate-limited).
- **Access**: Public
- **Response `200 OK`**:
  ```json
  {
    "status": "OK",
    "database": "CONNECTED",
    "uptimeSeconds": 3600,
    "timestamp": "2026-11-22T07:00:00.000Z"
  }
  ```

---

### 2. Authentication (`/api/auth`)

#### `POST /api/auth/login`
Authenticates user credentials and establishes a session.
- **Access**: Public (throttled by Leaky Bucket)
- **Request Body**:
  ```json
  {
    "username": "admin_user",
    "password": "admin123"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "message": "Login successful",
    "user": {
      "id": 1,
      "username": "admin_user",
      "fullName": "System Administrator",
      "role": "ROLE_ADMIN",
      "email": "admin@library.edu"
    }
  }
  ```

#### `GET /api/auth/me`
Retrieves the currently authenticated session user profile.
- **Access**: Authenticated (`ROLE_ADMIN` or `ROLE_STUDENT`)
- **Response `200 OK`**:
  ```json
  {
    "user": {
      "id": 1,
      "username": "admin_user",
      "fullName": "System Administrator",
      "role": "ROLE_ADMIN"
    }
  }
  ```

#### `POST /api/auth/logout`
Destroys the current server session and clears client session cookies.
- **Access**: Public / Authenticated
- **Response `200 OK`**:
  ```json
  { "message": "Logged out successfully" }
  ```

#### `PUT /api/auth/change-password`
Changes the password for the active authenticated user.
- **Access**: Authenticated
- **Request Body**:
  ```json
  {
    "oldPassword": "current_password",
    "newPassword": "new_secure_password"
  }
  ```

---

### 3. Book Catalog (`/api/books`)

#### `GET /api/books`
Searches, filters, and paginates library titles.
- **Access**: Public
- **Query Parameters**:
  - `search` (string): Search term matching title, author, or ISBN.
  - `category` (string): Filter by category.
  - `available` (boolean): `true` to return only in-stock books.
  - `page` (number, default: 1): Page number.
  - `limit` (number, default: 10): Items per page.
- **Response `200 OK`**:
  ```json
  {
    "books": [
      {
        "id": 1,
        "title": "Clean Code",
        "author": "Robert C. Martin",
        "isbn": "978-0132350884",
        "category": "Software Engineering",
        "copies": 4,
        "totalCopies": 5,
        "imageUrl": null
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalBooks": 25,
      "totalPages": 3
    }
  }
  ```

#### `GET /api/books/categories`
Returns a list of all distinct book categories.
- **Access**: Public

#### `GET /api/books/:id`
Retrieves full details of a specific book by ID.
- **Access**: Public

---

### 4. Administrator Endpoints (`/api/admin`)
*(Requires session with `ROLE_ADMIN`)*

#### `GET /api/admin/dashboard`
Fetches complete administration dashboard data (books, users, transactions, summary stats).

#### `POST /api/admin/issue-book`
Issues a book copy to a student.
- **Request Body**:
  ```json
  {
    "studentUsername": "student_rahul",
    "bookTitle": "Clean Code"
  }
  ```

#### `POST /api/admin/return-book/:transId`
Processes the return of an issued book, recalculates fines, and increments available copies.

#### `GET /api/admin/students`
Lists all registered users (students and admins) with contact and academic details.

#### `POST /api/admin/add-student`
Creates a single user account and assigns their role.
- **Request Body**:
  ```json
  {
    "username": "student_ananya",
    "password": "Password@123",
    "fullName": "Ananya Iyer",
    "role": "ROLE_STUDENT",
    "branch": "Information Technology",
    "year": "2nd Year",
    "email": "ananya@college.edu"
  }
  ```

#### `PUT /api/admin/students/:id`
Updates a user's role, name, student ID, department, or password.

#### `POST /api/admin/students/:id/reset-password`
Directly resets any user's password without requiring their previous password.
- **Request Body**:
  ```json
  {
    "newPassword": "NewPassword@123"
  }
  ```

#### `DELETE /api/admin/students/:id`
Removes a user account (blocked if the user has unreturned books or unpaid fines).

#### `POST /api/admin/import/books`
Bulk uploads books via `.xlsx`, `.xls`, or `.csv` multipart form data.
- **Form Key**: `file`

#### `POST /api/admin/import/students`
Bulk uploads users and roles via `.xlsx`, `.xls`, or `.csv` multipart form data.
- **Form Key**: `file`

#### `GET /api/admin/templates/books.xlsx`
Downloads the official book import spreadsheet template.

#### `GET /api/admin/templates/students.xlsx`
Downloads the official user import spreadsheet template (with sample Student and Admin records).

#### `POST /api/admin/add-book`
Adds a single new book title to the catalog.

#### `PUT /api/admin/books/:id`
Updates existing book details or adjusts stock levels.

#### `DELETE /api/admin/delete-book/:id`
Deletes a book from the catalog (safely blocked if copies are currently issued).

#### `POST /api/admin/transactions/:id/pay-fine`
Marks an overdue loan's fine as paid.

#### `GET /api/admin/overdue`
Returns an audit list of all active transactions that have exceeded their due date.

#### `GET /api/admin/stats`
Returns aggregated analytics (total loans, return rates, fine collection, active borrowers).

#### `GET /api/admin/export/transactions.csv`
Streams the entire library transaction history as a downloadable CSV spreadsheet.

---

### 5. Student Endpoints (`/api/student`)
*(Requires session with `ROLE_STUDENT`)*

#### `GET /api/student/dashboard`
Returns the student's profile, currently borrowed books, loan due dates, and book catalog.

#### `POST /api/student/return-book/:transId`
Allows a student to initiate the return of their own borrowed book.

#### `POST /api/student/renew/:transId`
Extends the loan period by 7 days (allowed up to 2 times, provided the book is not reserved by another student).

#### `POST /api/student/reserve/:bookId`
Places the student on the reservation waitlist for an out-of-stock book.

#### `DELETE /api/student/reserve/:id`
Cancels an active book reservation.

#### `GET /api/student/reservations`
Lists the student's active reservations and queue status.

#### `GET /api/student/fines`
Returns the student's unpaid and historical fine records.

#### `GET /api/student/history`
Returns the student's complete historical borrowing record.

---

## 🧪 Automated Testing & Health Checks

### Running Integration Tests
Execute the automated Jest test suite covering authentication, session cookies, Token Bucket bursts, Leaky Bucket limits, and login lockout triggers:

```bash
cd backend
npm test
```

### Manual Trigger of Daily Overdue Notifications
You can manually run the background overdue checker and loan reminder script:

```bash
cd backend
npm run notify:test
```

### Production Build Verification
To test and verify the optimized production build of the frontend:

```bash
cd frontend
npm run build
```

---

## 📄 License
This project is licensed under the MIT License.
