// employeeNotes.ts
// Routes for employee notes on jobs

import { Router } from "express";
import * as controller from "../controllers/employeeNotes.controller";
import { withDbContext } from "../middleware/dbContext";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

/* 🔐 RLS context */
router.use(requireAuth);
router.use(withDbContext);

/* ===============================
   EMPLOYEE NOTES ROUTES
================================ */

/* GET ALL NOTES FOR A JOB */
router.get("/jobs/:jobId/notes", controller.getAll);

/* CREATE A NEW NOTE */
router.post("/jobs/:jobId/notes", controller.create);

/* DELETE A NOTE (optional - only own notes) */
router.delete("/notes/:id", controller.remove);

export default router;
