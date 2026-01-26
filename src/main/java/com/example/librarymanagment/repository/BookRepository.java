package com.example.librarymanagment.repository;

import com.example.librarymanagment.model.Book;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {
    // JpaRepository already provides findAll(), save(), and findById()
    // which we use for checking book availability.
     Book findByTitle(String title);
}