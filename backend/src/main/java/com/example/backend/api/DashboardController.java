package com.example.backend.api;

import com.example.backend.api.dto.ApiDtos.DashboardResponse;
import com.example.backend.domain.Payment;
import com.example.backend.domain.PaymentStatus;
import com.example.backend.domain.Room;
import com.example.backend.domain.Student;
import com.example.backend.domain.StudentStatus;
import com.example.backend.repository.PaymentRepository;
import com.example.backend.repository.RoomRepository;
import com.example.backend.repository.StudentRepository;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "bearerAuth")
public class DashboardController {
    private final StudentRepository students;
    private final RoomRepository rooms;
    private final PaymentRepository payments;

    public DashboardController(StudentRepository students, RoomRepository rooms, PaymentRepository payments) {
        this.students = students;
        this.rooms = rooms;
        this.payments = payments;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public DashboardResponse dashboard() {
        LocalDate today = LocalDate.now();
        List<Student> allStudents = students.findAll();
        List<Room> allRooms = rooms.findAll();
        List<Payment> paid = payments.findByYearAndMonthAndStatus(
                today.getYear(), today.getMonthValue(), PaymentStatus.PAID);
        long activeStudents = allStudents.stream().filter(Student::isActive).count();
        long occupiedRooms = allRooms.stream().filter(room -> !room.getStudents().isEmpty()).count();
        long availableRooms = allRooms.stream().filter(room ->
                room.isActive() && room.getStudents().size() < room.getCapacity()).count();
        long unpaid = allStudents.stream().filter(Student::isActive)
                .filter(student -> paid.stream().noneMatch(payment -> payment.getStudent().getId().equals(student.getId())))
                .count();
        BigDecimal revenue = paid.stream().map(Payment::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        return new DashboardResponse(allStudents.size(), activeStudents, allRooms.size(), occupiedRooms,
                availableRooms, paid.size(), unpaid, revenue);
    }
}
