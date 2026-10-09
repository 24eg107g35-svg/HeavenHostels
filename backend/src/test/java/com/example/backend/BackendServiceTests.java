package com.example.backend;

import com.example.backend.api.dto.ApiDtos.LoginRequest;
import com.example.backend.api.dto.ApiDtos.PaymentRequest;
import com.example.backend.api.dto.ApiDtos.RegisterRequest;
import com.example.backend.api.dto.ApiDtos.RoomRequest;
import com.example.backend.api.dto.ApiDtos.StudentRequest;
import com.example.backend.ai.AiUnavailableException;
import com.example.backend.ai.GeminiService;
import com.example.backend.domain.PaymentStatus;
import com.example.backend.domain.Role;
import com.example.backend.domain.Student;
import com.example.backend.domain.StudentStatus;
import com.example.backend.domain.UserAccount;
import com.example.backend.repository.PaymentRepository;
import com.example.backend.repository.RoomRepository;
import com.example.backend.repository.StudentRepository;
import com.example.backend.repository.UserAccountRepository;
import com.example.backend.security.JwtService;
import com.example.backend.service.ApiException;
import com.example.backend.service.AuthService;
import com.example.backend.service.PaymentService;
import com.example.backend.service.ReceiptService;
import com.example.backend.service.RateLimiter;
import com.example.backend.service.RoomService;
import com.example.backend.service.StudentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:hostelservice;DB_CLOSE_DELAY=-1;MODE=MySQL",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.flyway.enabled=false",
        "app.jwt.secret=integration-test-only-secret-with-at-least-32-chars",
        "app.bootstrap-admin.email=",
        "app.bootstrap-admin.password=",
        "app.ai.gemini.api-key=",
        "spring.mail.host="
})
@AutoConfigureMockMvc
class BackendServiceTests {
    @Autowired AuthService auth;
    @Autowired JwtService jwt;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired UserAccountRepository users;
    @Autowired StudentRepository students;
    @Autowired RoomRepository rooms;
    @Autowired PaymentRepository paymentRepository;
    @Autowired RoomService roomService;
    @Autowired PaymentService paymentService;
    @Autowired StudentService studentService;
    @Autowired ReceiptService receiptService;
    @Autowired RateLimiter rateLimiter;
    @Autowired MockMvc mockMvc;
    @MockitoBean GeminiService geminiService;

    @Test
    @Transactional
    void studentRegistrationLoginAndJwtValidation() {
        String email = uniqueEmail();
        RegisterRequest registration = new RegisterRequest(email, "StrongPassword1!", "Test Student", null, "student");
        auth.register(registration, UUID.randomUUID().toString());

        var response = auth.login(new LoginRequest(email, "StrongPassword1!"), UUID.randomUUID().toString());
        assertEquals("STUDENT", response.role());
        assertEquals(email, jwt.validate(response.token()).email());
        var refreshed = auth.refresh(response.refreshToken());
        assertEquals(email, jwt.validate(refreshed.token()).email());
        assertThrows(ApiException.class, () -> auth.refresh(response.refreshToken()));
        assertTrue(passwordEncoder.matches("StrongPassword1!",
                users.findByEmailIgnoreCase(email).orElseThrow().getPasswordHash()));
    }

    @Test
    @Transactional
    void publicRegistrationCannotGrantAdminRole() {
        RegisterRequest registration = new RegisterRequest(uniqueEmail(), "StrongPassword1!",
                "Untrusted Admin", null, "admin");
        assertThrows(ApiException.class, () -> auth.register(registration, UUID.randomUUID().toString()));
    }

    @Test
    @Transactional
    void roomAssignmentEnforcesCapacity() {
        UserAccount admin = admin();
        var room = roomService.create(new RoomRequest("T-" + UUID.randomUUID().toString().substring(0, 8), 1,
                new BigDecimal("6000.00"), true), admin.getEmail());
        Student first = student("first");
        Student second = student("second");

        roomService.assign(room.id(), first.getId(), admin.getEmail());
        assertEquals(room.roomNumber(), students.findById(first.getId()).orElseThrow().getRoomNumber());
        assertThrows(ApiException.class, () -> roomService.assign(room.id(), second.getId(), admin.getEmail()));
    }

