# Integration Guide: React + Spring Boot + MySQL

This document outlines the step-by-step changes made to migrate the Library Management System from a Thymeleaf-based MVC structure using an H2 database to a modern full-stack application with a **React.js Frontend**, a **Spring Boot REST API**, and a **MySQL Database**.

---

## 📂 Project Architecture

```
LibraryManagment/
├── pom.xml                     <-- [Added] MySQL dependency
├── INTEGRATION_GUIDE.md        <-- [Added] This setup and description guide
├── src/main/resources/
│   ├── application.properties  <-- [Updated] Switched H2 to MySQL configuration
│   └── static/                 <-- [Target] Compiled React assets (production build)
├── src/main/java/.../
│   ├── config/
│   │   └── SecurityConfig.java <-- [Updated] CORS enabled, programmatic auth, API security
│   └── controller/api/
│       ├── ApiAuthController.java    <-- [Added] JSON authentication endpoints
│       ├── ApiAdminController.java   <-- [Added] JSON admin dashboard/crud endpoints
│       └── ApiStudentController.java  <-- [Added] JSON student catalog & return endpoints
└── frontend/                   <-- [Added] React.js application
    ├── package.json            <-- Vite React dependencies & scripts
    ├── vite.config.js          <-- Dev proxy & Production build directories
    └── src/
        ├── index.css           <-- Premium global glassmorphism stylesheets
        ├── api.js              <-- Session-based frontend API fetch wrapper
        └── App.jsx             <-- Responsive Login/Dashboard view router
```

---

## 🛠️ Step-by-Step Changes Details

### 1. Database Migration: H2 to MySQL

1. **Dependency Addition (`pom.xml`)**:
   We added the MySQL JDBC driver dependency:
   ```xml
   <dependency>
       <groupId>com.mysql</groupId>
       <artifactId>mysql-connector-j</artifactId>
       <scope>runtime</scope>
   </dependency>
   ```

2. **Properties Updates (`application.properties`)**:
   We disabled the H2 database configurations and replaced them with MySQL connection settings:
   ```properties
   # Database - MySQL (Active)
   spring.datasource.url=jdbc:mysql://localhost:3306/library_db?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
   spring.datasource.driverClassName=com.mysql.cj.jdbc.Driver
   spring.datasource.username=root
   spring.datasource.password=root
   spring.jpa.database-platform=org.hibernate.dialect.MySQLDialect
   spring.jpa.hibernate.ddl-auto=update
   ```
   *Note: Standard MySQL credentials (`root` / `root`) are configured. When Spring Boot starts up, Hibernate automatically creates the database schema (`library_db`) and necessary tables.*

---

### 2. Spring Security Adaptations (`SecurityConfig.java`)

To bridge the backend REST APIs with the separate React client, we implemented the following changes:
- **CORS Configuration**: Enabled cross-origin requests from Vite's local dev server (`http://localhost:5173`) and allowed session credentials (cookies).
- **Authentication Entry Points**: Adjusted the security config so that requests starting with `/api/` return a JSON `401 Unauthorized` status on authentication failures instead of triggering standard page redirects.
- **`AuthenticationManager` Exposure**: Exposed Spring Security's `AuthenticationManager` as a bean so that controllers can log in users programmatically.
- **REST Endpoint Matchers**: Secured the new endpoints under `/api/admin/**` for `ADMIN` role, `/api/student/**` for `STUDENT` role, and left `/api/auth/**` publicly accessible.
- **Static Frontend Paths**: Allowed public access to `/`, `/index.html`, `/favicon.svg`, and `/assets/**` so that React files can load freely.

---

### 3. Backend REST Controllers (`com.example.librarymanagment.controller.api`)

We introduced three lightweight RestControllers:
1. **`ApiAuthController`**:
   - `POST /api/auth/login`: Validates password credentials, authenticates using `AuthenticationManager`, saves session state, and returns the sanitized user profile.
   - `POST /api/auth/register-admin`: Registers a new administrator user.
   - `GET /api/auth/me`: Retrieves details of the currently authenticated user session.
   - `POST /api/auth/logout`: Invalidates the session and signs out.
