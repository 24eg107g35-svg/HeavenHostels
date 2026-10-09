package com.example.backend.security;

import com.example.backend.domain.UserAccount;
import com.example.backend.repository.UserAccountRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    private static final AntPathMatcher PATH_MATCHER = new AntPathMatcher();
    private static final java.util.List<String> PUBLIC_PATHS = java.util.List.of(
            "/api/auth/login", "/api/auth/register", "/api/auth/refresh", "/api/auth/send-otp",
            "/api/auth/verify-otp", "/api/auth/reset-password",
            "/api/students/studentlogin", "/api/students/studentregistration");
    private final JwtService jwtService;
    private final UserAccountRepository users;

    public JwtAuthenticationFilter(JwtService jwtService, UserAccountRepository users) {
        this.jwtService = jwtService;
        this.users = users;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return "OPTIONS".equalsIgnoreCase(request.getMethod())
                || PUBLIC_PATHS.stream().anyMatch(path -> PATH_MATCHER.match(path, request.getServletPath()));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String authorization = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authorization != null && authorization.startsWith("Bearer ")) {
            try {
                JwtService.TokenClaims claims = jwtService.validate(authorization.substring(7));
                UserAccount account = users.findByEmailIgnoreCase(claims.email()).orElseThrow();
                if (!account.isEnabled() || account.getTokenVersion() != claims.version()
                        || !account.getRole().name().equals(claims.role())) {
                    throw new IllegalArgumentException();
                }
                AuthenticatedUser principal = AuthenticatedUser.from(account);
                SecurityContextHolder.getContext().setAuthentication(
                        new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
            } catch (Exception exception) {
                SecurityContextHolder.clearContext();
                log.warn("Bearer token authentication failed for {} {}", request.getMethod(), request.getRequestURI());
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.getWriter().write("{\"timestamp\":\"" + java.time.Instant.now()
                        + "\",\"status\":401,\"error\":\"Unauthorized\","
                        + "\"message\":\"Invalid or expired bearer token\"}");
                return;
            }
        }
        chain.doFilter(request, response);
    }
}
