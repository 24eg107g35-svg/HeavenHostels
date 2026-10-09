package com.example.backend.service;

import com.example.backend.api.dto.HostelDataDtos.ComplaintRequest;
import com.example.backend.api.dto.HostelDataDtos.ComplaintResponse;
import com.example.backend.domain.ComplaintStatus;
import com.example.backend.domain.Student;
import com.example.backend.domain.StudentComplaint;
import com.example.backend.repository.StudentComplaintRepository;
import com.example.backend.repository.StudentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ComplaintService {
    private final StudentRepository students;
    private final StudentComplaintRepository complaints;
    private final StudentNotificationService notifications;

    public ComplaintService(StudentRepository students, StudentComplaintRepository complaints,
                            StudentNotificationService notifications) {
        this.students = students;
        this.complaints = complaints;
        this.notifications = notifications;
    }

    @Transactional(readOnly = true)
    public List<ComplaintResponse> mine(Long accountId) {
        return complaints.findByStudentAccountIdOrderByCreatedAtDesc(accountId).stream()
                .map(this::view).toList();
    }

    @Transactional(readOnly = true)
    public List<ComplaintResponse> all() {
        return complaints.findAllByOrderByCreatedAtDesc().stream().map(this::view).toList();
    }

    @Transactional
    public ComplaintResponse updateStatus(Long complaintId, ComplaintStatus status) {
        StudentComplaint complaint = complaints.findById(complaintId)
                .orElseThrow(() -> ApiException.notFound("Complaint not found"));
        if (complaint.getStatus() != status) {
            complaint.setStatus(status);
            notifications.createForStudent(complaint.getStudent(),
                    "Complaint status updated",
                    "Your complaint \"" + complaint.getTitle() + "\" is now " + status.name().replace('_', ' ') + ".");
        }
        return view(complaint);
    }

    @Transactional
    public ComplaintResponse createForAccount(Long accountId, ComplaintRequest request) {
        Student student = students.findByAccountIdForUpdate(accountId)
                .orElseThrow(() -> ApiException.notFound("Student profile not found"));
        return view(complaints.save(new StudentComplaint(student, request.title().trim(),
                request.description().trim())));
    }

    private ComplaintResponse view(StudentComplaint complaint) {
        return new ComplaintResponse(complaint.getId(), complaint.getTitle(), complaint.getDescription(),
                complaint.getStatus().name(), complaint.getCreatedAt(), complaint.getUpdatedAt(),
                complaint.getStudent().getId(), complaint.getStudent().getStudentName(),
                complaint.getStudent().getEmail(), complaint.getStudent().getRoomNumber());
    }
}
