package com.example.librarymanagment.config;

import com.example.librarymanagment.model.User;
import com.example.librarymanagment.repository.UserRepository;
import org.jspecify.annotations.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(@NonNull String username) throws UsernameNotFoundException {
        // Database se user ko dhoondna
        User user = userRepository.findByUsername(username);

        if (user == null) {
            throw new UsernameNotFoundException("User not found: " + username);
        }

        String role = user.getRole();
        if (role == null || role.isBlank()) {
            role = "ROLE_STUDENT";
        }

        // Spring Security ke format mein user return karna
        return org.springframework.security.core.userdetails.User
                .withUsername(user.getUsername())
                .password(user.getPassword()) // Ye already encoded hai
                .roles(role.replace("ROLE_", "")) // "ROLE_ADMIN" -> "ADMIN"
                .build();
    }
}