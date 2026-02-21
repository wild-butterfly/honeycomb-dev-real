// pdf.ts
// Routes for PDF generation

import { Router } from "express";
import * as controller from "../controllers/pdf.controller";
import { withDbContext } from "../middleware/dbContext";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

/* 🔐 Auth context */
router.use(requireAuth);
router.use(withDbContext);

/* ===============================
   PDF GENERATION
================================ */

// Generate and download invoice as PDF
router.get("/invoices/:id/pdf", controller.generateInvoicePdf);

export default router;
