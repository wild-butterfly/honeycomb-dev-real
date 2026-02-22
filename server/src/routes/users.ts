// server/src/routes/users.ts
// User management routes for admins

import { Router } from "express";
import * as controller from "../controllers/users.controller";
import { requireAuth } from "../middleware/authMiddleware";
import { withDbContext } from "../middleware/dbContext";

const router = Router();

/* =====================================================
   USER MANAGEMENT ROUTES (Admin Only)
===================================================== */

// Create employee account (Admin only)
router.post(
  "/employees",
  requireAuth,
  withDbContext,
  controller.createEmployee
);

// List all employees in company (Admin only)
router.get(
  "/employees",
  requireAuth,
  withDbContext,
  controller.getCompanyEmployees
);

// Deactivate employee account (Admin only - soft delete)
router.delete(
  "/employees/:id",
  requireAuth,
  withDbContext,
  controller.deactivateEmployee
);

export default router;
