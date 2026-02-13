import { Router } from "express";
import {
  getLabourEntries,
  addLabourEntry,
  deleteLabourEntry,
} from "../controllers/labourController";

import { withDbContext } from "../middleware/dbContext";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

/*
  🔐 Must be authenticated
*/
router.use(requireAuth);

/*
  🔐 Attach DB transaction + RLS context
*/
router.use(withDbContext);

/* ===============================
   LABOUR ROUTES
================================ */

/*
  Admin & Manager can view all.
  Employee can view (RLS + job policy already filters).
*/
router.get(
  "/jobs/:jobId/labour",
  requireRole(["admin", "manager", "employee"]),
  getLabourEntries
);

/*
  Admin can add for anyone.
  Employee can add only for themselves.
*/
router.post(
  "/jobs/:jobId/labour",
  requireRole(["admin", "employee"]),
  addLabourEntry
);

/*
  Only admin can delete labour
*/
router.delete(
  "/labour/:id",
  requireRole(["admin"]),
  deleteLabourEntry
);

export default router;
