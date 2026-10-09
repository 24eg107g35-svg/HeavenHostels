package com.example.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Scheduled;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimiter {
    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();

    public void check(String key, int limit, long windowSeconds) {
        long now = Instant.now().getEpochSecond();
        Window window = windows.compute(key, (ignored, current) ->
                current == null || now - current.startedAt >= windowSeconds
                        ? new Window(now, 1)
                        : new Window(current.startedAt, current.count + 1));
        if (window.count > limit) {
            throw new ApiException(org.springframework.http.HttpStatus.TOO_MANY_REQUESTS,
                    "Too many requests. Please try again later.");
        }
    }

    @Scheduled(fixedDelay = 300_000)
    void removeExpiredWindows() {
        long now = Instant.now().getEpochSecond();
        windows.entrySet().removeIf(entry -> now - entry.getValue().startedAt >= 3600);
    }

    private record Window(long startedAt, int count) {}
}
