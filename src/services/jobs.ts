import {
  collection,
  getDocs,
  getDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";
import { CalendarJob, Assignment } from "../pages/CalendarPage";

/**
 * Fetch all jobs with assignments
 */
export async function fetchJobs(): Promise<CalendarJob[]> {
  const snap = await getDocs(collection(db, "jobs"));

  const jobs: CalendarJob[] = await Promise.all(
    snap.docs.map(async (jobDoc) => {
      const data = jobDoc.data();

      const assignmentsSnap = await getDocs(
        collection(db, "jobs", jobDoc.id, "assignments")
      );

      const assignments: Assignment[] = assignmentsSnap.docs.map((a) => ({
        id: a.id,
        employeeId: Number(a.data().employeeId),
        start: String(a.data().start ?? ""),
        end: String(a.data().end ?? ""),
      }));

      return {
        id: jobDoc.id, // 🔥 STRING
        title: data.title ?? "Untitled Job",
        customer: data.customer ?? "",
        status: data.status ?? "active",
        color: data.color ?? "#e4f4de",
        location: data.location ?? "",
        siteContact: data.siteContact ?? "",
        contactInfo: data.contactInfo ?? "",
        notes: data.notes ?? "",
        assignments,
      };
    })
  );

  return jobs;
}
