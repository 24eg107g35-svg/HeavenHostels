package com.example.backend.api;

import com.example.backend.api.dto.ApiDtos.PageResponse;
import com.example.backend.api.dto.ApiDtos.RegisterRequest;
import com.example.backend.api.dto.ApiDtos.StudentRequest;
import com.example.backend.api.dto.ApiDtos.StudentResponse;
import com.example.backend.api.dto.ApiDtos.StudentRoomDetailResponse;
import com.example.backend.api.dto.ApiDtos.UserResponse;
import com.example.backend.domain.Role;
import com.example.backend.domain.UserAccount;
import com.example.backend.repository.UserAccountRepository;
import com.example.backend.security.AuthenticatedUser;
import com.example.backend.service.ApiException;
import com.example.backend.service.AuthService;
import com.example.backend.service.PaymentService;
import com.example.backend.service.StudentService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/students")
public class StudentController {
    private final StudentService students;
    private final UserAccountRepository users;
    private final AuthService auth;
    private final PaymentService payments;

    public StudentController(StudentService students, UserAccountRepository users,
                             AuthService auth, PaymentService payments) {
        this.students = students;
        this.users = users;
        this.auth = auth;
        this.payments = payments;
    }

    @PostMapping("/studentlogin")
    public com.example.backend.api.dto.ApiDtos.AuthResponse legacyLogin(
            @Valid @RequestBody com.example.backend.api.dto.ApiDtos.LoginRequest request,
            HttpServletRequest servletRequest) {
        return auth.login(request, servletRequest.getRemoteAddr());
    }

    @PostMapping("/studentregistration")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> legacyRegistration(@Valid @RequestBody RegisterRequest request,
                                                   HttpServletRequest servletRequest) {
        auth.register(request, servletRequest.getRemoteAddr());
        return Map.of("message", "Student registration successful");
    }

    @GetMapping("/protected")
    @SecurityRequirement(name = "bearerAuth")
    public Map<String, UserResponse> protectedUser(@AuthenticationPrincipal AuthenticatedUser principal) {
        return Map.of("user", new UserResponse(principal.id(), principal.email(), principal.role()));
    }

    @GetMapping("/me")
    @SecurityRequirement(name = "bearerAuth")
    public StudentResponse me(@AuthenticationPrincipal AuthenticatedUser principal) {
        return students.byEmail(principal.email());
    }

    @GetMapping("/my-room")
    @SecurityRequirement(name = "bearerAuth")
    public StudentRoomDetailResponse myRoom(@AuthenticationPrincipal AuthenticatedUser principal) {
        return students.roomDetailsForAccount(principal.id(), principal.email());
    }

    @PostMapping("/addnewstudent")
    @SecurityRequirement(name = "bearerAuth")
    public Map<String, StudentResponse> addStudent(@Valid @RequestBody StudentRequest request,
                                                    @AuthenticationPrincipal AuthenticatedUser principal) {
        boolean admin = principal.role().equals(Role.ADMIN.name());
        UserAccount actor = account(principal);
        return Map.of("data", admin
                ? students.saveLegacyProfile(request, actor)
                : students.saveProfile(request, actor, false));
    }

    @PostMapping
    @SecurityRequirement(name = "bearerAuth")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public StudentResponse create(@Valid @RequestBody StudentRequest request,
                                  @AuthenticationPrincipal AuthenticatedUser principal) {
        return students.saveProfile(request, account(principal), true);
    }

    @GetMapping
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    public PageResponse<StudentResponse> list(@RequestParam(defaultValue = "0") int page,
                                               @RequestParam(defaultValue = "20") int size) {
        validatePage(page, size);
        return students.list(page, size);
    }

    @GetMapping("/search")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    public List<StudentResponse> search(@RequestParam("q") String query) {
        return students.search(query);
    }

    @GetMapping("/allstudents")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, List<StudentResponse>> allStudents() {
        return Map.of("data", students.all());
    }

