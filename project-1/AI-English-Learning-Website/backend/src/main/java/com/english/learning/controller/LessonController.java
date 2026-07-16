package com.english.learning.controller;

import com.english.learning.service.LessonService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")

@RequiredArgsConstructor
public class LessonController {

    private final LessonService lessonService;

    @GetMapping("/lessons")
    public ResponseEntity<List<Map<String, Object>>> getLessons() {
        return ResponseEntity.ok(lessonService.getPublishedDaysForUser());
    }

    @GetMapping("/lessons/days")
    public ResponseEntity<List<Map<String, Object>>> getLessonDays() {
        return ResponseEntity.ok(lessonService.getPublishedDaysForUser());
    }

    @GetMapping("/lessons/day/{dayNumber}")
    public ResponseEntity<Map<String, Object>> getLessonByDay(@PathVariable int dayNumber) {
        return ResponseEntity.ok(lessonService.getDayByNumberForUser(dayNumber));
    }

    @GetMapping("/lessons/days/{dayNumber}")
    public ResponseEntity<Map<String, Object>> getLessonDayByNumber(@PathVariable int dayNumber) {
        return ResponseEntity.ok(lessonService.getDayByNumberForUser(dayNumber));
    }

    @GetMapping("/lessons/days/{dayNumber}/sections")
    public ResponseEntity<?> getDaySectionsByNumber(@PathVariable int dayNumber) {
        Map<String, Object> day = lessonService.getDayByNumberForUser(dayNumber);
        return ResponseEntity.ok(day.getOrDefault("sections", List.of()));
    }

    // New generic routes supporting dayId or identifier
    @GetMapping("/lessons/{dayId}")
    public ResponseEntity<?> getLessonDayByIdentifier(@PathVariable String dayId) {
        try {
            return ResponseEntity.ok(lessonService.getDayByIdentifierForUser(dayId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/lessons/{dayId}/sections")
    public ResponseEntity<?> getLessonSectionsByIdentifier(@PathVariable String dayId) {
        try {
            Map<String, Object> day = lessonService.getDayByIdentifierForUser(dayId);
            return ResponseEntity.ok(day.getOrDefault("sections", List.of()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }
}
