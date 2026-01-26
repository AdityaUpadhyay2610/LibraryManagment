package com.example.librarymanagment.repository;

import com.example.librarymanagment.model.Book;
import com.example.librarymanagment.model.Transaction;
import com.example.librarymanagment.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    // Add this method to find books by specific student
    List<Transaction> findByStudent(User student);
    List<Transaction> findByBook(Book book);
}