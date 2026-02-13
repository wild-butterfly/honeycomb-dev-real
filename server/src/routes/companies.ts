import { Router } from "express";
import * as controller from "../controllers/companies.controller";
import { withDbContext } from "../middleware/dbContext";

const router = Router();

/*
  🔐 Attach request-scoped DB context
  Every /api/companies request runs inside RLS scope
*/
router.use(withDbContext);

/* ===============================
   COMPANIES
================================ */

// Optional: Only if you plan super-admin
router.get("/", controller.getAll);

router.post("/", controller.create);

// ⚠️ REMOVE this for SaaS safety unless super-admin
// router.get("/:id/employees", controller.getEmployees);

export default router;