    @Test
    @Transactional
    void adminCanCreateAndDeactivateStudentProfile() {
        UserAccount admin = admin();
        String roomNumber = "A-" + UUID.randomUUID().toString().substring(0, 8);
        roomService.create(new RoomRequest(roomNumber, 2, new BigDecimal("6000.00"), true), admin.getEmail());
        StudentRequest request = new StudentRequest("Profile Student", uniqueEmail(), roomNumber, "2",
                "College", "Course", "9000000000", "9000000001", "Hostel address",
                new BigDecimal("6000.00"), LocalDate.now(), true);

        var created = studentService.saveProfile(request, admin, true);
        assertTrue(created.isActive());
        studentService.delete(created.id(), admin.getEmail());
        assertEquals("INACTIVE", students.findById(created.id()).orElseThrow().getStatus().name());
    }

    @Test
    @Transactional
    void paymentUsesConfiguredAmountAndPreventsDuplicateSuccess() {
        UserAccount admin = admin();
        Student student = student("payer");
        LocalDate date = LocalDate.now();
        BigDecimal due = new BigDecimal("6300.00");
        student.updateProfile(student.getStudentName(), student.getEmail(), null, null, null,
                null, null, null, null, due, date);
        student.setStatus(StudentStatus.ACTIVE);
        students.save(student);
        PaymentRequest request = new PaymentRequest(student.getId(), due,
                date.getMonthValue(), date.getYear(), date, null);

        assertThrows(ApiException.class, () -> paymentService.create(
                new PaymentRequest(student.getId(), BigDecimal.ONE, date.getMonthValue(), date.getYear(), date, null), admin));
        var created = paymentService.create(request, admin);
        assertEquals("Paid", created.status());
        assertEquals(due, created.amount());
        assertTrue(new String(receiptService.generate(paymentService.findPayment(created.id())),
                java.nio.charset.StandardCharsets.ISO_8859_1).startsWith("%PDF"));
        assertThrows(ApiException.class, () -> paymentService.create(request, admin));
        assertTrue(paymentRepository.existsByStudentIdAndYearAndMonthAndStatus(
                student.getId(), date.getYear(), date.getMonthValue(), PaymentStatus.PAID));
    }

