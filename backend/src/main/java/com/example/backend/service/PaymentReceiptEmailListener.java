package com.example.backend.service;

import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class PaymentReceiptEmailListener {
    private static final Logger log = LoggerFactory.getLogger(PaymentReceiptEmailListener.class);
    private final EmailService emailService;
    private final PaymentService payments;

    public PaymentReceiptEmailListener(EmailService emailService, PaymentService payments) {
        this.emailService = emailService;
        this.payments = payments;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void sendReceiptEmail(PaymentReceiptEvent event) {
        if (!emailService.isConfigured()) {
            emailService.logSkippedPaymentReceipt(event.receiptNumber());
            return;
        }
        try {
            ReceiptEmailData receipt = payments.emailReceiptData(event.paymentId());
            emailService.sendPaymentReceipt(receipt.recipientEmail(), receipt.receiptNumber(), receipt.pdf());
        } catch (RuntimeException exception) {
            log.error("Payment receipt email failed for receipt {}", event.receiptNumber(), exception);
        }
    }
}
