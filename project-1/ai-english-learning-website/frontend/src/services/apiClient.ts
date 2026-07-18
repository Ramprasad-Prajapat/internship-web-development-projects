import axios from "axios";
import { mockDatabase, DB_KEYS } from "./mockDatabase";

const isMock = (import.meta.env.VITE_API_MODE ?? "mock") === "mock";
const enableMockFallback = (import.meta.env.VITE_ENABLE_MOCK_FALLBACK ?? "true") === "true";
const baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api";

const axiosInstance = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Mock handler for client-side fallback when running in mock mode or offline
async function handleMockRequest(method: string, url: string, data?: any, params?: any): Promise<{ data: any }> {
  const cleanUrl = url.split("?")[0];

  // Auth Endpoints
  if (cleanUrl.endsWith("/auth/register") || cleanUrl.endsWith("/auth/login")) {
    const email = data?.email || "demo@english.app";
    const name = data?.name || email.split("@")[0];
    const user = { id: 1, name, email, level: "BEGINNER" };
    const token = "mock_jwt_token_" + Date.now();
    return { data: { token, user } };
  }
  if (cleanUrl.endsWith("/auth/me")) {
    const stored = localStorage.getItem("user");
    const user = stored ? JSON.parse(stored) : { id: 1, name: "Demo Learner", email: "demo@english.app", level: "BEGINNER" };
    return { data: user };
  }
  if (cleanUrl.endsWith("/profile")) {
    const stored = localStorage.getItem("user");
    const user = stored ? { ...JSON.parse(stored), ...data } : { id: 1, name: "Learner", ...data };
    localStorage.setItem("user", JSON.stringify(user));
    return { data: user };
  }

  // Lessons
  if (cleanUrl.includes("/lessons/day/")) {
    const parts = cleanUrl.split("/");
    const dayNum = parseInt(parts[parts.length - 1], 10) || 1;
    return {
      data: {
        id: `day_${dayNum}`,
        dayNumber: dayNum,
        title: `Day ${dayNum} Practice`,
        rawContent: `Day ${dayNum} content overview and exercises.`,
        tags: ["grammar", "speaking"],
        sections: [
          { id: `sec_${dayNum}_1`, title: "Vocabulary", category: "vocabulary", content: "Word list" },
          { id: `sec_${dayNum}_2`, title: "Grammar", category: "grammar", content: "Grammar rules" }
        ]
      }
    };
  }
  if (cleanUrl.endsWith("/lessons")) {
    return {
      data: Array.from({ length: 7 }, (_, i) => ({
        id: `day_${i + 1}`,
        dayNumber: i + 1,
        title: `Day ${i + 1} Practice`,
        tags: ["daily"]
      }))
    };
  }

  // Notebook
  if (cleanUrl.endsWith("/notebook")) {
    if (method === "GET") {
      const items = mockDatabase.getCollection(DB_KEYS.notebookItems);
      return { data: items };
    }
    if (method === "POST") {
      const item = { id: data.id || mockDatabase.uid("note"), createdAt: mockDatabase.nowIso(), ...data };
      const items = mockDatabase.getCollection<any>(DB_KEYS.notebookItems);
      const filtered = items.filter((i) => i.id !== item.id);
      mockDatabase.setCollection(DB_KEYS.notebookItems, [item, ...filtered]);
      return { data: item };
    }
  }
  if (cleanUrl.includes("/notebook/")) {
    const id = cleanUrl.split("/").pop();
    if (method === "DELETE") {
      const items = mockDatabase.getCollection<any>(DB_KEYS.notebookItems).filter((i) => i.id !== id);
      mockDatabase.setCollection(DB_KEYS.notebookItems, items);
      return { data: { success: true } };
    }
  }

  // Practice
  if (cleanUrl.endsWith("/practice/check")) {
    const answer = {
      id: mockDatabase.uid("ans"),
      sourceType: data?.sourceType || "DAILY_LESSON",
      sourceId: data?.sourceId || "1",
      questionText: data?.questionText || "",
      answerText: data?.answerText || "",
      status: "passed",
      score: 85,
      feedback: "Good sentence structure!",
      createdAt: mockDatabase.nowIso()
    };
    mockDatabase.addToCollection(DB_KEYS.practiceAnswers, answer);
    return { data: answer };
  }
  if (cleanUrl.endsWith("/practice/history")) {
    const answers = mockDatabase.getCollection(DB_KEYS.practiceAnswers);
    return { data: answers };
  }

  // Homework
  if (cleanUrl.includes("/homework/")) {
    if (cleanUrl.endsWith("/check")) {
      return { data: { status: "passed", feedback: "Good homework completion!" } };
    }
    return { data: { id: "hw_1", content: "Write 3 sentences", submitted: false } };
  }

  // Mistakes
  if (cleanUrl.endsWith("/mistakes")) {
    if (method === "GET") {
      return { data: mockDatabase.getCollection(DB_KEYS.mistakes) };
    }
    if (method === "POST") {
      const item = { id: mockDatabase.uid("mst"), createdAt: mockDatabase.nowIso(), fixed: false, ...data };
      mockDatabase.addToCollection(DB_KEYS.mistakes, item);
      return { data: item };
    }
  }
  if (cleanUrl.includes("/mistakes/")) {
    const parts = cleanUrl.split("/");
    const id = parts[parts.length - 2] || parts[parts.length - 1];
    if (method === "DELETE") {
      const items = mockDatabase.getCollection<any>(DB_KEYS.mistakes).filter((m) => m.id !== id);
      mockDatabase.setCollection(DB_KEYS.mistakes, items);
      return { data: { success: true } };
    }
    if (cleanUrl.endsWith("/fixed")) {
      const items = mockDatabase.getCollection<any>(DB_KEYS.mistakes).map((m) => (m.id === id ? { ...m, fixed: true } : m));
      mockDatabase.setCollection(DB_KEYS.mistakes, items);
      return { data: { id, fixed: true } };
    }
  }

  // Reports / Progress
  if (cleanUrl.endsWith("/progress")) {
    return { data: [{ dayNumber: 1, completed: true }] };
  }
  if (cleanUrl.endsWith("/reports/history")) {
    return { data: [] };
  }
  if (cleanUrl.endsWith("/reports/summary")) {
    return { data: { overallScore: 80, completedLessons: 3, streak: 3 } };
  }

  // Self check submissions fallback
  if (cleanUrl.endsWith("/self-check/submissions")) {
    if (method === "GET") {
      const items = mockDatabase.getCollection(DB_KEYS.selfCheckSubmissions);
      return { data: items };
    }
    if (method === "POST") {
      const item = { id: mockDatabase.uid("sc"), submittedAt: mockDatabase.nowIso(), ...data };
      const items = mockDatabase.getCollection<any>(DB_KEYS.selfCheckSubmissions);
      mockDatabase.setCollection(DB_KEYS.selfCheckSubmissions, [item, ...items]);
      return { data: item };
    }
  }

  // Admin endpoints fallback
  if (cleanUrl.includes("/admin/lessons")) {
    return { data: { success: true } };
  }

  return { data: Array.isArray(data) ? [] : {} };
}

