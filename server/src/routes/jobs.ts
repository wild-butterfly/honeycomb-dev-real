import { Router } from "express";
import * as controller from "../controllers/jobs.controller";
import * as financialsController from "../controllers/jobFinancials.controller";
import { withDbContext } from "../middleware/dbContext";
import { requireAuth, requireRole } from "../middleware/authMiddleware";



const router = Router();

/* 🔐 RLS context */
router.use(requireAuth);
router.use(withDbContext);

/* ===============================
   JOB CRUD
================================ */

/* GET ALL */
router.get("/", controller.getAll);

/* ⭐ ACTIVITY FIRST */
router.get("/:id/activity", controller.getActivity);

/* GET ONE */
router.get("/:id", controller.getOne);

/* CREATE */
router.post("/", requireRole(["admin"]), controller.create);

/* UPDATE */
router.put("/:id", requireRole(["admin"]), controller.update);

/* DELETE */
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


/* ===============================
   JOB FINANCIALS
================================ */

/* GET job financials */
router.get("/:jobId/financials", financialsController.getJobFinancials);

/* CREATE job financials */
router.post("/:jobId/financials", requireRole(["admin"]), financialsController.createJobFinancials);

/* UPDATE job financials */
router.put("/:jobId/financials/:id", requireRole(["admin"]), financialsController.updateJobFinancials);


export default router;