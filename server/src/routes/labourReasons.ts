import { Router } from "express";
import {
  getLabourReasons,
  addLabourReason,
  deleteLabourReason,
} from "../controllers/labourReasons.controller";

const router = Router();

// GET  /labour-reasons/:companyId
router.get("/:companyId", getLabourReasons);

// POST /labour-reasons/:companyId
router.post("/:companyId", addLabourReason);

// DELETE /labour-reasons/:companyId/:reasonId
router.delete("/:companyId/:reasonId", deleteLabourReason);

export default router;
