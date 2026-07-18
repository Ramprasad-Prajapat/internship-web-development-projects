import mockDatabase from "./mockDatabase";
import authService from "./authService";

export interface AssessmentQuestion {
  id: string;
  category: "grammar" | "vocabulary" | "writing" | "speaking" | "listening";
  questionText: string;
  choices?: string[];
  correctAnswer?: string; // used for automatic matching
  audioText?: string; // used for listening tts
  placeholder?: string;
}

export interface AssessmentResult {
  overallLevel: "Beginner" | "Basic" | "Intermediate";
  scores: {
    grammar: number;
    vocabulary: number;
    writing: number;
    speaking: number;
    listening: number;
  };
  weakAreas: string[];
  recommendedStartDay: number;
  recommendedDailyMinutes: number;
  mockAiExplanation: string;
  completedAt: string;
}

const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  // 1. Grammar
  {
    id: "aq_grammar_1",
    category: "grammar",
    questionText: 'Fill in the blank: "She ___ to school every day."',
    choices: ["go", "goes", "going"],
    correctAnswer: "goes",
  },
  {
    id: "aq_grammar_2",
    category: "grammar",
    questionText: 'Which of the following sentences is grammatically correct?',
    choices: [
      "I am agree with your suggestion.",
      "I agree with your suggestion.",
      "I agrees with your suggestion."
    ],
    correctAnswer: "I agree with your suggestion.",
  },
  // 2. Vocabulary
  {
    id: "aq_vocab_1",
    category: "vocabulary",
    questionText: 'What is the correct meaning of the word "deliberate"?',
    choices: [
      "Done intentionally or on purpose",
      "Moving very fast and suddenly",
      "Very cold or frozen"
    ],
    correctAnswer: "Done intentionally or on purpose",
  },
  {
    id: "aq_vocab_2",
    category: "vocabulary",
    questionText: 'Use the word "frequent" in a short sentence.',
    placeholder: "Type your sentence here...",
  },
  // 3. Writing
  {
    id: "aq_writing_1",
    category: "writing",
    questionText: "Write 2 to 3 sentences describing your favorite hobby and why you enjoy it.",
    placeholder: "I enjoy reading books because...",
  },
  // 4. Speaking Typed
  {
    id: "aq_speaking_1",
    category: "speaking",
    questionText: 'Read the following sentence aloud and type what you spoke: "The weather today is very pleasant for a walk."',
    placeholder: "Type the exact spoken words...",
  },
  // 5. Listening
  {
    id: "aq_listening_1",
    category: "listening",
    questionText: "Click 'Play Audio' to listen, then type what you heard.",
    audioText: "Practice makes perfect and consistent study builds fluency.",
    placeholder: "Type what you heard...",
  },
];

