package com.english.learning.controller;

import com.english.learning.service.LessonService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/settings")

@RequiredArgsConstructor
public class AdminSettingsController {

    private final LessonService lessonService;

    @GetMapping("/backup/export")
    public ResponseEntity<?> exportBackup() {
        return ResponseEntity.ok(lessonService.exportBackup());
    }

    @PostMapping("/backup/import")
    public ResponseEntity<?> importBackup(@RequestBody Map<String, Object> body) {
        try {
            lessonService.importBackup(body);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/backup/reset")
    public ResponseEntity<?> resetDatabase() {
        try {
            lessonService.resetDatabase();
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}
