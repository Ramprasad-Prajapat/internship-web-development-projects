package com.english.learning.controller;

import com.english.learning.model.User;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AiController {

    private final ObjectMapper objectMapper = new ObjectMapper();

    private String callGemini(String prompt) {
        String apiKey = System.getenv("GEMINI_API_KEY");
        if (apiKey == null || apiKey.trim().isEmpty()) {
            return null;
        }
        try {
            java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey;
            
            String requestBody = "{\"contents\":[{\"parts\":[{\"text\":" + 
                    objectMapper.writeValueAsString(prompt) + 
                    "}]}]}";

            java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create(url))
                    .header("Content-Type", "application/json")
                    .POST(java.net.http.HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            java.net.http.HttpResponse<String> response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                JsonNode rootNode = objectMapper.readTree(response.body());
                return rootNode.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
            }
        } catch (Exception e) {
            System.err.println("Error calling Gemini API: " + e.getMessage());
        }
        return null;
    }

    private String extractJson(String text) {
        if (text == null) return null;
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        if (start != -1 && end != -1 && end > start) {
            return text.substring(start, end + 1);
        }
        return null;
    }

    @PostMapping("/explain-content")
    public ResponseEntity<Map<String, Object>> explainContent(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        String content = (String) body.getOrDefault("content", "");
        String context = (String) body.getOrDefault("context", "");

        String prompt = "Explain the following English learning content to a beginner: '" + content + "' in the context of '" + context + "'. Keep the explanation simple, clear, and beginner-friendly. Answer ONLY in JSON format: {\"explanation\": \"...\", \"simpleRule\": \"...\"}";
        String geminiResponse = callGemini(prompt);
        String extracted = extractJson(geminiResponse);

        if (extracted != null) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> result = objectMapper.readValue(extracted, Map.class);
                return ResponseEntity.ok(result);
            } catch (Exception ignored) {}
        }

        // Rule-based Fallback
        String explanation = "Here is a simple explanation of the content: \"" + content + "\"";
        String simpleRule = "Focus on the main verbs and word connections.";

        String lowercaseContent = content.toLowerCase();
        if (lowercaseContent.contains("preposition") || lowercaseContent.contains(" in ") || lowercaseContent.contains(" on ") || lowercaseContent.contains(" at ")) {
            explanation = "This content focuses on Prepositions (in, on, at, to). Prepositions show where things are or when they happen. Remember: 'in' is for closed spaces, 'on' is for surfaces, and 'at' is for specific points.";
            simpleRule = "Prepositions connect nouns to other parts of a sentence.";
        } else if (lowercaseContent.contains("had") && (lowercaseContent.contains("past") || lowercaseContent.contains("perfect"))) {
            explanation = "This content uses the Past Perfect tense (had + past participle). We use it to talk about an action that happened before another action in the past. Example: 'The train had left before I arrived.'";
            simpleRule = "Had + verb-3rd-form describes the older of two past events.";
        } else if (lowercaseContent.length() < 20) {
            explanation = "\"" + content + "\" represents basic vocabulary. Try incorporating this word into your daily practice dialogues!";
            simpleRule = "Learn new words in context rather than in isolation.";
        }

        return ResponseEntity.ok(Map.of(
            "explanation", explanation,
            "simpleRule", simpleRule
        ));
    }

    @PostMapping("/generate-practice")
    public ResponseEntity<Map<String, Object>> generatePractice(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        String content = (String) body.getOrDefault("content", "");
        int count = body.containsKey("count") ? ((Number) body.get("count")).intValue() : 3;

        String prompt = "Generate " + count + " practice questions for a beginner English learner based on the content: '" + content + "'. Answer ONLY in JSON format: {\"questions\": [{\"id\": \"q1\", \"type\": \"blank\", \"question\": \"Fill in the blank: '...'\", \"choices\": [\"...\", \"...\"], \"correctAnswer\": \"...\", \"simpleRule\": \"...\", \"source\": \"AI Tutor Session\"}]}";
        String geminiResponse = callGemini(prompt);
        String extracted = extractJson(geminiResponse);

        if (extracted != null) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> result = objectMapper.readValue(extracted, Map.class);
                return ResponseEntity.ok(result);
            } catch (Exception ignored) {}
        }

        // Rule-based Fallback
        List<Map<String, Object>> questions = new ArrayList<>();
        String[] words = content.replaceAll("[^a-zA-Z\\s]", "").split("\\s+");
        List<String> validWords = new ArrayList<>();
        for (String w : words) {
            if (w.length() > 3) validWords.add(w);
        }

        for (int i = 0; i < Math.min(count, 3); i++) {
            if (i == 0 && !validWords.isEmpty()) {
                String targetWord = validWords.get(validWords.size() / 2);
                String sentenceWithBlank = content.replaceAll("(?i)\\b" + Pattern.quote(targetWord) + "\\b", "_______");
                questions.add(Map.of(
                    "id", "tutor-gen-blank-" + System.currentTimeMillis() + "-" + i,
                    "type", "blank",
                    "question", "Fill in the blank: \"" + sentenceWithBlank + "\"",
                    "correctAnswer", targetWord,
                    "simpleRule", "Complete the sentence with the missing vocabulary term: " + targetWord,
                    "source", "AI Tutor Session"
                ));
            } else if (i == 1 && validWords.size() > 1) {
                String wordToUse = validWords.get(0);
                questions.add(Map.of(
                    "id", "tutor-gen-make-" + System.currentTimeMillis() + "-" + i,
                    "type", "make",
                    "question", "Construct a new sentence using the word: \"" + wordToUse + "\"",
                    "correctAnswer", wordToUse,
                    "simpleRule", "Show understanding of the word '" + wordToUse + "' by writing a short sentence.",
                    "source", "AI Tutor Session"
                ));
            } else {
                questions.add(Map.of(
                    "id", "tutor-gen-correct-" + System.currentTimeMillis() + "-" + i,
                    "type", "correct",
                    "question", "Correct any grammar or capitalization errors: \"" + content.toLowerCase() + "\"",
                    "correctAnswer", content,
                    "simpleRule", "Ensure proper sentence casing and punctuation.",
                    "source", "AI Tutor Session"
                ));
            }
        }

        if (questions.isEmpty()) {
            questions.add(Map.of(
                "id", "tutor-gen-default",
                "type", "blank",
                "question", "Select the correct option: 'She ___ learning English.'",
                "choices", List.of("is", "are", "am"),
                "correctAnswer", "is",
                "simpleRule", "Third-person singular takes 'is'.",
                "source", "AI Tutor Session"
            ));
        }

        return ResponseEntity.ok(Map.of("questions", questions));
    }

    @PostMapping("/weekly-review")
    public ResponseEntity<Map<String, Object>> weeklyReview(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<String> weakAreas = (List<String>) body.getOrDefault("weakAreas", new ArrayList<>());

        String prompt = "Based on these weak areas: " + weakAreas + ", suggest a brief study tip for a beginner English learner. Keep it under 2 sentences. Answer ONLY in JSON format: {\"suggestion\": \"...\"}";
        String geminiResponse = callGemini(prompt);
        String extracted = extractJson(geminiResponse);

        if (extracted != null) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> result = objectMapper.readValue(extracted, Map.class);
                return ResponseEntity.ok(result);
            } catch (Exception ignored) {}
        }

        // Rule-based Fallback
        String suggestion = "Review writing drafts in the AI Notebook and practice reading out loud.";
        if (weakAreas != null && !weakAreas.isEmpty()) {
            String primary = weakAreas.get(0);
            if (primary.toLowerCase().contains("prepositions")) {
                suggestion = "Review the Prepositions of Place practice module. Focus on selecting correct prepositions in context exercises.";
            } else if (primary.toLowerCase().contains("grammar") || primary.toLowerCase().contains("writing")) {
                suggestion = "Rewrite your saved mistakes in the Mistakes Log, and try to write a 3-sentence summary of your day in the Notebook.";
            } else if (primary.toLowerCase().contains("speaking") || primary.toLowerCase().contains("pronunciation")) {
                suggestion = "Perform 3 speaking checks in the Practice Center using your device microphone to check for phonetic accuracy.";
            }
        }

        return ResponseEntity.ok(Map.of("suggestion", suggestion));
    }

    @PostMapping("/notebook-review")
    public ResponseEntity<Map<String, Object>> notebookReview(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        String content = (String) body.getOrDefault("content", "");
        String action = (String) body.getOrDefault("action", "");

        if ("summarize".equals(action)) {
            String prompt = "Summarize this study note: '" + content + "'. Provide exactly 3 short bullet points/sentences in JSON format: {\"summary\": [\"...\", \"...\", \"...\"]}";
            String geminiResponse = callGemini(prompt);
            String extracted = extractJson(geminiResponse);
            if (extracted != null) {
                try {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> result = objectMapper.readValue(extracted, Map.class);
                    return ResponseEntity.ok(result);
                } catch (Exception ignored) {}
            }
            // Fallback
            String[] sentences = content.split("[.!?]+");
            List<String> summary = new ArrayList<>();
            for (String s : sentences) {
                String t = s.trim();
                if (!t.isEmpty()) summary.add(t);
            }
            while (summary.size() < 3) {
                summary.add("Review the primary grammatical structure of this study note.");
            }
            return ResponseEntity.ok(Map.of("summary", summary.subList(0, 3)));

        } else if ("vocabulary".equals(action)) {
            String prompt = "Extract up to 3 key English words from this text: '" + content + "'. Answer ONLY in JSON format: {\"vocabulary\": [{\"word\": \"...\", \"meaning\": \"...\", \"example\": \"...\", \"status\": \"need-practice\"}]}";
            String geminiResponse = callGemini(prompt);
            String extracted = extractJson(geminiResponse);
            if (extracted != null) {
                try {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> result = objectMapper.readValue(extracted, Map.class);
                    return ResponseEntity.ok(result);
                } catch (Exception ignored) {}
            }
            // Fallback
            List<Map<String, Object>> vocabulary = new ArrayList<>();
            vocabulary.add(Map.of(
                "word", "English",
                "meaning", "A West Germanic language that was first spoken in early medieval England.",
                "example", "I am learning English online.",
                "status", "known"
            ));
            return ResponseEntity.ok(Map.of("vocabulary", vocabulary));

        } else if ("questions".equals(action)) {
            String prompt = "Create 2 simple review questions (1 fill_blank, 1 true_false) based on: '" + content + "'. Answer ONLY in JSON format: {\"questions\": [{\"id\": \"q1\", \"type\": \"fill_blank\", \"questionText\": \"...\", \"expectedAnswer\": \"...\"}]}";
            String geminiResponse = callGemini(prompt);
            String extracted = extractJson(geminiResponse);
            if (extracted != null) {
                try {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> result = objectMapper.readValue(extracted, Map.class);
                    return ResponseEntity.ok(result);
                } catch (Exception ignored) {}
            }
            // Fallback
            List<Map<String, Object>> questions = List.of(
                Map.of(
                    "id", "ntb-q-" + System.currentTimeMillis() + "-1",
                    "type", "fill_blank",
                    "questionText", "Complete the following statement with the correct meaning of the content: 'Practice makes ______.'",
                    "expectedAnswer", "perfect"
                ),
                Map.of(
                    "id", "ntb-q-" + System.currentTimeMillis() + "-2",
                    "type", "true_false",
                    "questionText", "True or False: We should only practice writing and avoid speaking checks.",
                    "expectedAnswer", "false"
                )
            );
            return ResponseEntity.ok(Map.of("questions", questions));

        } else if ("rewrite-sentence".equals(action)) {
            String prompt = "Correct any grammar mistakes in this English sentence: '" + content + "'. Provide corrected version, simple explanation, and a better alternative. Answer ONLY in JSON format: {\"corrected\": \"...\", \"explanation\": \"...\", \"betterOption\": \"...\"}";
            String geminiResponse = callGemini(prompt);
            String extracted = extractJson(geminiResponse);
            if (extracted != null) {
                try {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> result = objectMapper.readValue(extracted, Map.class);
                    return ResponseEntity.ok(result);
                } catch (Exception ignored) {}
            }
            // Fallback
            String corrected = content.trim();
            String explanation = "No obvious grammar errors detected in this sentence.";
            String betterOption = content;

            String lower = content.toLowerCase();
            if (lower.contains("looking forward to see")) {
                corrected = content.replaceAll("(?i)looking forward to see", "looking forward to seeing");
                explanation = "Use gerund form '-ing' after prepositional phrase 'looking forward to'.";
                betterOption = "I am looking forward to seeing you soon.";
            } else if (lower.contains("am agree") || lower.contains("is agree")) {
                corrected = content.replaceAll("(?i)am agree", "agree").replaceAll("(?i)is agree", "agrees");
                explanation = "Agree is a main verb and should not be used with helper verb 'am/is'.";
                betterOption = "I strongly agree with this suggestion.";
            }
            return ResponseEntity.ok(Map.of(
                "corrected", corrected,
                "explanation", explanation,
                "betterOption", betterOption
            ));
        }

        return ResponseEntity.badRequest().body(Map.of("error", "Invalid notebook action"));
    }

    @PostMapping("/check-writing")
    public ResponseEntity<Map<String, Object>> checkWriting(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        String text = (String) body.getOrDefault("text", "");
        String promptText = (String) body.getOrDefault("prompt", "");

        String prompt = "Check this English sentence written by a beginner: '" + text + "' for the prompt: '" + promptText + "'. Give a score from 30 to 100, a corrected sentence, hints (list of strings), a simpleRule, and a mistakeType ('grammar', 'capitalization', 'punctuation', or 'none'). Answer ONLY in JSON format: {\"score\": 90, \"correctedSentence\": \"...\", \"hints\": [\"...\"], \"simpleRule\": \"...\", \"mistakeType\": \"...\"}";
        String geminiResponse = callGemini(prompt);
        String extracted = extractJson(geminiResponse);

        if (extracted != null) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> result = objectMapper.readValue(extracted, Map.class);
                return ResponseEntity.ok(result);
            } catch (Exception ignored) {}
        }

        // Rule-based Fallback
        int score = 100;
        String correctedSentence = text.trim();
        List<String> hints = new ArrayList<>();
        String simpleRule = "Perfect! Your sentence follows correct English conventions.";
        String mistakeType = "none";

        if (correctedSentence.length() > 0 && !Character.isUpperCase(correctedSentence.charAt(0))) {
            score -= 10;
            correctedSentence = Character.toUpperCase(correctedSentence.charAt(0)) + correctedSentence.substring(1);
            hints.add("Capitalize the first letter of a sentence.");
            simpleRule = "Sentences must start with a capital letter.";
            mistakeType = "capitalization";
        }

        if (correctedSentence.length() > 0 && !correctedSentence.matches(".*[.!?]$")) {
            score -= 10;
            correctedSentence += ".";
            hints.add("Add terminal punctuation (period, question mark, or exclamation point).");
            simpleRule = "Sentences must end with proper punctuation.";
            mistakeType = "punctuation";
        }

        String lower = text.toLowerCase();
        if (lower.contains("am agree") || lower.contains("is agree")) {
            score -= 20;
            correctedSentence = correctedSentence.replaceAll("(?i)am agree", "agree").replaceAll("(?i)is agree", "agrees");
            hints.add("Use 'agree' as a verb directly. Avoid using the auxiliary verb 'am/is' with 'agree'.");
            simpleRule = "Say 'I agree' instead of 'I am agree'.";
            mistakeType = "grammar";
        } else if (lower.contains("looking forward to see")) {
            score -= 25;
            correctedSentence = correctedSentence.replaceAll("(?i)looking forward to see", "looking forward to seeing");
            hints.add("Use the gerund form (-ing) after the prepositional phrase 'looking forward to'.");
            simpleRule = "Use gerund (seeing) after 'looking forward to'.";
            mistakeType = "grammar";
        } else if (lower.contains("interested on")) {
            score -= 20;
            correctedSentence = correctedSentence.replaceAll("(?i)interested on", "interested in");
            hints.add("Use the preposition 'in' after the adjective 'interested'.");
            simpleRule = "Interested is followed by the preposition 'in'.";
            mistakeType = "grammar";
        } else if (lower.contains("depend of")) {
            score -= 20;
            correctedSentence = correctedSentence.replaceAll("(?i)depend of", "depend on");
            hints.add("Use the preposition 'on' after the verb 'depend'.");
            simpleRule = "Depend is followed by the preposition 'on'.";
            mistakeType = "grammar";
        }

        return ResponseEntity.ok(Map.of(
            "score", Math.max(30, score),
            "correctedSentence", correctedSentence,
            "hints", hints,
            "simpleRule", simpleRule,
            "mistakeType", mistakeType
        ));
    }

    @PostMapping("/analyze-speaking")
    public ResponseEntity<Map<String, Object>> analyzeSpeaking(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        String transcript = (String) body.getOrDefault("transcript", "");
        String question = (String) body.getOrDefault("question", "");

        String prompt = "Analyze this spoken English attempt. The user read: '" + transcript + "' for the target sentence: '" + question + "'. Provide correctedAnswer, betterAnswer, grammarMistakes, pronunciationHints, fluencyScore (30 to 100), wordsToRepeat, and speakingPracticeLine. Answer ONLY in JSON format: {\"correctedAnswer\": \"...\", \"betterAnswer\": \"...\", \"grammarMistakes\": [], \"pronunciationHints\": [], \"fluencyScore\": 85, \"wordsToRepeat\": [], \"speakingPracticeLine\": \"...\"}";
        String geminiResponse = callGemini(prompt);
        String extracted = extractJson(geminiResponse);

        if (extracted != null) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> result = objectMapper.readValue(extracted, Map.class);
                return ResponseEntity.ok(result);
            } catch (Exception ignored) {}
        }

        // Rule-based Fallback
        String cleanTranscript = transcript.trim().toLowerCase().replaceAll("[.,/#!$%^&*;:{}=\\-_`~()]", "");
        String cleanTarget = question.trim().toLowerCase().replaceAll("[.,/#!$%^&*;:{}=\\-_`~()]", "");

        String[] transcriptWords = cleanTranscript.split("\\s+");
        String[] targetWords = cleanTarget.split("\\s+");

        Set<String> userWordSet = new HashSet<>(Arrays.asList(transcriptWords));
        int matched = 0;
        for (String w : targetWords) {
            if (userWordSet.contains(w)) matched++;
        }

        int fluencyScore = targetWords.length > 0 ? Math.round(((float) matched / targetWords.length) * 100) : 70;
        fluencyScore = Math.max(30, Math.min(100, fluencyScore));

        List<String> missingWords = new ArrayList<>();
        for (String w : targetWords) {
            if (!userWordSet.contains(w)) missingWords.add(w);
        }

        List<String> grammarMistakes = new ArrayList<>();
        List<String> pronunciationHints = new ArrayList<>();
        if (!missingWords.isEmpty()) {
            pronunciationHints.add("Try to pronounce these words more clearly: " + String.join(", ", missingWords.subList(0, Math.min(3, missingWords.size()))));
        }

        String correctedAnswer = transcript;
        if (cleanTranscript.contains("am agree") || cleanTranscript.contains("is agree")) {
            grammarMistakes.add("Say 'I agree' instead of 'I am agree'.");
            correctedAnswer = correctedAnswer.replaceAll("(?i)am agree", "agree");
        }

        return ResponseEntity.ok(Map.of(
            "correctedAnswer", correctedAnswer.isEmpty() ? "No speech detected." : correctedAnswer,
            "betterAnswer", question,
            "grammarMistakes", grammarMistakes,
            "pronunciationHints", pronunciationHints,
            "fluencyScore", fluencyScore,
            "wordsToRepeat", missingWords.subList(0, Math.min(3, missingWords.size())),
            "speakingPracticeLine", question
        ));
    }
}
