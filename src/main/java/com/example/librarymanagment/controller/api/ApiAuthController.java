package com.example.librarymanagment.controller.api;

import com.example.librarymanagment.model.User;
import com.example.librarymanagment.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class ApiAuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials, HttpServletRequest request) {
        String username = credentials.get("username");
        String password = credentials.get("password");

        try {
            UsernamePasswordAuthenticationToken token = new UsernamePasswordAuthenticationToken(username, password);
            Authentication authentication = authenticationManager.authenticate(token);

            SecurityContextHolder.getContext().setAuthentication(authentication);
            HttpSession session = request.getSession(true);
            session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, SecurityContextHolder.getContext());

            User user = userRepo.findByUsername(username);
            
            // Send back sanitised user data without password
            User responseUser = new User();
            responseUser.setId(user.getId());
            responseUser.setUsername(user.getUsername());
            responseUser.setFullName(user.getFullName());
            responseUser.setRole(user.getRole());
            responseUser.setBranch(user.getBranch());
            responseUser.setYear(user.getYear());
            responseUser.setEmail(user.getEmail());

            return ResponseEntity.ok(responseUser);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid username or password"));
        }
    }

    @PostMapping("/register-admin")
    public ResponseEntity<?> registerAdmin(@RequestBody Map<String, String> data) {
        String username = data.get("username");
        String password = data.get("password");
        String fullName = data.get("fullName");

        if (userRepo.findByUsername(username) != null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username already exists"));
        }

        User u = new User();
        u.setFullName(fullName);
        u.setUsername(username);
        u.setPassword(passwordEncoder.encode(password));
        u.setRole("ROLE_ADMIN");
        u.setBranch("N/A");
        u.setYear("N/A");

        userRepo.save(u);
        return ResponseEntity.ok(Map.of("message", "Admin registered successfully"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Not authenticated"));
        }

        User user = userRepo.findByUsername(auth.getName());
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "User not found"));
        }

        User responseUser = new User();
        responseUser.setId(user.getId());
        responseUser.setUsername(user.getUsername());
        responseUser.setFullName(user.getFullName());
        responseUser.setRole(user.getRole());
        responseUser.setBranch(user.getBranch());
        responseUser.setYear(user.getYear());
        responseUser.setEmail(user.getEmail());

        return ResponseEntity.ok(responseUser);
    }
}
