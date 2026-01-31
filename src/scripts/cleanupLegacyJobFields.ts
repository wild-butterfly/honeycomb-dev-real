// Created by Honeycomb © 2026
// 🔥 FINAL cleanup: remove legacy assignedTo/start/end from jobs

/**
 * ⚠️ ONE-OFF / MAINTENANCE SCRIPT
 *
 * Used to clean legacy / duplicated job fields
 * that caused calendar lag due to duplicated data.
 *
 * NOT part of production flow.
 * Run manually if legacy data reappears.
 *
 * Last used: 2026-01
 */

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteField,
} from "firebase/firestore";
import { jobsCol } from "../lib/firestorePaths";

const firebaseConfig = {
  apiKey: "AIzaSyBzCyZj58fS2U0_CGPEk6p1dNmXLJwkF9o",
  authDomain: "honeycomb-au.firebaseapp.com",
  projectId: "honeycomb-au",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cleanupLegacyJobs() {
  const jobsSnap = await getDocs(collection(db, jobsCol()));

  let cleaned = 0;
  let skipped = 0;

  for (const jobDoc of jobsSnap.docs) {
    const jobId = jobDoc.id;

    const assignmentsRef = collection(db, "jobs", jobId, "assignments");
    const assignmentsSnap = await getDocs(assignmentsRef);

    // 🟡 Assignment yoksa dokunma
    if (assignmentsSnap.empty) {
      skipped++;
      continue;
    }

    const data = jobDoc.data();
    const updates: any = {};

    if ("assignedTo" in data) updates.assignedTo = deleteField();
    if ("start" in data) updates.start = deleteField();
    if ("end" in data) updates.end = deleteField();

    if (Object.keys(updates).length === 0) {
      skipped++;
      continue;
    }

    await updateDoc(doc(db, "jobs", jobId), updates);
    cleaned++;

    console.log(`✅ Cleaned legacy fields for job ${jobId}`);
  }

  console.log("──────────────────────────");
  console.log(`✅ Jobs cleaned: ${cleaned}`);
  console.log(`⏭️ Jobs skipped: ${skipped}`);
  console.log("🔥 Migration COMPLETE");
}

cleanupLegacyJobs().catch(console.error);
