package com.example.backend.service;

import com.example.backend.api.dto.ApiDtos.AuthResponse;
import com.example.backend.api.dto.ApiDtos.LoginRequest;
import com.example.backend.api.dto.ApiDtos.RegisterRequest;
import com.example.backend.api.dto.ApiDtos.ResetPasswordRequest;
import com.example.backend.api.dto.ApiDtos.VerifyOtpRequest;
import com.example.backend.domain.PasswordResetOtp;
import com.example.backend.domain.RefreshToken;
import com.example.backend.domain.Role;
import com.example.backend.domain.Student;
import com.example.backend.domain.UserAccount;
import com.example.backend.repository.PasswordResetOtpRepository;
import com.example.backend.repository.RefreshTokenRepository;
import com.example.backend.repository.StudentRepository;
import com.example.backend.repository.UserAccountRepository;
import com.example.backend.security.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.HexFormat;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Locale;

@Service
public class AuthService {
    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private final UserAccountRepository users;
    private final StudentRepository students;
    private final PasswordResetOtpRepository otps;
    private final RefreshTokenRepository refreshTokens;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;
    private final RateLimiter rateLimiter;
    private final long otpExpirationMinutes;
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthService(UserAccountRepository users, StudentRepository students,
                       PasswordResetOtpRepository otps, RefreshTokenRepository refreshTokens,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService, EmailService emailService, RateLimiter rateLimiter,
                       @Value("${app.otp.expiration-minutes}") long otpExpirationMinutes) {
        this.users = users;
        this.students = students;
        this.otps = otps;
        this.refreshTokens = refreshTokens;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.emailService = emailService;
        this.rateLimiter = rateLimiter;
        this.otpExpirationMinutes = otpExpirationMinutes;
    }

    @Transactional
    public AuthResponse login(LoginRequest request, String ip) {
        rateLimiter.check("login:" + ip, 10, 60);
        validatePasswordBytes(request.password());
        UserAccount account = users.findByEmailIgnoreCase(normalize(request.email())).orElse(null);
        if (account == null || !account.isEnabled() || !passwordEncoder.matches(request.password(), account.getPasswordHash())) {
            log.warn("Authentication attempt failed");
            throw ApiException.unauthorized("Invalid credentials");
        }
        log.info("Authentication succeeded");
        return token(account);
    }

    @Transactional
    public void register(RegisterRequest request, String ip) {
        rateLimiter.check("register:" + ip, 5, 3600);
        validatePasswordBytes(request.password());
        if (request.role() != null && !request.role().isBlank()
                && !request.role().equalsIgnoreCase("student")) {
            throw ApiException.forbidden("Public registration is only available to students");
        }
        String email = normalize(request.email());
        if (users.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("Email already registered");
        }
        UserAccount account = users.save(new UserAccount(email, passwordEncoder.encode(request.password()), Role.STUDENT));
        Student student = students.findByEmailIgnoreCase(email)
                .orElseGet(() -> new Student(request.studentName().trim(), email));
        student.updateProfile(request.studentName().trim(), email, student.getRoomNumber(), student.getSharing(),
                student.getCollegeName(), student.getCourseNameAndYear(), student.getMobileNumber(),
                student.getParentMobileNumber(), student.getAddress(), student.getAmountPerMonth(),
                student.getStartingDate());
        student.setAccount(account);
        students.save(student);
        log.info("Student self-registration completed");
    }

    @Transactional
    public AuthResponse refresh(String rawRefreshToken) {
        String tokenHash = hashRefreshToken(rawRefreshToken);
        RefreshToken refreshToken = refreshTokens.findActiveForUpdate(tokenHash)
                .orElseThrow(() -> ApiException.unauthorized("Invalid or expired refresh token"));
        if (refreshToken.getExpiresAt().isBefore(Instant.now()) || !refreshToken.getUser().isEnabled()) {
            refreshToken.revoke();
            throw ApiException.unauthorized("Invalid or expired refresh token");
        }
        UserAccount account = refreshToken.getUser();
        refreshToken.revoke();
        return token(account);
    }

    @Transactional
    public void logout(UserAccount account) {
        account.invalidateTokens();
        users.save(account);
        refreshTokens.findAllByUser_IdAndRevokedFalse(account.getId()).forEach(RefreshToken::revoke);
    }

    @Transactional
    public String sendOtp(String rawEmail, String ip) {
        rateLimiter.check("otp:" + ip, 5, 600);
        String email = normalize(rawEmail);
        if (!users.existsByEmailIgnoreCase(email)) {
            return "If the account exists, a password reset code has been sent.";
        }
        String otp = String.format("%06d", secureRandom.nextInt(1_000_000));
        PasswordResetOtp resetOtp = new PasswordResetOtp(email,
                passwordEncoder.encode(otp), Instant.now().plus(otpExpirationMinutes, ChronoUnit.MINUTES));
        otps.save(resetOtp);
        emailService.sendOtp(email, otp);
        return "If the account exists, a password reset code has been sent.";
    }

    @Transactional
    public void verifyOtp(VerifyOtpRequest request, String ip) {
        rateLimiter.check("verify-otp:" + ip, 10, 600);
        PasswordResetOtp otp = otps.findById(normalize(request.email()))
                .orElseThrow(() -> ApiException.badRequest("Invalid or expired OTP"));
        if (otp.getExpiresAt().isBefore(Instant.now()) || !passwordEncoder.matches(request.otp(), otp.getOtpHash())) {
            otps.delete(otp);
            throw ApiException.badRequest("Invalid or expired OTP");
        }
        otp.markVerified();
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request, String ip) {
        rateLimiter.check("reset-password:" + ip, 5, 600);
        validatePasswordBytes(request.password());
        String email = normalize(request.email());
        PasswordResetOtp otp = otps.findById(email)
                .orElseThrow(() -> ApiException.badRequest("Verify a valid OTP before resetting the password"));
        if (!otp.isVerified() || otp.getExpiresAt().isBefore(Instant.now())) {
            throw ApiException.badRequest("Verify a valid OTP before resetting the password");
        }
        UserAccount account = users.findByEmailIgnoreCase(email)
                .orElseThrow(() -> ApiException.badRequest("Invalid password reset request"));
        account.setPasswordHash(passwordEncoder.encode(request.password()));
        account.invalidateTokens();
        refreshTokens.findAllByUser_IdAndRevokedFalse(account.getId()).forEach(RefreshToken::revoke);
        otps.delete(otp);
    }

    private AuthResponse token(UserAccount account) {
        byte[] bytes = new byte[48];
        secureRandom.nextBytes(bytes);
        String rawRefreshToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        String hash = hashRefreshToken(rawRefreshToken);
        refreshTokens.save(new RefreshToken(hash, account, Instant.now().plus(30, ChronoUnit.DAYS)));
        return new AuthResponse(jwtService.issue(account), rawRefreshToken, "Bearer",
                account.getRole().name(), account.getEmail());
    }

    private String hashRefreshToken(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (java.security.NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }

    private void validatePasswordBytes(String password) {
        if (password.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72) {
            throw ApiException.badRequest("Password must be at most 72 UTF-8 bytes");
        }
    }

    private String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
