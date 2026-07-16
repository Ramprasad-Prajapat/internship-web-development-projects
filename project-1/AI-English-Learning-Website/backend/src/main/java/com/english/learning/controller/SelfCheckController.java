package com.english.learning.controller;

import com.english.learning.model.SelfCheckSubmission;
import com.english.learning.model.User;
import com.english.learning.repository.SelfCheckSubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/self-check")

@RequiredArgsConstructor
public class SelfCheckController {

    private final SelfCheckSubmissionRepository selfCheckSubmissionRepository;

    @GetMapping("/submissions")
    public ResponseEntity<List<Map<String, Object>>> getSubmissions(@AuthenticationPrincipal User user) {
        List<SelfCheckSubmission> subs = selfCheckSubmissionRepository.findByUserOrderBySubmittedAtDesc(user);
        List<Map<String, Object>> result = new ArrayList<>();
        for (SelfCheckSubmission sub : subs) {
            result.add(Map.of(
                "id", sub.getId().toString(),
                "checkId", sub.getCheckId(),
                "answers", sub.getAnswers() != null ? sub.getAnswers() : "",
                "score", sub.getScore() != null ? sub.getScore() : 0,
                "submittedAt", sub.getSubmittedAt().toString()
            ));
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/submissions")
    public ResponseEntity<Map<String, Object>> addSubmission(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        String checkId = (String) body.getOrDefault("checkId", "default_check");
        Integer score = (Integer) body.getOrDefault("score", 0);
        String answers = body.containsKey("answers") ? body.get("answers").toString() : "";

        SelfCheckSubmission sub = SelfCheckSubmission.builder()
                .user(user)
                .checkId(checkId)
                .score(score)
                .answers(answers)
                .build();
                
        sub = selfCheckSubmissionRepository.save(sub);

        return ResponseEntity.ok(Map.of(
            "id", sub.getId().toString(),
            "checkId", sub.getCheckId(),
            "score", sub.getScore(),
            "submittedAt", sub.getSubmittedAt().toString()
        ));
    }
}
