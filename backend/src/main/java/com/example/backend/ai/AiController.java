package com.example.backend.ai;

import com.example.backend.security.AuthenticatedUser;
import com.example.backend.api.dto.HostelDataDtos.ComplaintConfirmationRequest;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
@SecurityRequirement(name = "bearerAuth")
public class AiController {
    private static final Logger log = LoggerFactory.getLogger(AiController.class);
    private final AiService ai;

    public AiController(AiService ai) {
        this.ai = ai;
    }

    @PostMapping("/chat")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<AiResponse> chat(@Valid @RequestBody AiRequest request,
                                           @AuthenticationPrincipal AuthenticatedUser principal) {
        try {
            return ResponseEntity.ok(ai.chat(principal.id(), principal.email(), request));
        } catch (AiUnavailableException exception) {
            log.error("AI chat failed for account {}: {}", principal.id(), exception.getMessage(), exception);
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(new AiResponse(false,
                            "Sorry, I'm unable to respond right now. Please try again.",
                            request.conversationId()));
        }
    }

    @PostMapping("/complaints/confirm")
    @PreAuthorize("hasRole('STUDENT')")
    public AiResponse confirmComplaint(@Valid @RequestBody ComplaintConfirmationRequest request,
                                       @AuthenticationPrincipal AuthenticatedUser principal) {
        return ai.confirmComplaint(principal.id(), request.actionToken());
    }

    @PostMapping("/complaints/cancel")
    @PreAuthorize("hasRole('STUDENT')")
    public AiResponse cancelComplaint(@Valid @RequestBody ComplaintConfirmationRequest request,
                                      @AuthenticationPrincipal AuthenticatedUser principal) {
        ai.cancelComplaint(principal.id(), request.actionToken());
        return new AiResponse(true, "Complaint submission cancelled.", null);
    }
}
