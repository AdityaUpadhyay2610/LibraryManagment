package com.example.librarymanagment;

import com.example.librarymanagment.config.CustomUserDetailsService;
import com.example.librarymanagment.model.User;
import com.example.librarymanagment.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomUserDetailsServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CustomUserDetailsService userDetailsService;

    @Test
    void loadUserByUsername_shouldDefaultMissingRoleToStudent() {
        User user = new User();
        user.setUsername("student1");
        user.setPassword("encoded-password");
        user.setRole(null);

        when(userRepository.findByUsername("student1")).thenReturn(user);

        UserDetails userDetails = userDetailsService.loadUserByUsername("student1");

        assertThat(userDetails.getUsername()).isEqualTo("student1");
        assertThat(userDetails.getAuthorities())
                .extracting(authority -> authority.getAuthority())
                .contains("ROLE_STUDENT");
    }
}
