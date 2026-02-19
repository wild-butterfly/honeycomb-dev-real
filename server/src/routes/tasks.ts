// server/src/routes/tasks.ts
// Created by Honeycomb © 2026
// Tasks routes (RLS safe)

import { Router } from "express";
import * as controller from "../controllers/tasksController";
import { requireAuth, requireRole } from "../middleware/authMiddleware";
import { withDbContext } from "../middleware/dbContext";

const router = Router();

/* =================================================
   AUTH
   User must be logged in
================================================= */
router.use(requireAuth);

/* =================================================
   RLS CONTEXT
   Sets current_company_id for PostgreSQL RLS
================================================= */
router.use(withDbContext);

/* =================================================
   ROUTES
================================================= */

/* -------------------------------------------------
   Get all tasks (company scoped)
   Everyone can view
------------------------------------------------- */
router.get("/", controller.getAll);

/* -------------------------------------------------
   Create task
   Admin + Manager only
------------------------------------------------- */
router.post(
  "/",
  requireRole(["admin", "manager"]),
  controller.create
);

/* -------------------------------------------------
   Mark task complete
------------------------------------------------- */
router.put(
  "/:id/complete",
  requireRole(["admin", "manager"]),
  controller.complete
);

/* -------------------------------------------------
   Delete ALL completed tasks
   ⚠ MUST come BEFORE /:id route
------------------------------------------------- */
router.delete(
  "/completed",
  requireRole(["admin", "manager"]),
  controller.deleteCompleted
);

/* -------------------------------------------------
   Delete single task by id
   ⚠ Dynamic route LAST
------------------------------------------------- */
router.delete(
  "/:id",
  requireRole(["admin"]),
  controller.remove
);

export default router;