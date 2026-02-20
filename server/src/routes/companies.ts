import { Router } from "express";
import * as controller from "../controllers/companies.controller";
import { requireAuth, requireRole } from "../middleware/authMiddleware";

const router = Router();

router.use(requireAuth);

router.get(
  "/",
  requireRole(["admin", "superadmin"]),
  controller.getAll
);

export default router;