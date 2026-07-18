import apiClient from "./apiClient";

export interface HomeworkProgress {
  sourceId: string;
  task_read: boolean;
  homework_written: boolean;
  homework_checked: boolean;
  homework_saved: boolean;
  note_saved: boolean;
  mistake_saved: boolean;
  section_completed: boolean;
  homeworkAnswerText?: string;
}

async function getProgress(sourceId: string): Promise<HomeworkProgress> {
  const response: any = await apiClient.get(`/homework/${sourceId}`);
  const data = response.data;
  return {
    sourceId: data.sourceId,
    task_read: data.homeworkChecked, // Map to backend checked state as approximation
    homework_written: data.homeworkWritten,
    homework_checked: data.homeworkChecked,
    homework_saved: data.homeworkSaved,
    note_saved: data.homeworkSaved,
    mistake_saved: data.homeworkSaved,
    section_completed: data.homeworkChecked,
    homeworkAnswerText: data.homeworkAnswerText || ""
  };
}

async function updateProgress(sourceId: string, updates: Partial<HomeworkProgress>): Promise<HomeworkProgress> {
  const payload: any = {};
  if (updates.hasOwnProperty("homework_written")) payload.homework_written = updates.homework_written;
  if (updates.hasOwnProperty("homework_checked")) payload.homework_checked = updates.homework_checked;
  if (updates.hasOwnProperty("homework_saved")) payload.homework_saved = updates.homework_saved;
  if (updates.hasOwnProperty("homeworkAnswerText")) payload.homeworkAnswerText = updates.homeworkAnswerText;

  const response: any = await apiClient.put(`/homework/${sourceId}`, payload);
  const data = response.data;
  return {
    sourceId: data.sourceId,
    task_read: data.homeworkChecked,
    homework_written: data.homeworkWritten,
    homework_checked: data.homeworkChecked,
    homework_saved: data.homeworkSaved,
    note_saved: data.homeworkSaved,
    mistake_saved: data.homeworkSaved,
    section_completed: data.homeworkChecked,
    homeworkAnswerText: data.homeworkAnswerText || ""
  };
}

async function checkHomework(sourceId: string, answerText: string): Promise<{ score: number; status: string; feedback: string }> {
  const response: any = await apiClient.post(`/homework/${sourceId}/check`, { answerText });
  return response.data;
}

export const homeworkService = {
  getProgress,
  updateProgress,
  checkHomework,
};

export default homeworkService;
