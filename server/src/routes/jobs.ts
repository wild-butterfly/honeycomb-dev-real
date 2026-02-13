import { Router } from "express";
import * as controller from "../controllers/jobs.controller";
import { withDbContext } from "../middleware/dbContext";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

/* 🔐 RLS context */
router.use(requireAuth);
router.use(withDbContext);

/* ===============================
   JOB CRUD
================================ */

/* GET ALL → admin + employee */
router.get("/", controller.getAll);

/* GET ONE → admin + employee */
router.get("/:id", controller.getOne);

/* CREATE → admin only */
router.post("/", requireRole(["admin"]), controller.create);

/* UPDATE → admin only */
router.put("/:id", requireRole(["admin"]), controller.update);

/* DELETE → admin only */
router.delete("/:id", requireRole(["admin"]), controller.remove);

/* ===============================
   ASSIGNMENTS
================================ */

router.put(
  "/:id/assign",
  requireRole(["admin"]),
  controller.assignEmployee
);

router.put(
  "/:id/unassign",
  requireRole(["admin"]),
  controller.unassignEmployee
);

/* ===============================
   JOB → LABOUR
================================ */

/* VIEW labour → admin + employee */
router.get("/:id/labour", controller.getLabour);

/* ADD labour → admin + employee */
router.post("/:id/labour", controller.addLabour);

/* UPDATE labour → admin + employee */
router.put("/:jobId/labour/:labourId", controller.updateLabour);

/* DELETE labour → admin only */
router.delete(
  "/:jobId/labour/:labourId",
  requireRole(["admin"]),
  controller.deleteLabour
);

export default router;
