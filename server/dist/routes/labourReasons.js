"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const labourReasons_controller_1 = require("../controllers/labourReasons.controller");
const router = (0, express_1.Router)();
// GET  /labour-reasons/:companyId
router.get("/:companyId", labourReasons_controller_1.getLabourReasons);
// POST /labour-reasons/:companyId
router.post("/:companyId", labourReasons_controller_1.addLabourReason);
// DELETE /labour-reasons/:companyId/:reasonId
router.delete("/:companyId/:reasonId", labourReasons_controller_1.deleteLabourReason);
exports.default = router;
