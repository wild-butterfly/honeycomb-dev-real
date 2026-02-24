"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const invoiceTemplate_controller_1 = require("../controllers/invoiceTemplate.controller");
const router = express_1.default.Router();
// Get all templates for a company
router.get("/:companyId", invoiceTemplate_controller_1.getCompanyTemplates);
// Get a single template
router.get("/template/:id", invoiceTemplate_controller_1.getTemplate);
// Create a new template
router.post("/", invoiceTemplate_controller_1.createTemplate);
// Update a template
router.put("/:id", invoiceTemplate_controller_1.updateTemplate);
// Preview template as PDF
router.post("/preview-pdf", invoiceTemplate_controller_1.previewTemplatePdf);
// Delete a template
router.delete("/:id", invoiceTemplate_controller_1.deleteTemplate);
exports.default = router;
