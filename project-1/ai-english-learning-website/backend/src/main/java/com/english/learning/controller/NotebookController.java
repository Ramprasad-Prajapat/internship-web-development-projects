package com.english.learning.controller;

import com.english.learning.model.User;
import com.english.learning.model.UserNote;
import com.english.learning.repository.UserNoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api")

@RequiredArgsConstructor
public class NotebookController {

    private final UserNoteRepository userNoteRepository;

    @GetMapping({"/notebook", "/notes"})
    public ResponseEntity<List<Map<String, Object>>> listNotes(@AuthenticationPrincipal User user) {
        List<UserNote> notes = userNoteRepository.findByUserOrderByUpdatedAtDesc(user);
        List<Map<String, Object>> result = new ArrayList<>();
        for (UserNote note : notes) {
            result.add(noteToDto(note));
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping({"/notebook", "/notes"})
    public ResponseEntity<Map<String, Object>> saveNote(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        String idStr = (String) body.get("id");
        UserNote note;
        
        if (idStr != null && idStr.startsWith("note_")) {
            // New note from frontend
            note = UserNote.builder().user(user).build();
        } else if (idStr != null) {
            // Update existing
            try {
                Long id = Long.parseLong(idStr);
                note = userNoteRepository.findById(id).orElse(UserNote.builder().user(user).build());
                if (note.getId() != null && !note.getUser().getId().equals(user.getId())) {
                    return ResponseEntity.status(403).build();
                }
            } catch (NumberFormatException e) {
                note = UserNote.builder().user(user).build();
            }
        } else {
            note = UserNote.builder().user(user).build();
        }

        if (body.containsKey("title")) note.setTitle((String) body.get("title"));
        if (body.containsKey("content")) note.setContent((String) body.get("content"));
        if (body.containsKey("tags")) note.setTags((String) body.get("tags"));

        note = userNoteRepository.save(note);
        return ResponseEntity.ok(noteToDto(note));
    }

    @PutMapping({"/notebook/{id}", "/notes/{id}"})
    public ResponseEntity<Map<String, Object>> updateNote(@AuthenticationPrincipal User user, @PathVariable Long id, @RequestBody Map<String, Object> body) {
        Optional<UserNote> noteOpt = userNoteRepository.findById(id);
        if (noteOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Note not found"));
        }
        UserNote note = noteOpt.get();
        if (!note.getUser().getId().equals(user.getId())) return ResponseEntity.status(403).build();
        
        if (body.containsKey("title")) note.setTitle((String) body.get("title"));
        if (body.containsKey("content")) note.setContent((String) body.get("content"));
        if (body.containsKey("tags")) note.setTags((String) body.get("tags"));

        note = userNoteRepository.save(note);
        return ResponseEntity.ok(noteToDto(note));
    }

    @DeleteMapping({"/notebook/{id}", "/notes/{id}"})
    public ResponseEntity<Map<String, Object>> deleteNote(@AuthenticationPrincipal User user, @PathVariable String id) {
        try {
            Long noteId = Long.parseLong(id.replace("note_", "")); // Handle mock ID format if passed
            userNoteRepository.findById(noteId).ifPresent(note -> {
                if (note.getUser().getId().equals(user.getId())) {
                    userNoteRepository.delete(note);
                }
            });
        } catch (NumberFormatException ignored) {
            // Ignore format errors from mock UUIDs
        }
        return ResponseEntity.ok(Map.of("success", true));
    }

    private Map<String, Object> noteToDto(UserNote note) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", note.getId().toString()); // Frontend expects string IDs usually
        dto.put("title", note.getTitle());
        dto.put("content", note.getContent());
        dto.put("tags", note.getTags());
        dto.put("createdAt", note.getCreatedAt() != null ? note.getCreatedAt().toString() : "");
        dto.put("updatedAt", note.getUpdatedAt() != null ? note.getUpdatedAt().toString() : "");
        return dto;
    }
}
