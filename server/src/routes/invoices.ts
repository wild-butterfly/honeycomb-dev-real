// invoices.ts
// Routes for invoices

import { Router } from "express";
import * as controller from "../controllers/invoices.controller";
import { withDbContext } from "../middleware/dbContext";
import { requireAuth, requireRole } from "../middleware/authMiddleware";

const router = Router();

/* 🔐 RLS context */
router.use(requireAuth);
router.use(withDbContext);

/* ===============================
   INVOICES
================================ */

router.get("/invoices", controller.getAll);
router.get("/invoices/:id", controller.getById);
router.post("/invoices", requireRole(["admin", "manager"]), controller.create);
router.put("/invoices/:id", requireRole(["admin", "manager"]), controller.update);
router.post(
   "/invoices/:id/approve",
   requireRole(["admin", "manager"]),
   controller.approve
);

/* ===============================
   JOB → INVOICES
================================ */

router.get("/jobs/:jobId/invoices", controller.getByJobId);

export default router;
