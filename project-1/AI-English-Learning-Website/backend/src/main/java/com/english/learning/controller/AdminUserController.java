package com.english.learning.controller;

import com.english.learning.model.Role;
import com.english.learning.model.User;
import com.english.learning.repository.UserRepository;
import com.english.learning.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/users")

@RequiredArgsConstructor
public class AdminUserController {

    private final UserRepository userRepository;
    private final AuthService authService;

    // List all users (admin view)
    @GetMapping
    public ResponseEntity<?> listUsers(
            @AuthenticationPrincipal User admin,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) Boolean enabled) {
        // Ensure caller is admin
        if (admin.getRole() != Role.ADMIN) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }
        List<Map<String, Object>> users = userRepository.findAll()
                .stream()
                .filter(u -> {
                    // search by name or email
                    if (search != null && !(u.getName().contains(search) || u.getEmail().contains(search))) {
                        return false;
                    }
                    // filter by role
                    if (role != null && u.getRole() != role) {
                        return false;
                    }
                    // filter by enabled status; treat null as enabled
                    if (enabled != null) {
                        boolean userEnabled = !Boolean.FALSE.equals(u.getEnabled());
                        if (userEnabled != enabled) {
                            return false;
                        }
                    }
                    return true;
                })
                .map(authService::adminUserDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    // Enable or disable a user
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> setEnabled(@AuthenticationPrincipal User admin,
                                         @PathVariable Long id,
                                         @RequestBody Map<String, Object> body) {
        if (admin.getRole() != Role.ADMIN) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }
        Boolean enabled = (Boolean) body.get("enabled");
        // Treat null as true per requirements
        if (enabled == null) {
            enabled = true;
        }
        // Self-disable protection
        if (admin.getId().equals(id) && Boolean.FALSE.equals(enabled)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Admins cannot disable their own account"));
        }
        User target = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        // Last enabled admin protection
        if (target.getRole() == Role.ADMIN && Boolean.FALSE.equals(enabled)) {
            long enabledAdminCount = userRepository.findAll().stream()
                    .filter(u -> u.getRole() == Role.ADMIN)
                    .filter(u -> !Boolean.FALSE.equals(u.getEnabled()))
                    .count();
            if (enabledAdminCount <= 1) {
                return ResponseEntity.badRequest().body(Map.of("error", "Cannot disable the last enabled admin"));
            }
        }
        target.setEnabled(enabled);
        userRepository.save(target);
        return ResponseEntity.ok(Map.of("message", "User enabled status updated", "user", authService.adminUserDto(target)));
    }
}
