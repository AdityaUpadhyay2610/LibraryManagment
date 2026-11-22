# Library Management System

A web application for managing a library. Administrators can manage the book catalog, register students, issue and return books, track late fines, and import records from Excel files. Students can browse available books, check their active loans and due dates, and renew eligible books.

## Tech Stack

- Backend: Node.js, Express.js, PostgreSQL (`pg` pool)
- Frontend: React, Vite, Tailwind CSS
- Authentication: Express session with PostgreSQL session store (`connect-pg-simple`), with Bearer token fallback for cross-domain deployments
- Testing: Jest, Supertest

## Project Structure

- `backend/`: Express server, PostgreSQL connection, routes, controllers, middleware, and services.
- `frontend/`: React single page application built with Vite.

## Setup and Installation

### 1. Prerequisites

- Node.js (v18 or higher recommended)
- PostgreSQL database (local or cloud instance such as Neon)

### 2. Backend Setup

1. Open a terminal in the `backend` folder:
   ```bash
   cd backend
   npm install
   ```

2. Create a `.env` file inside `backend/` based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Update the environment variables in `.env` with your database connection string and secret key:
   - `PORT`: Port number the backend server runs on (default: `8080`)
   - `NODE_ENV`: Application mode (`development`, `production`, or `test`)
   - `CLIENT_ORIGIN`: Allowed frontend origin for CORS (e.g. `http://localhost:5173`)
   - `DATABASE_URL`: PostgreSQL connection string (e.g. `postgresql://user:password@localhost:5432/library_db`)
   - `SESSION_SECRET`: Secret string used to sign session cookies
   - `MAIL_USER` and `MAIL_PASS`: Optional Gmail SMTP credentials for automated email notifications
   - `LOAN_DAYS`: Number of days a book loan lasts before becoming overdue (default: `7`)
   - `FINE_PER_DAY`: Fine amount in rupees charged per day overdue (default: `10`)
   - `MAX_BOOKS_PER_STUDENT`: Maximum active borrowed books allowed per student (default: `3`)

4. Initialize the database schema and seed default data:
   ```bash
   npm run db:init
   ```

5. Start the backend server:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup

1. Open a terminal in the `frontend` folder:
   ```bash
   cd frontend
   npm install
   ```

2. (Optional) Create a `.env` file in `frontend/` if the backend is hosted separately:
   ```env
   VITE_API_URL=http://localhost:8080
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

## Default Seed Accounts

When the database is initialized using `npm run db:init`, the following accounts are created:

- Administrator:
  - Username: `YOURADMINID`
  - Password: `YOURPASSWORD`
- Student:
  - Username: `YOURSTUDENTID`
  - Password: `YOURPASSWORD`

## Running Tests

To run the backend test suite:
```bash
cd backend
npm test
```
