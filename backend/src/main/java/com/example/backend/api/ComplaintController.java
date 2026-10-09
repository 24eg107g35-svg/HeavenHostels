package com.example.backend.api;

import com.example.backend.api.dto.HostelDataDtos.ComplaintRequest;
import com.example.backend.api.dto.HostelDataDtos.ComplaintResponse;
import com.example.backend.api.dto.HostelDataDtos.ComplaintStatusRequest;
import com.example.backend.security.AuthenticatedUser;
import com.example.backend.service.ComplaintService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/complaints")
@SecurityRequirement(name = "bearerAuth")
public class ComplaintController {
    private final ComplaintService complaints;

    public ComplaintController(ComplaintService complaints) {
        this.complaints = complaints;
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('STUDENT')")
    public List<ComplaintResponse> mine(@AuthenticationPrincipal AuthenticatedUser principal) {
        return complaints.mine(principal.id());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('STUDENT')")
    public ComplaintResponse create(@Valid @RequestBody ComplaintRequest request,
                                    @AuthenticationPrincipal AuthenticatedUser principal) {
        return complaints.createForAccount(principal.id(), request);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<ComplaintResponse> all() {
        return complaints.all();
    }

    @org.springframework.web.bind.annotation.PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ComplaintResponse updateStatus(@org.springframework.web.bind.annotation.PathVariable Long id,
                                          @Valid @RequestBody ComplaintStatusRequest request) {
        return complaints.updateStatus(id, request.status());
    }
}
