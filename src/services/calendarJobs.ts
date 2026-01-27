import {
  collection,
  deleteDoc,
  doc,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";

export async function deleteJobFromFirestore(jobId: number | string) {
  const jobIdStr = String(jobId);


  const assignmentsSnap = await getDocs(
    collection(db, "jobs", jobIdStr, "assignments")
  );


  await Promise.all(
    assignmentsSnap.docs.map((d) => deleteDoc(d.ref))
  );


  await deleteDoc(doc(db, "jobs", jobIdStr));

  console.log("🧨 Job HARD deleted:", jobIdStr);
}