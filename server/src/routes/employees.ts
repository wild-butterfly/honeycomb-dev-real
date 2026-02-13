import { Router } from "express";
import * as controller from "../controllers/employees.controller";
import { withDbContext } from "../middleware/dbContext";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

/* =====================================================
   GLOBAL MIDDLEWARE
===================================================== */

// 🔐 Must be logged in
router.use(requireAuth);

// 🔐 Attach DB + RLS context
router.use(withDbContext);

/* =====================================================
   EMPLOYEES ROUTES
===================================================== */

/*
  SUPERADMIN → everything (auto bypass in requireRole)
  ADMIN      → full company access
  MANAGER    → read only
*/

/* ================= LIST ================= */

// Admin & Manager can list
router.get(
  "/",
  requireRole(["admin", "manager"]),
  controller.getAll
);

/* ================= GET ONE ================= */

router.get(
  "/:id",
  requireRole(["admin", "manager"]),
  controller.getOne
);

/* ================= CREATE ================= */

// Only admin create
router.post(
  "/",
  requireRole(["admin"]),
  controller.create
);

/* ================= UPDATE ================= */

// Only admin update
router.put(
  "/:id",
  requireRole(["admin"]),
  controller.update
);

/* ================= DELETE ================= */

// Only admin delete
router.delete(
  "/:id",
  requireRole(["admin"]),
  controller.remove
);

export default router;