    @GetMapping("/getbyroomnumber/{roomNumber}")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, List<StudentResponse>> byRoom(@PathVariable String roomNumber) {
        List<StudentResponse> result = students.byRoom(roomNumber);
        if (result.isEmpty()) throw ApiException.notFound("Room not found");
        return Map.of("data", result);
    }

    @GetMapping("/getstudentbymail/{email}")
    @SecurityRequirement(name = "bearerAuth")
    public Map<String, StudentResponse> byEmail(@PathVariable String email,
                                                 @AuthenticationPrincipal AuthenticatedUser principal) {
        if (!principal.role().equals(Role.ADMIN.name()) && !principal.email().equalsIgnoreCase(email)) {
            throw ApiException.forbidden("Students may only access their own profile");
        }
        return java.util.Collections.singletonMap("data", students.byEmail(email));
    }

    @PutMapping("/updatestudent/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, StudentResponse> updateLegacy(@PathVariable Long id,
                                                      @Valid @RequestBody StudentRequest request,
                                                      @AuthenticationPrincipal AuthenticatedUser principal) {
        return Map.of("data", students.update(id, request, account(principal)));
    }

    @PutMapping("/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    public StudentResponse update(@PathVariable Long id, @Valid @RequestBody StudentRequest request,
                                  @AuthenticationPrincipal AuthenticatedUser principal) {
        return students.update(id, request, account(principal));
    }

    @DeleteMapping("/deletestudent/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, String> deleteLegacy(@PathVariable Long id,
                                             @AuthenticationPrincipal AuthenticatedUser principal) {
        students.delete(id, principal.email());
        return Map.of("message", "Student deactivated");
    }

    @DeleteMapping("/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, String> delete(@PathVariable Long id,
                                      @AuthenticationPrincipal AuthenticatedUser principal) {
        students.delete(id, principal.email());
        return Map.of("message", "Student deactivated");
    }

    @GetMapping("/unpaidlist")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, List<StudentResponse>> unpaidList() {
        return Map.of("data", students.allViews().stream()
                .filter(StudentResponse::isActive)
                .filter(student -> "Unpaid".equals(student.paymentstatus()))
                .toList());
    }

    @GetMapping("/paidlist")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, List<StudentResponse>> paidList() {
        return Map.of("data", students.allViews().stream()
                .filter(StudentResponse::isActive)
                .filter(student -> "Paid".equals(student.paymentstatus()))
                .toList());
    }

    @PutMapping("/updatepaymentstatus/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> markPaid(@PathVariable Long id,
                                       @RequestBody(required = false) Map<String, String> request,
                                       @AuthenticationPrincipal AuthenticatedUser principal) {
        String dateValue = request == null ? null : request.get("paymentDate");
        LocalDate date = dateValue == null || dateValue.isBlank() ? LocalDate.now() : LocalDate.parse(dateValue);
        return Map.of("data", payments.markCurrentMonthPaid(id, date, account(principal)));
    }

    @PutMapping("/updateallpaymentstatus")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, String> resetCurrentStatuses(@AuthenticationPrincipal AuthenticatedUser principal) {
        payments.resetCurrentMonthPayments(account(principal));
        return Map.of("message", "Current month payment statuses updated");
    }

    @PostMapping("/updatepaymentstatustoUnpaid/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, String> markUnpaid(@PathVariable Long id,
                                         @AuthenticationPrincipal AuthenticatedUser principal) {
        payments.markCurrentMonthUnpaid(id, account(principal));
        return Map.of("message", "Payment status updated");
    }

    @GetMapping("/paymenthistroy")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> legacyPaymentHistory() {
        return Map.of("responses", payments.legacyHistory());
    }

    @GetMapping("/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    public StudentResponse get(@PathVariable Long id) {
        return students.get(id);
    }

    private UserAccount account(AuthenticatedUser principal) {
        return users.findById(principal.id())
                .orElseThrow(() -> ApiException.unauthorized("Account no longer exists"));
    }

    private void validatePage(int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw ApiException.badRequest("page must be non-negative and size must be between 1 and 100");
        }
    }
}
