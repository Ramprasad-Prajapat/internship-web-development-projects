import { MockWritingCheckResult, MockSpeakingCheckResult } from "../types/lessonSection.types";
import mistakeService from "./mistakeService";
import type { PracticeSourceType } from "../types/ai.types";

/**
 * Checks the user's written sentence against basic grammar rules.
 * If errors are found, it can save them to the Mistake store.
 */
async function checkWriting(
  text: string,
  sourceType: PracticeSourceType,
  sourceId: string | null,
  sourceTitle: string
): Promise<MockWritingCheckResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      status: "needs-improvement",
      betterSentence: "",
      simpleRule: "Please write something before checking.",
      score: 0,
    };
  }

  let betterSentence = trimmed;
  let simpleRule = "Great work! Your sentence is grammatically correct. Keep it up! 👍";
  let status: "correct" | "needs-improvement" = "correct";
  let capitalizationHint: string | undefined;
  let punctuationHint: string | undefined;
  let grammarHint: string | undefined;
  let wordsToImprove: string[] = [];
  let score = 100;

  // 1. Capitalization check
  if (trimmed.length > 0 && trimmed[0] !== trimmed[0].toUpperCase()) {
    capitalizationHint = "Sentence should start with a capital letter.";
    betterSentence = betterSentence[0].toUpperCase() + betterSentence.slice(1);
    score -= 10;
    status = "needs-improvement";
    wordsToImprove.push(trimmed[0]);
  }

  // 2. Punctuation check
  const lastChar = trimmed[trimmed.length - 1];
  if (trimmed.length > 0 && !/[.!?]/.test(lastChar)) {
    punctuationHint = "Sentence should end with proper punctuation (e.g., a period).";
    betterSentence = betterSentence + ".";
    score -= 10;
    status = "needs-improvement";
    wordsToImprove.push("[missing punctuation]");
  }

  // 3. Simple rule matching
  const lowercaseText = trimmed.toLowerCase();
  let grammarMistakeFound = false;
  let currentRule = "";
  let originalWrong = "";
  let expectedCorrect = "";
  let currentGrammarHint = "";

  if (lowercaseText.includes("there is many")) {
    grammarMistakeFound = true;
    originalWrong = "there is many";
    expectedCorrect = "there are many";
    currentRule = "Use 'there are' for plural subjects (e.g. many cars).";
    currentGrammarHint = "Subject-verb agreement error: 'there is' is singular, but 'many' indicates a plural subject. Use 'there are' instead.";
    wordsToImprove.push("there is");
  } else if (lowercaseText.includes("is many")) {
    grammarMistakeFound = true;
    originalWrong = "is many";
    expectedCorrect = "are many";
    currentRule = "Use plural verb 'are' with plural subjects.";
    currentGrammarHint = "Subject-verb agreement error: Use 'are' with plural subjects.";
    wordsToImprove.push("is");
  } else if (lowercaseText.includes("am go")) {
    grammarMistakeFound = true;
    originalWrong = "am go";
    expectedCorrect = "am going";
    currentRule = "Use verb-ing (going) after auxiliary 'am' for continuous action.";
    currentGrammarHint = "Verb form error: After auxiliary 'am/is/are', continuous actions require the present participle (-ing) form of the verb.";
    wordsToImprove.push("am go");
  } else if (/\bin (monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i.test(trimmed)) {
    grammarMistakeFound = true;
    const match = trimmed.match(/\bin (monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);
    originalWrong = match ? match[0] : "in day";
    const day = match ? match[1] : "day";
    expectedCorrect = `on ${day[0].toUpperCase() + day.slice(1)}`;
    currentRule = "Use preposition 'on' for specific days of the week.";
    currentGrammarHint = "Preposition error: Use 'on' for specific days of the week, not 'in'.";
    wordsToImprove.push(originalWrong);
  } else if (lowercaseText.includes("at the room")) {
    grammarMistakeFound = true;
    originalWrong = "at the room";
    expectedCorrect = "in the room";
    currentRule = "Use preposition 'in' for enclosed spaces like rooms.";
    currentGrammarHint = "Preposition error: Use 'in' to indicate location within a bounded space or room.";
    wordsToImprove.push("at the room");
  } else if (lowercaseText.includes("go to home")) {
    grammarMistakeFound = true;
    originalWrong = "go to home";
    expectedCorrect = "go home";
    currentRule = "The word 'home' does not require the preposition 'to' when indicating direction.";
    currentGrammarHint = "Idiomatic preposition error: The verb phrase 'go home' does not take a preposition of direction.";
    wordsToImprove.push("go to home");
  } else if (lowercaseText.includes("born in") && !lowercaseText.includes("was born in") && !lowercaseText.includes("were born in")) {
    grammarMistakeFound = true;
    originalWrong = "born in";
    expectedCorrect = "was born in";
    currentRule = "Use 'was born' for the past event of birth.";
    currentGrammarHint = "Passive voice error: The word 'born' requires the past form of the helper verb 'to be' ('was' or 'were').";
    wordsToImprove.push("born in");
  }

  if (grammarMistakeFound) {
    status = "needs-improvement";
    score -= 30;
    simpleRule = currentRule;
    grammarHint = currentGrammarHint;

    // Replace the wrong part in the better sentence
    const regex = new RegExp(originalWrong, "i");
    betterSentence = betterSentence.replace(regex, expectedCorrect);

    // Save mistake to mistakeService
    await mistakeService.saveMistake({
      sourceType,
      sourceId,
      sourceTitle,
      wrongSentence: trimmed,
      correctSentence: betterSentence,
      simpleRule: currentRule,
      mistakeType: "grammar"
    });
  } else if (status === "needs-improvement") {
    // Only capitalization/punctuation mistakes
    simpleRule = "Formatting Check: Please check capitalization and punctuation rules.";
    grammarHint = "No grammar errors detected. Double check formatting rules (capitalization and punctuation).";
  } else {
    grammarHint = "Perfect grammar! Keep using this sentence pattern.";
  }

  // Ensure score doesn't go below 50 for attempts with content
  score = Math.max(50, score);

  return {
    status,
    betterSentence,
    simpleRule,
    capitalizationHint,
    punctuationHint,
    grammarHint,
    wordsToImprove: wordsToImprove.length > 0 ? Array.from(new Set(wordsToImprove)) : undefined,
    score,
  };
}

/**
 * Compares user's typed speech text with expected section content.
 */
function checkSpeaking(
  typedText: string,
  expectedText: string
): MockSpeakingCheckResult {
  const clean = (str: string) =>
    str
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const userClean = clean(typedText);
  const expectedClean = clean(expectedText);

  const userWords = userClean ? userClean.split(" ") : [];
  const expectedWords = expectedClean ? expectedClean.split(" ") : [];

  if (expectedWords.length === 0) {
    return {
      accuracy: 0,
      missingWords: [],
      extraWords: [],
      wordsToRepeat: [],
      recommendedPracticeLine: "No content available to practice.",
      speakingTip: "No text found for analysis."
    };
  }

  // Count matches
  const userWordSet = new Set(userWords);
  const expectedWordSet = new Set(expectedWords);

  const missingWords = expectedWords.filter(w => !userWordSet.has(w));
  const extraWords = userWords.filter(w => !expectedWordSet.has(w));
  const matchedWords = expectedWords.filter(w => userWordSet.has(w));

  const accuracy = Math.round((matchedWords.length / expectedWords.length) * 100);

  // Recommended practice line: find the first complete sentence in expected text
  const sentences = expectedText.split(/[.!?\n]/).map(s => s.trim()).filter(Boolean);
  const recommendedPracticeLine = sentences[0] || expectedText;

  let speakingTip = "Try listening to the native voice guide again. Focus on speaking each word clearly and matching the phrase rhythm. 🎧";
  if (accuracy >= 90) {
    speakingTip = "Excellent! Your speaking accuracy is near perfect. Keep up the good work! 🚀";
  } else if (accuracy >= 70) {
    speakingTip = "Great try! Focus on pronunciation clarity and pacing. Re-listen to the practice line to perfect your tone. 📢";
  }

  return {
    accuracy,
    missingWords: Array.from(new Set(missingWords)),
    extraWords: Array.from(new Set(extraWords)),
    wordsToRepeat: Array.from(new Set(missingWords)),
    recommendedPracticeLine,
    speakingTip
  };
}

/**
 * Returns section-based recommendations.
 */
function getSectionRecommendations(heading: string, bodyContent: string): string[] {
  const h = heading.toLowerCase();

  if (h.includes("vocab")) {
    return [
      "Practice difficult words and make new sentences with them.",
      "Save these words to your vocabulary manager for daily revision.",
      "Say each word out loud 3 times using the Speaker tool."
    ];
  }
  if (h.includes("grammar")) {
    return [
      "Understand the rule and write down 3 correct sentences using it.",
      "Review the examples and identify the subject, verb, and object.",
      "Focus on singular vs plural verb agreement."
    ];
  }
  if (h.includes("prep")) {
    return [
      "Compare IN, ON, and AT rules.",
      "Write one sentence for each preposition (in, on, at) based on the section examples.",
      "Do the mini quiz on prepositions to test your understanding."
    ];
  }
  if (h.includes("question") || h.includes("q&a") || h.includes("answers")) {
    return [
      "Try to answer the question in your own words before checking the correct answer.",
      "Practice speaking your answer aloud using the Speak Mode tab to check pronunciation.",
      "Use the speech synthesis button to listen to the question and native answer key.",
      "If you make a grammar mistake, save it to the Mistakes tab to practice again later.",
      "Save particularly useful sentence structures to your Notebook Notes tab."
    ];
  }
  if (h.includes("speaking") || h.includes("drill")) {
    return [
      "Repeat these lines out loud 5 times using the Speak Mode.",
      "Focus on rhythm, stress, and pronunciation of each word.",
      "Use the Speaker tool to check the correct native pronunciation first."
    ];
  }
  if (h.includes("mistake")) {
    return [
      "Write down the correct sentences in your physical notebook.",
      "Review the wrong sentences to see why the mistake happened.",
      "Try to formulate 3 sentences similar to the correct ones."
    ];
  }
  if (h.includes("homework")) {
    return [
      "Complete the homework writing task in Write Mode and get AI feedback.",
      "Save your final sentences to the AI Notebook.",
      "Review the homework tomorrow and compare it to previous days."
    ];
  }

  return [
    "Read the content carefully and write a 2-sentence summary in your notes.",
    "Use Speak Mode to practice reading the content aloud.",
    "Save the most important points to your AI Notebook."
  ];
}

export const lessonSectionPracticeService = {
  checkWriting,
  checkSpeaking,
  getSectionRecommendations,
};

export default lessonSectionPracticeService;
