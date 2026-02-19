import { Router } from "express";
import * as controller from "../controllers/companies.controller";
import { withDbContext } from "../middleware/dbContext";
import { requireAuth, requireRole } from "../middleware/authMiddleware";

const router = Router();

/*
  🔐 Auth required
*/
router.use(requireAuth);

/*
  🔐 Attach request-scoped DB context (after auth)
*/
router.use(withDbContext);

/* ===============================
   COMPANIES
================================ */

// Admin only
router.get(
  "/",
  requireRole(["admin", "superadmin"]),
  controller.getAll
);



// Only admin can create company (or disable completely)
router.post(
  "/",
  requireRole(["admin", "superadmin"]),
  controller.create
);

export default router;