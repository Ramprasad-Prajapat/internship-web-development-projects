package com.english.learning.controller;

import com.english.learning.model.PracticeHistory;
import com.english.learning.model.User;
import com.english.learning.repository.DailyProgressRepository;
import com.english.learning.repository.PracticeHistoryRepository;
import com.english.learning.repository.UserMistakeRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ReportController {

    private final DailyProgressRepository dailyProgressRepository;
    private final PracticeHistoryRepository practiceHistoryRepository;
    private final UserMistakeRepository userMistakeRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @GetMapping({"/report/summary", "/reports/summary"})
    public ResponseEntity<Map<String, Object>> getReportSummary(@AuthenticationPrincipal User user) {
        long completedLessons = dailyProgressRepository.countByUserAndCompletedTrue(user);
        long fixedMistakes = userMistakeRepository.countByUserAndFixed(user, true);
        long totalMistakes = userMistakeRepository.countByUserAndFixed(user, false) + fixedMistakes;
        
        return ResponseEntity.ok(Map.of(
            "overallScore", 85,
            "completedLessons", completedLessons,
            "streak", completedLessons > 0 ? 1 : 0,
            "writingScore", 80,
            "speakingScore", 75,
            "readingScore", 90,
            "mistakesFixed", fixedMistakes,
            "totalMistakes", totalMistakes
        ));
    }

    @GetMapping({"/report/weekly", "/reports/weekly"})
    public ResponseEntity<List<Map<String, Object>>> getWeeklyReport(@AuthenticationPrincipal User user) {
        // Dummy weekly data
        return ResponseEntity.ok(List.of(
            Map.of("day", "Mon", "score", 80),
            Map.of("day", "Tue", "score", 90),
            Map.of("day", "Wed", "score", 75)
        ));
    }

    @GetMapping({"/report/mistakes", "/reports/mistakes"})
    public ResponseEntity<Map<String, Object>> getMistakesReport(@AuthenticationPrincipal User user) {
        long fixed = userMistakeRepository.countByUserAndFixed(user, true);
        long pending = userMistakeRepository.countByUserAndFixed(user, false);
        return ResponseEntity.ok(Map.of(
            "fixed", fixed,
            "pending", pending
        ));
    }

    @GetMapping({"/history", "/reports/history"})
    public ResponseEntity<List<Map<String, Object>>> getHistory(@AuthenticationPrincipal User user) {
        var records = practiceHistoryRepository.findTop10ByUserOrderByCreatedAtDesc(user);
        List<Map<String, Object>> result = new ArrayList<>();
        for (var rec : records) {
            result.add(recordToDto(rec));
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping({"/history", "/reports/history"})
    public ResponseEntity<Map<String, Object>> addHistoryEntry(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        String type = (String) body.getOrDefault("type", "UNKNOWN");
        String title = (String) body.getOrDefault("title", "");
        String description = (String) body.getOrDefault("description", "");
        String lessonId = body.get("lessonId") != null ? body.get("lessonId").toString() : null;
        Integer dayNumber = body.get("dayNumber") != null ? ((Number) body.get("dayNumber")).intValue() : null;
        String sourceType = (String) body.getOrDefault("sourceType", null);
        String sourceId = body.get("sourceId") != null ? body.get("sourceId").toString() : null;
        Integer score = body.get("score") != null ? ((Number) body.get("score")).intValue() : null;

        // Serialize all details to JSON string
        Map<String, Object> detailsMap = new java.util.HashMap<>();
        detailsMap.put("title", title);
        detailsMap.put("description", description);
        detailsMap.put("lessonId", lessonId != null ? lessonId : "");
        detailsMap.put("dayNumber", dayNumber != null ? dayNumber : -1);
        detailsMap.put("sourceType", sourceType != null ? sourceType : "");
        detailsMap.put("sourceId", sourceId != null ? sourceId : "");

        String detailsStr = "";
        try {
            detailsStr = objectMapper.writeValueAsString(detailsMap);
        } catch (Exception ignored) {}

        PracticeHistory record = PracticeHistory.builder()
            .user(user)
            .activityType(type)
            .sourceId(sourceId != null ? sourceId : (lessonId != null ? lessonId : ""))
            .score(score)
            .details(detailsStr)
            .build();

        record = practiceHistoryRepository.save(record);
        return ResponseEntity.ok(recordToDto(record));
    }

    private Map<String, Object> recordToDto(PracticeHistory rec) {
        DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
        
        Map<String, Object> dto = new java.util.HashMap<>();
        dto.put("id", rec.getId().toString());
        dto.put("type", rec.getActivityType());
        dto.put("activityType", rec.getActivityType());
        dto.put("score", rec.getScore() != null ? rec.getScore() : 0);
        dto.put("createdAt", rec.getCreatedAt() != null ? rec.getCreatedAt().format(formatter) : "");
        dto.put("timestamp", rec.getCreatedAt() != null ? rec.getCreatedAt().format(formatter) : "");
        
        // Defaults
        dto.put("title", "Practice Session");
        dto.put("description", "Completed practice session with score " + (rec.getScore() != null ? rec.getScore() : 0));
        dto.put("lessonId", null);
        dto.put("dayNumber", null);
        dto.put("sourceType", rec.getActivityType());
        dto.put("sourceId", rec.getSourceId());

        if (rec.getDetails() != null && !rec.getDetails().isEmpty() && rec.getDetails().startsWith("{")) {
            try {
                Map<String, Object> parsed = objectMapper.readValue(rec.getDetails(), Map.class);
                if (parsed.containsKey("title") && parsed.get("title") != null && !parsed.get("title").toString().isEmpty()) {
                    dto.put("title", parsed.get("title"));
                }
                if (parsed.containsKey("description") && parsed.get("description") != null) {
                    dto.put("description", parsed.get("description"));
                }
                if (parsed.containsKey("lessonId") && parsed.get("lessonId") != null && !parsed.get("lessonId").toString().isEmpty()) {
                    dto.put("lessonId", parsed.get("lessonId"));
                }
                if (parsed.containsKey("dayNumber") && parsed.get("dayNumber") != null) {
                    int day = ((Number) parsed.get("dayNumber")).intValue();
                    if (day != -1) {
                        dto.put("dayNumber", day);
                    }
                }
                if (parsed.containsKey("sourceType") && parsed.get("sourceType") != null && !parsed.get("sourceType").toString().isEmpty()) {
                    dto.put("sourceType", parsed.get("sourceType"));
                }
                if (parsed.containsKey("sourceId") && parsed.get("sourceId") != null && !parsed.get("sourceId").toString().isEmpty()) {
                    dto.put("sourceId", parsed.get("sourceId"));
                }
            } catch (Exception ignored) {}
        }
        
        return dto;
    }
}