    @Test
    void adminRecordsOfflineCashAndStudentCanReadStatusAndNotification() throws Exception {
        UserAccount admin = admin();
        String email = uniqueEmail();
        auth.register(new RegisterRequest(email, "StrongPassword1!", "Offline Payment Student", null, "student"),
                UUID.randomUUID().toString());
        UserAccount studentAccount = users.findByEmailIgnoreCase(email).orElseThrow();
        Student profile = students.findByAccountId(studentAccount.getId()).orElseThrow();
        BigDecimal due = new BigDecimal("6200.00");
        LocalDate paidDate = LocalDate.now();
        profile.updateProfile(profile.getStudentName(), profile.getEmail(), null, null, null,
                null, null, null, null, due, paidDate);
        profile.setStatus(StudentStatus.ACTIVE);
        students.save(profile);

        String adminToken = auth.login(new LoginRequest(admin.getEmail(), "AdminPassword1!"),
                UUID.randomUUID().toString()).token();
        String studentToken = auth.login(new LoginRequest(email, "StrongPassword1!"),
                UUID.randomUUID().toString()).token();

        mockMvc.perform(post("/api/payment-confirmations/mine")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING"));

        mockMvc.perform(post("/api/payments")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"studentId\":" + profile.getId() + ",\"amount\":6200.00,"
                                + "\"month\":" + paidDate.getMonthValue() + ",\"year\":" + paidDate.getYear()
                                + ",\"paymentDate\":\"" + paidDate + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("Paid"))
                .andExpect(jsonPath("$.amount").value(6200.0));

        mockMvc.perform(get("/api/payments/my-history")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("Paid"));
        mockMvc.perform(get("/api/notifications/mine")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Offline payment recorded"));
        mockMvc.perform(get("/api/payment-confirmations/mine")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("COMPLETED"));
        mockMvc.perform(post("/api/payments")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"studentId\":" + profile.getId() + ",\"amount\":6200.00,"
                                + "\"month\":" + paidDate.getMonthValue() + ",\"year\":" + paidDate.getYear()
                                + ",\"paymentDate\":\"" + paidDate + "\"}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/payments")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/payments/pay-current")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.anyOf(
                        org.hamcrest.Matchers.containsString("Payment for current month is already completed"),
                        org.hamcrest.Matchers.containsString("Online payment is disabled"))));
    }

    @Test
    void studentCanRequestOfflinePaymentAndAdminCanCompleteIt() throws Exception {
        UserAccount admin = admin();
        String email = uniqueEmail();
        auth.register(new RegisterRequest(email, "StrongPassword1!", "Payment Request Student", null, "student"),
                UUID.randomUUID().toString());
        UserAccount studentAccount = users.findByEmailIgnoreCase(email).orElseThrow();
        Student profile = students.findByAccountId(studentAccount.getId()).orElseThrow();
        String studentToken = auth.login(new LoginRequest(email, "StrongPassword1!"),
                UUID.randomUUID().toString()).token();
        mockMvc.perform(post("/api/payment-confirmations/mine")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Only active students can request payment confirmation"));

        BigDecimal due = new BigDecimal("6400.00");
        LocalDate today = LocalDate.now();
        profile.updateProfile(profile.getStudentName(), profile.getEmail(), "C-12", null, null,
                null, null, null, null, due, today);
        profile.setStatus(StudentStatus.ACTIVE);
        students.save(profile);

        String adminToken = auth.login(new LoginRequest(admin.getEmail(), "AdminPassword1!"),
                UUID.randomUUID().toString()).token();

        var requestResult = mockMvc.perform(post("/api/payment-confirmations/mine")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.amount").value(6400.0))
                .andReturn();
        java.util.regex.Matcher requestId = java.util.regex.Pattern
                .compile("\"id\":(\\d+)")
                .matcher(requestResult.getResponse().getContentAsString());
        assertTrue(requestId.find());

        mockMvc.perform(post("/api/payment-confirmations/mine")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(Long.parseLong(requestId.group(1))));

        mockMvc.perform(get("/api/payment-confirmations/pending")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].studentName").value("Payment Request Student"));
        mockMvc.perform(get("/api/payment-confirmations/pending/count")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pendingCount").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)));

        mockMvc.perform(patch("/api/payment-confirmations/" + requestId.group(1) + "/complete")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"paymentDate\":\"" + today + "\"}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(patch("/api/payment-confirmations/" + requestId.group(1) + "/complete")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"paymentDate\":\"" + today + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.paymentId").isNumber());
        mockMvc.perform(get("/api/payment-confirmations/mine")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("COMPLETED"));
        mockMvc.perform(get("/api/payments/my-history")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("Paid"));
    }

    @Test
    @Transactional
    void studentPaymentHistoryIsRestrictedToItsOwner() {
        UserAccount admin = admin();
        UserAccount owner = users.save(new UserAccount(uniqueEmail(),
                passwordEncoder.encode("StudentPassword1!"), Role.STUDENT));
        UserAccount other = users.save(new UserAccount(uniqueEmail(),
                passwordEncoder.encode("OtherPassword1!"), Role.STUDENT));
        Student student = student("history");
        student.setAccount(owner);
        student.updateProfile(student.getStudentName(), student.getEmail(), null, null, null,
                null, null, null, null, new BigDecimal("5000.00"), LocalDate.now());
        students.save(student);
        LocalDate date = LocalDate.now();
        var payment = paymentService.create(new PaymentRequest(student.getId(), new BigDecimal("5000.00"),
                date.getMonthValue(), date.getYear(), date, null), admin);

        assertEquals(1, paymentService.studentHistory(student.getId(), owner, false).size());
        assertThrows(ApiException.class, () -> paymentService.studentHistory(student.getId(), other, false));
        assertTrue(paymentService.receipt(payment.id(), owner, false).length > 0);
        assertThrows(ApiException.class, () -> paymentService.receipt(payment.id(), other, false));
    }

    @Test
    void rateLimiterRejectsExcessRequests() {
        String key = UUID.randomUUID().toString();
        for (int i = 0; i < 2; i++) rateLimiter.check(key, 2, 60);
        assertThrows(ApiException.class, () -> rateLimiter.check(key, 2, 60));
    }

    @Test
    void protectedAdminEndpointRejectsAnonymousAndStudentRequests() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/students/allstudents"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Authentication required"));

        String email = uniqueEmail();
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"StrongPassword1!\","
                                + "\"studentName\":\"Student Test\"}"))
                .andExpect(status().isCreated());
        var studentToken = auth.login(new LoginRequest(email, "StrongPassword1!"),
                UUID.randomUUID().toString()).token();
        mockMvc.perform(get("/api/students/allstudents")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Access denied"));

        mockMvc.perform(post("/api/students/addnewstudent")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"StudentName\":\"Student Test\",\"Email\":\"" + email + "\","
                                + "\"RoomNumber\":\"untrusted-room\",\"Sharing\":\"2\","
                                + "\"AmountPerMonth\":6000.00,\"StartingDate\":\"2026-10-06\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.StudentName").value("Student Test"))
                .andExpect(jsonPath("$.data.status").value("PENDING"));
    }

    @Test
    void aiChatRequiresStudentAuthenticationAndReturnsControlledProviderFailure() throws Exception {
        mockMvc.perform(post("/api/ai/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"What is my room number?\"}"))
                .andExpect(status().isUnauthorized());

        String email = uniqueEmail();
        auth.register(new RegisterRequest(email, "StrongPassword1!", "AI Test Student", null, "student"),
                UUID.randomUUID().toString());
        String token = auth.login(new LoginRequest(email, "StrongPassword1!"),
                UUID.randomUUID().toString()).token();
        when(geminiService.respond(anyString(), anyList()))
                .thenThrow(new AiUnavailableException("AI provider request failed."));

        mockMvc.perform(post("/api/ai/chat")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"What is my room number?\"}"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.response").value(
                        "Sorry, I'm unable to respond right now. Please try again."));
    }

    @Test
    void studentCanReadPublishedMenuAndComplaintRequiresExplicitConfirmation() throws Exception {
        UserAccount admin = admin();
        String email = uniqueEmail();
        auth.register(new RegisterRequest(email, "StrongPassword1!", "AI Feature Student", null, "student"),
                UUID.randomUUID().toString());
        String studentToken = auth.login(new LoginRequest(email, "StrongPassword1!"),
                UUID.randomUUID().toString()).token();

        LocalDate menuDate = LocalDate.now();
        mockMvc.perform(post("/api/mess/menus")
                        .header("Authorization", "Bearer " + auth.login(
                                new LoginRequest(admin.getEmail(), "AdminPassword1!"),
                                UUID.randomUUID().toString()).token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"date\":\"" + menuDate + "\",\"breakfast\":\"Menu breakfast\","
                                + "\"lunch\":\"Menu lunch\",\"snacks\":\"Menu snacks\",\"dinner\":\"Menu dinner\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/mess/menus/" + menuDate)
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.breakfast").value("Menu breakfast"));

        var proposal = mockMvc.perform(post("/api/ai/chat")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"Raise a complaint about my room fan\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.actionToken").isNotEmpty())
                .andReturn();

        mockMvc.perform(get("/api/complaints/mine")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());

        java.util.regex.Matcher actionToken = java.util.regex.Pattern
                .compile("\"actionToken\":\"([^\"]+)\"")
                .matcher(proposal.getResponse().getContentAsString());
        assertTrue(actionToken.find());
        String otherEmail = uniqueEmail();
        auth.register(new RegisterRequest(otherEmail, "StrongPassword1!", "Another AI Student", null, "student"),
                UUID.randomUUID().toString());
        String otherToken = auth.login(new LoginRequest(otherEmail, "StrongPassword1!"),
                UUID.randomUUID().toString()).token();
        mockMvc.perform(post("/api/ai/complaints/confirm")
                        .header("Authorization", "Bearer " + otherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"actionToken\":\"" + actionToken.group(1) + "\"}"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(get("/api/complaints/mine")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());

        mockMvc.perform(post("/api/ai/complaints/confirm")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"actionToken\":\"" + actionToken.group(1) + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.response").value(org.hamcrest.Matchers.containsString("submitted")));

        mockMvc.perform(get("/api/complaints/mine")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("My room fan issue"));
    }

    @Test
    void notificationsArePersistedAndCanOnlyBeReadByTheirStudent() throws Exception {
        UserAccount admin = admin();
        String email = uniqueEmail();
        auth.register(new RegisterRequest(email, "StrongPassword1!", "Notification Student", null, "student"),
                UUID.randomUUID().toString());
        UserAccount account = users.findByEmailIgnoreCase(email).orElseThrow();
        Student profile = students.findByAccountId(account.getId()).orElseThrow();
        String studentToken = auth.login(new LoginRequest(email, "StrongPassword1!"),
                UUID.randomUUID().toString()).token();
        String adminToken = auth.login(new LoginRequest(admin.getEmail(), "AdminPassword1!"),
                UUID.randomUUID().toString()).token();

        var created = mockMvc.perform(post("/api/notifications")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"studentId\":" + profile.getId()
                                + ",\"title\":\"Water maintenance\",\"message\":\"Water is off until noon.\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.read").value(false))
                .andReturn();
        java.util.regex.Matcher notificationId = java.util.regex.Pattern
                .compile("\"id\":(\\d+)")
                .matcher(created.getResponse().getContentAsString());
        assertTrue(notificationId.find());

        String otherEmail = uniqueEmail();
        auth.register(new RegisterRequest(otherEmail, "StrongPassword1!", "Other Student", null, "student"),
                UUID.randomUUID().toString());
        String otherToken = auth.login(new LoginRequest(otherEmail, "StrongPassword1!"),
                UUID.randomUUID().toString()).token();
        mockMvc.perform(patch("/api/notifications/" + notificationId.group(1) + "/read")
                        .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/notifications/mine")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Water maintenance"));
        mockMvc.perform(patch("/api/notifications/" + notificationId.group(1) + "/read")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.read").value(true));
        mockMvc.perform(get("/api/notifications/mine?unreadOnly=true")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
        mockMvc.perform(get("/api/notifications/mine/unread-count")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount").value(0));
        mockMvc.perform(get("/api/notifications/mine")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCanReviewComplaintsAndUpdateTheirStatus() throws Exception {
        UserAccount admin = admin();
        String studentEmail = uniqueEmail();
        auth.register(new RegisterRequest(studentEmail, "StrongPassword1!", "Complaint Student", null, "student"),
                UUID.randomUUID().toString());
        String studentToken = auth.login(new LoginRequest(studentEmail, "StrongPassword1!"),
                UUID.randomUUID().toString()).token();
        String adminToken = auth.login(new LoginRequest(admin.getEmail(), "AdminPassword1!"),
                UUID.randomUUID().toString()).token();

        var created = mockMvc.perform(post("/api/complaints")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Maintenance: Broken fan\",\"description\":\"The fan is not working.\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.studentName").value("Complaint Student"))
                .andExpect(jsonPath("$.studentEmail").value(studentEmail))
                .andReturn();
        java.util.regex.Matcher complaintId = java.util.regex.Pattern
                .compile("\"id\":(\\d+)")
                .matcher(created.getResponse().getContentAsString());
        assertTrue(complaintId.find());

        mockMvc.perform(get("/api/complaints")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(Long.parseLong(complaintId.group(1))))
                .andExpect(jsonPath("$[0].title").value("Maintenance: Broken fan"));

        mockMvc.perform(patch("/api/complaints/" + complaintId.group(1) + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"IN_PROGRESS\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));

        mockMvc.perform(get("/api/complaints/mine")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("IN_PROGRESS"));
        mockMvc.perform(get("/api/notifications/mine")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Complaint status updated"))
                .andExpect(jsonPath("$[0].message").value(
                        "Your complaint \"Maintenance: Broken fan\" is now IN PROGRESS."));

        mockMvc.perform(get("/api/complaints")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCanBroadcastUpdatesToStudents() throws Exception {
        UserAccount admin = admin();
        String firstEmail = uniqueEmail();
        String secondEmail = uniqueEmail();
        auth.register(new RegisterRequest(firstEmail, "StrongPassword1!", "First Student", null, "student"),
                UUID.randomUUID().toString());
        auth.register(new RegisterRequest(secondEmail, "StrongPassword1!", "Second Student", null, "student"),
                UUID.randomUUID().toString());
        String firstToken = auth.login(new LoginRequest(firstEmail, "StrongPassword1!"),
                UUID.randomUUID().toString()).token();
        String secondToken = auth.login(new LoginRequest(secondEmail, "StrongPassword1!"),
                UUID.randomUUID().toString()).token();
        String adminToken = auth.login(new LoginRequest(admin.getEmail(), "AdminPassword1!"),
                UUID.randomUUID().toString()).token();

        mockMvc.perform(post("/api/notifications/broadcast")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Water update\",\"message\":\"Water service resumes at noon.\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.recipientCount").value(
                        org.hamcrest.Matchers.greaterThanOrEqualTo(2)));

        mockMvc.perform(get("/api/notifications/mine")
                        .header("Authorization", "Bearer " + firstToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Water update"));
        mockMvc.perform(get("/api/notifications/mine/unread-count")
                        .header("Authorization", "Bearer " + secondToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount").value(1));
        mockMvc.perform(post("/api/notifications/broadcast")
                        .header("Authorization", "Bearer " + firstToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Unauthorized\",\"message\":\"Not an admin update.\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void registrationValidationReturnsConsistentClientError() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"not-an-email\",\"password\":\"short\",\"studentName\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    private UserAccount admin() {
        return users.save(new UserAccount(uniqueEmail(), passwordEncoder.encode("AdminPassword1!"), Role.ADMIN));
    }

    private Student student(String prefix) {
        String email = prefix + "-" + uniqueEmail();
        Student student = new Student(prefix, email);
        student.setStatus(StudentStatus.ACTIVE);
        return students.save(student);
    }

    private String uniqueEmail() {
        return UUID.randomUUID() + "@example.test";
    }
}
