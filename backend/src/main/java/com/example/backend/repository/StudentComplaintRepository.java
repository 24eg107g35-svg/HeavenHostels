package com.example.backend.repository;

import com.example.backend.domain.StudentComplaint;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentComplaintRepository extends JpaRepository<StudentComplaint, Long> {
    List<StudentComplaint> findByStudentAccountIdOrderByCreatedAtDesc(Long accountId);
    List<StudentComplaint> findAllByOrderByCreatedAtDesc();
    Optional<StudentComplaint> findById(Long id);
    Optional<StudentComplaint> findByIdAndStudentAccountId(Long id, Long accountId);
}
