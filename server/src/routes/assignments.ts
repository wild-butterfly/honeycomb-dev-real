// server/routes/assignments.ts
// Created by Clevermode © 2026
// 🔐 RLS SAFE ROUTE

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

const router = Router();

/*
  🔐 Attach request-scoped DB context
  Every request to /api/assignments will:
  - Open transaction
  - SET LOCAL app.current_company_id
  - Run inside RLS scope
*/
router.use(withDbContext);

/* ===============================
   BULK ACTIONS
================================ */
router.put("/complete", completeAssignments);
router.put("/reopen", reopenAssignments);

/* ===============================
   CRUD
================================ */
router.get("/", getAllAssignments);
router.post("/", createAssignment);
router.put("/:id", updateAssignment);
router.delete("/:id", deleteAssignment);

export default router;