import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";


export type Employee = {
  id: string;
  name: string;
  active: boolean;
};

export async function fetchEmployees(): Promise<Employee[]> {
  const q = query(
    collection(db, "employees"),
    orderBy("name")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data() as Omit<Employee, "id">;

    return {
      id: doc.id, // 🔥 Firestore ID
      ...data,    // 🔥 Diğer alanlar (id yok artık)
    };
  });
}
