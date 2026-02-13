// server/routes/jobs.ts
// 🔐 RLS SAFE

import { Router } from "express";
import * as controller from "../controllers/jobs.controller";
import { withDbContext } from "../middleware/dbContext";

const router = Router();

/*
  🔐 Every job request runs inside
  a request-scoped DB transaction with RLS context
*/
router.use(withDbContext);

/* ===============================
   JOB CRUD
================================ */

router.get("/", controller.getAll);
router.get("/:id", controller.getOne);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

/* ===============================
   ASSIGNMENTS (No Schedule)
================================ */

router.put("/:id/assign", controller.assignEmployee);
router.put("/:id/unassign", controller.unassignEmployee);

/* ===============================
   JOB → LABOUR
================================ */

router.get("/:id/labour", controller.getLabour);
router.post("/:id/labour", controller.addLabour);

router.put("/:jobId/labour/:labourId", controller.updateLabour);
router.delete("/:jobId/labour/:labourId", controller.deleteLabour);

export default router;