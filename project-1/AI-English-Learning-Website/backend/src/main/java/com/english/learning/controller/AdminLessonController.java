package com.english.learning.controller;

import com.english.learning.service.LessonService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AdminLessonController {

    private final LessonService lessonService;

    @GetMapping("/days")
    public ResponseEntity<?> getAllDays() {
        return ResponseEntity.ok(lessonService.getAllDays());
    }

    @PostMapping("/days/add-next")
    public ResponseEntity<?> addNextDay() {
        return ResponseEntity.ok(lessonService.addNextDay());
    }

    @DeleteMapping("/days/{id}")
    public ResponseEntity<?> deleteDay(@PathVariable Long id) {
        lessonService.deleteDayById(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/lessons/day/{dayNumber}")
    public ResponseEntity<Map<String, Object>> updateDayLesson(
            @PathVariable int dayNumber,
            @RequestBody Map<String, Object> body) {
        Map<String, Object> result = lessonService.saveOrUpdateDay(dayNumber, body);
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/lessons/day/{dayNumber}")
    public ResponseEntity<Map<String, Object>> deleteDayLesson(@PathVariable int dayNumber) {
        lessonService.deleteDay(dayNumber);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/days/{dayId}/sections")
    public ResponseEntity<?> getDaySections(@PathVariable String dayId) {
        try {
            return ResponseEntity.ok(lessonService.getSectionsByDay(dayId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/days/{dayId}/sections")
    public ResponseEntity<?> addDaySection(
            @PathVariable String dayId,
            @RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.ok(lessonService.addSectionToDay(dayId, body));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping({"/lessons/sections/{sectionId}", "/sections/{sectionId}"})
    public ResponseEntity<Map<String, Object>> updateSection(
            @PathVariable String sectionId,
            @RequestBody Map<String, Object> body) {
        try {
            Long id = Long.parseLong(sectionId.replace("sec_", ""));
            Map<String, Object> result = lessonService.updateSection(id, body);
            return ResponseEntity.ok(result);
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid section ID"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping({"/lessons/sections/{sectionId}", "/sections/{sectionId}"})
    public ResponseEntity<Map<String, Object>> deleteSection(@PathVariable String sectionId) {
        try {
            Long id = Long.parseLong(sectionId.replace("sec_", ""));
            lessonService.deleteSection(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid section ID"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/days/{dayId}/content/preview")
    public ResponseEntity<?> previewContent(
            @PathVariable String dayId,
            @RequestBody Map<String, Object> body) {
        try {
            String rawContent = (String) body.get("rawContent");
            return ResponseEntity.ok(lessonService.previewImportContent(dayId, rawContent));
        } catch (IllegalArgumentException e) {
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
            }
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/days/{dayId}/content/import")
    public ResponseEntity<?> importContent(
            @PathVariable String dayId,
            @RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.ok(lessonService.importContent(dayId, body));
        } catch (IllegalArgumentException e) {
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
            }
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/lessons/day/{dayNumber}")
    public ResponseEntity<?> getAdminLessonByDay(@PathVariable int dayNumber) {
        return ResponseEntity.ok(lessonService.getDayByNumber(dayNumber));
    }

    @PutMapping("/lessons/day/{dayNumber}/content")
    public ResponseEntity<?> updateAdminLessonContent(@PathVariable int dayNumber, @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(lessonService.saveOrUpdateDay(dayNumber, body));
    }

    @PostMapping("/lessons/day/{dayNumber}/replace")
    public ResponseEntity<?> replaceAdminLessonContent(@PathVariable int dayNumber, @RequestBody Map<String, Object> body) {
        body.put("mode", "replace");
        return ResponseEntity.ok(lessonService.saveOrUpdateDay(dayNumber, body));
    }

    @DeleteMapping("/lessons/day/{dayNumber}/content")
    public ResponseEntity<?> removeAdminLessonContent(@PathVariable int dayNumber) {
        lessonService.deleteDay(dayNumber);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
