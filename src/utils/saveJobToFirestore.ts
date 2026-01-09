// Created by Clevermode © 2025. All rights reserved.
import { db } from "../firebase";
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { CalendarJob } from "../pages/CalendarPage";

/**
 * Saves ONLY job metadata.
 * Assignment timing is handled in:
 * jobs/{jobId}/assignments/{employeeId}
 */
export async function saveJobToFirestore(
  job: Pick<
    CalendarJob,
    | "id"
    | "title"
    | "customer"
    | "status"
    | "color"
    | "location"
    | "siteContact"
    | "contactInfo"
    | "notes"
  >
) {
  try {
    const {
      id,
      title,
      customer,
      status,
      color,
      location,
      siteContact,
      contactInfo,
      notes,
    } = job;

    await setDoc(
      doc(db, "jobs", id),
      {
        title,
        customer,
        status,
        color,
        location,
        siteContact,
        contactInfo,
        notes,
      },
      { merge: true }
    );

    console.log("🔥 Job metadata saved:", id);
  } catch (err) {
    console.error("❌ Error saving job metadata:", err);
  }
}

export async function deleteJobFromFirestore(jobId: string) {
  try {
    await deleteDoc(doc(db, "jobs", jobId));
    console.log("🗑 Deleted job:", jobId);
  } catch (err) {
    console.error("❌ Error deleting job:", err);
  }
}
