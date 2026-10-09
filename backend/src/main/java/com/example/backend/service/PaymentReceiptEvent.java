package com.example.backend.service;

public record PaymentReceiptEvent(Long paymentId, String recipientEmail, String receiptNumber) {}
