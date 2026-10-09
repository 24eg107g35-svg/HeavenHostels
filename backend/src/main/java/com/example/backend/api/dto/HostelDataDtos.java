package com.example.backend.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import com.example.backend.domain.ComplaintStatus;

import java.time.Instant;
import java.time.LocalDate;

public final class HostelDataDtos {
    private HostelDataDtos() {
    }

    public record MessMenuRequest(@NotNull LocalDate date,
                                  @Size(max = 1000) String breakfast,
                                  @Size(max = 1000) String lunch,
                                  @Size(max = 1000) String snacks,
                                  @Size(max = 1000) String dinner) {
    }

    public record MessMenuResponse(Long id, LocalDate date, String breakfast,
                                   String lunch, String snacks, String dinner) {
    }

    public record ComplaintRequest(@NotBlank @Size(max = 160) String title,
                                   @NotBlank @Size(max = 2000) String description) {
    }

    public record ComplaintStatusRequest(@NotNull ComplaintStatus status) {
    }

    public record ComplaintResponse(Long id, String title, String description,
                                    String status, Instant createdAt, Instant updatedAt,
                                    Long studentId, String studentName, String studentEmail,
                                    String roomNumber) {
    }

    public record NotificationRequest(@NotNull Long studentId,
                                      @NotBlank @Size(max = 160) String title,
                                      @NotBlank @Size(max = 2000) String message) {
    }

    public record NotificationBroadcastRequest(@NotBlank @Size(max = 160) String title,
                                                @NotBlank @Size(max = 2000) String message) {
    }

    public record NotificationBroadcastResponse(int recipientCount) {
    }

    public record NotificationResponse(Long id, String title, String message,
                                       boolean read, Instant createdAt) {
    }

    public record NotificationUnreadCountResponse(long unreadCount) {
    }

    public record ComplaintConfirmationRequest(@NotBlank String actionToken) {
    }
}
