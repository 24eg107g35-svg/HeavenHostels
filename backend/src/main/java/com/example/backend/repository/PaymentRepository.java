package com.example.backend.repository;

import com.example.backend.domain.Payment;
import com.example.backend.domain.PaymentStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByStudentIdOrderByYearDescMonthDescDateDesc(Long studentId);
    List<Payment> findByYearAndMonthAndStatus(int year, int month, PaymentStatus status);
    Optional<Payment> findByStudentIdAndYearAndMonthAndStatus(Long studentId, int year, int month, PaymentStatus status);
    boolean existsByStudentIdAndYearAndMonthAndStatus(Long studentId, int year, int month, PaymentStatus status);
    boolean existsByTransactionId(String transactionId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select payment from Payment payment where payment.id = :id")
    Optional<Payment> findByIdForUpdate(@Param("id") Long id);
}
