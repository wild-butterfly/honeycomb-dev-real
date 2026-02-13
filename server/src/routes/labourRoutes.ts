// server/routes/labour.ts
// 🔐 RLS SAFE

import { Router } from "express";
import {
  getLabourEntries,
  addLabourEntry,
  deleteLabourEntry,
} from "../controllers/labourController";

import { withDbContext } from "../middleware/dbContext";

const router = Router();

/*
  🔐 Attach DB transaction + RLS context
*/
router.use(withDbContext);

/* ===============================
   LABOUR ROUTES
================================ */

router.get("/jobs/:jobId/labour", getLabourEntries);
router.post("/jobs/:jobId/labour", addLabourEntry);
router.delete("/labour/:id", deleteLabourEntry);

export default router;