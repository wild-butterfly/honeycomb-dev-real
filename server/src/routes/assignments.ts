// server/routes/assignments.ts
// Created by Clevermode © 2026

import { Router } from "express";
import {
  getAllAssignments,
  createAssignment,
  updateAssignment,
  completeAssignments,
  reopenAssignments,
  deleteAssignment,
  
} from "../controllers/assignments.controller";

const router = Router();

router.put("/complete", completeAssignments);
router.put("/reopen", reopenAssignments);

router.get("/", getAllAssignments);
router.post("/", createAssignment);
router.put("/:id", updateAssignment);
router.delete("/:id", deleteAssignment);

export default router;