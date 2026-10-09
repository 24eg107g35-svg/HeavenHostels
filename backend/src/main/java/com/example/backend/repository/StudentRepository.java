package com.example.backend.repository;

import com.example.backend.domain.Student;
import com.example.backend.domain.StudentStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByEmailIgnoreCase(String email);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select student from Student student where lower(student.email) = lower(:email)")
    Optional<Student> findByEmailIgnoreCaseForUpdate(@Param("email") String email);
    Optional<Student> findByAccountId(Long accountId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select student from Student student where student.account.id = :accountId")
    Optional<Student> findByAccountIdForUpdate(@Param("accountId") Long accountId);
    List<Student> findAllByOrderByStudentNameAsc();
    List<Student> findByRoomIdAndIdNotOrderByStudentNameAsc(Long roomId, Long studentId);
    List<Student> findByRoomNumberOrderByStudentNameAsc(String roomNumber);
    List<Student> findByStatus(StudentStatus status);
    long countByRoomId(Long roomId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select student from Student student where student.id = :id")
    Optional<Student> findByIdForUpdate(@Param("id") Long id);
}
