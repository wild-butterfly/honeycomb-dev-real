import { apiGet, apiPost, apiPut, apiDelete } from "./api";

/* ───────── Types ───────── */

export type Task = {
  id: string;
  description: string;
  assigned: number[];
  due: string;
  status: "pending" | "completed";
  completedBy?: number;
  createdAt?: string;
};

/* ───────── Normalizer ───────── */

const normalizeTask = (t: any): Task => ({
  id: String(t.id),
  description: String(t.description ?? ""),
  assigned: Array.isArray(t.assigned) ? t.assigned.map(Number) : [],
  due: String(t.due ?? ""),
  status: t.status === "completed" ? "completed" : "pending",
  completedBy: t.completedBy ?? undefined,
  createdAt: t.createdAt ?? undefined,
});

/* ───────── CREATE ───────── */

export const createTask = async (input: {
  description: string;
  assigned: number[];
  due: string;
}): Promise<Task> => {
  const res = await apiPost<any>("/tasks", input);
  return normalizeTask(res);
};

/* ───────── GET ───────── */

export const getTasks = async (): Promise<Task[]> => {
  const res = await apiGet<any[]>("/tasks");
  return (Array.isArray(res) ? res : []).map(normalizeTask);
};

/* ───────── DELETE ───────── */

export const deleteTask = async (taskId: string): Promise<void> => {
  await apiDelete(`/tasks/${taskId}`);
};

/* ───────── COMPLETE ───────── */

export const completeTask = async (taskId: string): Promise<Task> => {
  const res = await apiPut<any>(`/tasks/${taskId}/complete`, {});
  return normalizeTask(res);
};

/* ───────── CLEAN ───────── */

export const deleteAllCompletedTasks = async (): Promise<void> => {
  await apiDelete(`/tasks/completed`);
};