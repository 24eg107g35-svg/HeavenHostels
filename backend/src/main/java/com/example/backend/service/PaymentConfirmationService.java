package com.example.backend.service;

import com.example.backend.api.dto.ApiDtos.PaymentConfirmationDateRequest;
import com.example.backend.api.dto.ApiDtos.PaymentConfirmationResponse;
import com.example.backend.api.dto.ApiDtos.PaymentRequest;
import com.example.backend.domain.PaymentConfirmationRequest;
import com.example.backend.domain.PaymentConfirmationStatus;
import com.example.backend.domain.Student;
import com.example.backend.repository.PaymentConfirmationRequestRepository;
import com.example.backend.repository.StudentRepository;
import com.example.backend.domain.UserAccount;
import com.example.backend.repository.UserAccountRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class PaymentConfirmationService {
    private final PaymentConfirmationRequestRepository requests;
    private final StudentRepository students;
    private final UserAccountRepository users;
    private final PaymentService payments;
    private final StudentNotificationService notifications;

    public PaymentConfirmationService(PaymentConfirmationRequestRepository requests,
                                      StudentRepository students, UserAccountRepository users,
                                      PaymentService payments, StudentNotificationService notifications) {
        this.requests = requests;
        this.students = students;
        this.users = users;
        this.payments = payments;
        this.notifications = notifications;
    }

    @Transactional
    public PaymentConfirmationResponse requestCurrentPayment(Long accountId) {
        Student student = students.findByAccountIdForUpdate(accountId)
                .or(() -> {
                    var u = users.findById(accountId);
                    return u.flatMap(userAccount -> students.findByEmailIgnoreCaseForUpdate(userAccount.getEmail()));
                })
                .orElseThrow(() -> ApiException.notFound("Student profile not found"));
        if (student.getAccount() == null) {
            users.findById(accountId).ifPresent(student::setAccount);
        }
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

    @Transactional
    public PaymentConfirmationResponse adminSendPaymentRequest(Long studentId, Integer month, Integer year, String adminEmail) {
        Student student = students.findByIdForUpdate(studentId)
                .orElseThrow(() -> ApiException.notFound("Student not found"));
        LocalDate today = LocalDate.now();
        int m = month != null ? month : today.getMonthValue();
        int y = year != null ? year : today.getYear();

        if (payments.isPaid(studentId, y, m)) {
            throw ApiException.conflict("Payment for this month is already marked Paid");
        }

        // Activate student and ensure amount & account
        if (student.getStatus() != com.example.backend.domain.StudentStatus.INACTIVE) {
            student.setStatus(com.example.backend.domain.StudentStatus.ACTIVE);
        }
        if (student.getAccount() == null && student.getEmail() != null) {
            users.findByEmailIgnoreCase(student.getEmail()).ifPresent(student::setAccount);
        }
        if (student.getAmountPerMonth() == null || student.getAmountPerMonth().signum() <= 0) {
            student.setAmountPerMonth(PaymentService.defaultPriceForSharing(student.getSharing()));
        }
        students.save(student);

        PaymentConfirmationRequest existing = requests
                .findFirstByStudentIdAndMonthAndYearAndStatusOrderByRequestedAtDesc(
                        studentId, m, y, PaymentConfirmationStatus.PENDING)
                .orElse(null);
        if (existing != null) {
            return view(existing);
        }

        PaymentConfirmationRequest saved = requests.save(new PaymentConfirmationRequest(student, m, y));
        notifications.createForStudent(student, "Hostel Fee Payment Request",
                "Administrator has requested payment for " + m + "/" + y + " (₹" + student.getAmountPerMonth() + "). Please accept and pay.");
        return view(saved);
    }

    @Transactional
    public List<PaymentConfirmationResponse> adminSendAllUnpaidRequests(String adminEmail) {
        LocalDate today = LocalDate.now();
        int m = today.getMonthValue();
        int y = today.getYear();
        List<Student> activeStudents = students.findAllByOrderByStudentNameAsc().stream()
                .filter(s -> s.getStatus() != com.example.backend.domain.StudentStatus.INACTIVE)
                .toList();
        return activeStudents.stream()
                .filter(s -> !payments.isPaid(s.getId(), y, m))
                .map(s -> {
                    s.setStatus(com.example.backend.domain.StudentStatus.ACTIVE);
                    if (s.getAccount() == null && s.getEmail() != null) {
                        users.findByEmailIgnoreCase(s.getEmail()).ifPresent(s::setAccount);
                    }
                    if (s.getAmountPerMonth() == null || s.getAmountPerMonth().signum() <= 0) {
                        s.setAmountPerMonth(PaymentService.defaultPriceForSharing(s.getSharing()));
                    }
                    students.save(s);
                    PaymentConfirmationRequest pending = requests
                            .findFirstByStudentIdAndMonthAndYearAndStatusOrderByRequestedAtDesc(
                                    s.getId(), m, y, PaymentConfirmationStatus.PENDING)
                            .orElseGet(() -> {
                                PaymentConfirmationRequest req = requests.save(new PaymentConfirmationRequest(s, m, y));
                                notifications.createForStudent(s, "Hostel Fee Payment Request",
                                        "Administrator has requested fee payment for " + m + "/" + y + " (₹" + s.getAmountPerMonth() + "). Please accept and pay in Fee Management.");
                                return req;
                            });
                    return view(pending);
                })
                .toList();
    }

    @Transactional
    public com.example.backend.api.dto.ApiDtos.PaymentResponse acceptAndPay(Long requestId, UserAccount actor) {
        PaymentConfirmationRequest request = findPendingForUpdate(requestId);
        Student student = request.getStudent();
        if (student.getAccount() == null || !student.getAccount().getId().equals(actor.getId())) {
            if (student.getEmail() != null && student.getEmail().equalsIgnoreCase(actor.getEmail())) {
                student.setAccount(actor);
            } else if (student.getAccount() == null) {
                student.setAccount(actor);
            } else {
                throw ApiException.forbidden("You can only accept payment requests addressed to your account");
            }
        }
        // Activate student
        if (student.getStatus() != com.example.backend.domain.StudentStatus.ACTIVE) {
            student.setStatus(com.example.backend.domain.StudentStatus.ACTIVE);
        }
        BigDecimal amount = student.getAmountPerMonth();
        if (amount == null || amount.signum() <= 0) {
            amount = PaymentService.defaultPriceForSharing(student.getSharing());
            student.setAmountPerMonth(amount);
        }
        students.save(student);

        LocalDate today = LocalDate.now();
        var admin = users.findByEmailIgnoreCase(actor.getEmail()).orElse(actor);
        var payment = payments.create(new com.example.backend.api.dto.ApiDtos.PaymentRequest(
                student.getId(), amount,
                request.getMonth(), request.getYear(), today, "ONLINE-" + java.util.UUID.randomUUID().toString().substring(0, 8)), admin);
        request.complete(payment.id());
        notifications.createForStudent(student, "Payment Accepted & Confirmed",
                "You have accepted the payment request and completed payment of ₹" + amount + " for " + request.getMonth() + "/" + request.getYear() + ".");
        return payment;
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
