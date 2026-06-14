package com.example.librarymanagment.controller.api;

import com.example.librarymanagment.model.Book;
import com.example.librarymanagment.model.Transaction;
import com.example.librarymanagment.model.User;
import com.example.librarymanagment.repository.BookRepository;
import com.example.librarymanagment.repository.TransactionRepository;
import com.example.librarymanagment.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/student")
public class ApiStudentController {

    @Autowired private UserRepository userRepo;
    @Autowired private TransactionRepository transRepo;
    @Autowired private BookRepository bookRepo;

    @GetMapping("/dashboard")
    public ResponseEntity<?> dashboard() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User student = userRepo.findByUsername(auth.getName());

        if (student == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "User session not found"));
        }

        List<Transaction> myBooks = transRepo.findByStudent(student);
        List<Book> availableBooks = bookRepo.findAll();

        Map<String, Object> data = new HashMap<>();
        
        // Sanitize student details
        User responseUser = new User();
        responseUser.setId(student.getId());
        responseUser.setUsername(student.getUsername());
        responseUser.setFullName(student.getFullName());
        responseUser.setRole(student.getRole());
        responseUser.setBranch(student.getBranch());
        responseUser.setYear(student.getYear());
        responseUser.setEmail(student.getEmail());

        data.put("user", responseUser);
        data.put("myBooks", myBooks);
        data.put("catalog", availableBooks);

        return ResponseEntity.ok(data);
    }

    @PostMapping("/return-book/{transId}")
    public ResponseEntity<?> returnBook(@PathVariable Long transId) {
        Transaction t = transRepo.findById(transId).orElse(null);
        if (t == null) {
            return ResponseEntity.notFound().build();
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (t.getStudent() == null || !auth.getName().equals(t.getStudent().getUsername())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Unauthorized to return this book transaction"));
        }

        if (t.getReturnDate() == null) {
            Book book = t.getBook();
            book.setCopies(book.getCopies() + 1);
            bookRepo.save(book);

            t.setReturnDate(LocalDateTime.now());
            transRepo.save(t);
            return ResponseEntity.ok(Map.of("message", "Book returned successfully"));
        }

        return ResponseEntity.badRequest().body(Map.of("message", "Book already returned"));
    }
}
