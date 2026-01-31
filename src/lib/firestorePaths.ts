// 🔥 Honeycomb multi-tenant Firestore path manager
// SINGLE SOURCE OF TRUTH for ALL database paths

let currentCompanyId: string | null = null;

/* =================================================
   COMPANY CONTROL
================================================= */

/**
 * MUST be called immediately after login / app boot.
 */
export const setCompanyId = (id: string) => {
  if (!id) throw new Error("setCompanyId: invalid company id");
  currentCompanyId = id;
};

/**
 * Optional: logout safety
 */
export const resetCompanyId = () => {
  currentCompanyId = null;
};

/**
 * Optional: read current id
 */
export const getCompanyId = () => currentCompanyId;

/**
 * Ensures company is set before any DB access
 */
const requireCompany = () => {
  if (!currentCompanyId) {
    throw new Error(
      "🔥 Firestore path used before setCompanyId() was called"
    );
  }
  return currentCompanyId;
};

/**
 * Safe Firestore path builder
 * Example:
 *   build("jobs","123")
 *   -> companies/a1testing/jobs/123
 */
const build = (...segments: (string | number)[]) =>
  ["companies", requireCompany(), ...segments.map(String)].join("/");


/* =================================================
   COLLECTION HELPERS
================================================= */

export const employeesCol = () => build("employees");

export const jobsCol = () => build("jobs");

export const labourEntriesCol = () => build("labourEntries");

export const assignmentsCol = (jobId: string | number) =>
  build("jobs", jobId, "assignments");


/* =================================================
   DOCUMENT HELPERS
================================================= */

export const employeeDoc = (id: string | number) =>
  build("employees", id);

export const jobDoc = (id: string | number) =>
  build("jobs", id);

export const labourEntryDoc = (id: string | number) =>
  build("labourEntries", id);

export const assignmentDoc = (
  jobId: string | number,
  assignmentId: string | number
) =>
  build("jobs", jobId, "assignments", assignmentId);
