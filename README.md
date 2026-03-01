# 📚 Smart Library Management System

> A full-stack automated library system built with Spring Boot, featuring automated email notifications, fine calculation, and role-based security.

## 🚀 Overview
This project digitizes traditional library operations. It allows an Admin to manage books and students while automating critical tasks like tracking due dates and sending overdue warnings via email. The system is secured with Spring Security and uses a responsive Glassmorphism UI.

## ✨ Key Features
* **🔐 Role-Based Security:** Secure login for Admins and Students (Spring Security + BCrypt).
* **📧 Automated Notifications:** * Instant email confirmation when a book is issued.
    * **Daily Scheduler:** Automatically checks for overdue books every morning and emails students.
* **💰 Smart Fine System:** Automatically calculates late fees (₹10/day) based on the return date.
* **📊 Interactive Dashboard:** Real-time statistics (Total Books, Active Issued, Pending Fines) with a modern Glass UI.
* **🔎 Search & Inventory:** Live search for students and books without page reloads.

## 🛠️ Tech Stack
* **Backend:** Java 25, Spring Boot 3.4.1
* **Database:** H2 Database (SQL) / JPA Hibernate
* **Frontend:** Thymeleaf, HTML5, CSS3 (Glassmorphism), JavaScript
* **Tools:** Maven, IntelliJ IDEA, JavaMailSender

## 📂 Project Structure
```text
src/main/java/com/example/librarymanagment
├── config
│   ├── SecurityConfig.java       # Login & Role Permissions
│   └── DataInitializer.java      # Creates default Admin user
├── controller
│   ├── AdminController.java      # Dashboard & Book Management
│   ├── AuthController.java       # Login/Logout Logic
│   └── StudentController.java    # Student Profile & History
├── model
│   ├── Book.java                 # Book Entity
│   ├── User.java                 # Student/Admin Entity
│   └── Transaction.java          # Issue/Return History
├── repository                    # JPA Interfaces (SQL Queries)
└── service
    ├── EmailService.java         # SMTP Email Logic
    └── NotificationService.java  # @Scheduled Task for Overdue Alerts
