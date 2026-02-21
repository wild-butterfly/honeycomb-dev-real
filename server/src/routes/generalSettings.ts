// server/src/routes/generalSettings.ts
// General Settings Routes
// RESTful API for company settings, taxes, and customer sources

import { Router } from "express";
import {
  getGeneralSettings,
  updateGeneralSettings,
  addTax,
  removeTax,
  addCustomerSource,
  removeCustomerSource,
  incrementSourceUsage,
} from "../controllers/generalSettings.controller";

const router = Router();

/* =========================================================
   GENERAL SETTINGS ROUTES
========================================================= */

// Get all general settings for a company
router.get("/:companyId", getGeneralSettings);

// Update general settings
router.put("/:companyId", updateGeneralSettings);

/* =========================================================
   TAXES ROUTES
========================================================= */

// Add a tax
router.post("/:companyId/taxes", addTax);

// Remove a tax (soft delete)
router.delete("/:companyId/taxes/:taxId", removeTax);

/* =========================================================
   CUSTOMER SOURCES ROUTES
========================================================= */

// Add a customer source
router.post("/:companyId/sources", addCustomerSource);

// Remove a customer source (soft delete)
router.delete("/:companyId/sources/:sourceId", removeCustomerSource);

// Increment source usage count
router.patch("/:companyId/sources/:sourceId/increment", incrementSourceUsage);

export default router;
