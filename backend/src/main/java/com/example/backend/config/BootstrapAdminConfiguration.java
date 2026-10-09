package com.example.backend.config;

import com.example.backend.domain.Role;
import com.example.backend.domain.UserAccount;
import com.example.backend.repository.UserAccountRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Locale;

@Configuration
public class BootstrapAdminConfiguration {
    private static final Logger log = LoggerFactory.getLogger(BootstrapAdminConfiguration.class);

    @Bean
    ApplicationRunner seedAdmin(UserAccountRepository users, PasswordEncoder encoder,
                                @Value("${app.bootstrap-admin.email:}") String email,
                                @Value("${app.bootstrap-admin.password:}") String password) {
        return args -> {
            if (email.isBlank() && password.isBlank()) return;
            if (email.isBlank() || password.length() < 8) {
                throw new IllegalStateException("Set both BOOTSTRAP_ADMIN_EMAIL and a BOOTSTRAP_ADMIN_PASSWORD of at least 8 characters");
            }
            if (password.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72) {
                throw new IllegalStateException("BOOTSTRAP_ADMIN_PASSWORD must not exceed 72 UTF-8 bytes");
            }
            String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
            UserAccount existing = users.findByEmailIgnoreCase(normalizedEmail).orElse(null);
            if (existing == null) {
                users.save(new UserAccount(normalizedEmail, encoder.encode(password), Role.ADMIN));
                log.info("Bootstrap administrator account created");
            } else if (existing.getRole() != Role.ADMIN) {
                throw new IllegalStateException("Bootstrap admin email is already registered as a non-admin account");
            }
        };
    }
}
