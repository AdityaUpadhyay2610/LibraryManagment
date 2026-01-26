package com.example.librarymanagment.controller;

import com.example.librarymanagment.model.Book;
import com.example.librarymanagment.model.Transaction;
import com.example.librarymanagment.model.User;
import com.example.librarymanagment.repository.BookRepository;
import com.example.librarymanagment.repository.TransactionRepository;
import com.example.librarymanagment.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

import java.time.LocalDateTime;
import java.util.List;

@Controller
@RequestMapping("/student")
public class StudentController {

    @Autowired private UserRepository userRepo;
    @Autowired private TransactionRepository transRepo;
    @Autowired private BookRepository bookRepo; // Needed to update book copies

    @GetMapping("/dashboard")
    public String dashboard(Model model) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User student = userRepo.findByUsername(auth.getName());

        if(student == null) return "redirect:/login";

        List<Transaction> myBooks = transRepo.findByStudent(student);
        model.addAttribute("user", student);
        model.addAttribute("myBooks", myBooks);
        return "student_dashboard";
    }

    // NEW: Allow Student to Return Book
    @GetMapping("/return-book/{transId}")
    public String returnBook(@PathVariable Long transId) {
        Transaction t = transRepo.findById(transId).orElse(null);

        // Security Check: Ensure the transaction exists and hasn't been returned yet
        if (t != null && t.getReturnDate() == null) {
            // 1. Increase Book Copies
            Book book = t.getBook();
            book.setCopies(book.getCopies() + 1);
            bookRepo.save(book);

            // 2. Mark Transaction as Returned
            t.setReturnDate(LocalDateTime.now());
            transRepo.save(t);
        }
        return "redirect:/student/dashboard";
    }
}