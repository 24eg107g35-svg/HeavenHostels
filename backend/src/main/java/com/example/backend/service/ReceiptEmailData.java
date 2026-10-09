package com.example.backend.service;

public record ReceiptEmailData(String recipientEmail, String receiptNumber, byte[] pdf) {}
