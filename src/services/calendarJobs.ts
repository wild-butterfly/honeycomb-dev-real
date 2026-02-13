// src/services/calendarJobs.ts

import { apiDelete } from "./api";

/* =========================================================
   DELETE JOB (Postgres version)

========================================================= */

export async function deleteJob(jobId: number | string) {
  const id = String(jobId);

  await apiDelete(`/jobs/${id}`);
}