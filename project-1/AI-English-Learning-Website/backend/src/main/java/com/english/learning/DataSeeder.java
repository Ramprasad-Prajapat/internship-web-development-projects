package com.english.learning;

import com.english.learning.model.LessonDay;
import com.english.learning.model.LessonSection;
import com.english.learning.model.Role;
import com.english.learning.model.User;
import com.english.learning.repository.LessonDayRepository;
import com.english.learning.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * DataSeeder — runs once on application startup.
 * Uses check-before-insert logic so it is safe to restart without duplicating data.
 *
 * Seeded entities (real JPA / MySQL):
 *   - Admin user    : admin@example.com / password123  (role = ADMIN)
 *   - Demo learner  : demo@example.com  / password123  (role = USER)
 *   - Day 1 lesson  : "Day 1: Greetings & Introductions" (published = true)
 *   - Day 1 sections: Vocabulary, Grammar, Speaking Practice (published = true)
 *
 * Not seeded (in-memory only — not real DB entities):
 *   - Notebook notes  → NOT SUPPORTED YET (NotebookController uses in-memory List)
 *   - Mistakes        → NOT SUPPORTED YET (MistakeController uses in-memory List)
 *   - Progress        → NOT SUPPORTED YET (ReportController uses in-memory List)
 *   - Practice history→ NOT SUPPORTED YET (PracticeController uses in-memory List)
 */
@Component
@RequiredArgsConstructor
public class DataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository userRepository;
    private final LessonDayRepository lessonDayRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seedUsers();
        seedDay1Lesson();
        log.info("[DataSeeder] Seed complete.");
    }

    // ─── Users ────────────────────────────────────────────────────────────────

    private void seedUsers() {
        seedUser("Admin User", "admin@english.com", "Admin123", Role.ADMIN);
        seedUser("Demo Learner", "demo@example.com", "password123", Role.USER);
    }

    private void seedUser(String name, String email, String rawPassword, Role role) {
        if (userRepository.existsByEmail(email)) {
            log.info("[DataSeeder] User already exists, skipping: {}", email);
            return;
        }
        User user = User.builder()
                .name(name)
                .email(email)
                .password(passwordEncoder.encode(rawPassword))
                .role(role)
                .level("BEGINNER")
                .build();
        userRepository.save(user);
        log.info("[DataSeeder] Seeded user: {} ({})", email, role);
    }

    // ─── Day 1 Lesson ─────────────────────────────────────────────────────────

    private void seedDay1Lesson() {
        lessonDayRepository.findByDayNumber(1).ifPresent(day -> {
            if (day.getSections() == null || day.getSections().size() != 12) {
                log.info("[DataSeeder] Day 1 has invalid section count, deleting to re-seed.");
                lessonDayRepository.delete(day);
            }
        });

        // If Day 1 already exists, do nothing – preserves any admin edits.
        if (lessonDayRepository.findByDayNumber(1).isPresent()) {
            log.info("[DataSeeder] Day 1 lesson already exists, skipping.");
            return;
        }

        // Create default Day 1 with 12 published sections.
        List<LessonSection> sections = new java.util.ArrayList<>();

        String[][] defaultSections = {
            {"Time Table", "time-table"},
            {"Vocabulary", "vocabulary"},
            {"Grammar", "grammar"},
            {"Examples / Make Sentences", "examples"},
            {"Questions & Answers", "qa"},
            {"Speaking Drill", "speaking"},
            {"Mini Conversation", "conversation"},
            {"Pronunciation Drill", "pronunciation"},
            {"Common Mistakes", "mistakes"},
            {"Homework", "homework"},
            {"Self Check", "self-check"},
            {"Day Preview", "preview"}
        };

        for (int i = 0; i < defaultSections.length; i++) {
            LessonSection sec = LessonSection.builder()
                .title(defaultSections[i][0])
                .category(defaultSections[i][1])
                .content("Default content for " + defaultSections[i][0] + ".")
                .sectionOrder(i)
                .build();
            sections.add(sec);
        }

        LessonDay day1 = LessonDay.builder()
                .dayNumber(1)
                .title("Day 1: Daily Routine")
                .rawContent("Base lesson for Day 1 – Daily Routine – provides the core structure for new learners.")
                .isPublished(true)
                .sections(sections)
                .build();

        // Back‑reference each section to its parent day.
        for (LessonSection sec : sections) {
            sec.setLessonDay(day1);
        }

        lessonDayRepository.save(day1);
        log.info("[DataSeeder] Seeded default Day 1 with 12 sections.");
    }
}
