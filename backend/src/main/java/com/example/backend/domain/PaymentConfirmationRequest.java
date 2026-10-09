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

import java.time.Instant;

@Entity
@Table(name = "payment_confirmation_requests")
public class PaymentConfirmationRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(name = "payment_month", nullable = false)
    private int month;

    @Column(name = "payment_year", nullable = false)
    private int year;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentConfirmationStatus status = PaymentConfirmationStatus.PENDING;

    @Column(name = "payment_id")
    private Long paymentId;

    @Column(name = "requested_at", nullable = false, updatable = false)
    private Instant requestedAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    protected PaymentConfirmationRequest() {
    }

    public PaymentConfirmationRequest(Student student, int month, int year) {
        this.student = student;
        this.month = month;
        this.year = year;
    }

    public Long getId() { return id; }
    public Student getStudent() { return student; }
    public int getMonth() { return month; }
    public int getYear() { return year; }
    public PaymentConfirmationStatus getStatus() { return status; }
    public Long getPaymentId() { return paymentId; }
    public Instant getRequestedAt() { return requestedAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    public void complete(Long paymentId) {
        this.status = PaymentConfirmationStatus.COMPLETED;
        this.paymentId = paymentId;
        this.updatedAt = Instant.now();
    }

    public void reject() {
        this.status = PaymentConfirmationStatus.REJECTED;
        this.updatedAt = Instant.now();
    }
}
