package com.example.backend.ai;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class GeminiService {
    private static final Logger log = LoggerFactory.getLogger(GeminiService.class);
    private final RestClient restClient;
    private final String apiKey;
    private final String model;

    public GeminiService(@Value("${app.ai.gemini.api-key:}") String apiKey,
                         @Value("${app.ai.gemini.model:gemini-3.8-flash}") String model) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.model = model == null || model.isBlank() ? "gemini-3.8-flash" : model.trim();
        if (this.apiKey.isBlank()) {
            log.error("GEMINI_API_KEY is not available to the backend process; AI chat requests cannot reach Gemini.");
            log.info("GEMINI_API_KEY present = false for model {}", this.model);
        } else {
            log.info("Gemini AI is configured with model {} and GEMINI_API_KEY present = true", this.model);
        }
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(Duration.ofSeconds(30));
        this.restClient = RestClient.builder()
                .baseUrl("https://generativelanguage.googleapis.com")
                .requestFactory(requestFactory)
                .build();
    }

    public String respond(String systemInstruction, List<ChatTurn> turns) {
        if (apiKey.isBlank()) {
            throw new AiUnavailableException("GEMINI_API_KEY is not available to the backend process.");
        }

        Map<String, Object> request = Map.of(
                "systemInstruction", Map.of("parts", List.of(Map.of("text", systemInstruction))),
                "contents", turns.stream()
                        .map(turn -> Map.of(
                                "role", turn.role(),
                                "parts", List.of(Map.of("text", turn.text()))))
                        .toList(),
                "generationConfig", Map.of("temperature", 0.2, "maxOutputTokens", 800));

        try {
            Map<?, ?> response = restClient.post()
                    .uri(uriBuilder -> uriBuilder
                            .path("/v1beta/models/{model}:generateContent")
                            .build(model))
                    .header("x-goog-api-key", apiKey)
                    .body(request)
                    .retrieve()
                    .body(Map.class);

            String text = extractText(response);
            if (text == null || text.isBlank()) {
                throw new AiUnavailableException("AI returned no response.");
            }
            return text;
        } catch (RestClientResponseException exception) {
            log.error("Gemini request failed with HTTP status {} for model {}",
                    exception.getStatusCode().value(), model);
            throw new AiUnavailableException("AI provider request failed.", exception);
        } catch (RestClientException exception) {
            log.error("Gemini request could not be completed for model {}", model, exception);
            throw new AiUnavailableException("AI provider request failed.", exception);
        }
    }

    private String extractText(Map<?, ?> response) {
        if (response == null || !(response.get("candidates") instanceof List<?> candidates)
                || candidates.isEmpty() || !(candidates.get(0) instanceof Map<?, ?> candidate)
                || !(candidate.get("content") instanceof Map<?, ?> content)
                || !(content.get("parts") instanceof List<?> parts)) {
            return "";
        }

        List<String> textParts = new ArrayList<>();
        for (Object part : parts) {
            if (part instanceof Map<?, ?> partMap && partMap.get("text") instanceof String text && !text.isBlank()) {
                textParts.add(text);
            }
        }
        return String.join("\n", textParts);
    }

    public record ChatTurn(String role, String text) {
    }
}
