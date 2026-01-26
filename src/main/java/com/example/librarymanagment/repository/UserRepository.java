package com.example.librarymanagment.repository;

import com.example.librarymanagment.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    User findByUsername(String username);

    // Get list of all unique branches (for the filter dropdown)
    @Query("SELECT DISTINCT u.branch FROM User u WHERE u.branch IS NOT NULL")
    List<String> findAllBranches();

    // Get list of all unique years
    @Query("SELECT DISTINCT u.year FROM User u WHERE u.year IS NOT NULL")
    List<String> findAllYears();
}