package com.example.backend.security;

import com.example.backend.domain.UserAccount;
import jakarta.annotation.PostConstruct;
import tools.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;

@Service
public class JwtService {
    private static final Base64.Encoder URL_ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder URL_DECODER = Base64.getUrlDecoder();
    private final ObjectMapper objectMapper;
    private final String secret;
    private final String issuer;
    private final long expirationMinutes;

    public JwtService(ObjectMapper objectMapper,
                      @Value("${app.jwt.secret:}") String secret,
                      @Value("${app.jwt.issuer}") String issuer,
                      @Value("${app.jwt.expiration-minutes}") long expirationMinutes) {
        this.objectMapper = objectMapper;
        this.secret = secret;
        this.issuer = issuer;
        this.expirationMinutes = expirationMinutes;
    }

    @PostConstruct
    void validateConfiguration() {
        if (secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("JWT_SECRET must be configured with at least 32 characters");
        }
        if (expirationMinutes < 5 || expirationMinutes > 1440) {
            throw new IllegalStateException("JWT_EXPIRATION_MINUTES must be between 5 and 1440");
        }
    }

    public String issue(UserAccount account) {
        try {
            long now = Instant.now().getEpochSecond();
            Map<String, Object> header = Map.of("alg", "HS256", "typ", "JWT");
            Map<String, Object> claims = Map.of(
                    "sub", account.getEmail(),
                    "role", account.getRole().name(),
                    "ver", account.getTokenVersion(),
                    "iss", issuer,
                    "iat", now,
                    "exp", now + expirationMinutes * 60
            );
            String unsigned = encode(objectMapper.writeValueAsBytes(header)) + "." + encode(objectMapper.writeValueAsBytes(claims));
            return unsigned + "." + URL_ENCODER.encodeToString(sign(unsigned));
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to issue authentication token", exception);
        }
    }

    public TokenClaims validate(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                throw new IllegalArgumentException();
            }
            String unsigned = parts[0] + "." + parts[1];
            byte[] suppliedSignature = URL_DECODER.decode(parts[2]);
            if (!MessageDigest.isEqual(sign(unsigned), suppliedSignature)) {
                throw new IllegalArgumentException();
            }
            Map<?, ?> header = objectMapper.readValue(URL_DECODER.decode(parts[0]), Map.class);
            Map<?, ?> claims = objectMapper.readValue(URL_DECODER.decode(parts[1]), Map.class);
            if (!"HS256".equals(header.get("alg"))
                    || !issuer.equals(claims.get("iss"))
                    || !(claims.get("sub") instanceof String email)
                    || !(claims.get("role") instanceof String role)
                    || !(claims.get("ver") instanceof Number version)
                    || !(claims.get("exp") instanceof Number expiration)
                    || expiration.longValue() <= Instant.now().getEpochSecond()) {
                throw new IllegalArgumentException();
            }
            return new TokenClaims(email, role, version.longValue());
        } catch (Exception exception) {
            throw new IllegalArgumentException("Invalid or expired bearer token");
        }
    }

    private byte[] sign(String input) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return mac.doFinal(input.getBytes(StandardCharsets.UTF_8));
    }

    private String encode(byte[] value) {
        return URL_ENCODER.encodeToString(value);
    }

    public record TokenClaims(String email, String role, long version) {}
}
