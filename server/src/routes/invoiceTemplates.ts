import express from "express";
import {
  getCompanyTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "../controllers/invoiceTemplate.controller";

const router = express.Router();

// Get all templates for a company
router.get("/:companyId", getCompanyTemplates);

// Get a single template
router.get("/template/:id", getTemplate);

// Create a new template
router.post("/", createTemplate);

// Update a template
router.put("/:id", updateTemplate);

// Delete a template
router.delete("/:id", deleteTemplate);

export default router;
