import { db } from "../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { CalendarJob } from "../pages/CalendarPage";
import { jobDoc } from "../lib/firestorePaths";

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
    if (!job?.id) return;

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
      doc(db, jobDoc(id)),
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
      { merge: true },
    );
  } catch (err) {
    console.error(err);
  }
}
