package com.example.backend.service;

import com.example.backend.api.dto.ApiDtos.PaymentConfirmationDateRequest;
import com.example.backend.api.dto.ApiDtos.PaymentConfirmationResponse;
import com.example.backend.api.dto.ApiDtos.PaymentRequest;
import com.example.backend.domain.PaymentConfirmationRequest;
import com.example.backend.domain.PaymentConfirmationStatus;
import com.example.backend.domain.Student;
import com.example.backend.repository.PaymentConfirmationRequestRepository;
import com.example.backend.repository.StudentRepository;
import com.example.backend.repository.UserAccountRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class PaymentConfirmationService {
    private final PaymentConfirmationRequestRepository requests;
    private final StudentRepository students;
    private final UserAccountRepository users;
    private final PaymentService payments;

    public PaymentConfirmationService(PaymentConfirmationRequestRepository requests,
                                      StudentRepository students, UserAccountRepository users,
                                      PaymentService payments) {
        this.requests = requests;
        this.students = students;
        this.users = users;
        this.payments = payments;
    }

    @Transactional
    public PaymentConfirmationResponse requestCurrentPayment(Long accountId) {
        Student student = students.findByAccountIdForUpdate(accountId)
                .orElseThrow(() -> ApiException.notFound("Student profile not found"));
        if (!student.isActive()) {
            throw ApiException.conflict("Only active students can request payment confirmation");
        }

        LocalDate today = LocalDate.now();
        if (payments.isPaidThisMonth(student.getId())) {
            throw ApiException.conflict("This month's payment is already completed");
        }
        PaymentConfirmationRequest pending = requests
                .findFirstByStudentIdAndMonthAndYearAndStatusOrderByRequestedAtDesc(
                        student.getId(), today.getMonthValue(), today.getYear(), PaymentConfirmationStatus.PENDING)
                .orElse(null);
        if (pending != null) return view(pending);

        return view(requests.save(new PaymentConfirmationRequest(
                student, today.getMonthValue(), today.getYear())));
    }

    @Transactional(readOnly = true)
    public List<PaymentConfirmationResponse> mine(Long accountId) {
        return requests.findByStudentAccountIdOrderByRequestedAtDesc(accountId).stream()
                .map(this::view).toList();
    }

    @Transactional(readOnly = true)
    public List<PaymentConfirmationResponse> pending() {
        return requests.findByStatusOrderByRequestedAtAsc(PaymentConfirmationStatus.PENDING).stream()
                .map(this::view).toList();
    }

    @Transactional(readOnly = true)
    public long pendingCount() {
        return requests.countByStatus(PaymentConfirmationStatus.PENDING);
    }

    @Transactional
    public PaymentConfirmationResponse complete(Long requestId, PaymentConfirmationDateRequest dateRequest,
                                                String adminEmail) {
        PaymentConfirmationRequest request = findPendingForUpdate(requestId);
        LocalDate paymentDate = dateRequest.paymentDate();
        LocalDate today = LocalDate.now();
        if (paymentDate.isAfter(today)
                || paymentDate.getYear() != request.getYear()
                || paymentDate.getMonthValue() != request.getMonth()) {
            throw ApiException.badRequest("Payment date must be within the requested month and cannot be in the future");
        }

        Student student = request.getStudent();
        var admin = users.findByEmailIgnoreCase(adminEmail)
                .orElseThrow(() -> ApiException.unauthorized("Administrator account no longer exists"));
        var payment = payments.create(new PaymentRequest(student.getId(), student.getAmountPerMonth(),
                request.getMonth(), request.getYear(), paymentDate, null), admin);
        request.complete(payment.id());
        return view(request);
    }

    @Transactional
    public PaymentConfirmationResponse reject(Long requestId) {
        PaymentConfirmationRequest request = findPendingForUpdate(requestId);
        request.reject();
        return view(request);
    }

    private PaymentConfirmationRequest findPendingForUpdate(Long requestId) {
        PaymentConfirmationRequest request = requests.findByIdForUpdate(requestId)
                .orElseThrow(() -> ApiException.notFound("Payment confirmation request not found"));
        if (request.getStatus() != PaymentConfirmationStatus.PENDING) {
            throw ApiException.conflict("This payment confirmation request is no longer pending");
        }
        return request;
    }

    private PaymentConfirmationResponse view(PaymentConfirmationRequest request) {
        Student student = request.getStudent();
        return new PaymentConfirmationResponse(request.getId(), student.getId(), student.getStudentName(),
                student.getEmail(), student.getRoomNumber(), student.getAmountPerMonth(),
                java.time.Month.of(request.getMonth()).getDisplayName(
                        java.time.format.TextStyle.SHORT, java.util.Locale.ENGLISH),
                request.getYear(), request.getStatus().name(), request.getRequestedAt(),
                request.getUpdatedAt(), request.getPaymentId());
    }
}
