"use strict";
// server/src/routes/generalSettings.ts
// General Settings Routes
// RESTful API for company settings, taxes, and customer sources
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const generalSettings_controller_1 = require("../controllers/generalSettings.controller");
const router = (0, express_1.Router)();
/* =========================================================
   GENERAL SETTINGS ROUTES
========================================================= */
// Get all general settings for a company
router.get("/:companyId", generalSettings_controller_1.getGeneralSettings);
// Update general settings
router.put("/:companyId", generalSettings_controller_1.updateGeneralSettings);
/* =========================================================
   TAXES ROUTES
========================================================= */
// Add a tax
router.post("/:companyId/taxes", generalSettings_controller_1.addTax);
// Remove a tax (soft delete)
router.delete("/:companyId/taxes/:taxId", generalSettings_controller_1.removeTax);
/* =========================================================
   CUSTOMER SOURCES ROUTES
========================================================= */
// Add a customer source
router.post("/:companyId/sources", generalSettings_controller_1.addCustomerSource);
// Remove a customer source (soft delete)
router.delete("/:companyId/sources/:sourceId", generalSettings_controller_1.removeCustomerSource);
// Increment source usage count
router.patch("/:companyId/sources/:sourceId/increment", generalSettings_controller_1.incrementSourceUsage);
/* =========================================================
   COMPANY LOGO ROUTES
========================================================= */
// Upload company logo
router.post("/:companyId/logo", generalSettings_controller_1.logoUpload.single("logo"), generalSettings_controller_1.uploadLogo);
// Delete company logo
router.delete("/:companyId/logo", generalSettings_controller_1.deleteLogo);
exports.default = router;
