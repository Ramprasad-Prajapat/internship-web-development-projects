package com.english.learning.controller;

import com.english.learning.model.DailyProgress;
import com.english.learning.model.SectionProgress;
import com.english.learning.model.User;
import com.english.learning.repository.DailyProgressRepository;
import com.english.learning.repository.SectionProgressRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/progress")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ProgressController {

    private final DailyProgressRepository dailyProgressRepository;
    private final SectionProgressRepository sectionProgressRepository;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllProgress(@AuthenticationPrincipal User user) {
        List<DailyProgress> progressList = dailyProgressRepository.findByUser(user);
        List<Map<String, Object>> result = new ArrayList<>();
        for (DailyProgress dp : progressList) {
            result.add(Map.of("dayNumber", dp.getDayNumber(), "completed", dp.getCompleted()));
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> updateGeneralProgress(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        if (body.containsKey("dayNumber")) {
            Integer dayNumber = (Integer) body.get("dayNumber");
            Boolean completed = (Boolean) body.getOrDefault("completed", true);
            DailyProgress dp = dailyProgressRepository.findByUserAndDayNumber(user, dayNumber)
                    .orElse(DailyProgress.builder().user(user).dayNumber(dayNumber).build());
            dp.setCompleted(completed);
            dailyProgressRepository.save(dp);
        }
        return ResponseEntity.ok(body);
    }

    @GetMapping("/today")
    public ResponseEntity<Map<String, Object>> getTodayProgress(@AuthenticationPrincipal User user) {
        // Mocking 'today' as Day 1 for demo purposes if nothing exists
        return ResponseEntity.ok(Map.of("dayNumber", 1, "completed", false));
    }

    @GetMapping("/day/{dayNumber}")
    public ResponseEntity<Map<String, Object>> getDayProgress(@AuthenticationPrincipal User user, @PathVariable Integer dayNumber) {
        DailyProgress dp = dailyProgressRepository.findByUserAndDayNumber(user, dayNumber).orElse(null);
        if (dp == null) {
            return ResponseEntity.ok(Map.of("dayNumber", dayNumber, "completed", false));
        }
        return ResponseEntity.ok(Map.of("dayNumber", dayNumber, "completed", dp.getCompleted()));
    }

    @GetMapping("/section/{sectionId}")
    public ResponseEntity<Map<String, Object>> getSectionProgress(@AuthenticationPrincipal User user, @PathVariable String sectionId) {
        SectionProgress sp = sectionProgressRepository.findByUserAndSectionId(user, sectionId).orElse(null);
        if (sp == null) {
            return ResponseEntity.ok(Map.of("sectionId", sectionId, "completed", false));
        }
        return ResponseEntity.ok(Map.of("sectionId", sectionId, "completed", sp.getCompleted(), "score", sp.getScore() != null ? sp.getScore() : 0));
    }

    @PostMapping("/section/{sectionId}")
    public ResponseEntity<Map<String, Object>> updateSectionProgress(
            @AuthenticationPrincipal User user,
            @PathVariable String sectionId,
            @RequestBody Map<String, Object> body) {
        
        SectionProgress sp = sectionProgressRepository.findByUserAndSectionId(user, sectionId)
                .orElse(SectionProgress.builder().user(user).sectionId(sectionId).build());

        sp.setCompleted((Boolean) body.getOrDefault("completed", true));
        if (body.containsKey("score")) {
            sp.setScore((Integer) body.get("score"));
        }
        sp = sectionProgressRepository.save(sp);

        return ResponseEntity.ok(Map.of("sectionId", sectionId, "completed", sp.getCompleted(), "score", sp.getScore() != null ? sp.getScore() : 0));
    }
}
