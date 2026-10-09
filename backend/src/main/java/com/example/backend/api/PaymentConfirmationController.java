package com.example.backend.api;

import com.example.backend.api.dto.ApiDtos.PaymentConfirmationDateRequest;
import com.example.backend.api.dto.ApiDtos.PaymentConfirmationResponse;
import com.example.backend.security.AuthenticatedUser;
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

    public PaymentConfirmationController(PaymentConfirmationService confirmations) {
        this.confirmations = confirmations;
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
}
