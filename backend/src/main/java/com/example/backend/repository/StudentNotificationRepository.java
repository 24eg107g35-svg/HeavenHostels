package com.example.backend.repository;

import com.example.backend.domain.StudentNotification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentNotificationRepository extends JpaRepository<StudentNotification, Long> {
    List<StudentNotification> findByStudentAccountIdOrderByCreatedAtDesc(Long accountId);
    List<StudentNotification> findByStudentAccountIdAndReadFalseOrderByCreatedAtDesc(Long accountId);
    Optional<StudentNotification> findByIdAndStudentAccountId(Long id, Long accountId);
    long countByStudentAccountIdAndReadFalse(Long accountId);
}
