// src/services/tasks.ts
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";

/* ───────── TYPES ───────── */

export type Task = {
  id: string; // Firestore document id
  desc: string;
  assigned: number[];
  due: string; // yyyy-mm-dd
  status: "pending" | "completed";
  completedBy?: number; // employeeId
  createdAt?: Timestamp;
};

/* ───────── CREATE TASK ───────── */

export async function createTask(input: {
  desc: string;
  assigned: number[];
  due: string;
}) {
  const ref = await addDoc(collection(db, "tasks"), {
    desc: input.desc,
    assigned: input.assigned,
    due: input.due,
    status: "pending",
    createdAt: serverTimestamp(),
  });

  return ref;
}

/* ───────── REALTIME SUBSCRIBE ───────── */

export function subscribeToTasks(onChange: (tasks: Task[]) => void) {
  const q = query(collection(db, "tasks"), orderBy("createdAt", "desc"));

  return onSnapshot(q, (snap) => {
    const tasks: Task[] = snap.docs.map((d) => {
      const data = d.data() as Omit<Task, "id">;

      return {
        id: d.id,
        desc: data.desc,
        assigned: Array.isArray(data.assigned) ? data.assigned : [],
        due: data.due,
        status: data.status ?? "pending",
        completedBy: data.completedBy,
        createdAt: data.createdAt,
      };
    });

    onChange(tasks);
  });
}

/* ───────── DELETE TASK ───────── */

export async function deleteTask(taskId: string) {
  return deleteDoc(doc(db, "tasks", taskId));
}

/* ───────── COMPLETE TASK ───────── */

export async function completeTask(
  taskId: string,
  completedBy: number,
) {
  return updateDoc(doc(db, "tasks", taskId), {
    status: "completed",
    completedBy,
  });
}
