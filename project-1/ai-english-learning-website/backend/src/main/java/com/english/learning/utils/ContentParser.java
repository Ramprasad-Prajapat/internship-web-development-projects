package com.english.learning.utils;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class ContentParser {

    private static final List<String> HEADING_KEYWORDS = List.of(
            "Vocabulary", "Grammar", "Speaking Practice", "Homework", "Self Check",
            "Warm Up Discussion", "Introduction", "Practice", "Main Lesson"
    );

    public static List<Map<String, Object>> parse(String rawContent) {
        List<Map<String, Object>> sections = new ArrayList<>();
        if (rawContent == null || rawContent.trim().isEmpty()) {
            return sections;
        }

        String[] lines = rawContent.split("\\r?\\n");
        String currentHeading = null;
        StringBuilder currentBody = new StringBuilder();

        // Regex patterns for headings
        Pattern mdPattern = Pattern.compile("^(#{1,6})\\s+(.*)$");
        Pattern sectionPattern = Pattern.compile("^(?i)Section\\s+\\d+:\\s*(.*)$");
        Pattern dotPattern = Pattern.compile("^\\d+\\.\\s*(.*)$");
        Pattern parenPattern = Pattern.compile("^\\d+\\)\\s*(.*)$");

        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.isEmpty()) {
                currentBody.append(line).append("\n");
                continue;
            }

            boolean isHeading = false;
            String headingText = "";

            // 1. Markdown heading
            Matcher mdMatcher = mdPattern.matcher(line);
            if (mdMatcher.matches()) {
                isHeading = true;
                headingText = mdMatcher.group(2).trim();
            }

            // 2. Section N:
            if (!isHeading) {
                Matcher secMatcher = sectionPattern.matcher(line);
                if (secMatcher.matches()) {
                    isHeading = true;
                    headingText = secMatcher.group(1).trim();
                }
            }

            // 3. N. or N)
            if (!isHeading) {
                Matcher dotMatcher = dotPattern.matcher(line);
                if (dotMatcher.matches()) {
                    isHeading = true;
                    headingText = dotMatcher.group(1).trim();
                }
            }
            if (!isHeading) {
                Matcher parenMatcher = parenPattern.matcher(line);
                if (parenMatcher.matches()) {
                    isHeading = true;
                    headingText = parenMatcher.group(1).trim();
                }
            }

            // 4. Colon headings like "Vocabulary:"
            if (!isHeading) {
                for (String hw : HEADING_KEYWORDS) {
                    if (trimmed.equalsIgnoreCase(hw) || trimmed.equalsIgnoreCase(hw + ":")) {
                        isHeading = true;
                        headingText = hw;
                        break;
                    }
                }
            }

            if (isHeading) {
                // Save previous section if exists and not empty
                if (currentHeading != null || currentBody.toString().trim().length() > 0) {
                    Map<String, Object> sec = new HashMap<>();
                    sec.put("heading", currentHeading != null ? currentHeading : "Main Lesson");
                    sec.put("body", currentBody.toString().trim());
                    sec.put("category", getCategoryByTitle(currentHeading));
                    sections.add(sec);
                }

                currentHeading = cleanHeadingText(headingText);
                currentBody = new StringBuilder();
            } else {
                currentBody.append(line).append("\n");
            }
        }

        // Add the last section
        if (currentHeading != null || currentBody.toString().trim().length() > 0) {
            Map<String, Object> sec = new HashMap<>();
            sec.put("heading", currentHeading != null ? currentHeading : "Main Lesson");
            sec.put("body", currentBody.toString().trim());
            sec.put("category", getCategoryByTitle(currentHeading));
            sections.add(sec);
        }

        // Remove empty body sections
        sections.removeIf(s -> ((String) s.get("body")).trim().isEmpty());

        // Fallback keyword parsing if no headings were detected
        if (sections.isEmpty()) {
            sections = parseByKeywords(rawContent);
        }

        return sections;
    }

    private static String cleanHeadingText(String text) {
        return text.replaceAll("\\*\\*", "").trim();
    }

    private static String getCategoryByTitle(String title) {
        if (title == null) return "general";
        String lower = title.toLowerCase();
        if (lower.contains("vocab") || lower.contains("word")) return "vocabulary";
        if (lower.contains("grammar") || lower.contains("rule")) return "grammar";
        if (lower.contains("speaking") || lower.contains("dialogue") || lower.contains("conversation")) return "speaking";
        if (lower.contains("practice") || lower.contains("drill") || lower.contains("exercise")) return "practice";
        if (lower.contains("homework") || lower.contains("assignment")) return "homework";
        if (lower.contains("self-check") || lower.contains("self check") || lower.contains("quiz")) return "self-check";
        return "general";
    }

    private static List<Map<String, Object>> parseByKeywords(String rawContent) {
        List<Map<String, Object>> sections = new ArrayList<>();
        String lowerContent = rawContent.toLowerCase();

        boolean hasVocab = lowerContent.contains("greeting") || lowerContent.contains("words") || lowerContent.contains("meaning") || lowerContent.contains("vocabulary");
        boolean hasGrammar = lowerContent.contains("grammar") || lowerContent.contains("sentence") || lowerContent.contains("pattern") || lowerContent.contains("rule");
        boolean hasSpeaking = lowerContent.contains("dialogue") || lowerContent.contains("conversation") || lowerContent.contains("speaking");
        boolean hasPractice = lowerContent.contains("exercise") || lowerContent.contains("practice") || lowerContent.contains("fill") || lowerContent.contains("question");
        boolean hasHomework = lowerContent.contains("homework") || lowerContent.contains("assignment");
        boolean hasSelfCheck = lowerContent.contains("self-check") || lowerContent.contains("quiz") || lowerContent.contains("check yourself");

        if (hasVocab) {
            Map<String, Object> sec = new HashMap<>();
            sec.put("heading", "Vocabulary");
            sec.put("category", "vocabulary");
            sec.put("body", extractContentForKeyword(rawContent, List.of("greeting", "words", "meaning", "vocabulary")));
            sections.add(sec);
        }
        if (hasGrammar) {
            Map<String, Object> sec = new HashMap<>();
            sec.put("heading", "Grammar");
            sec.put("category", "grammar");
            sec.put("body", extractContentForKeyword(rawContent, List.of("grammar", "sentence", "pattern", "rule")));
            sections.add(sec);
        }
        if (hasSpeaking) {
            Map<String, Object> sec = new HashMap<>();
            sec.put("heading", "Speaking Practice");
            sec.put("category", "speaking");
            sec.put("body", extractContentForKeyword(rawContent, List.of("dialogue", "conversation", "speaking")));
            sections.add(sec);
        }
        if (hasPractice) {
            Map<String, Object> sec = new HashMap<>();
            sec.put("heading", "Practice");
            sec.put("category", "practice");
            sec.put("body", extractContentForKeyword(rawContent, List.of("exercise", "practice", "fill", "question")));
            sections.add(sec);
        }
        if (hasHomework) {
            Map<String, Object> sec = new HashMap<>();
            sec.put("heading", "Homework");
            sec.put("category", "homework");
            sec.put("body", extractContentForKeyword(rawContent, List.of("homework", "assignment")));
            sections.add(sec);
        }
        if (hasSelfCheck) {
            Map<String, Object> sec = new HashMap<>();
            sec.put("heading", "Self Check");
            sec.put("category", "self-check");
            sec.put("body", extractContentForKeyword(rawContent, List.of("self-check", "quiz", "check yourself")));
            sections.add(sec);
        }

        if (sections.isEmpty()) {
            sections.add(createSectionMap("Introduction", "general", "Welcome to today's lesson plan."));
            sections.add(createSectionMap("Main Lesson", "general", rawContent));
            sections.add(createSectionMap("Practice", "practice", "Review the lesson materials and practice."));
        }

        sections.removeIf(s -> ((String) s.get("body")).trim().isEmpty());

        if (sections.isEmpty() && !rawContent.trim().isEmpty()) {
            sections.add(createSectionMap("Main Lesson", "general", rawContent));
        }

        return sections;
    }

    private static Map<String, Object> createSectionMap(String heading, String category, String body) {
        Map<String, Object> map = new HashMap<>();
        map.put("heading", heading);
        map.put("category", category);
        map.put("body", body);
        return map;
    }

    private static String extractContentForKeyword(String content, List<String> keywords) {
        String[] lines = content.split("\\r?\\n");
        StringBuilder sb = new StringBuilder();
        for (String line : lines) {
            for (String kw : keywords) {
                if (line.toLowerCase().contains(kw)) {
                    sb.append(line).append("\n");
                    break;
                }
            }
        }
        String res = sb.toString().trim();
        return res.isEmpty() ? content : res;
    }
}
