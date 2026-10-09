package com.example.backend.api;

import com.example.backend.api.dto.HostelDataDtos.NotificationRequest;
import com.example.backend.api.dto.HostelDataDtos.NotificationBroadcastRequest;
import com.example.backend.api.dto.HostelDataDtos.NotificationBroadcastResponse;
import com.example.backend.api.dto.HostelDataDtos.NotificationUnreadCountResponse;
import com.example.backend.api.dto.HostelDataDtos.NotificationResponse;
import com.example.backend.security.AuthenticatedUser;
import com.example.backend.service.StudentNotificationService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@SecurityRequirement(name = "bearerAuth")
public class StudentNotificationController {
    private final StudentNotificationService notifications;

    public StudentNotificationController(StudentNotificationService notifications) {
        this.notifications = notifications;
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('STUDENT')")
    public List<NotificationResponse> mine(@AuthenticationPrincipal AuthenticatedUser principal,
                                            @RequestParam(defaultValue = "false") boolean unreadOnly) {
        return notifications.mine(principal.id(), unreadOnly);
    }

    @GetMapping("/mine/unread-count")
    @PreAuthorize("hasRole('STUDENT')")
    public NotificationUnreadCountResponse unreadCount(@AuthenticationPrincipal AuthenticatedUser principal) {
        return new NotificationUnreadCountResponse(notifications.unreadCount(principal.id()));
    }

    @PatchMapping("/{id}/read")
    @PreAuthorize("hasRole('STUDENT')")
    public NotificationResponse markRead(@PathVariable Long id,
                                         @AuthenticationPrincipal AuthenticatedUser principal) {
        return notifications.markRead(principal.id(), id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public NotificationResponse create(@Valid @RequestBody NotificationRequest request) {
        return notifications.create(request);
    }

    @PostMapping("/broadcast")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public NotificationBroadcastResponse broadcast(@Valid @RequestBody NotificationBroadcastRequest request) {
        return notifications.broadcast(request);
    }
}
