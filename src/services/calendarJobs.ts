import {
  collection,
  deleteDoc,
  doc,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import { assignmentsCol, jobDoc } from "../lib/firestorePaths";

export async function deleteJobFromFirestore(jobId: number | string) {
  const jobIdStr = String(jobId);

  // ✅ correct tenant path
  const assignmentsSnap = await getDocs(
    collection(db, assignmentsCol(jobIdStr))
  );

  await Promise.all(
    assignmentsSnap.docs.map((d) => deleteDoc(d.ref))
  );

  // ✅ correct tenant path
  await deleteDoc(doc(db, jobDoc(jobIdStr)));

  console.log("🧨 Job HARD deleted:", jobIdStr);
}