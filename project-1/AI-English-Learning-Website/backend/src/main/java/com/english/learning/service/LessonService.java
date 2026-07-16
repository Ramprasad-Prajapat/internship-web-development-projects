package com.english.learning.service;

import com.english.learning.model.LessonDay;
import com.english.learning.model.LessonSection;
import com.english.learning.repository.LessonDayRepository;
import com.english.learning.repository.LessonSectionRepository;
import com.english.learning.utils.ContentParser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class LessonService {

    private final LessonDayRepository lessonDayRepository;
    private final LessonSectionRepository lessonSectionRepository;
    public List<Map<String, Object>> getPublishedDays() {
        List<LessonDay> days = lessonDayRepository.findByIsPublishedTrueOrderByDayNumberAsc();
        List<Map<String, Object>> result = new ArrayList<>();
        for (LessonDay day : days) {
            result.add(lessonDayToDto(day, false));
        }
        return result;
    }

    public List<Map<String, Object>> getPublishedDaysForUser() {
        List<LessonDay> days = lessonDayRepository.findByIsPublishedTrueOrderByDayNumberAsc();
        List<Map<String, Object>> result = new ArrayList<>();
        for (LessonDay day : days) {
            result.add(lessonDayToDto(day, true));
        }
        return result;
    }

    public LessonDay findDayByIdentifier(String dayIdentifier) {
        if (dayIdentifier == null) return null;
        Integer dayNum = null;
        Long dayId = null;
        try {
            String clean = dayIdentifier.replace("day_", "");
            dayNum = Integer.parseInt(clean);
        } catch (NumberFormatException e) {
            // ignore
        }
        try {
            dayId = Long.parseLong(dayIdentifier);
        } catch (NumberFormatException e) {
            // ignore
        }

        Optional<LessonDay> dayOpt = Optional.empty();
        if (dayNum != null) {
            dayOpt = lessonDayRepository.findByDayNumber(dayNum);
        }
        if (dayOpt.isEmpty() && dayId != null) {
            dayOpt = lessonDayRepository.findById(dayId);
        }
        return dayOpt.orElse(null);
    }

    public Map<String, Object> getDayByNumber(Integer dayNumber) {
        Optional<LessonDay> dayOpt = lessonDayRepository.findByDayNumber(dayNumber);
        if (dayOpt.isPresent()) {
            return lessonDayToDto(dayOpt.get(), false);
        }
        return Map.of(
                "id", "day_" + dayNumber,
                "dayNumber", dayNumber,
                "title", "Day " + dayNumber + " Practice Plan",
                "rawContent", "Day " + dayNumber + " raw text exercises and notes.",
                "tags", List.of("grammar", "vocabulary"),
                "sections", List.of(
                        Map.of("id", "sec_" + dayNumber + "_1", "title", "Vocabulary", "category", "vocabulary", "content", "Study words"),
                        Map.of("id", "sec_" + dayNumber + "_2", "title", "Grammar", "category", "grammar", "content", "Study grammar rules")
                )
        );
    }

    public Map<String, Object> getDayByNumberForUser(Integer dayNumber) {
        Optional<LessonDay> dayOpt = lessonDayRepository.findByDayNumber(dayNumber);
        if (dayOpt.isPresent() && Boolean.TRUE.equals(dayOpt.get().getIsPublished())) {
            return lessonDayToDto(dayOpt.get(), true);
        }
        Map<String, Object> fallback = new HashMap<>();
        fallback.put("id", -1L);
        fallback.put("dayNumber", dayNumber);
        fallback.put("title", "Day " + dayNumber + " (Unavailable)");
        fallback.put("rawContent", "");
        fallback.put("sections", Collections.emptyList());
        fallback.put("tags", Collections.emptyList());
        fallback.put("isPublished", false);
        return fallback;
    }

    public Map<String, Object> getDayByIdentifierForUser(String dayIdentifier) {
        LessonDay day = findDayByIdentifier(dayIdentifier);
        if (day != null && Boolean.TRUE.equals(day.getIsPublished())) {
            return lessonDayToDto(day, true);
        }
        Integer dayNum = 1;
        try {
            dayNum = Integer.parseInt(dayIdentifier.replace("day_", ""));
        } catch (Exception e) {}
        Map<String, Object> fallback = new HashMap<>();
        fallback.put("id", -1L);
        fallback.put("dayNumber", dayNum);
        fallback.put("title", "Day " + dayNum + " (Unavailable)");
        fallback.put("rawContent", "");
        fallback.put("sections", Collections.emptyList());
        fallback.put("tags", Collections.emptyList());
        fallback.put("isPublished", false);
        return fallback;
    }


    @Transactional
    public Map<String, Object> saveOrUpdateDay(Integer dayNumber, Map<String, Object> body) {
        LessonDay day = lessonDayRepository.findByDayNumber(dayNumber)
                .orElse(LessonDay.builder().dayNumber(dayNumber).title("Day " + dayNumber + " Practice").build());

        if (body.containsKey("title")) {
            day.setTitle((String) body.get("title"));
        }
        if (body.containsKey("rawContent")) {
            day.setRawContent((String) body.get("rawContent"));
        }

        String mode = (String) body.getOrDefault("mode", "replace");
        if ("replace".equals(mode)) {
            day.getSections().clear();
        }

        if (body.containsKey("sections") && body.get("sections") instanceof List<?> sectionList) {
            for (Object obj : sectionList) {
                if (obj instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> secMap = (Map<String, Object>) obj;
                    String heading = (String) secMap.get("heading");
                    String title = secMap.containsKey("title") ? (String) secMap.get("title") : heading;
                    String content = (String) secMap.get("body");
                    if (content == null) {
                        content = (String) secMap.get("content");
                    }
                    String category = secMap.containsKey("category") ? (String) secMap.get("category") : "general";

                    if ("merge".equals(mode)) {
                        LessonSection existingSec = day.getSections().stream()
                                .filter(s -> s.getTitle().equalsIgnoreCase(title))
                                .findFirst()
                                .orElse(null);
                        if (existingSec != null) {
                            existingSec.setContent(content);
                            existingSec.setCategory(category);
                            continue;
                        }
                    }

                    LessonSection sec = LessonSection.builder()
                            .title(title)
                            .content(content)
                            .category(category)
                            .lessonDay(day)
                            .build();
                    day.getSections().add(sec);
                }
            }
        }

        day.setUpdatedAt(java.time.LocalDateTime.now());
        day = lessonDayRepository.save(day);
        return lessonDayToDto(day);
    }

    @Transactional
    public Map<String, Object> updateSection(Long sectionId, Map<String, Object> body) {
        LessonSection sec = lessonSectionRepository.findById(sectionId)
                .orElseThrow(() -> new IllegalArgumentException("Section not found"));

        if (body.containsKey("heading")) {
            sec.setTitle((String) body.get("heading"));
        } else if (body.containsKey("title")) {
            sec.setTitle((String) body.get("title"));
        }

        if (body.containsKey("body")) {
            sec.setContent((String) body.get("body"));
        } else if (body.containsKey("content")) {
            sec.setContent((String) body.get("content"));
        }

        if (body.containsKey("category")) {
            sec.setCategory((String) body.get("category"));
        }

        if (body.containsKey("status")) {
            sec.setStatus((String) body.get("status"));
        }

        if (body.containsKey("order")) {
            sec.setSectionOrder(((Number) body.get("order")).intValue());
        }

        sec = lessonSectionRepository.save(sec);
        return Map.of(
                "id", "sec_" + sec.getId(),
                "title", sec.getTitle(),
                "content", sec.getContent(),
                "category", sec.getCategory(),
                "status", sec.getStatus(),
                "order", sec.getSectionOrder()
        );
    }

    @Transactional
    public void deleteSection(Long sectionId) {
        lessonSectionRepository.deleteById(sectionId);
    }

    @Transactional
    public void deleteDay(Integer dayNumber) {
        lessonDayRepository.findByDayNumber(dayNumber).ifPresent(lessonDayRepository::delete);
    }

    public Map<String, Object> lessonDayToDto(LessonDay day) {
        return lessonDayToDto(day, false);
    }

    public Map<String, Object> lessonDayToDto(LessonDay day, boolean forUser) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", day.getId());
        dto.put("dayNumber", day.getDayNumber());
        dto.put("title", day.getTitle());
        dto.put("rawContent", day.getRawContent() != null ? day.getRawContent() : "");
        dto.put("tags", List.of("grammar", "vocabulary"));
        dto.put("updatedAt", day.getUpdatedAt() != null ? day.getUpdatedAt().toString() : "");
        
        List<Map<String, Object>> sectionDtos = new ArrayList<>();
        if (day.getSections() != null) {
            List<LessonSection> sortedSections = new ArrayList<>(day.getSections());
            sortedSections.sort(Comparator.comparing(s -> s.getSectionOrder() != null ? s.getSectionOrder() : 0));
            
            for (LessonSection sec : sortedSections) {
                String status = sec.getStatus() != null ? sec.getStatus() : "Published";
                if (forUser && "Draft".equalsIgnoreCase(status)) {
                    continue; // Hide draft sections from learners
                }
                
                Map<String, Object> secMap = new HashMap<>();
                secMap.put("id", "sec_" + sec.getId());
                secMap.put("title", sec.getTitle() != null ? sec.getTitle() : "");
                secMap.put("heading", sec.getTitle() != null ? sec.getTitle() : "");
                secMap.put("category", sec.getCategory() != null ? sec.getCategory() : "general");
                secMap.put("content", sec.getContent() != null ? sec.getContent() : "");
                secMap.put("body", sec.getContent() != null ? sec.getContent() : "");
                secMap.put("status", status);
                secMap.put("order", sec.getSectionOrder() != null ? sec.getSectionOrder() : 0);
                
                sectionDtos.add(secMap);
            }
        }
        dto.put("sections", sectionDtos);
        return dto;
    }

    public List<Map<String, Object>> getAllDays() {
        List<LessonDay> days = lessonDayRepository.findAll();
        days.sort(Comparator.comparing(LessonDay::getDayNumber));
        List<Map<String, Object>> result = new ArrayList<>();
        for (LessonDay day : days) {
            result.add(lessonDayToDto(day));
        }
        return result;
    }

    @Transactional
    public Map<String, Object> addNextDay() {
        List<LessonDay> days = lessonDayRepository.findAll();
        int nextDayNum = 1;
        if (!days.isEmpty()) {
            nextDayNum = days.stream().mapToInt(LessonDay::getDayNumber).max().orElse(0) + 1;
        }
        LessonDay day = LessonDay.builder()
                .dayNumber(nextDayNum)
                .title("Day " + nextDayNum)
                .isPublished(true)
                .build();
        day = lessonDayRepository.save(day);
        return lessonDayToDto(day);
    }

    @Transactional
    public void deleteDayById(Long id) {
        lessonDayRepository.deleteById(id);
    }

    public List<Map<String, Object>> getSectionsByDay(String dayIdentifier) {
        LessonDay day = findDayByIdentifier(dayIdentifier);
        if (day == null) {
            throw new IllegalArgumentException("Lesson Day not found for identifier: " + dayIdentifier);
        }
        Map<String, Object> dto = lessonDayToDto(day, false);
        return (List<Map<String, Object>>) dto.getOrDefault("sections", List.of());
    }

    @Transactional
    public Map<String, Object> addSectionToDay(String dayIdentifier, Map<String, Object> body) {
        LessonDay day = findDayByIdentifier(dayIdentifier);
        if (day == null) {
            throw new IllegalArgumentException("Lesson Day not found for identifier: " + dayIdentifier);
        }

        String title = (String) body.get("title");
        if (title == null) {
            title = (String) body.get("heading");
        }
        String content = (String) body.get("content");
        if (content == null) {
            content = (String) body.get("body");
        }
        String category = (String) body.getOrDefault("category", "general");
        String status = (String) body.getOrDefault("status", "Published");

        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("Section title/heading is required");
        }
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("Section content/body is required");
        }

        int nextOrder = 1;
        if (day.getSections() != null && !day.getSections().isEmpty()) {
            nextOrder = day.getSections().stream()
                    .mapToInt(s -> s.getSectionOrder() != null ? s.getSectionOrder() : 0)
                    .max().orElse(0) + 1;
        }

        LessonSection sec = LessonSection.builder()
                .title(title)
                .content(content)
                .category(category)
                .status(status)
                .sectionOrder(nextOrder)
                .lessonDay(day)
                .build();
        sec = lessonSectionRepository.save(sec);

        return Map.of(
                "id", "sec_" + sec.getId(),
                "title", sec.getTitle(),
                "content", sec.getContent(),
                "category", sec.getCategory(),
                "status", sec.getStatus(),
                "order", sec.getSectionOrder()
        );
    }

    public List<Map<String, Object>> previewImportContent(String dayIdentifier, String rawContent) {
        if (rawContent == null || rawContent.trim().isEmpty()) {
            throw new IllegalArgumentException("rawContent is required");
        }
        return ContentParser.parse(rawContent);
    }

    @Transactional
    public Map<String, Object> importContent(String dayIdentifier, Map<String, Object> body) {
        String title = (String) body.get("title");
        String rawContent = (String) body.get("rawContent");
        String mode = (String) body.getOrDefault("mode", "replace");

        if (title == null || title.trim().isEmpty()) {
            throw new IllegalArgumentException("title is required");
        }
        if (rawContent == null || rawContent.trim().isEmpty()) {
            throw new IllegalArgumentException("rawContent is required");
        }

        Integer dayNum = null;
        Long dayId = null;
        try {
            String clean = dayIdentifier.replace("day_", "");
            dayNum = Integer.parseInt(clean);
        } catch (NumberFormatException e) {
            // ignore
        }
        try {
            dayId = Long.parseLong(dayIdentifier);
        } catch (NumberFormatException e) {
            // ignore
        }

        Optional<LessonDay> dayOpt = Optional.empty();
        if (dayNum != null) {
            dayOpt = lessonDayRepository.findByDayNumber(dayNum);
        }
        if (dayOpt.isEmpty() && dayId != null) {
            dayOpt = lessonDayRepository.findById(dayId);
        }

        if (dayOpt.isEmpty()) {
            throw new IllegalArgumentException("Lesson Day not found for identifier: " + dayIdentifier);
        }

        LessonDay day = dayOpt.get();
        day.setTitle(title);
        day.setRawContent(rawContent);

        List<Map<String, Object>> parsed = new ArrayList<>();
        if (body.containsKey("sections") && body.get("sections") instanceof List<?> secList) {
            for (Object obj : secList) {
                if (obj instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> item = (Map<String, Object>) obj;
                    parsed.add(item);
                }
            }
        } else {
            parsed = ContentParser.parse(rawContent);
        }

        if ("replace".equals(mode)) {
            day.getSections().clear();
        }

        for (Map<String, Object> secMap : parsed) {
            String heading = (String) secMap.get("title");
            if (heading == null) {
                heading = (String) secMap.get("heading");
            }
            String content = (String) secMap.get("content");
            if (content == null) {
                content = (String) secMap.get("body");
            }
            String category = (String) secMap.getOrDefault("category", "general");
            String status = (String) secMap.getOrDefault("status", "Published");

            if (heading == null || heading.trim().isEmpty()) {
                heading = "Section Heading";
            }
            if (content == null || content.trim().isEmpty()) {
                content = "Section Content";
            }

            LessonSection sec = LessonSection.builder()
                    .title(heading.trim())
                    .content(content.trim())
                    .category(category)
                    .status(status)
                    .lessonDay(day)
                    .build();
            day.getSections().add(sec);
        }

        day.setUpdatedAt(java.time.LocalDateTime.now());
        day = lessonDayRepository.save(day);
        return lessonDayToDto(day);
    }

    public Map<String, Object> exportBackup() {
        Map<String, Object> backup = new HashMap<>();
        backup.put("version", "1.0");
        backup.put("exportedAt", java.time.Instant.now().toString());

        List<LessonDay> days = lessonDayRepository.findAll();
        List<Map<String, Object>> lessonsList = new ArrayList<>();

        for (LessonDay day : days) {
            Map<String, Object> dayMap = new HashMap<>();
            dayMap.put("id", day.getId());
            dayMap.put("dayNumber", day.getDayNumber());
            dayMap.put("title", day.getTitle());
            dayMap.put("rawContent", day.getRawContent() != null ? day.getRawContent() : "");

            List<Map<String, Object>> sectionsList = new ArrayList<>();
            if (day.getSections() != null) {
                int sectionNumber = 1;
                for (LessonSection sec : day.getSections()) {
                    Map<String, Object> secMap = new HashMap<>();
                    secMap.put("sectionNumber", sectionNumber++);
                    secMap.put("title", sec.getTitle() != null ? sec.getTitle() : "");
                    secMap.put("content", sec.getContent() != null ? sec.getContent() : "");
                    secMap.put("category", sec.getCategory() != null ? sec.getCategory() : "general");
                    secMap.put("status", "PUBLISHED");
                    sectionsList.add(secMap);
                }
            }
            dayMap.put("sections", sectionsList);
            lessonsList.add(dayMap);
        }

        backup.put("lessons", lessonsList);
        backup.put("meta", Map.of("totalDays", days.size()));
        return backup;
    }

    @Transactional
    public void importBackup(Map<String, Object> backup) {
        if (backup == null) {
            throw new IllegalArgumentException("Backup data is empty");
        }
        String version = (String) backup.get("version");
        if (!"1.0".equals(version)) {
            throw new IllegalArgumentException("Invalid backup version: " + version);
        }
        List<?> lessons = (List<?>) backup.get("lessons");
        if (lessons == null || lessons.isEmpty()) {
            throw new IllegalArgumentException("Backup lessons array is empty");
        }        lessonDayRepository.deleteAll();
        lessonDayRepository.flush();

        for (Object item : lessons) {
            if (!(item instanceof Map)) continue;
            @SuppressWarnings("unchecked")
            Map<String, Object> dayMap = (Map<String, Object>) item;

            Number dayNumberNum = (Number) dayMap.get("dayNumber");
            if (dayNumberNum == null) {
                throw new IllegalArgumentException("dayNumber is required for all imported lessons");
            }
            Integer dayNumber = dayNumberNum.intValue();
            String title = (String) dayMap.get("title");
            if (title == null || title.trim().isEmpty()) {
                title = "Day " + dayNumber;
            }
            String rawContent = (String) dayMap.get("rawContent");

            LessonDay day = LessonDay.builder()
                    .dayNumber(dayNumber)
                    .title(title)
                    .rawContent(rawContent)
                    .isPublished(true)
                    .sections(new ArrayList<>())
                    .build();
            List<?> sections = (List<?>) dayMap.get("sections");
            if (sections != null) {
                int sectionOrder = 1;
                for (Object secObj : sections) {
                    if (!(secObj instanceof Map)) continue;
                    @SuppressWarnings("unchecked")
                    Map<String, Object> secMap = (Map<String, Object>) secObj;

                    String secTitle = (String) secMap.get("title");
                    String secContent = (String) secMap.get("content");
                    String secCategory = (String) secMap.getOrDefault("category", "general");
                    String status = (String) secMap.getOrDefault("status", "Published");
                    Number sectionNumVal = (Number) secMap.get("sectionNumber");
                    int order = (sectionNumVal != null) ? sectionNumVal.intValue() : sectionOrder++;

                    if (secTitle == null || secTitle.trim().isEmpty()) {
                        secTitle = "Section Title";
                    }
                    if (secContent == null || secContent.trim().isEmpty()) {
                        secContent = "Section Content";
                    }

                    LessonSection section = LessonSection.builder()
                            .title(secTitle.trim())
                            .content(secContent.trim())
                            .category(secCategory)
                            .status(status)
                            .sectionOrder(order)
                            .lessonDay(day)
                            .build();

                    day.getSections().add(section);
                }
            }
            lessonDayRepository.save(day);
        }
    }

    @Transactional
    public void resetDatabase() {
        lessonDayRepository.deleteAll();
        lessonDayRepository.flush();

        LessonSection vocabularySection = LessonSection.builder()
                .title("Vocabulary: Common Greetings")
                .category("vocabulary")
                .content(
                    "Learn these essential greeting words:\n" +
                    "• Hello / Hi — used to greet someone\n" +
                    "• Good morning — greeting used before noon\n" +
                    "• Good afternoon — greeting used after noon\n" +
                    "• Good evening — greeting used in the evening\n" +
                    "• Goodbye / Bye — used when leaving\n" +
                    "• Nice to meet you — used when meeting someone for the first time\n\n" +
                    "Practice: Say each greeting aloud 3 times."
                )
                .build();

        LessonSection grammarSection = LessonSection.builder()
                .title("Grammar: Introducing Yourself")
                .category("grammar")
                .content(
                    "Use these sentence patterns to introduce yourself:\n\n" +
                    "Pattern 1: My name is [name].\n" +
                    "  → My name is Rampr.\n\n" +
                    "Pattern 2: I am [name].\n" +
                    "  → I am a student.\n\n" +
                    "Pattern 3: I am from [place].\n" +
                    "  → I am from India.\n\n" +
                    "Pattern 4: I work as a [job].\n" +
                    "  → I work as an engineer.\n\n" +
                    "Fill in the blanks with your own information and practice."
                )
                .build();

        LessonSection speakingSection = LessonSection.builder()
                .title("Speaking Practice: Sample Dialogue")
                .category("speaking")
                .content(
                    "Read this dialogue aloud with expression:\n\n" +
                    "A: Hello! My name is Alex. Nice to meet you.\n" +
                    "B: Hi Alex! I'm Sam. Nice to meet you too.\n" +
                    "A: Where are you from, Sam?\n" +
                    "B: I'm from Mumbai. And you?\n" +
                    "A: I'm from Delhi. What do you do?\n" +
                    "B: I'm a software engineer. How about you?\n" +
                    "A: I'm a student. It was great meeting you!\n" +
                    "B: You too! Goodbye!\n\n" +
                    "Tip: Record yourself reading the dialogue and listen back to check your pronunciation."
                )
                .build();

        LessonDay day1 = LessonDay.builder()
                .dayNumber(1)
                .title("Day 1: Greetings & Introductions")
                .rawContent(
                    "Welcome to Day 1 of your English learning journey!\n\n" +
                    "Today you will learn:\n" +
                    "1. Common greetings and farewells\n" +
                    "2. How to introduce yourself using simple sentence patterns\n" +
                    "3. A sample real-world conversation dialogue\n\n" +
                    "Complete all three sections and practice speaking aloud. " +
                    "Beginners should spend 20-30 minutes on this lesson."
                )
                .isPublished(true)
                .sections(new ArrayList<>(List.of(vocabularySection, grammarSection, speakingSection)))
                .build();

        vocabularySection.setLessonDay(day1);
        grammarSection.setLessonDay(day1);
        speakingSection.setLessonDay(day1);

        lessonDayRepository.save(day1);
    }
}

