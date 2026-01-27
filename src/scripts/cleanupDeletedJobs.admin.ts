// src/scripts/cleanupDeletedJobs.admin.ts
import admin from "firebase-admin";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

async function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // ✅ JSON import yok — direkt dosyadan oku
  const keyPath = path.join(__dirname, "serviceAccountKey.json");
  const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf8"));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  const db = admin.firestore();

  console.log("🧹 Starting HARD DELETE cleanup...");

  const snap = await db.collection("jobs").where("deleted", "==", true).get();

  if (snap.empty) {
    console.log("✅ No deleted jobs found.");
    return;
  }

  console.log(`⚠️ Found ${snap.size} deleted jobs`);

  for (const d of snap.docs) {
    await d.ref.delete();
    console.log(`🗑️ Job ${d.id} permanently removed`);
  }

  console.log("🎉 Cleanup complete");
}

main().catch(console.error);
