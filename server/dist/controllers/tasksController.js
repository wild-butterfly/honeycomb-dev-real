"use strict";
// server/controllers/tasks.controller.ts
// 🔐 RLS SAFE + DB STRUCTURE MATCHED
Object.defineProperty(exports, "__esModule", { value: true });
exports.remove = exports.deleteCompleted = exports.complete = exports.create = exports.getAll = void 0;
/* ================= GET ALL ================= */
const getAll = async (req, res) => {
    const db = req.db;
    try {
        const result = await db.query(`
      SELECT *
      FROM tasks
      WHERE CASE
        WHEN current_setting('app.god_mode') = 'true' THEN TRUE
        ELSE company_id = current_setting('app.current_company_id')::bigint
      END
      ORDER BY created_at DESC
    `);
        res.json(result.rows);
    }
    catch (err) {
        console.error("tasks.getAll", err);
        res.status(500).json({ error: "Tasks load failed" });
    }
};
exports.getAll = getAll;
/* ================= CREATE ================= */
const create = async (req, res) => {
    const db = req.db;
    try {
        const { description, assigned, due } = req.body;
        const company_id = req.headers["x-company-id"]
            ||
                req.user?.company_id
            ||
                null;
        const role = req.user?.role;
        if (role !== "superadmin"
            &&
                !company_id) {
            return res.status(400).json({
                error: "Invalid company_id"
            });
        }
        const cleanAssigned = Array.isArray(assigned)
            ? assigned
                .filter((id) => id !== "" && id !== null && id !== undefined)
                .map((id) => Number(id))
                .filter((id) => Number.isInteger(id))
            : [];
        const result = await db.query(`
      INSERT INTO tasks
      (description, assigned, due, status, company_id)
      VALUES
      ($1, $2, $3, 'pending', $4)
      RETURNING *
      `, [
            description,
            cleanAssigned,
            due || null,
            company_id
        ]);
        res.status(201).json(result.rows[0]);
    }
    catch (err) {
        console.error("tasks.create error:", err);
        res.status(500).json({
            error: "Task create failed"
        });
    }
};
exports.create = create;
/* ================= COMPLETE ================= */
const complete = async (req, res) => {
    const db = req.db;
    try {
        const id = Number(req.params.id);
        const result = await db.query(`
      UPDATE tasks
      SET status = 'completed'
      WHERE id = $1 AND (
        current_setting('app.god_mode') = 'true'
        OR company_id = current_setting('app.current_company_id')::bigint
      )
      RETURNING *
      `, [id]);
        if (!result.rows.length) {
            return res.status(404).json({ error: "Task not found" });
        }
        res.json(result.rows[0]);
    }
    catch (err) {
        console.error("tasks.complete", err);
        res.status(500).json({ error: "Task complete failed" });
    }
};
exports.complete = complete;
/* ================= DELETE ALL COMPLETED ================= */
const deleteCompleted = async (req, res) => {
    const db = req.db;
    try {
        await db.query(`
      DELETE FROM tasks
      WHERE status = 'completed' AND (
        current_setting('app.god_mode') = 'true'
        OR company_id = current_setting('app.current_company_id')::bigint
      )
    `);
        res.json({ success: true });
    }
    catch (err) {
        console.error("tasks.deleteCompleted", err);
        res.status(500).json({ error: "Task delete failed" });
    }
};
exports.deleteCompleted = deleteCompleted;
/* ================= DELETE SINGLE ================= */
const remove = async (req, res) => {
    const db = req.db;
    try {
        const result = await db.query(`
      DELETE FROM tasks
      WHERE id = $1 AND (
        current_setting('app.god_mode') = 'true'
        OR company_id = current_setting('app.current_company_id')::bigint
      )
      RETURNING id
      `, [req.params.id]);
        if (!result.rowCount) {
            return res.status(404).json({ error: "Task not found" });
        }
        res.json({ success: true });
    }
    catch (err) {
        console.error("tasks.remove", err);
        res.status(500).json({ error: "Task delete failed" });
    }
};
exports.remove = remove;
