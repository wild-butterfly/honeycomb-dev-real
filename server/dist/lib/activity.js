"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveActorName = resolveActorName;
exports.resolveEmployeeName = resolveEmployeeName;
exports.logJobActivity = logJobActivity;
async function resolveActorName(db, req) {
    const employeeId = req.user?.employee_id;
    if (employeeId) {
        const result = await db.query("SELECT name FROM employees WHERE id = $1", [employeeId]);
        if (result.rows[0]?.name) {
            return result.rows[0].name;
        }
    }
    if (req.user?.role === "superadmin") {
        return "Superadmin";
    }
    if (req.user?.role === "admin") {
        return "Admin";
    }
    return "System";
}
async function resolveEmployeeName(db, employeeId) {
    const result = await db.query("SELECT name FROM employees WHERE id = $1", [employeeId]);
    return result.rows[0]?.name ?? "Staff";
}
async function logJobActivity(db, jobId, type, title, userName) {
    await db.query(`
    INSERT INTO job_activity
    (
      job_id,
      company_id,
      type,
      title,
      user_name
    )
    SELECT
      j.id,
      j.company_id,
      $2,
      $3,
      $4
    FROM jobs j
    WHERE j.id = $1 AND (
      current_setting('app.god_mode') = 'true'
      OR j.company_id = current_setting('app.current_company_id')::bigint
    )
    `, [jobId, type, title, userName]);
}
