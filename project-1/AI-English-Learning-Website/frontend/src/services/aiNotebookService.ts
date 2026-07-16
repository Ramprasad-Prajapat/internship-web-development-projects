import apiClient from "./apiClient";
import historyService from "./historyService";
import type { NotebookItem, NotebookVocabulary, NotebookQuestion, NotebookMistake } from "../types/aiNotebook.types";

async function listNotes(): Promise<NotebookItem[]> {
  const response: any = await apiClient.get("/notebook");
  return response.data || [];
}

async function getNoteById(id: string): Promise<NotebookItem | null> {
  const all = await listNotes();
  return all.find((item) => item.id === id) || null;
}

async function saveOrUpdateNote(note: NotebookItem): Promise<NotebookItem> {
  const response: any = await apiClient.post("/notebook", note);
  return response.data;
}

async function createNote(input: {
  title: string;
  sourceType: NotebookItem["sourceType"];
  originalContent: string;
  note?: string;
  tags?: string[];
  writingDraft?: string;
  speakingTranscript?: string;
  isUserCreated?: boolean;
  isAdminContent?: boolean;
  contentOwner?: "user" | "admin";
  moduleKey?: string;
}): Promise<NotebookItem> {
  const item: any = {
    title: input.title,
    sourceType: input.sourceType,
    originalContent: input.originalContent,
    note: input.note || "",
    tags: input.tags || [],
    status: "active",
    writingDraft: input.writingDraft,
    speakingTranscript: input.speakingTranscript,
    isUserCreated: input.isUserCreated ?? true,
    isAdminContent: input.isAdminContent ?? false,
    contentOwner: input.contentOwner || "user",
    moduleKey: input.moduleKey || "",
    savedVocabulary: [],
    generatedQuestions: [],
    mistakes: [],
  };
  return await saveOrUpdateNote(item);
}

async function updateNote(id: string, updates: Partial<NotebookItem>): Promise<NotebookItem> {
  const note = await getNoteById(id);
  if (!note) throw new Error("Note not found");
  const merged = { ...note, ...updates };
  return await saveOrUpdateNote(merged);
}

async function deleteNote(id: string): Promise<void> {
  await apiClient.delete(`/notebook/${id}`);
}

async function updateNoteStatus(id: string, status: "active" | "archived"): Promise<NotebookItem> {
  const note = await getNoteById(id);
  if (!note) throw new Error("Note not found");
  note.status = status;
  return await saveOrUpdateNote(note);
}

async function addVocabularyItem(id: string, vocab: NotebookVocabulary): Promise<NotebookItem> {
  const note = await getNoteById(id);
  if (!note) throw new Error("Note not found");
  note.savedVocabulary = note.savedVocabulary ?? [];
  note.savedVocabulary.push(vocab);
  return await saveOrUpdateNote(note);
}

async function addMistakeItem(id: string, mistake: NotebookMistake): Promise<NotebookItem> {
  const note = await getNoteById(id);
  if (!note) throw new Error("Note not found");
  note.mistakes = note.mistakes ?? [];
  note.mistakes.push(mistake);
  return await saveOrUpdateNote(note);
}

async function logPracticeHistory(type: any, noteId: string, title: string, desc: string) {
  await historyService.addEntry({
    type,
    title,
    description: desc,
    sourceType: "NOTEBOOK",
    sourceId: noteId,
  });
}

export const aiNotebookService = {
  listNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  updateNoteStatus,
  addVocabularyItem,
  addMistakeItem,
  logPracticeHistory,
  saveOrUpdateNote
};

export default aiNotebookService;
