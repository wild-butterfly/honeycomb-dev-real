// src/routes/jobFinancials.ts

import { Router } from "express";
import * as controller from "../controllers/jobFinancials.controller";
import { withDbContext } from "../middleware/dbContext";
import { requireAuth, requireRole } from "../middleware/authMiddleware";

const router = Router();

/* 🔐 RLS context */
router.use(requireAuth);
router.use(withDbContext);

/* ===============================
   JOB FINANCIALS CRUD
================================ */

/* GET job financials */
router.get("/:jobId/financials", controller.getJobFinancials);

/* CREATE job financials */
router.post(
  "/:jobId/financials",
  requireRole(["admin"]),
  controller.createJobFinancials
);

/* UPDATE job financials */
router.put(
  "/:jobId/financials",
  requireRole(["admin"]),
  controller.updateJobFinancials
);

export default router;
