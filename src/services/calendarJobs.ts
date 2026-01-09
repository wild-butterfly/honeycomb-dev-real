// src/services/calendarJobs.ts
import { db } from "../firebase";
import { doc, setDoc, deleteDoc } from "firebase/firestore";

export async function saveJobToFirestore(job: any) {
  try {
    await setDoc(doc(db, "jobs", String(job.id)), job, { merge: true });
    console.log("🔥 Saved to Firestore:", job.id);
  } catch (err) {
    console.error("❌ Save error:", err);
  }
}

export async function deleteJobFromFirestore(jobId: number) {
  try {
    await deleteDoc(doc(db, "jobs", String(jobId)));
    console.log("🗑 Deleted from Firestore:", jobId);
  } catch (err) {
    console.error("❌ Delete error:", err);
  }
}
