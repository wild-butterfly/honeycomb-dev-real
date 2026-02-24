"use strict";
// server/src/controllers/generalSettings.controller.ts
// General Settings Controller - Professional FSM Pattern
// Handles company settings, taxes, and customer sources
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteLogo = exports.uploadLogo = exports.logoUpload = exports.incrementSourceUsage = exports.removeCustomerSource = exports.addCustomerSource = exports.removeTax = exports.addTax = exports.updateGeneralSettings = exports.getGeneralSettings = void 0;
const db_1 = require("../db");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
/* =========================================================
   GET GENERAL SETTINGS
========================================================= */
const getGeneralSettings = async (req, res) => {
    try {
        const { companyId } = req.params;
        // Get company settings with invoice_settings joined
        // Prefer invoice_settings.company_name over companies.name if available
        const companyResult = await db_1.pool.query(`SELECT 
        c.id,
        COALESCE(i.company_name, c.name) as business_name,
        c.abn,
        c.payee_name,
        c.bsb_number,
        c.bank_account_number,
        c.job_number_prefix,
        c.starting_job_number,
        c.currency,
        c.date_format,
        c.timezone,
        c.auto_assign_phase,
        c.show_state_on_invoices,
        c.auto_archive_unpriced,
        c.unpriced_jobs_cleanup_days,
        c.expired_quotes_cleanup_days,
        c.inactive_jobs_cleanup_days,
        c.auto_archive_stale_days,
        c.logo_url,
        i.company_address,
        i.company_city,
        i.company_state,
        i.company_postal_code,
        i.company_phone,
        i.company_email,
        i.company_website
      FROM companies c
      LEFT JOIN invoice_settings i ON c.id = i.company_id
      WHERE c.id = $1`, [companyId]);
        if (companyResult.rows.length === 0) {
            return res.status(404).json({ error: "Company not found" });
        }
        // Get taxes for this company
        const taxesResult = await db_1.pool.query(`SELECT id, name, rate 
       FROM taxes 
       WHERE company_id = $1 AND is_active = true
       ORDER BY name`, [companyId]);
        // Get customer sources for this company
        const sourcesResult = await db_1.pool.query(`SELECT id, name 
       FROM customer_sources 
       WHERE company_id = $1 AND is_active = true
       ORDER BY usage_count DESC, name`, [companyId]);
        return res.json({
            settings: companyResult.rows[0],
            taxes: taxesResult.rows,
            customerSources: sourcesResult.rows,
        });
    }
    catch (error) {
        console.error("Error fetching general settings:", error);
        return res.status(500).json({ error: "Failed to fetch general settings" });
    }
};
exports.getGeneralSettings = getGeneralSettings;
/* =========================================================
   UPDATE GENERAL SETTINGS
========================================================= */
const updateGeneralSettings = async (req, res) => {
    try {
        const { companyId } = req.params;
        const { business_name, abn, payee_name, bsb_number, bank_account_number, job_number_prefix, starting_job_number, currency, date_format, timezone, auto_assign_phase, show_state_on_invoices, auto_archive_unpriced, unpriced_jobs_cleanup_days, expired_quotes_cleanup_days, inactive_jobs_cleanup_days, auto_archive_stale_days, } = req.body;
        console.log("UpdateGeneralSettings received:", {
            companyId,
            business_name,
            starting_job_number,
            auto_assign_phase,
            unpriced_jobs_cleanup_days,
            inactive_jobs_cleanup_days,
        });
        const result = await db_1.pool.query(`UPDATE companies SET
        name = COALESCE($1, name),
        abn = COALESCE($2, abn),
        payee_name = COALESCE($3, payee_name),
        bsb_number = COALESCE($4, bsb_number),
        bank_account_number = COALESCE($5, bank_account_number),
        job_number_prefix = COALESCE($6, job_number_prefix),
        starting_job_number = COALESCE($7::INTEGER, starting_job_number),
        currency = COALESCE($8, currency),
        date_format = COALESCE($9, date_format),
        timezone = COALESCE($10, timezone),
        auto_assign_phase = COALESCE($11::BOOLEAN, auto_assign_phase),
        show_state_on_invoices = COALESCE($12::BOOLEAN, show_state_on_invoices),
        auto_archive_unpriced = COALESCE($13::BOOLEAN, auto_archive_unpriced),
        unpriced_jobs_cleanup_days = COALESCE($14::INTEGER, unpriced_jobs_cleanup_days),
        expired_quotes_cleanup_days = COALESCE($15::INTEGER, expired_quotes_cleanup_days),
        inactive_jobs_cleanup_days = $16,
        auto_archive_stale_days = COALESCE($17::INTEGER, auto_archive_stale_days)
      WHERE id = $18
      RETURNING *`, [
            business_name,
            abn,
            payee_name,
            bsb_number,
            bank_account_number,
            job_number_prefix,
            starting_job_number,
            currency,
            date_format,
            timezone,
            auto_assign_phase,
            show_state_on_invoices,
            auto_archive_unpriced,
            unpriced_jobs_cleanup_days,
            expired_quotes_cleanup_days,
            inactive_jobs_cleanup_days,
            auto_archive_stale_days,
            companyId,
        ]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Company not found" });
        }
        return res.json({
            message: "General settings updated successfully",
            settings: result.rows[0],
        });
    }
    catch (error) {
        console.error("Error updating general settings:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("Detailed error:", errorMessage);
        return res.status(500).json({ error: `Failed to update general settings: ${errorMessage}` });
    }
};
exports.updateGeneralSettings = updateGeneralSettings;
/* =========================================================
   TAXES MANAGEMENT
========================================================= */
// Add tax
const addTax = async (req, res) => {
    try {
        const { companyId } = req.params;
        const { name, rate } = req.body;
        if (!name || rate === undefined) {
            return res.status(400).json({ error: "Tax name and rate are required" });
        }
        const result = await db_1.pool.query(`INSERT INTO taxes (company_id, name, rate)
       VALUES ($1, $2, $3)
       ON CONFLICT (company_id, name) 
       DO UPDATE SET rate = EXCLUDED.rate, is_active = true, updated_at = CURRENT_TIMESTAMP
       RETURNING *`, [companyId, name, rate]);
        return res.status(201).json({
            message: "Tax added successfully",
            tax: result.rows[0],
        });
    }
    catch (error) {
        console.error("Error adding tax:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return res.status(500).json({ error: `Failed to add tax: ${errorMessage}` });
    }
};
exports.addTax = addTax;
// Remove tax (soft delete)
const removeTax = async (req, res) => {
    try {
        const { companyId, taxId } = req.params;
        const result = await db_1.pool.query(`UPDATE taxes 
       SET is_active = false, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND company_id = $2
       RETURNING *`, [taxId, companyId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Tax not found" });
        }
        return res.json({
            message: "Tax removed successfully",
            tax: result.rows[0],
        });
    }
    catch (error) {
        console.error("Error removing tax:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return res.status(500).json({ error: `Failed to remove tax: ${errorMessage}` });
    }
};
exports.removeTax = removeTax;
/* =========================================================
   CUSTOMER SOURCES MANAGEMENT
========================================================= */
// Add customer source
const addCustomerSource = async (req, res) => {
    try {
        const { companyId } = req.params;
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: "Source name is required" });
        }
        const result = await db_1.pool.query(`INSERT INTO customer_sources (company_id, name)
       VALUES ($1, $2)
       ON CONFLICT (company_id, name) 
       DO UPDATE SET is_active = true, updated_at = CURRENT_TIMESTAMP
       RETURNING *`, [companyId, name]);
        return res.status(201).json({
            message: "Customer source added successfully",
            source: result.rows[0],
        });
    }
    catch (error) {
        console.error("Error adding customer source:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return res.status(500).json({ error: `Failed to add customer source: ${errorMessage}` });
    }
};
exports.addCustomerSource = addCustomerSource;
// Remove customer source (soft delete)
const removeCustomerSource = async (req, res) => {
    try {
        const { companyId, sourceId } = req.params;
        const result = await db_1.pool.query(`UPDATE customer_sources 
       SET is_active = false, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND company_id = $2
       RETURNING *`, [sourceId, companyId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Customer source not found" });
        }
        return res.json({
            message: "Customer source removed successfully",
            source: result.rows[0],
        });
    }
    catch (error) {
        console.error("Error removing customer source:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return res.status(500).json({ error: `Failed to remove customer source: ${errorMessage}` });
    }
};
exports.removeCustomerSource = removeCustomerSource;
// Increment usage count (when source is used for a new customer)
const incrementSourceUsage = async (req, res) => {
    try {
        const { companyId, sourceId } = req.params;
        await db_1.pool.query(`UPDATE customer_sources 
       SET usage_count = usage_count + 1
       WHERE id = $1 AND company_id = $2`, [sourceId, companyId]);
        return res.json({ message: "Source usage incremented" });
    }
    catch (error) {
        console.error("Error incrementing source usage:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return res.status(500).json({ error: `Failed to update source usage: ${errorMessage}` });
    }
};
exports.incrementSourceUsage = incrementSourceUsage;
/* =========================================================
   COMPANY LOGO UPLOAD
========================================================= */
// Configure multer for logo uploads
const logoStorage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path_1.default.join(process.cwd(), "uploads", "logos");
        // Create directory if it doesn't exist
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename with timestamp and random string
        const ext = path_1.default.extname(file.originalname);
        const filename = `logo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;
        cb(null, filename);
    },
});
const logoFileFilter = (req, file, cb) => {
    // Accept images only
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
        return cb(null, true);
    }
    else {
        cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"));
    }
};
exports.logoUpload = (0, multer_1.default)({
    storage: logoStorage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: logoFileFilter,
});
const uploadLogo = async (req, res) => {
    try {
        const { companyId } = req.params;
        console.log("uploadLogo called with companyId:", companyId);
        console.log("req.file:", req.file ? { filename: req.file.filename, path: req.file.path } : "NO FILE");
        if (!req.file) {
            console.error("No file uploaded");
            return res.status(400).json({ error: "No file uploaded" });
        }
        // Construct the file path that will be stored in database
        const logoPath = `/uploads/logos/${req.file.filename}`;
        console.log("Saving logo path to database:", logoPath);
        // Update company logo in database
        const result = await db_1.pool.query(`UPDATE companies 
       SET logo_url = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, name as business_name, abn, payee_name, bsb_number, 
                 bank_account_number, job_number_prefix, starting_job_number,
                 currency, date_format, timezone, auto_assign_phase, 
                 show_state_on_invoices, auto_archive_unpriced,
                 unpriced_jobs_cleanup_days, expired_quotes_cleanup_days,
                 inactive_jobs_cleanup_days, auto_archive_stale_days, logo_url`, [logoPath, companyId]);
        if (result.rows.length === 0) {
            console.error("Company not found:", companyId);
            return res.status(404).json({ error: "Company not found" });
        }
        console.log("Logo updated successfully for company:", companyId);
        // Get taxes and customer sources
        const taxesResult = await db_1.pool.query(`SELECT id, name, rate 
       FROM taxes 
       WHERE company_id = $1 AND is_active = true
       ORDER BY name`, [companyId]);
        const sourcesResult = await db_1.pool.query(`SELECT id, name 
       FROM customer_sources 
       WHERE company_id = $1 AND is_active = true
       ORDER BY usage_count DESC, name`, [companyId]);
        res.json({
            settings: result.rows[0],
            taxes: taxesResult.rows,
            customerSources: sourcesResult.rows,
        });
    }
    catch (error) {
        console.error("Error uploading logo:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ error: `Failed to upload logo: ${errorMessage}` });
    }
};
exports.uploadLogo = uploadLogo;
const deleteLogo = async (req, res) => {
    try {
        const { companyId } = req.params;
        console.log("deleteLogo called with companyId:", companyId);
        // Get current logo path
        const logoResult = await db_1.pool.query(`SELECT logo_url FROM companies WHERE id = $1`, [companyId]);
        if (logoResult.rows.length === 0) {
            console.error("Company not found:", companyId);
            return res.status(404).json({ error: "Company not found" });
        }
        const logoUrl = logoResult.rows[0].logo_url;
        // Delete file from disk if it exists
        if (logoUrl) {
            const filePath = path_1.default.join(process.cwd(), logoUrl);
            console.log("Attempting to delete file:", filePath);
            if (fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
                console.log("File deleted successfully");
            }
            else {
                console.log("File does not exist:", filePath);
            }
        }
        // Remove logo from database
        const result = await db_1.pool.query(`UPDATE companies 
       SET logo_url = NULL, updated_at = NOW()
       WHERE id = $1
       RETURNING id, name as business_name, abn, payee_name, bsb_number, 
                 bank_account_number, job_number_prefix, starting_job_number,
                 currency, date_format, timezone, auto_assign_phase, 
                 show_state_on_invoices, auto_archive_unpriced,
                 unpriced_jobs_cleanup_days, expired_quotes_cleanup_days,
                 inactive_jobs_cleanup_days, auto_archive_stale_days, logo_url`, [companyId]);
        // Get taxes and customer sources
        const taxesResult = await db_1.pool.query(`SELECT id, name, rate 
       FROM taxes 
       WHERE company_id = $1 AND is_active = true
       ORDER BY name`, [companyId]);
        const sourcesResult = await db_1.pool.query(`SELECT id, name 
       FROM customer_sources 
       WHERE company_id = $1 AND is_active = true
       ORDER BY usage_count DESC, name`, [companyId]);
        res.json({
            settings: result.rows[0],
            taxes: taxesResult.rows,
            customerSources: sourcesResult.rows,
        });
    }
    catch (error) {
        console.error("Error deleting logo:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ error: `Failed to delete logo: ${errorMessage}` });
    }
};
exports.deleteLogo = deleteLogo;
