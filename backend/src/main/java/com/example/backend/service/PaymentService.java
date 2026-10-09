package com.example.backend.service;

import com.example.backend.api.dto.ApiDtos.PageResponse;
import com.example.backend.api.dto.ApiDtos.PaymentRequest;
import com.example.backend.api.dto.ApiDtos.PaymentResponse;
import com.example.backend.api.dto.ApiDtos.StudentPaymentsResponse;
import com.example.backend.domain.Payment;
import com.example.backend.domain.PaymentStatus;
import com.example.backend.domain.PaymentConfirmationStatus;
import com.example.backend.domain.Student;
import com.example.backend.domain.UserAccount;
import com.example.backend.repository.PaymentRepository;
import com.example.backend.repository.PaymentConfirmationRequestRepository;
import com.example.backend.repository.StudentRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Month;
import java.time.format.TextStyle;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class PaymentService {
    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);
    private final PaymentRepository payments;
    private final PaymentConfirmationRequestRepository paymentConfirmationRequests;
    private final StudentRepository students;
    private final AuditService audit;
    private final ApplicationEventPublisher events;
    private final ReceiptService receipts;
    private final StudentNotificationService notifications;

    public PaymentService(PaymentRepository payments,
                          PaymentConfirmationRequestRepository paymentConfirmationRequests,
                          StudentRepository students,
                          AuditService audit, ApplicationEventPublisher events, ReceiptService receipts,
                          StudentNotificationService notifications) {
        this.payments = payments;
        this.paymentConfirmationRequests = paymentConfirmationRequests;
        this.students = students;
        this.audit = audit;
        this.events = events;
        this.receipts = receipts;
        this.notifications = notifications;
    }

    @Transactional
    public PaymentResponse create(PaymentRequest request, UserAccount actor) {
        Student student = students.findByIdForUpdate(request.studentId())
                .orElseThrow(() -> ApiException.notFound("Student not found"));
        if (!student.isActive()) throw paymentRejected(HttpStatus.CONFLICT, "Only active students can receive payments");
        if (request.month() < 1 || request.month() > 12 || request.year() < 2000 || request.year() > 2200) {
            throw paymentRejected(HttpStatus.BAD_REQUEST, "Payment month or year is invalid");
        }
        LocalDate paymentDate = request.paymentDate() == null ? LocalDate.now() : request.paymentDate();
        if (paymentDate.isAfter(LocalDate.now())) {
            throw paymentRejected(HttpStatus.BAD_REQUEST, "Payment date cannot be in the future");
        }
        BigDecimal dueAmount = student.getAmountPerMonth();
        if (dueAmount == null || dueAmount.signum() <= 0) {
            throw paymentRejected(HttpStatus.CONFLICT, "Student has no valid monthly amount configured");
        }
        if (request.amount().compareTo(dueAmount) != 0) {
            throw paymentRejected(HttpStatus.BAD_REQUEST, "Payment amount must match the student's configured monthly amount");
        }
        if (payments.existsByStudentIdAndYearAndMonthAndStatus(
                student.getId(), request.year(), request.month(), PaymentStatus.PAID)) {
            throw paymentRejected(HttpStatus.CONFLICT, "A successful payment already exists for this student and month");
        }
        if (request.transactionId() != null && !request.transactionId().isBlank()
                && payments.existsByTransactionId(request.transactionId().trim())) {
            throw paymentRejected(HttpStatus.CONFLICT, "Transaction ID has already been used");
        }

        Payment payment = payments.findByStudentIdAndYearAndMonthAndStatus(
                        student.getId(), request.year(), request.month(), PaymentStatus.UNPAID)
                .orElseGet(() -> new Payment(student, dueAmount, request.month(), request.year(),
                        paymentDate, PaymentStatus.PAID, receiptNumber(), normalizeTransaction(request.transactionId())));
        payment.setStatus(PaymentStatus.PAID);
        payment.setDate(paymentDate);
        payment.setAmount(dueAmount);
        Payment saved = payments.saveAndFlush(payment);
        paymentConfirmationRequests.findFirstByStudentIdAndMonthAndYearAndStatusOrderByRequestedAtDesc(
                        student.getId(), request.month(), request.year(), PaymentConfirmationStatus.PENDING)
                .ifPresent(confirmation -> confirmation.complete(saved.getId()));
        audit.record(actor.getEmail(), "PAYMENT_CREATED", "Payment", saved.getId());
        notifications.createForStudent(student, "Offline payment recorded",
                "The administrator recorded your cash payment of ₹" + saved.getAmount().toPlainString()
                        + " for " + saved.getMonth() + "/" + saved.getYear() + ". Your fee status is Paid.");
        events.publishEvent(new PaymentReceiptEvent(saved.getId(), student.getEmail(), saved.getReceiptNumber()));
        log.info("Payment created with receipt {}", saved.getReceiptNumber());
        return view(saved);
    }

    @Transactional(readOnly = true)
    public PageResponse<PaymentResponse> list(int page, int size) {
        Page<Payment> result = payments.findAll(PageRequest.of(page, size,
                org.springframework.data.domain.Sort.by("date").descending()));
        return new PageResponse<>(result.getContent().stream().map(this::view).toList(),
                result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages());
    }

    @Transactional(readOnly = true)
    public PaymentResponse get(Long id, UserAccount actor, boolean admin) {
        Payment payment = findPayment(id);
        authorizeStudent(payment, actor, admin);
        return view(payment);
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> studentHistory(Long studentId, UserAccount actor, boolean admin) {
        Student student = findStudent(studentId);
        if (!admin && (student.getAccount() == null || !student.getAccount().getId().equals(actor.getId()))) {
            throw ApiException.forbidden("Students may only view their own payment history");
        }
        return payments.findByStudentIdOrderByYearDescMonthDescDateDesc(studentId).stream()
                .map(this::view).toList();
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> ownHistory(UserAccount actor) {
        return ownHistoryForAccountId(actor.getId());
    }

    @Transactional
    public PaymentResponse studentPayCurrent(UserAccount actor) {
        Student student = students.findByAccountIdForUpdate(actor.getId())
                .orElseThrow(() -> ApiException.notFound("Student profile not found"));
        if (!student.isActive()) {
            throw paymentRejected(HttpStatus.CONFLICT, "Only active students can make payments");
        }
        LocalDate today = LocalDate.now();
        int month = today.getMonthValue();
        int year = today.getYear();
        if (payments.existsByStudentIdAndYearAndMonthAndStatus(student.getId(), year, month, PaymentStatus.PAID)) {
            throw paymentRejected(HttpStatus.CONFLICT, "Payment for current month is already completed");
        }
        BigDecimal rawAmount = student.getAmountPerMonth();
        final BigDecimal finalAmount = (rawAmount == null || rawAmount.compareTo(BigDecimal.ZERO) <= 0)
                ? defaultPriceForSharing(student.getSharing()) : rawAmount;

        Payment payment = payments.findByStudentIdAndYearAndMonthAndStatus(
                        student.getId(), year, month, PaymentStatus.UNPAID)
                .orElseGet(() -> new Payment(student, finalAmount, month, year, today, PaymentStatus.PAID,
                        receiptNumber(), "ONLINE-" + UUID.randomUUID().toString().substring(0, 10).toUpperCase(Locale.ROOT)));
        payment.setStatus(PaymentStatus.PAID);
        payment.setDate(today);
        payment.setAmount(finalAmount);
        Payment saved = payments.saveAndFlush(payment);

        paymentConfirmationRequests.findFirstByStudentIdAndMonthAndYearAndStatusOrderByRequestedAtDesc(
                        student.getId(), month, year, PaymentConfirmationStatus.PENDING)
                .ifPresent(confirmation -> confirmation.complete(saved.getId()));

        audit.record(actor.getEmail(), "STUDENT_ONLINE_PAYMENT", "Payment", saved.getId());
        notifications.createForStudent(student, "Payment Successful",
                "Your payment of ₹" + saved.getAmount().toPlainString()
                        + " for " + saved.getMonth() + "/" + saved.getYear() + " is confirmed! Status: Paid.");
        events.publishEvent(new PaymentReceiptEvent(saved.getId(), student.getEmail(), saved.getReceiptNumber()));
        log.info("Student online payment confirmed with receipt {}", saved.getReceiptNumber());
        return view(saved);
    }

    public static BigDecimal defaultPriceForSharing(String sharing) {
        if (sharing == null) return new BigDecimal("6500");
        String clean = sharing.replaceAll("[^0-9]", "");
        return switch (clean) {
            case "1" -> new BigDecimal("7500");
            case "2" -> new BigDecimal("7000");
            case "3" -> new BigDecimal("6500");
            case "4" -> new BigDecimal("6000");
            case "5" -> new BigDecimal("5500");
            default -> new BigDecimal("6500");
        };
    }


    @Transactional(readOnly = true)
    public List<PaymentResponse> ownHistoryForAccountId(Long accountId) {
        Student student = students.findByAccountId(accountId)
                .orElseThrow(() -> ApiException.notFound("Student profile not found"));
        return payments.findByStudentIdOrderByYearDescMonthDescDateDesc(student.getId()).stream()
                .map(this::view).toList();
    }

    @Transactional
    public PaymentResponse update(Long id, PaymentRequest request, UserAccount actor) {
        Payment payment = payments.findByIdForUpdate(id)
                .orElseThrow(() -> ApiException.notFound("Payment not found"));
        if (payment.getStatus() != PaymentStatus.UNPAID) {
            throw ApiException.conflict("Only unpaid payment records can be updated");
        }
        Student student = payment.getStudent();
        if (!student.getId().equals(request.studentId())) {
            throw ApiException.badRequest("A payment cannot be moved to a different student");
        }
        if (payment.getMonth() != request.month() || payment.getYear() != request.year()) {
            throw ApiException.badRequest("A payment record cannot be moved to a different month");
        }
        if (request.amount().compareTo(student.getAmountPerMonth()) != 0) {
            throw ApiException.badRequest("Payment amount must match the student's configured monthly amount");
        }
        if (request.paymentDate() != null && request.paymentDate().isAfter(LocalDate.now())) {
            throw ApiException.badRequest("Payment date cannot be in the future");
        }
        String transactionId = normalizeTransaction(request.transactionId());
        if (transactionId != null && !transactionId.equals(payment.getTransactionId())
                && payments.existsByTransactionId(transactionId)) {
            throw ApiException.conflict("Transaction ID has already been used");
        }
        payment.setAmount(student.getAmountPerMonth());
        if (request.paymentDate() != null) payment.setDate(request.paymentDate());
        if (transactionId != null) payment.setTransactionId(transactionId);
        audit.record(actor.getEmail(), "PAYMENT_UPDATED", "Payment", id);
        return view(payment);
    }

    @Transactional
    public void cancel(Long id, UserAccount actor) {
        Payment payment = payments.findByIdForUpdate(id)
                .orElseThrow(() -> ApiException.notFound("Payment not found"));
        if (payment.getStatus() != PaymentStatus.PAID) {
            throw ApiException.conflict("Only successful payments can be cancelled");
        }
        payment.setStatus(PaymentStatus.CANCELLED);
        notifications.createForStudent(payment.getStudent(), "Fee status updated",
                "Your fee for " + payment.getMonth() + "/" + payment.getYear()
                        + " was marked unpaid by the administrator.");
        LocalDate today = LocalDate.now();
        if (payment.getYear() == today.getYear() && payment.getMonth() == today.getMonthValue()) {
            ensureUnpaid(payment.getStudent(), payment.getYear(), payment.getMonth(), today);
        }
        audit.record(actor.getEmail(), "PAYMENT_CANCELLED", "Payment", id);
    }

    @Transactional
    public PaymentResponse markCurrentMonthPaid(Long studentId, LocalDate date, UserAccount actor) {
        LocalDate today = LocalDate.now();
        return markMonthPaid(studentId, today.getMonthValue(), today.getYear(), date, actor);
    }

    @Transactional
    public PaymentResponse markMonthPaid(Long studentId, int month, int year, LocalDate date, UserAccount actor) {
        Student student = findStudent(studentId);
        LocalDate today = LocalDate.now();
        LocalDate payDate = (date == null) ? today : date;
        if (payDate.isAfter(today)) {
            throw ApiException.badRequest("Payment date must be today or earlier");
        }
        PaymentRequest request = new PaymentRequest(studentId, student.getAmountPerMonth(),
                month, year, payDate, null);
        return create(request, actor);
    }

    @Transactional
    public void markMonthUnpaid(Long studentId, int month, int year, UserAccount actor) {
        Student student = findStudent(studentId);
        LocalDate today = LocalDate.now();
        payments.findByStudentIdAndYearAndMonthAndStatus(studentId, year, month, PaymentStatus.PAID)
                .ifPresent(payment -> {
                    payment.setStatus(PaymentStatus.CANCELLED);
                    ensureUnpaid(student, year, month, today);
                    notifications.createForStudent(student, "Fee status updated",
                            "Your fee for " + month + "/" + year
                                    + " was marked unpaid by the administrator.");
                    audit.record(actor.getEmail(), "PAYMENT_CANCELLED", "Payment", payment.getId());
                });
    }

    @Transactional
    public void markCurrentMonthUnpaid(Long studentId, UserAccount actor) {
        Student student = findStudent(studentId);
        LocalDate today = LocalDate.now();
        payments.findByStudentIdAndYearAndMonthAndStatus(studentId, today.getYear(), today.getMonthValue(), PaymentStatus.PAID)
                .ifPresent(payment -> {
                    payment.setStatus(PaymentStatus.CANCELLED);
                    ensureUnpaid(student, today.getYear(), today.getMonthValue(), today);
                    notifications.createForStudent(student, "Fee status updated",
                            "Your fee for " + today.getMonthValue() + "/" + today.getYear()
                                    + " was marked unpaid by the administrator.");
                    audit.record(actor.getEmail(), "PAYMENT_CANCELLED", "Payment", payment.getId());
                });
    }

    @Transactional
    public void resetCurrentMonthPayments(UserAccount actor) {
        LocalDate today = LocalDate.now();
        payments.findByYearAndMonthAndStatus(today.getYear(), today.getMonthValue(), PaymentStatus.PAID)
                .forEach(payment -> {
                    payment.setStatus(PaymentStatus.CANCELLED);
                    audit.record(actor.getEmail(), "PAYMENT_CANCELLED", "Payment", payment.getId());
                    ensureUnpaid(payment.getStudent(), today.getYear(), today.getMonthValue(), today);
                    notifications.createForStudent(payment.getStudent(), "Fee status updated",
                            "Your fee for " + today.getMonthValue() + "/" + today.getYear()
                                    + " was marked unpaid by the administrator.");
                });
    }

    @Transactional(readOnly = true)
    public List<StudentPaymentsResponse> legacyHistory() {
        return students.findAllByOrderByStudentNameAsc().stream().map(student ->
                new StudentPaymentsResponse(student.getId(), student.getStudentName(), student.getRoomNumber(),
                        student.getAmountPerMonth(), payments.findByStudentIdOrderByYearDescMonthDescDateDesc(student.getId())
                        .stream().map(this::view).toList())).toList();
    }

    @Transactional(readOnly = true)
    public StudentPaymentsResponse legacyStudentHistory(Long studentId, UserAccount actor, boolean admin) {
        Student student = findStudent(studentId);
        if (!admin && (student.getAccount() == null || !student.getAccount().getId().equals(actor.getId()))) {
            throw ApiException.forbidden("Students may only view their own payment history");
        }
        return new StudentPaymentsResponse(student.getId(), student.getStudentName(), student.getRoomNumber(),
                student.getAmountPerMonth(), payments.findByStudentIdOrderByYearDescMonthDescDateDesc(studentId)
                .stream().map(this::view).toList());
    }

    @Transactional(readOnly = true)
    public Payment findPayment(Long id) {
        return payments.findById(id).orElseThrow(() -> ApiException.notFound("Payment not found"));
    }

    @Transactional
    public byte[] receipt(Long id, UserAccount actor, boolean admin) {
        Payment payment = findPayment(id);
        authorizeStudent(payment, actor, admin);
        if (payment.getStatus() != PaymentStatus.PAID) {
            throw ApiException.conflict("A receipt is only available for a successful payment");
        }
        byte[] document = receipts.generate(payment);
        audit.record(actor.getEmail(), "RECEIPT_GENERATED", "Payment", id);
        return document;
    }

    @Transactional(readOnly = true)
    public ReceiptEmailData emailReceiptData(Long paymentId) {
        Payment payment = findPayment(paymentId);
        return new ReceiptEmailData(payment.getStudent().getEmail(), payment.getReceiptNumber(),
                receipts.generate(payment));
    }

    @Transactional(readOnly = true)
    public List<Payment> currentPayments(PaymentStatus status) {
        LocalDate today = LocalDate.now();
        return payments.findByYearAndMonthAndStatus(today.getYear(), today.getMonthValue(), status);
    }

    @Transactional(readOnly = true)
    public boolean isPaidThisMonth(Long studentId) {
        LocalDate today = LocalDate.now();
        return isPaid(studentId, today.getYear(), today.getMonthValue());
    }

    @Transactional(readOnly = true)
    public boolean isPaid(Long studentId, int year, int month) {
        return payments.existsByStudentIdAndYearAndMonthAndStatus(
                studentId, year, month, PaymentStatus.PAID);
    }


    private Student findStudent(Long id) {
        return students.findById(id).orElseThrow(() -> ApiException.notFound("Student not found"));
    }

    private void authorizeStudent(Payment payment, UserAccount actor, boolean admin) {
        if (!admin && (payment.getStudent().getAccount() == null
                || !payment.getStudent().getAccount().getId().equals(actor.getId()))) {
            throw ApiException.forbidden("Students may only access their own payments");
        }
    }

    private PaymentResponse view(Payment payment) {
        String status = switch (payment.getStatus()) {
            case PAID -> "Paid";
            case UNPAID -> "Unpaid";
            case CANCELLED -> "Cancelled";
        };
        return new PaymentResponse(payment.getId(), payment.getId(), payment.getAmount(),
                payment.getDate().toString(), status,
                Month.of(payment.getMonth()).getDisplayName(TextStyle.SHORT, Locale.ENGLISH),
                payment.getYear(), payment.getReceiptNumber());
    }

    private String receiptNumber() {
        return "HH-" + UUID.randomUUID().toString().replace("-", "").substring(0, 20).toUpperCase(Locale.ROOT);
    }

    private String normalizeTransaction(String transactionId) {
        return transactionId == null || transactionId.isBlank() ? null : transactionId.trim();
    }

    private ApiException paymentRejected(HttpStatus status, String message) {
        log.warn("Payment creation rejected: {}", message);
        return new ApiException(status, message);
    }

    private void ensureUnpaid(Student student, int year, int month, LocalDate date) {
        if (!payments.existsByStudentIdAndYearAndMonthAndStatus(
                student.getId(), year, month, PaymentStatus.UNPAID)) {
            payments.save(new Payment(student, student.getAmountPerMonth(), month, year, date,
                    PaymentStatus.UNPAID,
                    "DUE-" + UUID.randomUUID().toString().replace("-", "").substring(0, 18).toUpperCase(Locale.ROOT),
                    null));
        }
    }
}
