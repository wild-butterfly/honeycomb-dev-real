"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const quoteTemplate_controller_1 = require("../controllers/quoteTemplate.controller");
const router = express_1.default.Router();
// Get all quote templates for a company
router.get("/:companyId", quoteTemplate_controller_1.getCompanyQuoteTemplates);
// Get a single quote template
router.get("/template/:id", quoteTemplate_controller_1.getQuoteTemplate);
// Create a new quote template
router.post("/", quoteTemplate_controller_1.createQuoteTemplate);
// Update a quote template
router.put("/:id", quoteTemplate_controller_1.updateQuoteTemplate);
// Preview quote template as PDF
router.post("/preview-pdf", quoteTemplate_controller_1.previewQuoteTemplatePdf);
// Delete a quote template
router.delete("/:id", quoteTemplate_controller_1.deleteQuoteTemplate);
exports.default = router;
