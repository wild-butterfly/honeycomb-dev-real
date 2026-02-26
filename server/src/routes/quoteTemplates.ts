import express from "express";
import {
  getCompanyQuoteTemplates,
  getQuoteTemplate,
  createQuoteTemplate,
  updateQuoteTemplate,
  deleteQuoteTemplate,
  previewQuoteTemplatePdf,
} from "../controllers/quoteTemplate.controller";

const router = express.Router();

// Get all quote templates for a company
router.get("/:companyId", getCompanyQuoteTemplates);

// Get a single quote template
router.get("/template/:id", getQuoteTemplate);

// Create a new quote template
router.post("/", createQuoteTemplate);

// Update a quote template
router.put("/:id", updateQuoteTemplate);

// Preview quote template as PDF
router.post("/preview-pdf", previewQuoteTemplatePdf);

// Delete a quote template
router.delete("/:id", deleteQuoteTemplate);

export default router;
