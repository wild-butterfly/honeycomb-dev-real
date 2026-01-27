import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import serviceAccount from "./serviceAccountKey.json" assert { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(
    serviceAccount as admin.ServiceAccount
  ),
});

const db = getFirestore();

async function cleanupDeletedJobs() {
  console.log("🧹 Starting ADMIN cleanup...");

  const snap = await db
    .collection("jobs")
    .where("deleted", "==", true)
    .get();

  if (snap.empty) {
    console.log("✅ No deleted jobs found");
    return;
  }

  console.log(`⚠️ Found ${snap.size} deleted jobs`);

  for (const doc of snap.docs) {
    console.log(`🧨 Deleting job ${doc.id}`);

    // delete assignments
    const assignmentsSnap = await doc.ref
      .collection("assignments")
      .get();

    for (const a of assignmentsSnap.docs) {
      await a.ref.delete();
    }

    await doc.ref.delete();
    console.log(`✅ Job ${doc.id} removed`);
  }

  console.log("🎉 Cleanup complete");
}

cleanupDeletedJobs().catch(console.error);
