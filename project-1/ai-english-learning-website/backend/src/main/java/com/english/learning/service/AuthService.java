package com.english.learning.service;

import com.english.learning.model.Role;
import com.english.learning.model.User;
import com.english.learning.model.PasswordResetToken;
import com.english.learning.repository.UserRepository;
import com.english.learning.repository.PasswordResetTokenRepository;
import com.english.learning.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final PasswordResetTokenRepository tokenRepository;

    public Map<String, Object> register(Map<String, Object> payload) {
        String email = (String) payload.get("email");
        String name = (String) payload.getOrDefault("name", "Learner");
        String rawPassword = (String) payload.getOrDefault("password", "password123");
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email is already registered");
        }
        Role role = Role.USER;
        User user = User.builder()
                .name(name)
                .email(email)
                .password(passwordEncoder.encode(rawPassword))
                .role(role)
                .level("BEGINNER")
                .build();
        user = userRepository.save(user);
        String token = jwtService.generateToken(user.getEmail(), user.getRole().name());
        return Map.of("token", token, "user", userToDto(user));
    }

    public Map<String, Object> login(Map<String, Object> payload) {
        String email = (String) payload.get("email");
        String rawPassword = (String) payload.get("password");
        if (email == null || rawPassword == null) {
            throw new IllegalArgumentException("Email and password are required");
        }
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));
        if (Boolean.FALSE.equals(user.getEnabled())) {
            throw new IllegalArgumentException("Account is disabled");
        }
        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new IllegalArgumentException("Invalid credentials");
        }
        String token = jwtService.generateToken(user.getEmail(), user.getRole().name());
        return Map.of("token", token, "user", userToDto(user));
    }

    public Map<String, Object> userToDto(User user) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", user.getId());
        dto.put("name", user.getName());
        dto.put("email", user.getEmail());
        dto.put("level", user.getLevel());
        dto.put("role", user.getRole().name());
        return dto;
    }

    // Admin‑safe DTO that includes enabled flag
    public Map<String, Object> adminUserDto(User user) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", user.getId());
        dto.put("name", user.getName());
        dto.put("email", user.getEmail());
        dto.put("role", user.getRole().name());
        // treat null as enabled
        dto.put("enabled", user.getEnabled() == null ? true : user.getEnabled());
        dto.put("level", user.getLevel());
        return dto;
    }

    public User updateProfile(User currentUser, Map<String, Object> updates) {
        if (updates.containsKey("name")) {
            currentUser.setName((String) updates.get("name"));
        }
        if (updates.containsKey("level")) {
            currentUser.setLevel((String) updates.get("level"));
        }
        return userRepository.save(currentUser);
    }

    public Map<String, Object> changePassword(User user, Map<String, Object> payload) {
        String currentPassword = (String) payload.get("currentPassword");
        String newPassword = (String) payload.get("newPassword");
        String confirmPassword = (String) payload.get("confirmPassword");
        if (currentPassword == null || newPassword == null || confirmPassword == null) {
            throw new IllegalArgumentException("All password fields are required");
        }
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
        if (!newPassword.equals(confirmPassword)) {
            throw new IllegalArgumentException("New password and confirm password do not match");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        return Map.of("message", "Password changed successfully");
    }

    public Map<String, Object> forgotPassword(String email) {
        // Generic response to avoid user enumeration
        Optional<User> optionalUser = userRepository.findByEmail(email);
        optionalUser.ifPresent(user -> {
            String token = generateResetToken();
            String hashed = hashToken(token);
            PasswordResetToken resetToken = PasswordResetToken.builder()
                    .token(hashed)
                    .expiryDate(LocalDateTime.now().plusHours(1))
                    .user(user)
                    .build();
            tokenRepository.save(resetToken);
            // Local dev logging only
            System.out.println("Password reset token for " + email + ": " + token);
        });
        return Map.of("message", "If an account with that email exists, a password reset link has been sent.");
    }

    public Map<String, Object> resetPassword(String token, Map<String, Object> payload) {
        String newPassword = (String) payload.get("newPassword");
        String confirmPassword = (String) payload.get("confirmPassword");
        if (newPassword == null || confirmPassword == null) {
            throw new IllegalArgumentException("Password fields are required");
        }
        if (!newPassword.equals(confirmPassword)) {
            throw new IllegalArgumentException("Passwords do not match");
        }
        String hashedToken = hashToken(token);
        PasswordResetToken resetToken = tokenRepository.findByToken(hashedToken)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired token"));
        if (resetToken.isUsed() || resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Invalid or expired token");
        }
        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        resetToken.setUsed(true);
        tokenRepository.save(resetToken);
        return Map.of("message", "Password has been reset successfully");
    }

    private String generateResetToken() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
    }
}
