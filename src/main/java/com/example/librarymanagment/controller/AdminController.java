package com.example.librarymanagment.controller;

import com.example.librarymanagment.model.*;
import com.example.librarymanagment.repository.*;
import com.example.librarymanagment.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Controller
@RequestMapping("/admin")
public class AdminController {

    @Autowired private TransactionRepository transRepo;
    @Autowired private BookRepository bookRepo;
    @Autowired private UserRepository userRepo;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private EmailService emailService; // Inject Email Service

    @GetMapping("/dashboard")
    public String viewDashboard(Model model) {
        List<Transaction> allTrans = transRepo.findAll();
        List<Book> allBooks = bookRepo.findAll();
        List<User> allUsers = userRepo.findAll();

        // 1. Calculate Stats
        long totalBooks = allBooks.stream().mapToInt(Book::getCopies).sum();
        long totalIssued = allTrans.stream().filter(t -> t.getReturnDate() == null).count();
        long totalStudents = allUsers.stream().filter(u -> "ROLE_STUDENT".equals(u.getRole())).count();

        // Calculate Total Fines (Collected or Pending)
        double totalFines = allTrans.stream()
                .filter(t -> t.getFine() != null)
                .mapToDouble(Transaction::getFine)
                .sum();

        // 2. Pass Stats to View
        model.addAttribute("statBooks", totalBooks);
        model.addAttribute("statIssued", totalIssued);
        model.addAttribute("statStudents", totalStudents);
        model.addAttribute("statFines", totalFines);

        // ... (Keep existing attributes)
        model.addAttribute("transactions", allTrans);
        model.addAttribute("books", allBooks);
        model.addAttribute("users", allUsers);
        model.addAttribute("branchList", userRepo.findAllBranches());
        model.addAttribute("yearList", userRepo.findAllYears());

        return "admin_dashboard";
    }

    @PostMapping("/issue-book")
    public String issueBook(@RequestParam String studentUsername,
                            @RequestParam String bookTitle) {

        User student = userRepo.findByUsername(studentUsername);
        Book book = bookRepo.findByTitle(bookTitle);

        if (student != null && book != null && book.getCopies() > 0) {
            Transaction t = new Transaction();
            t.setStudent(student);
            t.setBook(book);
            t.setIssueDate(LocalDateTime.now());

            // Set Due Date (7 Days from now)
            t.setDueDate(LocalDateTime.now().plusDays(7));


            transRepo.save(t);

            book.setCopies(book.getCopies() - 1);
            bookRepo.save(book);

            // ---------------------------------------------------------
            // 📧 SEND FORMAL EMAIL NOTIFICATION
            // ---------------------------------------------------------
            if(student.getEmail() != null && !student.getEmail().isEmpty()) {

                // Formatter to make dates look nice (e.g., "26-Jan-2026 10:30 AM")
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
            }
        }
        return "redirect:/admin/dashboard";
    }

    @GetMapping("/return-book/{transId}")
    public String returnBook(@PathVariable Long transId) {
        Transaction t = transRepo.findById(transId).orElse(null);
        if (t != null && t.getReturnDate() == null) {
            t.setReturnDate(LocalDateTime.now());

            // 3. CALCULATE FINE (If returned late)
            long daysLate = ChronoUnit.DAYS.between(t.getDueDate(), t.getReturnDate());
            if (daysLate > 0) {
                t.setFine(daysLate * 10.0); // ₹10 per day fine
            } else {
                t.setFine(0.0);
            }

            Book book = t.getBook();
            book.setCopies(book.getCopies() + 1);
            bookRepo.save(book);
            transRepo.save(t);
        }
        return "redirect:/admin/dashboard";
    }

    @PostMapping("/add-student")
    public String addStudent(@RequestParam String username, @RequestParam String fullName,
                             @RequestParam String password, @RequestParam String branch,
                             @RequestParam String year, @RequestParam String email) { // Added Email
        User u = new User();
        u.setUsername(username);
        u.setFullName(fullName);
        u.setPassword(passwordEncoder.encode(password));
        u.setRole("ROLE_STUDENT");
        u.setBranch(branch);
        u.setYear(year);
        u.setEmail(email);
        userRepo.save(u);
        return "redirect:/admin/dashboard";
    }

    @PostMapping("/add-book")
    public String addBook(@RequestParam String title, @RequestParam String author,
                          @RequestParam int copies, @RequestParam String imageUrl) { // Added Image URL
        Book b = new Book();
        b.setTitle(title);
        b.setAuthor(author);
        b.setCopies(copies);
        b.setImageUrl(imageUrl); // Save Image URL
        bookRepo.save(b);
        return "redirect:/admin/dashboard";
    }

    // ... delete methods remain the same ...
    @GetMapping("/delete-book/{id}")
    public String deleteBook(@PathVariable Long id) {
        // 1. Find the Book
        Book book = bookRepo.findById(id).orElse(null);

        if (book != null) {
            // 2. Find all transactions (history) for this book
            List<Transaction> history = transRepo.findByBook(book);

            // 3. Delete the history FIRST (Fixes the crash)
            transRepo.deleteAll(history);

            // 4. Now safely delete the book
            bookRepo.delete(book);
        }
        return "redirect:/admin/dashboard";
    }
}