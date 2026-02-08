// src/services/jobs.ts

import { apiGet } from "./api";
import type { CalendarJob } from "../types/calendar";

/* =========================================================
   FETCH ALL JOBS (Postgres version)
========================================================= */

export async function fetchJobs(): Promise<CalendarJob[]> {
  const data = await apiGet<CalendarJob[]>("/jobs");
  return data ?? [];
}