2. **`ApiAdminController`**:
   - `GET /api/admin/dashboard`: Computes library statistics and returns lists of books, students, branch filters, and transaction tables.
   - `POST /api/admin/issue-book`: Links a student with a book, handles inventory reductions, and triggers email notifications.
   - `POST /api/admin/return-book/{transId}`: Marks a book returned, computes fines, and releases book inventory copies.
   - `POST /api/admin/add-student` & `POST /api/admin/add-book`: Standard CRUD forms.
   - `DELETE /api/admin/delete-book/{id}`: Cascades deletes onto history and deletes a book safely.
3. **`ApiStudentController`**:
   - `GET /api/student/dashboard`: Returns specific student info, their own issued book records, and the available book catalog.
   - `POST /api/student/return-book/{transId}`: Allows a student to return an issued book directly.

---

### 4. React Frontend Creation (`frontend/`)

Inside the `frontend` folder, we built a Vite-based React application:
- **`api.js`**: Built an API utility wrapping standard browser fetch. It passes `credentials: 'include'` on every request to automatically append session cookies.
- **`index.css`**: Created a beautiful slate-dark theme using CSS variables. Designed with:
  - Custom scrollbars.
  - Sleek modern responsive tables with status indicators.
  - Hover micro-animations and smooth transition fades.
  - High-end stats widgets with colorful top borders and glassmorphism cards.
  - Dynamic gradient fallback covers to make books feel visually premium even if they lack cover URLs.
- **`App.jsx`**: Main route and tab manager:
  - Checks if a session exists on mount via `/api/auth/me`.
  - Serves an elegant Login page (including a sliding toggle for Admin vs. Student login and registration options).
  - Routes admins to the Sidebar Admin Panel workspace (Overview tabs, book manager, student registration, issue book forms, and transaction logs).
  - Routes students to the Header Student Panel workspace (Personal loan ledgers, real-time searchable library catalog grids).

---

### 5. Seamless Proxy & Build Integration

1. **Development Mode Proxy (`vite.config.js`)**:
   Vite is configured to proxy all `/api` requests to `http://localhost:8080` under the hood. This eliminates the need to hardcode URLs in React:
   ```javascript
   server: {
     proxy: {
       '/api': {
         target: 'http://localhost:8080',
         changeOrigin: true,
         secure: false,
       }
     }
   }
   ```

2. **Single JAR Production Bundling (`vite.config.js`)**:
   Vite builds the distribution assets directly into the backend static folder:
   ```javascript
   build: {
     outDir: '../src/main/resources/static',
     emptyOutDir: true,
   }
   ```
   When you run `npm run build`, all assets compile, empty the backend `src/main/resources/static` directory, and output files directly into it. When Spring Boot compiles, it embeds these files and serves them dynamically on port `8080`!

---

## 🚀 How to Run the Application

### Prerequisites
1. Install **Node.js** (v18+).
2. Install **Java JDK 17** or higher.
3. Have **MySQL** running locally or in the cloud.
4. Open MySQL and create an empty database schema named `library_db`:
   ```sql
   CREATE DATABASE library_db;
   ```

---

### Option A: Development Environment (Highly Recommended for coding)

Run the backend and frontend in separate terminals. This provides hot-reloading on frontend changes.

#### Terminal 1: Start Backend (Spring Boot)
In the root directory:
```bash
# Compile and start backend
.\mvnw.cmd spring-boot:run
```

#### Terminal 2: Start Frontend (React)
In the `frontend/` directory:
```bash
# Start Vite development server
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

### Option B: Production Environment (For Live Demonstrations & GitHub Deployments)

This compiles the React code and embeds it directly into Spring Boot. The entire application runs on port `8080` from a single runnable file.

#### 1. Compile the Frontend
In the `frontend/` directory:
```bash
npm run build
```

#### 2. Package & Start the Backend
In the root directory:
```bash
# Package into a single executable JAR file
.\mvnw.cmd clean package -DskipTests
```
This builds a JAR file inside the `target/` directory.

#### 3. Run the JAR File
```bash
java -jar target/LibraryManagment-0.0.1-SNAPSHOT.jar
```
Open **`http://localhost:8080`** in your browser. The entire full-stack app is served live!
