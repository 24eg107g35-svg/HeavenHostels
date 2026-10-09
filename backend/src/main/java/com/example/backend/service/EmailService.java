package com.example.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.core.io.ByteArrayResource;

import jakarta.mail.MessagingException;
import java.nio.charset.StandardCharsets;

@Service
public class EmailService {
    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private final JavaMailSender mailSender;
    private final String host;
    private final String from;
    private final long otpExpirationMinutes;

    public EmailService(JavaMailSender mailSender,
                        @Value("${spring.mail.host:}") String host,
                        @Value("${spring.mail.username:}") String from,
                        @Value("${app.otp.expiration-minutes}") long otpExpirationMinutes) {
        this.mailSender = mailSender;
        this.host = host;
        this.from = from;
        this.otpExpirationMinutes = otpExpirationMinutes;
    }

    public void sendOtp(String recipient, String otp) {
        if (host.isBlank()) {
            throw new ApiException(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE,
                    "Password reset email is not configured");
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            if (!from.isBlank()) message.setFrom(from);
            message.setTo(recipient);
            message.setSubject("Hostel Management password reset");
            message.setText("Your password reset code is " + otp + ". It expires in "
                    + otpExpirationMinutes + " minutes.");
            mailSender.send(message);
        } catch (RuntimeException exception) {
            log.error("Password reset email delivery failed");
            throw new ApiException(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE,
                    "Unable to send password reset email");
        }
    }

    public boolean isConfigured() { return !host.isBlank(); }

    public void logSkippedPaymentReceipt(String receiptNumber) {
        log.warn("Payment receipt email skipped because SMTP is not configured for receipt {}", receiptNumber);
    }

    public void sendPaymentReceipt(String recipient, String receiptNumber, byte[] pdf) {
        try {
            var message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
            if (!from.isBlank()) helper.setFrom(from);
            helper.setTo(recipient);
            helper.setSubject("Hostel payment receipt");
            helper.setText("Your payment was recorded. Receipt number: " + receiptNumber + ".");
            helper.addAttachment(receiptNumber + ".pdf", new ByteArrayResource(pdf), "application/pdf");
            mailSender.send(message);
        } catch (MessagingException | RuntimeException exception) {
            log.error("Payment receipt email delivery failed for receipt {}", receiptNumber);
            throw new ApiException(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE,
                    "Unable to send payment receipt email");
        }
    }
}
