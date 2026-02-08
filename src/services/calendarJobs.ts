// src/services/calendarJobs.ts

import { apiDelete } from "./api";

/* =========================================================
   DELETE JOB (Postgres version)
   - DB tarafında CASCADE ile assignments da silinir
========================================================= */

export async function deleteJob(jobId: number | string) {
  const id = String(jobId);

  await apiDelete(`/jobs/${id}`);

  console.log("🧨 Job HARD deleted:", id);
}