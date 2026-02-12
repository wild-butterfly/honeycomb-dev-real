// server/routes/jobs.ts
import { Router } from "express";
import * as controller from "../controllers/jobs.controller";

const router = Router();

/* JOB CRUD */
router.get("/", controller.getAll);
router.get("/:id", controller.getOne);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.put("/:id/assign", controller.assignEmployee);
router.delete("/:id", controller.remove);
router.put("/:id/unassign", controller.unassignEmployee);

/* 🔥 JOB → LABOUR */
router.get("/:id/labour", controller.getLabour);
router.post("/:id/labour", controller.addLabour);

router.put("/:jobId/labour/:labourId", controller.updateLabour);
router.delete("/:jobId/labour/:labourId", controller.deleteLabour);
export default router;
