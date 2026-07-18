// frontend/src/services/speakingAiService.ts
// Backend-ready Spoken English AI service with SpeechRecognition check and mock fallback.

export interface SpeakingAnalysisResponse {
  correctedAnswer: string;
  betterAnswer: string;
  grammarMistakes: string[];
  pronunciationHints: string[];
  fluencyScore: number;
  wordsToRepeat: string[];
  speakingPracticeLine: string;
  isRealAI: boolean;
}

const BACKEND_BASE = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api") + "/ai";

async function postToBackend(endpoint: string, body: any): Promise<any> {
  try {
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const response = await fetch(`${BACKEND_BASE}${endpoint}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    const data = await response.json();
    return { ...data, isRealAI: true };
  } catch (err) {
    console.warn(`[Speaking AI Service] Backend API ${endpoint} failed/unavailable. Using local Mock AI fallback.`, err);
    return null;
  }
}

export const speakingAiService = {
  isSpeechRecognitionSupported(): boolean {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    return !!SpeechRecognition;
  },

  getSpeechRecognitionInstance(): any {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return null;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = "en-US";
    recognition.interimResults = false;
    return recognition;
  },

  async analyzeSpeaking(
    audioBlob: Blob | null,
    transcript: string,
    question: string,
    lessonContext?: any
  ): Promise<SpeakingAnalysisResponse> {
    const backendResult = await postToBackend("/analyze-speaking", {
      transcript,
      question,
      lessonContext,
      hasAudio: !!audioBlob
    });
    if (backendResult) return backendResult;

    // Fallback: rule-based word matcher and analyzer
    const cleanTranscript = transcript.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    const cleanTarget = question.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");

    const transcriptWords = cleanTranscript.split(/\s+/).filter(Boolean);
    const targetWords = cleanTarget.split(/\s+/).filter(Boolean);

    // Calculate basic word overlap score
    const matches = targetWords.filter(w => transcriptWords.includes(w));
    const scorePct = targetWords.length > 0 ? Math.round((matches.length / targetWords.length) * 100) : 70;
    const fluencyScore = Math.max(30, Math.min(100, scorePct));

    const missingWords = targetWords.filter(w => !transcriptWords.includes(w));
    const extraWords = transcriptWords.filter(w => !targetWords.includes(w));

    let correctedAnswer = transcript;
    let betterAnswer = question;
    const grammarMistakes: string[] = [];
    const pronunciationHints: string[] = [];
    const wordsToRepeat: string[] = [...missingWords.slice(0, 3)];

    // Grammar/pronunciation heuristic hints
    if (missingWords.length > 0) {
      pronunciationHints.push(`Try to pronounce these words more clearly: ${missingWords.slice(0, 3).join(", ")}`);
    }
    if (extraWords.length > 2) {
      grammarMistakes.push("Avoid adding filler words or deviating too much from the target sentence structure.");
    }
    if (transcriptWords.includes("am") && transcriptWords.includes("agree")) {
      grammarMistakes.push("Say 'I agree' instead of 'I am agree'.");
      correctedAnswer = correctedAnswer.replace("am agree", "agree");
    }

    return {
      correctedAnswer: correctedAnswer || transcript || "Check your input.",
      betterAnswer: betterAnswer || "The standard pattern.",
      grammarMistakes,
      pronunciationHints,
      fluencyScore,
      wordsToRepeat,
      speakingPracticeLine: question || "Try reading this out loud again.",
      isRealAI: false
    };
  },

  speakAloud(text: string): void {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel(); // Stop any pending speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9; // Slightly slower for language learners
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn("speechSynthesis is not supported in this browser.");
    }
  },

  getMockSpeakingFeedback(transcript: string, targetSentence: string): MockSpeakingCoachFeedback {
    const clean = (s: string) => s.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").replace(/\s+/g, " ").trim();
    const cleanUser = clean(transcript);
    const cleanTarget = clean(targetSentence);

    const userWords = cleanUser ? cleanUser.split(" ") : [];
    const targetWords = cleanTarget ? cleanTarget.split(" ") : [];

    const userWordSet = new Set(userWords);
    const missingWrongWords = targetWords.filter(w => !userWordSet.has(w));

    let score = 0;
    if (targetWords.length > 0) {
      const matchedCount = targetWords.length - missingWrongWords.length;
      score = Math.round((matchedCount / targetWords.length) * 10);
    }
    if (userWords.length > 0 && score === 0) {
      score = 1;
    }

    let mistakeType = "None";
    if (missingWrongWords.length > 0) {
      mistakeType = "Word Omission / Transcript Mismatch";
    } else if (userWords.length > targetWords.length) {
      mistakeType = "Extra Words / Addition";
    }

    let hinglishExplanation = "";
    if (score === 10) {
      hinglishExplanation = "Aapne bilkul sahi pronounce kiya hai! Har ek word target sentence se poori tarah match karta hai. Aise hi practice karte rahein!";
    } else if (score >= 8) {
      hinglishExplanation = `Aapki speaking bahut acchi hai! Sirf kuch minor differences hain. Aapne '${missingWrongWords.join(", ")}' ko sahi se bolne ki koshish karni hai.`;
    } else if (score >= 5) {
      hinglishExplanation = `Accha prayas hai! Lekin aapne target sentence ke kuch important words miss kiye hain: '${missingWrongWords.join(", ")}'. Ek baar speaker se suniye aur fir se try kijiye.`;
    } else {
      hinglishExplanation = `Aapko is sentence ko thoda aur practice karne ki zaroorat hai. Aapne maximum words galat bole ya miss kiye hain: '${missingWrongWords.join(", ")}'. Target sentence se match karne ki koshish karein.`;
    }

    return {
      score,
      transcript,
      correctedTranscript: targetSentence,
      betterSpokenSentence: targetSentence,
      missingWrongWords,
      mistakeType,
      hinglishExplanation,
    };
  }
};

export interface MockSpeakingCoachFeedback {
  score: number;
  transcript: string;
  correctedTranscript: string;
  betterSpokenSentence: string;
  missingWrongWords: string[];
  mistakeType: string;
  hinglishExplanation: string;
}

export default speakingAiService;
