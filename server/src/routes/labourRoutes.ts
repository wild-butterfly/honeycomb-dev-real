import { Router } from "express";
import {
  getLabourEntries,
  addLabourEntry,
  deleteLabourEntry,
} from "../controllers/labourController";

const router = Router();

router.get("/jobs/:jobId/labour", getLabourEntries);
router.post("/jobs/:jobId/labour", addLabourEntry);
router.delete("/labour/:id", deleteLabourEntry);

export default router;