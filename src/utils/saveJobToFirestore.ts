// src/utils/saveJobToFirestore.ts
// Created by Clevermode © 2025. All rights reserved.

import { db } from "../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { CalendarJob } from "../pages/CalendarPage";

/**
 * Saves ONLY job metadata.
 * Assignment timing is handled in:
 * jobs/{jobId}/assignments/{assignmentId}
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
  >,
) {
  try {
    if (!job?.id) {
      console.warn("⚠️ saveJobToFirestore called without job.id");
      return;
    }

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
        title: title ?? "",
        customer: customer ?? "",
        status: status ?? "active",
        color: color ?? "#fff9e6",
        location: location ?? "",
        siteContact: siteContact ?? "",
        contactInfo: contactInfo ?? "",
        notes: notes ?? "",
        updatedAt: serverTimestamp(),
      },
      { merge: true }, // 🔑 ASLA KALDIRILMAYACAK
    );

    console.log("🔥 Job metadata saved:", id);
  } catch (err) {
    console.error("❌ Error saving job metadata:", err);
  }
}

/**
 * SOFT delete ONLY.
 * NEVER hard-delete jobs (assignments are live listeners)
 */
export async function deleteJobFromFirestore(jobId: string) {
  try {
    if (!jobId) return;

    await setDoc(
      doc(db, "jobs", jobId),
      {
        deleted: true,
        deletedAt: serverTimestamp(),
      },
      { merge: true },
    );

    console.log("🗑 Job soft-deleted:", jobId);
  } catch (err) {
    console.error("❌ Error deleting job:", err);
  }
}
