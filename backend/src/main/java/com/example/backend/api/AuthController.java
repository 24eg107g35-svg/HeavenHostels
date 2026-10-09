package com.example.backend.api;

import com.example.backend.api.dto.ApiDtos.AuthResponse;
import com.example.backend.api.dto.ApiDtos.LoginRequest;
import com.example.backend.api.dto.ApiDtos.OtpRequest;
import com.example.backend.api.dto.ApiDtos.RefreshRequest;
import com.example.backend.api.dto.ApiDtos.RegisterRequest;
import com.example.backend.api.dto.ApiDtos.ResetPasswordRequest;
import com.example.backend.api.dto.ApiDtos.UserResponse;
import com.example.backend.api.dto.ApiDtos.VerifyOtpRequest;
import com.example.backend.domain.UserAccount;
import com.example.backend.repository.UserAccountRepository;
import com.example.backend.security.AuthenticatedUser;
import com.example.backend.service.AuthService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService auth;
    private final UserAccountRepository users;

    public AuthController(AuthService auth, UserAccountRepository users) {
        this.auth = auth;
        this.users = users;
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request, HttpServletRequest servletRequest) {
        return auth.login(request, servletRequest.getRemoteAddr());
    }

    @PostMapping("/register")
    @org.springframework.web.bind.annotation.ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> register(@Valid @RequestBody RegisterRequest request, HttpServletRequest servletRequest) {
        auth.register(request, servletRequest.getRemoteAddr());
        return Map.of("success", true, "message", "Registration successful");
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshRequest request) {
        return auth.refresh(request.refreshToken());
    }

    @PostMapping("/logout")
    @SecurityRequirement(name = "bearerAuth")
    public Map<String, String> logout(@AuthenticationPrincipal AuthenticatedUser principal) {
        auth.logout(account(principal));
        return Map.of("message", "Logged out");
    }

    @GetMapping("/me")
    @SecurityRequirement(name = "bearerAuth")
    public UserResponse me(@AuthenticationPrincipal AuthenticatedUser principal) {
        return new UserResponse(principal.id(), principal.email(), principal.role());
    }

    @PostMapping("/send-otp")
    public Map<String, String> sendOtp(@Valid @RequestBody OtpRequest request, HttpServletRequest servletRequest) {
        return Map.of("message", auth.sendOtp(request.email(), servletRequest.getRemoteAddr()));
    }

    @PostMapping("/verify-otp")
    public Map<String, String> verifyOtp(@Valid @RequestBody VerifyOtpRequest request,
                                         HttpServletRequest servletRequest) {
        auth.verifyOtp(request, servletRequest.getRemoteAddr());
        return Map.of("message", "OTP verified successfully");
    }

    @PostMapping("/reset-password")
    public Map<String, String> resetPassword(@Valid @RequestBody ResetPasswordRequest request,
                                             HttpServletRequest servletRequest) {
        auth.resetPassword(request, servletRequest.getRemoteAddr());
        return Map.of("message", "Password reset successfully");
    }

    private UserAccount account(AuthenticatedUser principal) {
        return users.findById(principal.id()).orElseThrow(() ->
                com.example.backend.service.ApiException.unauthorized("Account no longer exists"));
    }
}
