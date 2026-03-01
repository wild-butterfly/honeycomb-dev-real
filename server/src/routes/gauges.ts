// src/routes/gauges.ts

import { Router } from "express";
import * as controller from "../controllers/jobFinancials.controller";
import { withDbContext } from "../middleware/dbContext";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

/* 🔐 RLS context */
router.use(requireAuth);
router.use(withDbContext);

/* ===============================
   GAUGE DATA
================================ */

/* GET all gauge data (jobs grouped by phase) */
router.get("/phases", controller.getGaugeData);

export default router;
