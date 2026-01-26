package com.example.librarymanagment.controller;

import com.example.librarymanagment.model.User;
import com.example.librarymanagment.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class AuthController {

    @Autowired private UserRepository userRepo;
    @Autowired private PasswordEncoder passwordEncoder;

    // Show the "Add Admin" form
    @GetMapping("/register-admin")
    public String showRegisterAdmin() {
        return "register_admin";
    }

    // Save the new Admin
    @PostMapping("/save-admin")
    public String saveAdmin(@RequestParam String fullName,
                            @RequestParam String username,
                            @RequestParam String password) {

        // Check if user already exists
        if (userRepo.findByUsername(username) != null) {
            return "redirect:/register-admin?error";
        }

        User u = new User();
        u.setFullName(fullName);
        u.setUsername(username);
        u.setPassword(passwordEncoder.encode(password));
        u.setRole("ROLE_ADMIN"); // FORCE ADMIN ROLE
        // Branch/Year not needed for Admin, can be null or "N/A"
        u.setBranch("N/A");
        u.setYear("N/A");

        userRepo.save(u);
        return "redirect:/login?registered";
    }
}