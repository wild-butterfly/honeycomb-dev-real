// invoiceSettings.ts
// Routes for invoice settings

import { Router } from "express";
import * as controller from "../controllers/invoiceSettings.controller";
import { withDbContext } from "../middleware/dbContext";
import { requireAuth, requireRole } from "../middleware/authMiddleware";

const router = Router();

/* 🔐 RLS context */
router.use(requireAuth);
router.use(withDbContext);

/* ===============================
   INVOICE SETTINGS
================================ */

// Get invoice settings for a company
router.get("/invoice-settings/:companyId", controller.getByCompanyId);

// Create or update invoice settings
router.post("/invoice-settings", requireRole(["admin", "manager"]), controller.createOrUpdate);

// Update specific invoice settings
router.put("/invoice-settings/:companyId", requireRole(["admin", "manager"]), controller.update);

export default router;
