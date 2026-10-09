package com.example.backend.api;

import com.example.backend.api.dto.ApiDtos.AdminPaymentRequestDto;
import com.example.backend.api.dto.ApiDtos.PaymentConfirmationDateRequest;
import com.example.backend.api.dto.ApiDtos.PaymentConfirmationResponse;
import com.example.backend.api.dto.ApiDtos.PaymentResponse;
import com.example.backend.domain.UserAccount;
import com.example.backend.repository.UserAccountRepository;
import com.example.backend.security.AuthenticatedUser;
import com.example.backend.service.ApiException;
import com.example.backend.service.PaymentConfirmationService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payment-confirmations")
@SecurityRequirement(name = "bearerAuth")
public class PaymentConfirmationController {
    private final PaymentConfirmationService confirmations;
    private final UserAccountRepository users;

    public PaymentConfirmationController(PaymentConfirmationService confirmations, UserAccountRepository users) {
        this.confirmations = confirmations;
        this.users = users;
    }

    @PostMapping("/mine")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('STUDENT')")
    public PaymentConfirmationResponse requestPayment(@AuthenticationPrincipal AuthenticatedUser principal) {
        return confirmations.requestCurrentPayment(principal.id());
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('STUDENT')")
    public List<PaymentConfirmationResponse> mine(@AuthenticationPrincipal AuthenticatedUser principal) {
        return confirmations.mine(principal.id());
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public List<PaymentConfirmationResponse> pending() {
        return confirmations.pending();
    }

    @GetMapping("/pending/count")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Long> pendingCount() {
        return Map.of("pendingCount", confirmations.pendingCount());
    }

    @PatchMapping("/{id}/complete")
    @PreAuthorize("hasRole('ADMIN')")
    public PaymentConfirmationResponse complete(@PathVariable Long id,
            @Valid @RequestBody PaymentConfirmationDateRequest request,
            @AuthenticationPrincipal AuthenticatedUser principal) {
        return confirmations.complete(id, request, principal.email());
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public PaymentConfirmationResponse reject(@PathVariable Long id) {
        return confirmations.reject(id);
    }

    @PostMapping("/admin/send")
    @PreAuthorize("hasRole('ADMIN')")
    public PaymentConfirmationResponse adminSend(@RequestBody AdminPaymentRequestDto request,
                                                 @AuthenticationPrincipal AuthenticatedUser principal) {
        return confirmations.adminSendPaymentRequest(request.studentId(), request.month(), request.year(), principal.email());
    }

    @PostMapping("/admin/send-all-unpaid")
    @PreAuthorize("hasRole('ADMIN')")
    public List<PaymentConfirmationResponse> adminSendAllUnpaid(@AuthenticationPrincipal AuthenticatedUser principal) {
        return confirmations.adminSendAllUnpaidRequests(principal.email());
    }

    @PostMapping("/accept/{id}")
    @PreAuthorize("hasRole('STUDENT')")
    public PaymentResponse acceptAndPay(@PathVariable Long id,
                                       @AuthenticationPrincipal AuthenticatedUser principal) {
        return confirmations.acceptAndPay(id, account(principal));
    }

    private UserAccount account(AuthenticatedUser principal) {
        return users.findById(principal.id())
                .orElseThrow(() -> ApiException.unauthorized("Account does not exist"));
    }
}