export const englishAssessmentService = {
  getQuestions(): AssessmentQuestion[] {
    return ASSESSMENT_QUESTIONS;
  },

  getAssessmentResult(): AssessmentResult | null {
    const list = mockDatabase.getCollection<AssessmentResult>(mockDatabase.DB_KEYS.englishAssessmentResult as any);
    return list.length > 0 ? list[0] : null;
  },

  saveAssessmentResult(result: AssessmentResult): void {
    mockDatabase.setCollection(mockDatabase.DB_KEYS.englishAssessmentResult as any, [result]);

    // Update active user state in authService
    authService.updateUser({
      level: result.overallLevel.toUpperCase() as any,
      learningGoal: `Improve ${result.weakAreas.join(" and ")} skills`,
      dailyGoalMinutes: result.recommendedDailyMinutes,
      weakAreas: result.weakAreas,
    });
  },

  clearAssessmentResult(): void {
    mockDatabase.setCollection(mockDatabase.DB_KEYS.englishAssessmentResult as any, []);
  },

  isAssessmentTaken(): boolean {
    return this.getAssessmentResult() !== null;
  },

  evaluateAnswers(answers: Record<string, string>): AssessmentResult {
    // 1. Evaluate Grammar
    let grammarScore = 0;
    if (answers["aq_grammar_1"] === "goes") grammarScore += 50;
    if (answers["aq_grammar_2"] === "I agree with your suggestion.") grammarScore += 50;

    // 2. Evaluate Vocabulary
    let vocabScore = 0;
    if (answers["aq_vocab_1"] === "Done intentionally or on purpose") vocabScore += 50;
    const vocabSentence = (answers["aq_vocab_2"] || "").trim().toLowerCase();
    if (vocabSentence.includes("frequent") || vocabSentence.includes("frequently")) {
      vocabScore += 50;
    }

    // 3. Evaluate Writing
    let writingScore = 0;
    const writingText = (answers["aq_writing_1"] || "").trim();
    const words = writingText.split(/\s+/).filter(Boolean);
    if (words.length >= 10) writingScore = 100;
    else if (words.length >= 5) writingScore = 60;
    else if (words.length > 0) writingScore = 30;

    // 4. Evaluate Speaking
    let speakingScore = 0;
    const speakingText = (answers["aq_speaking_1"] || "").trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
    const targetSpeaking = "the weather today is very pleasant for a walk";
    if (speakingText === targetSpeaking) speakingScore = 100;
    else if (speakingText.includes("pleasant") || speakingText.includes("weather")) speakingScore = 70;
    else if (speakingText.length > 5) speakingScore = 40;

    // 5. Evaluate Listening
    let listeningScore = 0;
    const listeningText = (answers["aq_listening_1"] || "").trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
    const targetListening = "practice makes perfect and consistent study builds fluency";
    if (listeningText === targetListening) listeningScore = 100;
    else if (listeningText.includes("practice") || listeningText.includes("perfect") || listeningText.includes("fluency")) listeningScore = 70;
    else if (listeningText.length > 5) listeningScore = 40;

    const averageScore = (grammarScore + vocabScore + writingScore + speakingScore + listeningScore) / 5;

    let overallLevel: AssessmentResult["overallLevel"] = "Beginner";
    if (averageScore >= 80) overallLevel = "Intermediate";
    else if (averageScore >= 50) overallLevel = "Basic";

    const weakAreas: string[] = [];
    if (grammarScore < 70) weakAreas.push("Grammar");
    if (vocabScore < 70) weakAreas.push("Vocabulary");
    if (writingScore < 70) weakAreas.push("Writing");
    if (speakingScore < 70) weakAreas.push("Speaking");
    if (listeningScore < 70) weakAreas.push("Listening");

    // Default weak area if everything is above 70
    if (weakAreas.length === 0) {
      const scoresArr = [
        { name: "Grammar", score: grammarScore },
        { name: "Vocabulary", score: vocabScore },
        { name: "Writing", score: writingScore },
        { name: "Speaking", score: speakingScore },
        { name: "Listening", score: listeningScore },
      ];
      scoresArr.sort((a, b) => a.score - b.score);
      weakAreas.push(scoresArr[0].name);
    }

    const recommendedDailyMinutes = overallLevel === "Beginner" ? 20 : overallLevel === "Basic" ? 30 : 45;
    const recommendedStartDay = overallLevel === "Beginner" ? 1 : overallLevel === "Basic" ? 3 : 5;

    // Dynamic mock explanation
    const weakAreaList = weakAreas.join(", ");
    const mockAiExplanation = `Based on your diagnostics, we recommend starting from Day ${recommendedStartDay} of the course. Your strongest skills are highlighted in your results, while ${weakAreaList} could benefit from target practice. We've customized your roadmap schedule to automatically prioritize these components in your dashboard study actions.`;

    return {
      overallLevel,
      scores: {
        grammar: grammarScore,
        vocabulary: vocabScore,
        writing: writingScore,
        speaking: speakingScore,
        listening: listeningScore,
      },
      weakAreas,
      recommendedStartDay,
      recommendedDailyMinutes,
      mockAiExplanation,
      completedAt: new Date().toISOString(),
    };
  }
};

export default englishAssessmentService;
