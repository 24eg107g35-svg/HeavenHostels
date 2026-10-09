package com.example.backend.api;

import com.example.backend.api.dto.ApiDtos.PageResponse;
import com.example.backend.api.dto.ApiDtos.PaymentRequest;
import com.example.backend.api.dto.ApiDtos.PaymentResponse;
import com.example.backend.api.dto.ApiDtos.StudentPaymentsResponse;
import com.example.backend.domain.Role;
import com.example.backend.domain.UserAccount;
import com.example.backend.repository.UserAccountRepository;
import com.example.backend.security.AuthenticatedUser;
import com.example.backend.service.ApiException;
import com.example.backend.service.PaymentService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@SecurityRequirement(name = "bearerAuth")
public class PaymentController {
    private final PaymentService payments;
    private final UserAccountRepository users;

    public PaymentController(PaymentService payments, UserAccountRepository users) {
        this.payments = payments;
        this.users = users;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public PaymentResponse create(@Valid @RequestBody PaymentRequest request,
                                  @AuthenticationPrincipal AuthenticatedUser principal) {
        return payments.create(request, account(principal));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public PageResponse<PaymentResponse> list(@RequestParam(defaultValue = "0") int page,
                                               @RequestParam(defaultValue = "20") int size) {
        validatePage(page, size);
        return payments.list(page, size);
    }

    @GetMapping("/my-history")
    @PreAuthorize("hasRole('STUDENT')")
    public List<PaymentResponse> myHistory(@AuthenticationPrincipal AuthenticatedUser principal) {
        return payments.ownHistory(account(principal));
    }

    @PostMapping("/pay-current")
    @PreAuthorize("hasRole('STUDENT')")
    public PaymentResponse payCurrentMonth(@AuthenticationPrincipal AuthenticatedUser principal) {
        return payments.studentPayCurrent(account(principal));
    }

    @GetMapping("/student/{studentId}")
    public List<PaymentResponse> studentHistory(@PathVariable Long studentId,
                                                 @AuthenticationPrincipal AuthenticatedUser principal) {
        return payments.studentHistory(studentId, account(principal), isAdmin(principal));
    }

    @GetMapping("/getpaymentdetails/{studentId}")
    public Map<String, List<StudentPaymentsResponse>> legacyHistory(
            @PathVariable Long studentId, @AuthenticationPrincipal AuthenticatedUser principal) {
        return Map.of("data", List.of(payments.legacyStudentHistory(studentId, account(principal), isAdmin(principal))));
    }

    @GetMapping("/{id}/receipt")
    public ResponseEntity<byte[]> receipt(@PathVariable Long id,
                                          @AuthenticationPrincipal AuthenticatedUser principal) {
        UserAccount actor = account(principal);
        byte[] pdf = payments.receipt(id, actor, isAdmin(principal));
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename("receipt-" + id + ".pdf").build().toString())
                .body(pdf);
    }

    @GetMapping("/{id}")
    public PaymentResponse get(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser principal) {
        return payments.get(id, account(principal), isAdmin(principal));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public PaymentResponse update(@PathVariable Long id, @Valid @RequestBody PaymentRequest request,
                                  @AuthenticationPrincipal AuthenticatedUser principal) {
        return payments.update(id, request, account(principal));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, String> cancel(@PathVariable Long id,
                                      @AuthenticationPrincipal AuthenticatedUser principal) {
        payments.cancel(id, account(principal));
        return Map.of("message", "Payment cancelled");
    }

    private UserAccount account(AuthenticatedUser principal) {
        return users.findById(principal.id())
                .orElseThrow(() -> ApiException.unauthorized("Account no longer exists"));
    }

    private boolean isAdmin(AuthenticatedUser principal) {
        return Role.ADMIN.name().equals(principal.role());
    }

    private void validatePage(int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw ApiException.badRequest("page must be non-negative and size must be between 1 and 100");
        }
    }
}
