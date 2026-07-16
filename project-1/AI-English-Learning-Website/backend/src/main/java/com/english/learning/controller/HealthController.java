package com.english.learning.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
public class HealthController {

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> getRoot() {
        return ResponseEntity.ok(Map.of(
            "service", "ai-english-learning-backend",
            "status", "UP",
            "health", "/api/health"
        ));
    }

    @GetMapping("/api/health")
    public ResponseEntity<Map<String, Object>> getHealth() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "service", "ai-english-learning-backend",
            "database", "ai_english",
            "timestamp", System.currentTimeMillis()
        ));
    }
}