export const apiClient = {
  async get(url: string, config?: any) {
    if (isMock) return handleMockRequest("GET", url, undefined, config?.params);
    try {
      return await axiosInstance.get(url, config);
    } catch (err: any) {
      if (!enableMockFallback || err.response) throw err;
      console.warn("Backend unavailable, falling back to mock:", url);
      return handleMockRequest("GET", url, undefined, config?.params);
    }
  },
  async post(url: string, data?: any, config?: any) {
    if (isMock) return handleMockRequest("POST", url, data, config?.params);
    try {
      return await axiosInstance.post(url, data, config);
    } catch (err: any) {
      if (!enableMockFallback || err.response) throw err;
      console.warn("Backend unavailable, falling back to mock:", url);
      return handleMockRequest("POST", url, data, config?.params);
    }
  },
  async put(url: string, data?: any, config?: any) {
    if (isMock) return handleMockRequest("PUT", url, data, config?.params);
    try {
      return await axiosInstance.put(url, data, config);
    } catch (err: any) {
      if (!enableMockFallback || err.response) throw err;
      console.warn("Backend unavailable, falling back to mock:", url);
      return handleMockRequest("PUT", url, data, config?.params);
    }
  },
  async delete(url: string, config?: any) {
    if (isMock) return handleMockRequest("DELETE", url, undefined, config?.params);
    try {
      return await axiosInstance.delete(url, config);
    } catch (err: any) {
      if (!enableMockFallback || err.response) throw err;
      console.warn("Backend unavailable, falling back to mock:", url);
      return handleMockRequest("DELETE", url, undefined, config?.params);
    }
  },
  async patch(url: string, data?: any, config?: any) {
    if (isMock) return handleMockRequest("PATCH", url, data, config?.params);
    try {
      return await axiosInstance.patch(url, data, config);
    } catch (err: any) {
      if (!enableMockFallback || err.response) throw err;
      console.warn("Backend unavailable, falling back to mock:", url);
      return handleMockRequest("PATCH", url, data, config?.params);
    }
  },
};

export default apiClient;
