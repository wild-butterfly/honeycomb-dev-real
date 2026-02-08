// 🔥 Honeycomb multi-tenant Firestore path manager
// SINGLE SOURCE OF TRUTH for ALL database paths

let currentCompanyId: number | null = null;

/* =================================================
   COMPANY CONTROL
================================================= */

/**
 * MUST be called immediately after login / app boot.
 */
export const setCompanyId = (id: number) => {
  if (!id) throw new Error("setCompanyId: invalid company id");
  currentCompanyId = id;
};

/** Optional: logout safety */
export const resetCompanyId = () => {
  currentCompanyId = null;
};

/** Optional: read current id */
export const getCompanyId = () => currentCompanyId;

/** Ensures company is set before any DB access */
const requireCompany = (): number => {
  if (currentCompanyId === null) {
    throw new Error(
      "🔥 Firestore path used before setCompanyId() was called"
    );
  }
  return currentCompanyId;
};

/* =================================================
   CORE BUILDER
================================================= */

/**
 * Builds:
 * companies/{companyId}/...
 */
const build = (...segments: (string | number)[]) =>
  ["companies", requireCompany(), ...segments]
    .map(String)
    .join("/");

/* =================================================
   COLLECTION HELPERS
================================================= */

export const employeesCol = () => build("employees");
export const jobsCol = () => build("jobs");
export const labourEntriesCol = () => build("labourEntries");

export const assignmentsCol = (jobId: number) =>
  build("jobs", jobId, "assignments");

/* =================================================
   DOCUMENT HELPERS
================================================= */

export const employeeDoc = (id: number) =>
  build("employees", id);

export const jobDoc = (id: number) =>
  build("jobs", id);

export const labourEntryDoc = (id: number) =>
  build("labourEntries", id);

export const assignmentDoc = (
  jobId: number,
  assignmentId: number
) =>
  build("jobs", jobId, "assignments", assignmentId);