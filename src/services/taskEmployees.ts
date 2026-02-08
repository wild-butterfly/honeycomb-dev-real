import { useEffect, useState } from "react";

/* =========================================================
   TYPES
========================================================= */

export type TaskEmployee = {
  id: number;
  name: string;
  active?: boolean;
};

/* =========================================================
   SMALL API HELPER
========================================================= */

async function api<T>(url: string): Promise<T> {
  const res = await fetch(`/api${url}`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch employees");
  }

  return res.json();
}

/* =========================================================
   HOOK (POSTGRES VERSION)
========================================================= */

export function useTaskEmployees() {
  const [employees, setEmployees] = useState<TaskEmployee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const data = await api<TaskEmployee[]>("/employees");

        // 🔥 alfabetik garanti (Firestore orderBy yerine burada sort)
        const sorted = [...data].sort((a, b) =>
          a.name.localeCompare(b.name)
        );

        if (mounted) {
          setEmployees(sorted);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load employees:", err);
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  return { employees, loading };
}
