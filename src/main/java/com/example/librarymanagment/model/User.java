package com.example.librarymanagment.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "app_user")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String username;
    private String password;
    private String role;
    private String fullName;
    private String branch;
    @Column(name ="academic_year")
    private String year;

//    For notifications
    private String email;
}