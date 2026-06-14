package com.example.librarymanagment.controller.api;

import com.example.librarymanagment.model.Book;
import com.example.librarymanagment.model.Transaction;
import com.example.librarymanagment.model.User;
import com.example.librarymanagment.repository.BookRepository;
import com.example.librarymanagment.repository.TransactionRepository;
import com.example.librarymanagment.repository.UserRepository;
import com.example.librarymanagment.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class ApiAdminController {

    @Autowired private TransactionRepository transRepo;
    @Autowired private BookRepository bookRepo;
    @Autowired private UserRepository userRepo;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private EmailService emailService;

    @GetMapping("/dashboard")
    public ResponseEntity<?> viewDashboard() {
        List<Transaction> allTrans = transRepo.findAll();
        List<Book> allBooks = bookRepo.findAll();
        List<User> allUsers = userRepo.findAll();

        // Calculate Stats
        long totalBooks = allBooks.stream().mapToInt(Book::getCopies).sum();
        long totalIssued = allTrans.stream().filter(t -> t.getReturnDate() == null).count();
        long totalStudents = allUsers.stream().filter(u -> "ROLE_STUDENT".equals(u.getRole())).count();

        double totalFines = allTrans.stream()
                .filter(t -> t.getFine() != null)
                .mapToDouble(Transaction::getFine)
                .sum();

        Map<String, Object> data = new HashMap<>();
        data.put("statBooks", totalBooks);
        data.put("statIssued", totalIssued);
        data.put("statStudents", totalStudents);
        data.put("statFines", totalFines);
        data.put("transactions", allTrans);
        data.put("books", allBooks);
        
        // Exclude passwords from student/user list
        List<User> sanitizedUsers = allUsers.stream().map(u -> {
            User su = new User();
            su.setId(u.getId());
            su.setUsername(u.getUsername());
            su.setFullName(u.getFullName());
            su.setRole(u.getRole());
            su.setBranch(u.getBranch());
            su.setYear(u.getYear());
            su.setEmail(u.getEmail());
            return su;
        }).toList();
        data.put("users", sanitizedUsers);
        data.put("branchList", userRepo.findAllBranches());
        data.put("yearList", userRepo.findAllYears());

        return ResponseEntity.ok(data);
    }

    @PostMapping("/issue-book")
    public ResponseEntity<?> issueBook(@RequestBody Map<String, String> payload) {
        String studentUsername = payload.get("studentUsername");
        String bookTitle = payload.get("bookTitle");

        User student = userRepo.findByUsername(studentUsername);
        Book book = bookRepo.findByTitle(bookTitle);

        if (student == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Student username not found"));
        }
        if (book == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Book title not found"));
        }
        if (book.getCopies() <= 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "No copies of this book are available"));
        }

        Transaction t = new Transaction();
        t.setStudent(student);
        t.setBook(book);
        t.setIssueDate(LocalDateTime.now());
        t.setDueDate(LocalDateTime.now().plusDays(7));

        transRepo.save(t);

        book.setCopies(book.getCopies() - 1);
        bookRepo.save(book);

        // Send Email Notification
        if (student.getEmail() != null && !student.getEmail().isEmpty()) {
            try {
                java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("dd-MMM-yyyy HH:mm");
                String subject = "📚 Library Notification: Book Issued - " + book.getTitle();
                String body = "Dear " + student.getFullName() + ",\n\n" +
                        "We are pleased to inform you that the following book has been successfully issued to your library account. Please find the transaction details below:\n\n" +
                        "📖 BOOK DETAILS\n" +
                        "-----------------------------------------------------\n" +
                        "Title         : " + book.getTitle() + "\n" +
                        "Author        : " + book.getAuthor() + "\n" +
                        "Issue Date    : " + t.getIssueDate().format(formatter) + "\n" +
                        "Due Date      : " + t.getDueDate().format(formatter) + "\n" +
                        "-----------------------------------------------------\n\n" +
                        "⚠️ TERMS & CONDITIONS\n" +
                        "1. Please ensure the book is returned on or before the Due Date mentioned above.\n" +
                        "2. Late Returns will incur a fine of ₹10.00 per day.\n" +
                        "3. Please maintain the book in good condition to avoid damage charges.\n\n" +
                        "Thank you for using our library services.\n\n" +
                        "Best Regards,\n" +
                        "Library Management Team";
                emailService.sendEmail(student.getEmail(), subject, body);
            } catch (Exception e) {
                // Log and ignore email errors so issuing still succeeds
                System.out.println("Error sending email: " + e.getMessage());
            }
        }

        return ResponseEntity.ok(Map.of("message", "Book issued successfully", "transaction", t));
    }

    @PostMapping("/return-book/{transId}")
    public ResponseEntity<?> returnBook(@PathVariable Long transId) {
        Transaction t = transRepo.findById(transId).orElse(null);
        if (t == null) {
            return ResponseEntity.notFound().build();
        }
        if (t.getReturnDate() != null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Book already returned"));
        }

        t.setReturnDate(LocalDateTime.now());

        // Calculate fine
        long daysLate = ChronoUnit.DAYS.between(t.getDueDate(), t.getReturnDate());
        if (daysLate > 0) {
            t.setFine(daysLate * 10.0);
        } else {
            t.setFine(0.0);
        }

        Book book = t.getBook();
        book.setCopies(book.getCopies() + 1);
        bookRepo.save(book);
        transRepo.save(t);

        return ResponseEntity.ok(Map.of("message", "Book returned successfully", "fine", t.getFine()));
    }

    @PostMapping("/add-student")
    public ResponseEntity<?> addStudent(@RequestBody User student) {
        if (student.getUsername() == null || student.getUsername().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username is required"));
        }
        if (userRepo.findByUsername(student.getUsername()) != null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username is already taken"));
        }

        User u = new User();
        u.setUsername(student.getUsername());
        u.setFullName(student.getFullName());
        u.setPassword(passwordEncoder.encode(student.getPassword()));
        u.setRole("ROLE_STUDENT");
        u.setBranch(student.getBranch());
        u.setYear(student.getYear());
        u.setEmail(student.getEmail());

        userRepo.save(u);
        return ResponseEntity.ok(Map.of("message", "Student added successfully", "student", u));
    }

    @PostMapping("/add-book")
    public ResponseEntity<?> addBook(@RequestBody Book book) {
        if (book.getTitle() == null || book.getTitle().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Book title is required"));
        }

        Book b = new Book();
        b.setTitle(book.getTitle());
        b.setAuthor(book.getAuthor());
        b.setCopies(book.getCopies());
        b.setImageUrl(book.getImageUrl());

        bookRepo.save(b);
        return ResponseEntity.ok(Map.of("message", "Book added successfully", "book", b));
    }

    @DeleteMapping("/delete-book/{id}")
    public ResponseEntity<?> deleteBook(@PathVariable Long id) {
        Book book = bookRepo.findById(id).orElse(null);
        if (book == null) {
            return ResponseEntity.notFound().build();
        }

        List<Transaction> history = transRepo.findByBook(book);
        transRepo.deleteAll(history);
        bookRepo.delete(book);

        return ResponseEntity.ok(Map.of("message", "Book deleted successfully"));
    }
}
