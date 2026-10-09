package com.example.backend.ai;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AiRequest(
        @NotBlank @Size(max = 2000) String message,
        @Size(max = 80) String conversationId) {
}
