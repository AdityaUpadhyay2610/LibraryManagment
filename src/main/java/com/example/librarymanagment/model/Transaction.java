package com.example.librarymanagment.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
public class Transaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private User student;

    @ManyToOne
    private Book book;

    private LocalDateTime issueDate;
    private LocalDateTime returnDate;

    // Business Logic Fields
    private LocalDateTime dueDate;
    private Double fine;
}