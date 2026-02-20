"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAll = void 0;
const db_1 = require("../db");
const getAll = async (req, res) => {
    try {
        if (req.user?.role === "superadmin") {
            const result = await db_1.pool.query(`
        SELECT id, name
        FROM companies
        ORDER BY name
        `);
            return res.json(result.rows);
        }
        if (!req.user?.company_id) {
            return res.json([]);
        }
        const result = await db_1.pool.query(`
      SELECT id, name
      FROM companies
      WHERE id = $1
      `, [req.user.company_id]);
        res.json(result.rows);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: "Failed to load companies"
        });
    }
};
exports.getAll = getAll;
