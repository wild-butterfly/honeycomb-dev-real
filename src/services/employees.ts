// src/services/employees.ts

import {
  collection,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";

import { db } from "../firebase";
import { employeesCol } from "../lib/firestorePaths";

/* ================= TYPES ================= */

export type Employee = {
  id: string;
  name: string;
  active: boolean;
};

/* ================= FETCH ================= */

export async function fetchEmployees(): Promise<Employee[]> {
  // 🔥 Multi-tenant + alphabetical (Firestore side)
  const q = query(
    collection(db, employeesCol()),
    orderBy("name", "asc")
  );

  const snapshot = await getDocs(q);

  const list = snapshot.docs.map((doc) => {
    const data = doc.data() as Omit<Employee, "id">;

    return {
      id: doc.id,
      name: data.name ?? "",
      active: data.active ?? true,
    };
  });

  // 🔥 EXTRA SAFETY (frontend sort – always alphabetical)
  return list.sort((a, b) => a.name.localeCompare(b.name));
}
