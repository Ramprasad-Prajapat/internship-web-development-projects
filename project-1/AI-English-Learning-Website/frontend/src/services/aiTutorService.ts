// frontend/src/services/aiTutorService.ts
// Backend-ready AI Tutor service layer with local Mock AI fallback.

export interface ExplainContentResponse {
  explanation: string;
  simpleRule?: string;
  isRealAI: boolean;
}

export interface GeneratePracticeResponse {
  questions: Array<{
    id: string;
    type: "blank" | "correct" | "make" | "choice";
    question: string;
    choices?: string[];
    correctAnswer: string;
    simpleRule: string;
    source: string;
  }>;
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
    console.warn(`[AI Tutor Service] Backend API ${endpoint} failed/unavailable. Using local Mock AI fallback.`, err);
    return null;
  }
}

export const aiTutorService = {
  async explainContent(content: string, context?: string): Promise<ExplainContentResponse> {
    const backendResult = await postToBackend("/explain-content", { content, context });
    if (backendResult) return backendResult;

    // Fallback: rule-based beginner-friendly explanations
    let explanation = `Here is a simple explanation of the content: "${content}"`;
    let simpleRule = "Focus on the main verbs and word connections.";

    const lowercaseContent = content.toLowerCase();
    if (lowercaseContent.includes("preposition") || lowercaseContent.includes(" in ") || lowercaseContent.includes(" on ") || lowercaseContent.includes(" at ")) {
      explanation = "This content focuses on Prepositions (in, on, at, to). Prepositions show where things are or when they happen. Remember: 'in' is for closed spaces, 'on' is for surfaces, and 'at' is for specific points.";
      simpleRule = "Prepositions connect nouns to other parts of a sentence.";
    } else if (lowercaseContent.includes("had") && (lowercaseContent.includes("past") || lowercaseContent.includes("perfect"))) {
      explanation = "This content uses the Past Perfect tense (had + past participle). We use it to talk about an action that happened before another action in the past. Example: 'The train had left before I arrived.'";
      simpleRule = "Had + verb-3rd-form describes the older of two past events.";
    } else if (lowercaseContent.length < 20) {
      explanation = `"${content}" represents basic vocabulary. Try incorporating this word into your daily practice dialogues!`;
      simpleRule = "Learn new words in context rather than in isolation.";
    }

    return {
      explanation,
      simpleRule,
      isRealAI: false,
    };
  },

  async generatePracticeQuestions(content: string, count: number = 3): Promise<GeneratePracticeResponse> {
    const backendResult = await postToBackend("/generate-practice", { content, count });
    if (backendResult) return backendResult;

    // Fallback Mock AI question generation
    const words = content.replace(/[^a-zA-Z\s]/g, "").split(/\s+/).filter(w => w.length > 3);
    const questions: GeneratePracticeResponse["questions"] = [];

    // Generate up to 'count' questions
    for (let i = 0; i < Math.min(count, 3); i++) {
      if (i === 0 && words.length > 0) {
        const targetWord = words[Math.floor(words.length / 2)] || "English";
        const sentenceWithBlank = content.replace(new RegExp(`\\b${targetWord}\\b`, "i"), "_______");
        questions.push({
          id: `tutor-gen-blank-${Date.now()}-${i}`,
          type: "blank",
          question: `Fill in the blank: "${sentenceWithBlank}"`,
          correctAnswer: targetWord,
          simpleRule: `Complete the sentence with the missing vocabulary term: ${targetWord}`,
          source: "AI Tutor Session",
        });
      } else if (i === 1 && words.length > 1) {
        const wordToUse = words[0] || "practice";
        questions.push({
          id: `tutor-gen-make-${Date.now()}-${i}`,
          type: "make",
          question: `Construct a new sentence using the word: "${wordToUse}"`,
          correctAnswer: wordToUse,
          simpleRule: `Show understanding of the word '${wordToUse}' by writing a short sentence.`,
          source: "AI Tutor Session",
        });
      } else {
        questions.push({
          id: `tutor-gen-correct-${Date.now()}-${i}`,
          type: "correct",
          question: `Correct any grammar or capitalization errors: "${content.toLowerCase()}"`,
          correctAnswer: content,
          simpleRule: "Ensure proper sentence casing and punctuation.",
          source: "AI Tutor Session",
        });
      }
    }

    // Default if questions array is empty
    if (questions.length === 0) {
      questions.push({
        id: `tutor-gen-default`,
        type: "blank",
        question: "Select the correct option: 'She ___ learning English.'",
        choices: ["is", "are", "am"],
        correctAnswer: "is",
        simpleRule: "Third-person singular takes 'is'.",
        source: "AI Tutor Session",
      });
    }

    return {
      questions,
      isRealAI: false,
    };
  },

  async suggestWeakAreaPractice(weakAreas: string[]): Promise<{ suggestion: string; isRealAI: boolean }> {
    const backendResult = await postToBackend("/weekly-review", { weakAreas }); // maps to weekly review diagnostics
    if (backendResult) return backendResult;

    let suggestion = "Review writing drafts in the AI Notebook and practice reading out loud.";
    if (weakAreas.length > 0) {
      const primary = weakAreas[0];
      if (primary.toLowerCase().includes("prepositions")) {
        suggestion = "Review the Prepositions of Place practice module. Focus on selecting correct prepositions in context exercises.";
      } else if (primary.toLowerCase().includes("grammar") || primary.toLowerCase().includes("writing")) {
        suggestion = "Rewrite your saved mistakes in the Mistakes Log, and try to write a 3-sentence summary of your day in the Notebook.";
      } else if (primary.toLowerCase().includes("speaking") || primary.toLowerCase().includes("pronunciation")) {
        suggestion = "Perform 3 speaking checks in the Practice Center using your device microphone to check for phonetic accuracy.";
      }
    }

    return {
      suggestion,
      isRealAI: false,
    };
  },

  async askSentenceCoach(
    action: "explain_examples" | "give_examples" | "check_sentence" | "improve_sentence" | "generate_quiz",
    query: string,
    examples: string[],
    patternInfo: { pattern: string; description: string; formula: string }
  ): Promise<{
    result: "correct" | "incorrect" | "success" | "unrelated";
    answer: string;
    correctedSentence?: string;
    explanation: string;
    weakPattern?: string;
    isRealAI: boolean;
  }> {
    // Check if query is unrelated to topic/English learning (very basic check)
    const lowerQuery = query.toLowerCase();
    const isUnrelatedQuery =
      action === "check_sentence" &&
      lowerQuery.length > 0 &&
      !lowerQuery.includes("sentence") &&
      !lowerQuery.includes("english") &&
      (lowerQuery.includes("code") ||
        lowerQuery.includes("programming") ||
        lowerQuery.includes("javascript") ||
        lowerQuery.includes("react") ||
        lowerQuery.includes("html") ||
        lowerQuery.includes("sql") ||
        lowerQuery.includes("database") ||
        lowerQuery.includes("history") ||
        lowerQuery.includes("science"));

    if (isUnrelatedQuery) {
      return {
        result: "unrelated",
        answer: "This coach helps with this sentence section only.",
        explanation: "I can check your practice sentences, explain the pattern, or provide more examples related to today's lesson. Please write a sentence using the current pattern to practice.",
        isRealAI: false,
      };
    }

    if (action === "explain_examples") {
      const examplesList = examples.length > 0
        ? examples.map((ex, i) => `  ${i + 1}. "${ex}"`).join("\n")
        : "  No examples found in today's lesson.";

      return {
        result: "success",
        answer: "Here is the explanation for today's sentence pattern:",
        explanation: `### Sentence Pattern: **${patternInfo.pattern}**\n\n**Description:** ${patternInfo.description}\n\n**Structure / Formula:**\n\`${patternInfo.formula}\`\n\n**Today's Examples:**\n${examplesList}`,
        isRealAI: false,
      };
    }

    if (action === "give_examples") {
      let newExamples = [
        "I enjoy learning English in the evening.",
        "She writes a detailed email to her colleague.",
        "We watch an educational tutorial together."
      ];

      const pat = patternInfo.pattern.toLowerCase();
      if (pat.includes("verb(s/es)") || pat.includes("routine")) {
        newExamples = [
          "I wash my face at 7:15 AM every day.",
          "She reads a storybook before sleeping at night.",
          "He catches the city train at 9:00 AM sharp."
        ];
      } else if (pat.includes("base/present")) {
        newExamples = [
          "They build a sandcastle on the beach.",
          "I eat a fresh apple after my workouts.",
          "We sing a beautiful song together."
        ];
      } else if (pat.includes("name is") || pat.includes("i am")) {
        newExamples = [
          "My name is John.",
          "I am from Chicago.",
          "I am a software developer."
        ];
      } else if (pat.includes("this/that/these")) {
        newExamples = [
          "This is my brand new laptop.",
          "Those are wild birds on the roof.",
          "That is a very tall pine tree."
        ];
      } else if (pat.includes("there is") || pat.includes("there are")) {
        newExamples = [
          "There is a sleeping cat under the wooden bed.",
          "There are some fresh cookies inside the glass jar.",
          "There is a beautiful oil painting hanging on the wall."
        ];
      }

      return {
        result: "success",
        answer: "Here are 3 new example sentences applying today's pattern:",
        explanation: newExamples.map((ex, i) => `${i + 1}. **${ex}**`).join("\n\n"),
        isRealAI: false,
      };
    }

    if (action === "check_sentence") {
      const trimmed = query.trim();
      if (trimmed.length < 5) {
        return {
          result: "incorrect",
          answer: "Your sentence is too short or incomplete.",
          explanation: "Try writing a complete sentence with a Subject, Verb, and Object/Complement.",
          weakPattern: "Incomplete Sentence",
          isRealAI: false,
        };
      }

      // Check capitalization
      if (trimmed[0] !== trimmed[0].toUpperCase()) {
        const corrected = trimmed[0].toUpperCase() + trimmed.slice(1);
        return {
          result: "incorrect",
          answer: `Incorrect capitalization in: "${trimmed}"`,
          correctedSentence: corrected,
          explanation: "In English, every sentence must start with a capital letter. Please check the corrected version below.",
          weakPattern: "Sentence Capitalization",
          isRealAI: false,
        };
      }

      // Check punctuation
      const lastChar = trimmed[trimmed.length - 1];
      if (lastChar !== "." && lastChar !== "?" && lastChar !== "!") {
        const corrected = trimmed + ".";
        return {
          result: "incorrect",
          answer: `Missing end punctuation in: "${trimmed}"`,
          correctedSentence: corrected,
          explanation: "Ensure your sentence ends with a period (.), question mark (?), or exclamation point (!).",
          weakPattern: "End Punctuation",
          isRealAI: false,
        };
      }

      // Pattern-specific check: Singular/Plural with There is/are
      const pat = patternInfo.pattern.toLowerCase();
      if (pat.includes("there is") || pat.includes("there are")) {
        if (/there\s+is\s+(two|three|four|five|six|seven|eight|nine|ten|many|several|some|few|\d+)\b/i.test(trimmed)) {
          const corrected = trimmed.replace(/there\s+is/i, "There are");
          return {
            result: "incorrect",
            answer: "Grammar mistake: Subject-Verb number disagreement.",
            correctedSentence: corrected,
            explanation: "Use 'There are' for plural nouns (e.g., 'three books', 'many cars'). 'There is' is only for singular nouns.",
            weakPattern: "Singular/Plural Agreement",
            isRealAI: false,
          };
        }
        if (/there\s+are\s+(a|an|one)\b/i.test(trimmed)) {
          const corrected = trimmed.replace(/there\s+are/i, "There is");
          return {
            result: "incorrect",
            answer: "Grammar mistake: Subject-Verb number disagreement.",
            correctedSentence: corrected,
            explanation: "Use 'There is' for singular nouns (e.g., 'a pen', 'one apple'). 'There are' is only for plural nouns.",
            weakPattern: "Singular/Plural Agreement",
            isRealAI: false,
          };
        }
      }

      // Pattern-specific check: SVO Routine singular third person
      if (pat.includes("verb(s/es)") || pat.includes("routine")) {
        const match = trimmed.match(/^(he|she|it)\s+(\w+)\b/i);
        if (match) {
          const subject = match[1];
          const verb = match[2].toLowerCase();
          
          const wrongVerbs: Record<string, string> = {
            wake: "wakes",
            brush: "brushes",
            play: "plays",
            go: "goes",
            drink: "drinks",
            read: "reads",
            like: "likes",
            work: "works",
            eat: "eats",
            write: "writes"
          };

          if (wrongVerbs[verb]) {
            const correctedVerb = wrongVerbs[verb];
            const corrected = trimmed.replace(new RegExp(`\\b${verb}\\b`, "i"), correctedVerb);
            return {
              result: "incorrect",
              answer: "Grammar mistake: Subject-Verb agreement error.",
              correctedSentence: corrected,
              explanation: `For singular third-person subjects (he, she, it), the verb must end with -s or -es (e.g., "he ${correctedVerb}", not "he ${verb}").`,
              weakPattern: "Subject-Verb Agreement",
              isRealAI: false,
            };
          }
        }
      }

      return {
        result: "correct",
        answer: "Excellent! Your sentence is grammatically correct.",
        explanation: `"${trimmed}" correctly follows the grammar rules and sentence structure for today's lesson: "${patternInfo.pattern}".`,
        isRealAI: false,
      };
    }

    if (action === "improve_sentence") {
      let improved = query;
      const trimmed = query.trim().replace(/\.$/, "");
      
      if (trimmed.toLowerCase().includes("wake up")) {
        improved = "I typically wake up at the crack of dawn, around 7:00 AM, to start my day productively.";
      } else if (trimmed.toLowerCase().includes("brush")) {
        improved = "It is my daily habit to brush my teeth thoroughly every morning right after I wake up.";
      } else if (trimmed.toLowerCase().includes("read")) {
        improved = "I make it a point to read an engaging book for at least thirty minutes before going to sleep.";
      } else if (trimmed.toLowerCase().includes("tea")) {
        improved = "She absolutely enjoys sipping a warm cup of herbal green tea to unwind in the afternoon.";
      } else {
        improved = `${trimmed} to actively practice and enhance my English fluency every day.`;
      }

      return {
        result: "success",
        answer: "Here is a suggestion to make your sentence sound more natural and advanced:",
        correctedSentence: improved,
        explanation: `**Original:** "${query}"\n**Natural Version:** "${improved}"\n\nAdding adverbs (like *typically*, *thoroughly*, *actively*) and descriptive clauses makes your sentence structure richer and sound more like a native speaker.`,
        isRealAI: false,
      };
    }

    if (action === "generate_quiz") {
      let question = "Fill in the blank: 'We ____ cricket on weekends.'";
      let choices = ["plays", "play", "playing"];
      let correctAnswer = "play";
      let exp = "Plural subject 'We' takes the base verb 'play' in simple present.";

      const pat = patternInfo.pattern.toLowerCase();
      if (pat.includes("there is") || pat.includes("there are")) {
        question = "Choose the correct option: 'There ____ three books on the table.'";
        choices = ["is", "are", "am"];
        correctAnswer = "are";
        exp = "Since 'three books' is plural, we must use 'There are'.";
      } else if (pat.includes("verb(s/es)") || pat.includes("routine")) {
        question = "Choose the correct option: 'He ____ his teeth every morning.'";
        choices = ["brush", "brushes", "brushing"];
        correctAnswer = "brushes";
        exp = "Singular third-person 'He' takes 'brushes' (verb + es) in the present simple.";
      }

      return {
        result: "success",
        answer: `### Sentence Coach Quiz\n\n${question}`,
        explanation: `Options:\n${choices.map((c, i) => `- ${String.fromCharCode(65 + i)}) ${c}`).join("\n")}\n\n**Correct Answer:** ${correctAnswer}\n**Explanation:** ${exp}`,
        isRealAI: false,
      };
    }

    return {
      result: "unrelated",
      answer: "This coach helps with this sentence section only.",
      explanation: "Ask me to explain the pattern, give more examples, check a sentence, or start a quiz.",
      isRealAI: false,
    };
  }
};

export default aiTutorService;
