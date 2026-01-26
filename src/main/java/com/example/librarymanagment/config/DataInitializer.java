package com.example.librarymanagment.config;

import com.example.librarymanagment.model.*;
import com.example.librarymanagment.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

//import java.time.LocalDateTime;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initDatabase(UserRepository userRepo,
                                   BookRepository bookRepo,
//                                   TransactionRepository transactionRepo,
                                   PasswordEncoder passwordEncoder) {
        return args -> {
            // CHECK: Only initialize data if the Admin user doesn't exist yet
            if (userRepo.findByUsername("admin_user") == null) {
                System.out.println("--- Database is empty. Initializing Default Data... ---");

                // 1. Create Admin
                User admin = new User();
                admin.setUsername("admin_user");
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setRole("ROLE_ADMIN");
                userRepo.save(admin);

                // 2. Create Student (Rahul)
                User student = new User();
                student.setUsername("student_rahul");
                student.setPassword(passwordEncoder.encode("rahul123"));
                student.setRole("ROLE_STUDENT");
                student.setBranch("CSE");       // Added Branch
                student.setYear("3rd Year");    // Added Year
                userRepo.save(student);

                // 3. Create Books
                Book b1 = new Book();
                b1.setTitle("Java Programming");
                b1.setAuthor("James Gosling");
                b1.setCopies(5);
                bookRepo.save(b1);

                Book b2 = new Book();
                b2.setTitle("Spring Boot in Action");
                b2.setAuthor("Craig Walls");
                b2.setCopies(2);
                bookRepo.save(b2);

                System.out.println("--- Library Test Data Initialized ---");
            } else {
                System.out.println("--- Database already contains data. Skipping initialization. ---");
            }
        };
    }
}