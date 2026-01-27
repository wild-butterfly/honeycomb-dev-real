// src/services/taskEmployees.ts
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

export type TaskEmployee = {
  id: number;
  name: string;
  active?: boolean;
};

export function useTaskEmployees() {
  const [employees, setEmployees] = useState<TaskEmployee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "employees"), (snap) => {
      const data = snap.docs.map(
        (d) => ({ id: Number(d.id), ...d.data() }) as TaskEmployee
      );

      setEmployees(data);
      setLoading(false);
    });

    return unsub;
  }, []);

  return { employees, loading };
}
