package com.example.backend.repository;

import com.example.backend.domain.PaymentConfirmationRequest;
import com.example.backend.domain.PaymentConfirmationStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PaymentConfirmationRequestRepository extends JpaRepository<PaymentConfirmationRequest, Long> {
    List<PaymentConfirmationRequest> findByStudentAccountIdOrderByRequestedAtDesc(Long accountId);
    List<PaymentConfirmationRequest> findByStatusOrderByRequestedAtAsc(PaymentConfirmationStatus status);
    long countByStatus(PaymentConfirmationStatus status);
    Optional<PaymentConfirmationRequest> findFirstByStudentIdAndMonthAndYearAndStatusOrderByRequestedAtDesc(
            Long studentId, int month, int year, PaymentConfirmationStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select request from PaymentConfirmationRequest request where request.id = :id")
    Optional<PaymentConfirmationRequest> findByIdForUpdate(@Param("id") Long id);
}
