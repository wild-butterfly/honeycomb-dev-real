import { Router } from "express";
import {
  getAllAssignments,
  createAssignment,
  updateAssignment,
  completeAssignments,
  reopenAssignments,
  deleteAssignment,
} from "../controllers/assignments.controller";

import { withDbContext } from "../middleware/dbContext";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

/* 🔐 AUTH FIRST */
router.use(requireAuth);

/* 🔐 RLS CONTEXT */
router.use(withDbContext);

/* ===============================
   BULK ACTIONS
================================ */

/* complete → admin + employee */
router.put("/complete", completeAssignments);

/* reopen → admin + employee */
router.put("/reopen", reopenAssignments);

/* ===============================
   CRUD
================================ */

/* get assignments */
router.get("/", getAllAssignments);

/* create assignment → admin only */
router.post("/", requireRole(["admin"]), createAssignment);

/* update assignment → admin only */
router.put("/:id", requireRole(["admin"]), updateAssignment);

/* delete → admin only */
router.delete("/:id", requireRole(["admin"]), deleteAssignment);

export default router;