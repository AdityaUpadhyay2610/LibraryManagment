package com.example.librarymanagment.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
public class Book {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String title;
    private String author;
    private int copies;

//    Store URL of book cover (e.g., from Amazon/Google)
    private String imageUrl;
}