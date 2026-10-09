package com.example.backend.service;

import com.example.backend.api.dto.HostelDataDtos.NotificationRequest;
import com.example.backend.api.dto.HostelDataDtos.NotificationBroadcastRequest;
import com.example.backend.api.dto.HostelDataDtos.NotificationBroadcastResponse;
import com.example.backend.api.dto.HostelDataDtos.NotificationResponse;
import com.example.backend.domain.Student;
import com.example.backend.domain.StudentNotification;
import com.example.backend.repository.StudentNotificationRepository;
import com.example.backend.repository.StudentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class StudentNotificationService {
    private final StudentRepository students;
    private final StudentNotificationRepository notifications;

    public StudentNotificationService(StudentRepository students, StudentNotificationRepository notifications) {
        this.students = students;
        this.notifications = notifications;
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> mine(Long accountId, boolean unreadOnly) {
        List<StudentNotification> records = unreadOnly
                ? notifications.findByStudentAccountIdAndReadFalseOrderByCreatedAtDesc(accountId)
                : notifications.findByStudentAccountIdOrderByCreatedAtDesc(accountId);
        return records.stream().map(this::view).toList();
    }

    @Transactional(readOnly = true)
    public long unreadCount(Long accountId) {
        return notifications.countByStudentAccountIdAndReadFalse(accountId);
    }

    @Transactional
    public NotificationResponse create(NotificationRequest request) {
        Student student = students.findById(request.studentId())
                .orElseThrow(() -> ApiException.notFound("Student not found"));
        return createForStudent(student, request.title(), request.message());
    }

    @Transactional
    public NotificationResponse createForStudent(Student student, String title, String message) {
        return view(notifications.save(new StudentNotification(student, title.trim(), message.trim())));
    }

    @Transactional
    public NotificationBroadcastResponse broadcast(NotificationBroadcastRequest request) {
        String title = request.title().trim();
        String message = request.message().trim();
        List<Student> recipients = students.findAllByOrderByStudentNameAsc().stream()
                .filter(student -> student.getAccount() != null)
                .toList();
        List<StudentNotification> records = recipients.stream()
                .map(student -> new StudentNotification(student, title, message))
                .toList();
        notifications.saveAll(records);
        return new NotificationBroadcastResponse(records.size());
    }

    @Transactional
    public NotificationResponse markRead(Long accountId, Long notificationId) {
        StudentNotification notification = notifications.findByIdAndStudentAccountId(notificationId, accountId)
                .orElseThrow(() -> ApiException.notFound("Notification not found"));
        notification.markRead();
        return view(notification);
    }

    private NotificationResponse view(StudentNotification notification) {
        return new NotificationResponse(notification.getId(), notification.getTitle(),
                notification.getMessage(), notification.isRead(), notification.getCreatedAt());
    }
}
