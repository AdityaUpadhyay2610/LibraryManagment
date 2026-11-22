-- backend/db/schema.sql
-- Database schema for Library Management System in PostgreSQL

-- 1. Table: app_user (for Admin and Student accounts)
CREATE TABLE IF NOT EXISTS app_user (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('ROLE_ADMIN', 'ROLE_STUDENT')),
  full_name VARCHAR(255),
  branch VARCHAR(100),
  academic_year VARCHAR(100),
  email VARCHAR(255),
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table: book (inventory of books)
CREATE TABLE IF NOT EXISTS book (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255),
  isbn VARCHAR(100) UNIQUE,
  category VARCHAR(100),
  copies INT NOT NULL DEFAULT 1 CHECK (copies >= 0),
  total_copies INT NOT NULL DEFAULT 1,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Table: transaction (issue and return records)
CREATE TABLE IF NOT EXISTS "transaction" (
  id SERIAL PRIMARY KEY,
  student_id INT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  book_id INT NOT NULL REFERENCES book(id) ON DELETE RESTRICT,
  issue_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  due_date TIMESTAMP NOT NULL,
  return_date TIMESTAMP,
  fine NUMERIC(8,2) DEFAULT 0,
  fine_paid BOOLEAN DEFAULT false,
  renew_count INT DEFAULT 0
);

-- 4. Table: reservation (waitlist when all copies of a book are borrowed)
CREATE TABLE IF NOT EXISTS reservation (
  id SERIAL PRIMARY KEY,
  student_id INT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  book_id INT NOT NULL REFERENCES book(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL CHECK (status IN ('WAITING', 'READY', 'CANCELLED', 'FULFILLED')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Table: session (required by connect-pg-simple for persistent Express sessions)
CREATE TABLE IF NOT EXISTS "session" (
  "sid" VARCHAR NOT NULL COLLATE "default",
  "sess" JSON NOT NULL,
  "expire" TIMESTAMP(6) NOT NULL
)
WITH (OIDS=FALSE);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'session_pkey'
  ) THEN
    ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transaction_student_id ON "transaction"(student_id);
CREATE INDEX IF NOT EXISTS idx_transaction_book_id ON "transaction"(book_id);
CREATE INDEX IF NOT EXISTS idx_transaction_return_date ON "transaction"(return_date);
CREATE INDEX IF NOT EXISTS idx_book_title ON book(title);
CREATE INDEX IF NOT EXISTS idx_reservation_book_status ON reservation(book_id, status);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
