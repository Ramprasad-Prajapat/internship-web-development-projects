// frontend/src/services/writingAiService.ts
// Backend-ready Writing AI service with local fallback and mistake saving.

import mistakeService from "./mistakeService";

export interface WritingAnalysisResponse {
  score: number;
  correctedSentence: string;
  hints: string[];
  simpleRule: string;
  mistakeType: string;
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
    console.warn(`[Writing AI Service] Backend API ${endpoint} failed/unavailable. Using local Mock AI fallback.`, err);
    return null;
  }
}

export const writingAiService = {
  async checkWriting(text: string, prompt?: string, autoSave: boolean = true): Promise<WritingAnalysisResponse> {
    const backendResult = await postToBackend("/check-writing", { text, prompt });
    
    let result: WritingAnalysisResponse;
    if (backendResult) {
      result = backendResult;
    } else {
      // Fallback: rule-based checks
      let score = 100;
      let correctedSentence = text.trim();
      const hints: string[] = [];
      let simpleRule = "Perfect! Your sentence follows correct English conventions.";
      let mistakeType = "none";

      // 1. Capitalization check
      if (correctedSentence.length > 0 && correctedSentence[0] !== correctedSentence[0].toUpperCase()) {
        score -= 10;
        correctedSentence = correctedSentence[0].toUpperCase() + correctedSentence.slice(1);
        hints.push("Capitalize the first letter of a sentence.");
        simpleRule = "Sentences must start with a capital letter.";
        mistakeType = "capitalization";
      }

      // 2. Punctuation check
      if (correctedSentence.length > 0 && !/[.!?]$/.test(correctedSentence)) {
        score -= 10;
        correctedSentence += ".";
        hints.push("Add terminal punctuation (period, question mark, or exclamation point).");
        simpleRule = "Sentences must end with proper punctuation.";
        mistakeType = "punctuation";
      }

      // 3. Common grammatical mistakes checking
      const lower = text.toLowerCase();
      if (lower.includes("am agree") || lower.includes("is agree")) {
        score -= 20;
        correctedSentence = correctedSentence.replace(/am agree/gi, "agree").replace(/is agree/gi, "agrees");
        hints.push("Use 'agree' as a verb directly. Avoid using the auxiliary verb 'am/is' with 'agree'.");
        simpleRule = "Say 'I agree' instead of 'I am agree'.";
        mistakeType = "grammar";
      } else if (lower.includes("looking forward to see")) {
        score -= 25;
        correctedSentence = correctedSentence.replace(/looking forward to see/gi, "looking forward to seeing");
        hints.push("Use the gerund form (-ing) after the prepositional phrase 'looking forward to'.");
        simpleRule = "Use gerund (seeing) after 'looking forward to'.";
        mistakeType = "grammar";
      } else if (lower.includes("interested on")) {
        score -= 20;
        correctedSentence = correctedSentence.replace(/interested on/gi, "interested in");
        hints.push("Use the preposition 'in' after the adjective 'interested'.");
        simpleRule = "Interested is followed by the preposition 'in'.";
        mistakeType = "grammar";
      } else if (lower.includes("depend of")) {
        score -= 20;
        correctedSentence = correctedSentence.replace(/depend of/gi, "depend on");
        hints.push("Use the preposition 'on' after the verb 'depend'.");
        simpleRule = "Depend is followed by the preposition 'on'.";
        mistakeType = "grammar";
      }

      result = {
        score: Math.max(30, score),
        correctedSentence,
        hints,
        simpleRule,
        mistakeType,
        isRealAI: false
      };
    }

    // Auto-save to mistakes log if the score is less than 100
    if (autoSave && result.score < 100) {
      try {
        await mistakeService.saveMistake({
          sourceType: "WRITING",
          sourceTitle: prompt || "Writing Check Practice",
          wrongSentence: text,
          correctSentence: result.correctedSentence,
          simpleRule: result.simpleRule,
          mistakeType: result.mistakeType as any
        });
      } catch (err) {
        console.error("[Writing AI Service] Failed to save mistake log:", err);
      }
    }

    return result;
  }
};

export default writingAiService;
