package com.example.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "payments", uniqueConstraints = {
        @UniqueConstraint(name = "uk_payment_active_period", columnNames = {"student_id", "payment_year", "payment_month", "period_status"}),
        @UniqueConstraint(name = "uk_payment_receipt_number", columnNames = "receipt_number"),
        @UniqueConstraint(name = "uk_payment_transaction_id", columnNames = "transaction_id")
})
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "payment_month", nullable = false)
    private int month;

    @Column(name = "payment_year", nullable = false)
    private int year;

    @Column(name = "payment_date", nullable = false)
    private LocalDate date;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentStatus status;

    @Column(name = "period_status", length = 20, insertable = false, updatable = false)
    private String periodStatus;

    @Column(name = "receipt_number", nullable = false, length = 40)
    private String receiptNumber;

    @Column(name = "transaction_id", length = 120)
    private String transactionId;

    protected Payment() {
    }

    public Payment(Student student, BigDecimal amount, int month, int year, LocalDate date,
                   PaymentStatus status, String receiptNumber, String transactionId) {
        this.student = student;
        this.amount = amount;
        this.month = month;
        this.year = year;
        this.date = date;
        this.status = status;
        this.receiptNumber = receiptNumber;
        this.transactionId = transactionId;
    }

    public Long getId() { return id; }
    public Student getStudent() { return student; }
    public BigDecimal getAmount() { return amount; }
    public int getMonth() { return month; }
    public int getYear() { return year; }
    public LocalDate getDate() { return date; }
    public PaymentStatus getStatus() { return status; }
    public String getReceiptNumber() { return receiptNumber; }
    public String getTransactionId() { return transactionId; }
    public void setStatus(PaymentStatus status) { this.status = status; }
    public void setDate(LocalDate date) { this.date = date; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
}
