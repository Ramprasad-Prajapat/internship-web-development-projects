// frontend/src/services/notebookAiService.ts
// Backend-ready Notebook AI service with local Mock AI fallback.

export interface NotebookSummaryResponse {
  summary: string[];
  isRealAI: boolean;
}

export interface NotebookVocabResponse {
  vocabulary: Array<{
    word: string;
    meaning: string;
    example: string;
    status: "known" | "need-practice";
  }>;
  isRealAI: boolean;
}

export interface NotebookQuestionsResponse {
  questions: Array<{
    id: string;
    type: "fill_blank" | "true_false";
    questionText: string;
    expectedAnswer: string;
  }>;
  isRealAI: boolean;
}

export interface NotebookSentenceRewriteResponse {
  corrected: string;
  explanation: string;
  betterOption: string;
  isRealAI: boolean;
}

const BACKEND_BASE = "http://localhost:8080/api/ai";

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
    console.warn(`[Notebook AI Service] Backend API ${endpoint} failed/unavailable. Using local Mock AI fallback.`, err);
    return null;
  }
}

export const notebookAiService = {
  async summarizeNote(noteContent: string): Promise<NotebookSummaryResponse> {
    const backendResult = await postToBackend("/notebook-review", { content: noteContent, action: "summarize" });
    if (backendResult) return backendResult;

    // Fallback Mock AI summary
    const sentences = noteContent.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
    const summary = [
      sentences[0] ? `Core idea: ${sentences[0]}.` : "Introduces the primary subject of study.",
      sentences[1] ? `Elaboration: ${sentences[1]}.` : "Details specific grammatical structures or patterns.",
      sentences[2] ? `Application: ${sentences[2]}.` : "Provides contextual examples for daily practice."
    ];

    return {
      summary,
      isRealAI: false
    };
  },

  async extractVocabulary(noteContent: string): Promise<NotebookVocabResponse> {
    const backendResult = await postToBackend("/notebook-review", { content: noteContent, action: "vocabulary" });
    if (backendResult) return backendResult;

    // Fallback Mock AI vocabulary extractor
    const words = noteContent.replace(/[^a-zA-Z\s]/g, "").split(/\s+/);
    const filteredWords = Array.from(new Set(
      words.filter(w => w.length > 5 && /^[A-Z]/.test(w) || w.length > 7)
    )).slice(0, 4);

    const vocabulary: NotebookVocabResponse["vocabulary"] = filteredWords.map(w => ({
      word: w,
      meaning: `The dictionary definition for '${w.toLowerCase()}' in learning context.`,
      example: `This is a practice sentence using the word '${w}'.`,
      status: "need-practice"
    }));

    // If nothing found
    if (vocabulary.length === 0) {
      vocabulary.push({
        word: "English",
        meaning: "A West Germanic language that was first spoken in early medieval England.",
        example: "I am learning English online.",
        status: "known" as const
      });
    }

    return {
      vocabulary,
      isRealAI: false
    };
  },

  async generateNotebookQuestions(noteContent: string): Promise<NotebookQuestionsResponse> {
    const backendResult = await postToBackend("/notebook-review", { content: noteContent, action: "questions" });
    if (backendResult) return backendResult;

    // Fallback Mock AI question generator
    const questions: NotebookQuestionsResponse["questions"] = [
      {
        id: `ntb-q-${Date.now()}-1`,
        type: "fill_blank",
        questionText: "Complete the following statement with the correct meaning of the content: 'Practice makes _______.'",
        expectedAnswer: "perfect"
      },
      {
        id: `ntb-q-${Date.now()}-2`,
        type: "true_false",
        questionText: "True or False: We should only practice writing and avoid speaking checks.",
        expectedAnswer: "false"
      }
    ];

    return {
      questions,
      isRealAI: false
    };
  },

  async rewriteSavedSentence(sentence: string): Promise<NotebookSentenceRewriteResponse> {
    const backendResult = await postToBackend("/notebook-review", { content: sentence, action: "rewrite-sentence" });
    if (backendResult) return backendResult;

    // Fallback Mock AI sentence rewrite
    let corrected = sentence.trim();
    let explanation = "No obvious grammar errors detected in this sentence.";
    let betterOption = sentence;

    const lower = sentence.toLowerCase();
    if (lower.includes("looking forward to see")) {
      corrected = sentence.replace(/looking forward to see/gi, "looking forward to seeing");
      explanation = "Use gerund form '-ing' after prepositional phrase 'looking forward to'.";
      betterOption = "I am looking forward to seeing you soon.";
    } else if (lower.includes("am agree") || lower.includes("is agree")) {
      corrected = sentence.replace(/am agree/gi, "agree").replace(/is agree/gi, "agrees");
      explanation = "Agree is a main verb and should not be used with helper verb 'am/is'.";
      betterOption = "I strongly agree with this suggestion.";
    }

    return {
      corrected,
      explanation,
      betterOption,
      isRealAI: false
    };
  }
};

export default notebookAiService;
