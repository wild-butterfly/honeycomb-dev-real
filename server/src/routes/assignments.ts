// server/routes/assignments.ts
// Created by Clevermode © 2026

import { Router } from "express";
import {
  getAllAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
} from "../controllers/assignments.controller";

const router = Router();

router.get("/", getAllAssignments);
router.post("/", createAssignment);
router.put("/:id", updateAssignment);
router.delete("/:id", deleteAssignment);

export default router;