import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { employeesCol } from "../lib/firestorePaths";

export type TaskEmployee = {
  id: number;
  name: string;
  active?: boolean;
};

export function useTaskEmployees() {
  const [employees, setEmployees] = useState<TaskEmployee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      query(
        collection(db, employeesCol()),
        orderBy("name") // 🔥 alfabetik garanti
      ),
      (snap) => {
        const data = snap.docs.map(
          (d) => ({ id: Number(d.id), ...d.data() }) as TaskEmployee
        );

        setEmployees(data);
        setLoading(false);
      }
    );

    return unsub;
  }, []);

  return { employees, loading };
}
