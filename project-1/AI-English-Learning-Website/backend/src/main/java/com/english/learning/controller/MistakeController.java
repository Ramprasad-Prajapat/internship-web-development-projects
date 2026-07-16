package com.english.learning.controller;

import com.english.learning.model.User;
import com.english.learning.model.UserMistake;
import com.english.learning.repository.UserMistakeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class MistakeController {

    private final UserMistakeRepository userMistakeRepository;

    @GetMapping("/mistakes")
    public ResponseEntity<List<Map<String, Object>>> getMistakes(@AuthenticationPrincipal User user) {
        List<UserMistake> mistakes = userMistakeRepository.findByUserOrderByCreatedAtDesc(user);
        List<Map<String, Object>> result = new ArrayList<>();
        for (UserMistake mistake : mistakes) {
            result.add(mistakeToDto(mistake));
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/mistakes")
    public ResponseEntity<Map<String, Object>> addMistake(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        UserMistake mistake = UserMistake.builder().user(user).build();

        if (body.containsKey("originalText")) {
            mistake.setOriginalText((String) body.get("originalText"));
        } else if (body.containsKey("wrongSentence")) {
            mistake.setOriginalText((String) body.get("wrongSentence"));
        }

        if (body.containsKey("correctedText")) {
            mistake.setCorrectedText((String) body.get("correctedText"));
        } else if (body.containsKey("correctSentence")) {
            mistake.setCorrectedText((String) body.get("correctSentence"));
        }

        if (body.containsKey("explanation")) {
            mistake.setExplanation((String) body.get("explanation"));
        } else if (body.containsKey("simpleRule")) {
            mistake.setExplanation((String) body.get("simpleRule"));
        }

        if (body.containsKey("category")) mistake.setCategory((String) body.get("category"));

        mistake = userMistakeRepository.save(mistake);
        return ResponseEntity.ok(mistakeToDto(mistake));
    }

    @PatchMapping("/mistakes/{id}/fixed")
    public ResponseEntity<Map<String, Object>> markFixed(@AuthenticationPrincipal User user, @PathVariable String id) {
        return updateFixedStatus(user, id, true);
    }

    @PutMapping("/mistakes/{id}/mark-fixed")
    public ResponseEntity<Map<String, Object>> markFixedPut(@AuthenticationPrincipal User user, @PathVariable String id) {
        return updateFixedStatus(user, id, true);
    }

    private ResponseEntity<Map<String, Object>> updateFixedStatus(User user, String id, boolean fixed) {
        try {
            Long mistakeId = Long.parseLong(id.replace("mst_", ""));
            Optional<UserMistake> mistakeOpt = userMistakeRepository.findById(mistakeId);
            if (mistakeOpt.isPresent()) {
                UserMistake mistake = mistakeOpt.get();
                if (mistake.getUser().getId().equals(user.getId())) {
                    mistake.setFixed(fixed);
                    mistake = userMistakeRepository.save(mistake);
                    return ResponseEntity.ok(mistakeToDto(mistake));
                } else {
                    return ResponseEntity.status(403).build();
                }
            }
        } catch (NumberFormatException ignored) {}
        return ResponseEntity.ok(Map.of("id", id, "fixed", fixed));
    }

    @DeleteMapping("/mistakes/{id}")
    public ResponseEntity<Map<String, Object>> deleteMistake(@AuthenticationPrincipal User user, @PathVariable String id) {
        try {
            Long mistakeId = Long.parseLong(id.replace("mst_", ""));
            userMistakeRepository.findById(mistakeId).ifPresent(mistake -> {
                if (mistake.getUser().getId().equals(user.getId())) {
                    userMistakeRepository.delete(mistake);
                }
            });
        } catch (NumberFormatException ignored) {}
        return ResponseEntity.ok(Map.of("success", true));
    }

    private Map<String, Object> mistakeToDto(UserMistake mistake) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", mistake.getId().toString());
        dto.put("originalText", mistake.getOriginalText());
        dto.put("correctedText", mistake.getCorrectedText());
        dto.put("explanation", mistake.getExplanation());
        
        // Mapped frontend compatibility properties
        dto.put("wrongSentence", mistake.getOriginalText());
        dto.put("correctSentence", mistake.getCorrectedText());
        dto.put("simpleRule", mistake.getExplanation());
        
        dto.put("category", mistake.getCategory());
        dto.put("fixed", mistake.getFixed());
        dto.put("createdAt", mistake.getCreatedAt() != null ? mistake.getCreatedAt().toString() : "");
        return dto;
    }
}
