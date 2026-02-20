"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dbContext_1 = require("../middleware/dbContext");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
/* 🔐 Require login first */
router.use(authMiddleware_1.requireAuth);
/* 🔐 Then attach DB context */
router.use(dbContext_1.withDbContext);
router.get("/", async (req, res) => {
    const db = req.db;
    try {
        const result = await db.query(`
      SELECT
        NULLIF(
          current_setting('app.current_company_id', true),
          ''
        )::int AS company_id
    `);
        res.json({
            company_id: result.rows[0]?.company_id ?? null,
        });
    }
    catch (err) {
        console.error("GET /me failed", err);
        res.status(500).json({
            error: "Failed to load session",
        });
    }
});
exports.default = router;
