package com.example.backend.ai;

public record AiResponse(boolean success, String response, String conversationId,
                         String actionToken, String complaintTitle, String complaintDescription) {
    public AiResponse(boolean success, String response, String conversationId) {
        this(success, response, conversationId, null, null, null);
    }
}
