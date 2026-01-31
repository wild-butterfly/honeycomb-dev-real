import {
  collection,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import { CalendarJob, Assignment } from "../pages/CalendarPage";
import { jobsCol, assignmentsCol } from "../lib/firestorePaths";

/**
 * Fetch all jobs with assignments
 */
export async function fetchJobs(): Promise<CalendarJob[]> {
  const snap = await getDocs(collection(db, jobsCol()));

  const jobs: CalendarJob[] = await Promise.all(
    snap.docs.map(async (jobDocSnap) => {
      const data = jobDocSnap.data();

      const assignmentsSnap = await getDocs(
        collection(db, assignmentsCol(jobDocSnap.id))
      );

      const assignments: Assignment[] = assignmentsSnap.docs.map((a) => ({
        id: a.id,
        employeeId: Number(a.data().employeeId),
        start: String(a.data().start ?? ""),
        end: String(a.data().end ?? ""),
      }));

      return {
        id: jobDocSnap.id,
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
