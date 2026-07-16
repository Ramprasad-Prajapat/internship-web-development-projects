package com.english.learning.controller;

import com.english.learning.model.HomeworkSubmission;
import com.english.learning.model.User;
import com.english.learning.repository.HomeworkSubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class HomeworkController {

    private final HomeworkSubmissionRepository homeworkSubmissionRepository;

    @GetMapping("/homework/{sourceId}")
    public ResponseEntity<Map<String, Object>> getHomework(@AuthenticationPrincipal User user, @PathVariable String sourceId) {
        HomeworkSubmission sub = homeworkSubmissionRepository.findByUserAndHomeworkId(user, sourceId).orElse(null);
        if (sub != null) {
            boolean isChecked = "passed".equals(sub.getStatus());
            boolean isSaved = "saved".equals(sub.getStatus()) || isChecked;
            boolean isWritten = sub.getContent() != null && !sub.getContent().trim().isEmpty();

            Map<String, Object> response = new HashMap<>();
            response.put("id", sub.getId().toString());
            response.put("sourceId", sourceId);
            response.put("content", sub.getContent() != null ? sub.getContent() : "");
            response.put("status", sub.getStatus() != null ? sub.getStatus() : "pending");
            response.put("score", sub.getScore() != null ? sub.getScore() : 0);
            response.put("feedback", sub.getFeedback() != null ? sub.getFeedback() : "");
            response.put("submitted", true);
            response.put("homeworkChecked", isChecked);
            response.put("homeworkWritten", isWritten);
            response.put("homeworkSaved", isSaved);
            response.put("homeworkAnswerText", sub.getContent() != null ? sub.getContent() : "");
            return ResponseEntity.ok(response);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("id", "hw_" + sourceId);
        response.put("sourceId", sourceId);
        response.put("content", "");
        response.put("status", "pending");
        response.put("score", 0);
        response.put("feedback", "");
        response.put("submitted", false);
        response.put("homeworkChecked", false);
        response.put("homeworkWritten", false);
        response.put("homeworkSaved", false);
        response.put("homeworkAnswerText", "");
        return ResponseEntity.ok(response);
    }

    @PutMapping("/homework/{sourceId}")
    public ResponseEntity<Map<String, Object>> saveHomework(@AuthenticationPrincipal User user, @PathVariable String sourceId, @RequestBody Map<String, Object> body) {
        HomeworkSubmission sub = homeworkSubmissionRepository.findByUserAndHomeworkId(user, sourceId)
            .orElse(HomeworkSubmission.builder().user(user).homeworkId(sourceId).build());

        if (body.containsKey("content")) {
            sub.setContent((String) body.get("content"));
        } else if (body.containsKey("answerText")) {
            sub.setContent((String) body.get("answerText"));
        } else if (body.containsKey("homeworkAnswerText")) {
            sub.setContent((String) body.get("homeworkAnswerText"));
        }

        if (body.containsKey("homework_checked") && (Boolean) body.get("homework_checked")) {
            sub.setStatus("passed");
        } else if (body.containsKey("homework_saved") && (Boolean) body.get("homework_saved")) {
            sub.setStatus("saved");
        } else {
            sub.setStatus("saved");
        }

        sub = homeworkSubmissionRepository.save(sub);

        boolean isChecked = "passed".equals(sub.getStatus());
        boolean isSaved = "saved".equals(sub.getStatus()) || isChecked;
        boolean isWritten = sub.getContent() != null && !sub.getContent().trim().isEmpty();

        Map<String, Object> response = new HashMap<>();
        response.put("id", sub.getId().toString());
        response.put("sourceId", sourceId);
        response.put("content", sub.getContent() != null ? sub.getContent() : "");
        response.put("status", sub.getStatus() != null ? sub.getStatus() : "pending");
        response.put("score", sub.getScore() != null ? sub.getScore() : 0);
        response.put("feedback", sub.getFeedback() != null ? sub.getFeedback() : "");
        response.put("submitted", true);
        response.put("homeworkChecked", isChecked);
        response.put("homeworkWritten", isWritten);
        response.put("homeworkSaved", isSaved);
        response.put("homeworkAnswerText", sub.getContent() != null ? sub.getContent() : "");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/homework/{sourceId}/check")
    public ResponseEntity<Map<String, Object>> checkHomework(@AuthenticationPrincipal User user, @PathVariable String sourceId, @RequestBody Map<String, Object> body) {
        HomeworkSubmission sub = homeworkSubmissionRepository.findByUserAndHomeworkId(user, sourceId)
            .orElse(HomeworkSubmission.builder().user(user).homeworkId(sourceId).build());

        if (body.containsKey("content")) {
            sub.setContent((String) body.get("content"));
        } else if (body.containsKey("answerText")) {
            sub.setContent((String) body.get("answerText"));
        } else if (body.containsKey("homeworkAnswerText")) {
            sub.setContent((String) body.get("homeworkAnswerText"));
        }

        sub.setStatus("passed");
        sub.setScore(90);
        sub.setFeedback("Excellent homework assignment response!");
        sub = homeworkSubmissionRepository.save(sub);

        return ResponseEntity.ok(Map.of(
            "status", sub.getStatus(),
            "score", sub.getScore(),
            "feedback", sub.getFeedback()
        ));
    }

    @GetMapping("/homework/submissions")
    public ResponseEntity<List<Map<String, Object>>> getAllSubmissions(@AuthenticationPrincipal User user) {
        List<HomeworkSubmission> subs = homeworkSubmissionRepository.findByUserOrderBySubmittedAtDesc(user);
        List<Map<String, Object>> result = new ArrayList<>();
        for (HomeworkSubmission sub : subs) {
            result.add(Map.of(
                "id", sub.getId().toString(),
                "sourceId", sub.getHomeworkId(),
                "content", sub.getContent() != null ? sub.getContent() : "",
                "status", sub.getStatus() != null ? sub.getStatus() : "",
                "score", sub.getScore() != null ? sub.getScore() : 0
            ));
        }
        return ResponseEntity.ok(result);
    }
}
