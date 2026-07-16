package com.english.learning.controller;

import com.english.learning.model.PracticeHistory;
import com.english.learning.model.User;
import com.english.learning.repository.PracticeHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api")

@RequiredArgsConstructor
public class PracticeController {

    private final PracticeHistoryRepository practiceHistoryRepository;

    @PostMapping("/practice/check")
    public ResponseEntity<Map<String, Object>> checkPractice(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> payload) {
        String sourceType = (String) payload.getOrDefault("sourceType", "DAILY_LESSON");
        String sourceId = (String) payload.getOrDefault("sourceId", "1");
        
        PracticeHistory history = PracticeHistory.builder()
                .user(user)
                .activityType(sourceType)
                .sourceId(sourceId)
                .score(85)
                .details(payload.toString())
                .build();
                
        history = practiceHistoryRepository.save(history);

        Map<String, Object> response = new HashMap<>();
        response.put("id", history.getId().toString());
        response.put("sourceType", sourceType);
        response.put("sourceId", sourceId);
        response.put("questionText", payload.getOrDefault("questionText", ""));
        response.put("answerText", payload.getOrDefault("answerText", ""));
        response.put("status", "passed");
        response.put("score", history.getScore());
        response.put("feedback", "Great effort! Your sentence structure looks clean.");
        response.put("createdAt", history.getCreatedAt().toString());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/practice/history")
    public ResponseEntity<List<Map<String, Object>>> getPracticeHistory(@AuthenticationPrincipal User user) {
        List<PracticeHistory> records = practiceHistoryRepository.findByUserOrderByCreatedAtDesc(user);
        List<Map<String, Object>> result = new ArrayList<>();
        
        for (PracticeHistory ph : records) {
            Map<String, Object> dto = new HashMap<>();
            dto.put("id", ph.getId().toString());
            dto.put("sourceType", ph.getActivityType());
            dto.put("sourceId", ph.getSourceId());
            dto.put("score", ph.getScore());
            dto.put("createdAt", ph.getCreatedAt().toString());
            dto.put("status", "passed");
            result.add(dto);
        }
        return ResponseEntity.ok(result);
    }
}
