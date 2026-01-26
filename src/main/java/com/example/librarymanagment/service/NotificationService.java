package com.example.librarymanagment.service;

import com.example.librarymanagment.model.Transaction;
import com.example.librarymanagment.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class NotificationService {

    @Autowired private TransactionRepository transRepo;
    @Autowired private EmailService emailService;

    // This runs automatically every day at 10:00 AM
    // Cron Format: "Seconds Minutes Hours Day Month Year"
    @Scheduled(cron = "0 0 10 7 * ?")
    public void sendOverdueNotifications() {


        List<Transaction> allTransactions = transRepo.findAll();
        LocalDateTime now = LocalDateTime.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MMM-yyyy");

        for (Transaction t : allTransactions) {
            // Check if book is NOT returned AND Due Date has passed
            if (t.getReturnDate() == null && t.getDueDate().isBefore(now)) {

                // Calculate how late they are
                long daysLate = ChronoUnit.DAYS.between(t.getDueDate(), now);
                double estimatedFine = daysLate * 10.0; // ₹10 per day

                if (t.getStudent().getEmail() != null) {
                    String subject = "⚠️ URGENT: Overdue Book Notice - " + t.getBook().getTitle();

                    String body = "Dear " + t.getStudent().getFullName() + ",\n\n" +
                            "This is an automated reminder that the following book issued to your account is now OVERDUE.\n\n" +

                            "📖 OVERDUE ITEM DETAILS\n" +
                            "-----------------------------------------------------\n" +
                            "Title         : " + t.getBook().getTitle() + "\n" +
                            "Due Date      : " + t.getDueDate().format(formatter) + "\n" +
                            "Days Overdue  : " + daysLate + " days\n" +
                            "Estimated Fine: ₹" + estimatedFine + "\n" +
                            "-----------------------------------------------------\n\n" +

                            "⚠️ ACTION REQUIRED\n" +
                            "Please return this book to the library immediately to avoid further penalties.\n" +
                            "Note: Fines will continue to accumulate by ₹10.00 for every additional day.\n\n" +

                            "If you have already returned this book, please contact the library admin immediately.\n\n" +

                            "Best Regards,\n" +
                            "Library Management System";

                    // Send the email
                    emailService.sendEmail(t.getStudent().getEmail(), subject, body);
                    System.out.println("📩 Overdue notice sent to: " + t.getStudent().getFullName());
                }
            }
        }
    }
}