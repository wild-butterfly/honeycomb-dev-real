"use strict";
// server/src/controllers/profile.controller.ts
// User Profile Management Controller
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.deleteAvatar = exports.updateAvatar = exports.avatarUpload = exports.updateProfile = exports.getProfile = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const toInt = (v) => Number.parseInt(v, 10);
/* ========================================================
   GET CURRENT USER PROFILE
======================================================== */
const getProfile = async (req, res) => {
    const db = req.db;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const userCompanyId = req.user?.company_id;
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    try {
        // Get current company context from RLS
        const contextResult = await db.query(`
      SELECT
        NULLIF(current_setting('app.current_company_id', true), '')::int AS current_company_id,
        NULLIF(current_setting('app.god_mode', true), '') AS god_mode
    `);
        const currentCompanyId = contextResult.rows[0]?.current_company_id;
        const isGodMode = contextResult.rows[0]?.god_mode === 'true';
        const isSuperadmin = userRole === 'superadmin';
        let targetUserId = userId;
        // 🔒 SECURITY: When switching companies, fetch that company's admin profile instead
        // This prevents users from seeing avatars/profiles from other companies
        // If superadmin is impersonating a company (not in god mode and company selected),
        // fetch that company's admin user instead of the superadmin's own profile
        if (isSuperadmin && !isGodMode && currentCompanyId && currentCompanyId !== userCompanyId) {
            const companyAdminResult = await db.query(`
        SELECT id FROM users 
        WHERE company_id = $1 
          AND active = true 
          AND role IN ('admin', 'owner', 'superadmin')
        ORDER BY 
          CASE role 
            WHEN 'owner' THEN 1 
            WHEN 'admin' THEN 2 
            WHEN 'superadmin' THEN 3 
            ELSE 4 
          END,
          created_at ASC
        LIMIT 1
        `, [currentCompanyId]);
            if (companyAdminResult.rows.length > 0) {
                targetUserId = companyAdminResult.rows[0].id;
            }
            else {
                // No admin found for this company, return empty state
                return res.status(404).json({
                    error: "No admin user found for this company"
                });
            }
        }
        else if (!isSuperadmin && !isGodMode && currentCompanyId && currentCompanyId !== userCompanyId) {
            // For regular admins/owners: if switching to a different company, fetch that company's admin profile
            // This ensures each company sees only its own admin avatar
            const isAdminRole = userRole === 'admin' || userRole === 'owner';
            if (isAdminRole) {
                const companyAdminResult = await db.query(`
          SELECT id FROM users 
          WHERE company_id = $1 
            AND active = true 
            AND role IN ('admin', 'owner')
          ORDER BY 
            CASE role 
              WHEN 'owner' THEN 1 
              WHEN 'admin' THEN 2 
              ELSE 3 
            END,
            created_at ASC
          LIMIT 1
          `, [currentCompanyId]);
                if (companyAdminResult.rows.length > 0) {
                    targetUserId = companyAdminResult.rows[0].id;
                }
                else {
                    // No admin found for this company, return empty state
                    return res.status(404).json({
                        error: "No admin user found for this company"
                    });
                }
            }
        }
        // Get user profile
        const { rows } = await db.query(`
      SELECT
        id,
        email,
        full_name,
        phone,
        avatar,
        job_title,
        department,
        address,
        timezone,
        language,
        role,
        company_id,
        employee_id,
        created_at,
        profile_updated_at
      FROM users
      WHERE id = $1 AND active = true
      `, [targetUserId]);
        if (!rows.length) {
            return res.status(404).json({ error: "User not found" });
        }
        const profile = rows[0];
        // Check company isolation for regular users
        if (!isGodMode && !isSuperadmin) {
            // Regular users: enforce strict company matching
            if (currentCompanyId && profile.company_id !== currentCompanyId) {
                return res.status(403).json({
                    error: "Profile not available. You can only view your profile in your own company context."
                });
            }
            // If no company context but user has a company, they should match
            if (!currentCompanyId && userCompanyId && profile.company_id !== userCompanyId) {
                return res.status(403).json({
                    error: "Company context mismatch"
                });
            }
        }
        res.json(profile);
    }
    catch (err) {
        console.error("profile.getProfile:", err);
        res.status(500).json({ error: "Failed to load profile" });
    }
};
exports.getProfile = getProfile;
/* ========================================================
   UPDATE CURRENT USER PROFILE
======================================================== */
const updateProfile = async (req, res) => {
    const db = req.db;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const userCompanyId = req.user?.company_id;
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    try {
        // Get current company context from RLS
        const contextResult = await db.query(`
      SELECT
        NULLIF(current_setting('app.current_company_id', true), '')::int AS current_company_id,
        NULLIF(current_setting('app.god_mode', true), '') AS god_mode
    `);
        const currentCompanyId = contextResult.rows[0]?.current_company_id;
        const isGodMode = contextResult.rows[0]?.god_mode === 'true';
        const isSuperadmin = userRole === 'superadmin';
        let targetUserId = userId;
        // If superadmin is impersonating a company, edit that company's admin profile
        if (isSuperadmin && !isGodMode && currentCompanyId && currentCompanyId !== userCompanyId) {
            const companyAdminResult = await db.query(`
        SELECT id FROM users 
        WHERE company_id = $1 
          AND active = true 
          AND role IN ('admin', 'owner', 'superadmin')
        ORDER BY 
          CASE role 
            WHEN 'owner' THEN 1 
            WHEN 'admin' THEN 2 
            WHEN 'superadmin' THEN 3 
            ELSE 4 
          END,
          created_at ASC
        LIMIT 1
        `, [currentCompanyId]);
            if (companyAdminResult.rows.length > 0) {
                targetUserId = companyAdminResult.rows[0].id;
            }
            else {
                return res.status(404).json({
                    error: "No admin user found for this company"
                });
            }
        }
        else if (!isGodMode && !isSuperadmin && currentCompanyId && userCompanyId && userCompanyId !== currentCompanyId) {
            // Regular users cannot edit profile in different company context
            return res.status(403).json({
                error: "Cannot modify profile in different company context"
            });
        }
        const { full_name, email, phone, job_title, department, address, timezone, language, } = req.body;
        // Build update query dynamically for provided fields
        const updates = [];
        const values = [];
        let paramIndex = 1;
        if (full_name !== undefined) {
            updates.push(`full_name = $${paramIndex++}`);
            values.push(full_name);
        }
        if (email !== undefined) {
            const trimmedEmail = String(email).trim().toLowerCase();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
                return res.status(400).json({ error: "Invalid email address" });
            }
            // Check for duplicate email (exclude current user)
            const dup = await db.query(`SELECT id FROM users WHERE email = $1 AND id != $2 LIMIT 1`, [trimmedEmail, targetUserId]);
            if (dup.rows.length > 0) {
                return res.status(409).json({ error: "Email is already in use" });
            }
            updates.push(`email = $${paramIndex++}`);
            values.push(trimmedEmail);
        }
        if (phone !== undefined) {
            updates.push(`phone = $${paramIndex++}`);
            values.push(phone);
        }
        if (job_title !== undefined) {
            updates.push(`job_title = $${paramIndex++}`);
            values.push(job_title);
        }
        if (department !== undefined) {
            updates.push(`department = $${paramIndex++}`);
            values.push(department);
        }
        if (address !== undefined) {
            updates.push(`address = $${paramIndex++}`);
            values.push(address);
        }
        if (timezone !== undefined) {
            updates.push(`timezone = $${paramIndex++}`);
            values.push(timezone);
        }
        if (language !== undefined) {
            updates.push(`language = $${paramIndex++}`);
            values.push(language);
        }
        if (updates.length === 0) {
            return res.status(400).json({ error: "No fields to update" });
        }
        // Always update the profile_updated_at timestamp
        updates.push(`profile_updated_at = CURRENT_TIMESTAMP`);
        // Add targetUserId as the last parameter
        values.push(targetUserId);
        const query = `
      UPDATE users
      SET ${updates.join(", ")}
      WHERE id = $${paramIndex} AND active = true
      RETURNING
        id,
        email,
        full_name,
        phone,
        avatar,
        job_title,
        department,
        address,
        timezone,
        language,
        role,
        company_id,
        employee_id,
        profile_updated_at
    `;
        const { rows } = await db.query(query, values);
        if (!rows.length) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json({
            message: "Profile updated successfully",
            profile: rows[0],
        });
    }
    catch (err) {
        console.error("profile.updateProfile:", err);
        res.status(500).json({ error: "Failed to update profile" });
    }
};
exports.updateProfile = updateProfile;
/* ========================================================
   UPDATE USER AVATAR
======================================================== */
// Configure multer for avatar uploads
const avatarStorage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path_1.default.join(process.cwd(), "uploads", "avatars");
        // Create directory if it doesn't exist
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const userId = req.user?.id;
        const ext = path_1.default.extname(file.originalname);
        const filename = `avatar-${userId}-${Date.now()}${ext}`;
        cb(null, filename);
    },
});
const avatarFileFilter = (req, file, cb) => {
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
exports.avatarUpload = (0, multer_1.default)({
    storage: avatarStorage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: avatarFileFilter,
});
const updateAvatar = async (req, res) => {
    const db = req.db;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const userCompanyId = req.user?.company_id;
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }
    try {
        // Get current company context
        const contextResult = await db.query(`
      SELECT
        NULLIF(current_setting('app.current_company_id', true), '')::int AS current_company_id,
        NULLIF(current_setting('app.god_mode', true), '') AS god_mode
    `);
        const currentCompanyId = contextResult.rows[0]?.current_company_id;
        const isGodMode = contextResult.rows[0]?.god_mode === 'true';
        const isSuperadmin = userRole === 'superadmin';
        let targetUserId = userId;
        // If superadmin is impersonating a company, edit that company's admin avatar
        if (isSuperadmin && !isGodMode && currentCompanyId && currentCompanyId !== userCompanyId) {
            const companyAdminResult = await db.query(`
        SELECT id FROM users 
        WHERE company_id = $1 
          AND active = true 
          AND role IN ('admin', 'owner', 'superadmin')
        ORDER BY 
          CASE role 
            WHEN 'owner' THEN 1 
            WHEN 'admin' THEN 2 
            WHEN 'superadmin' THEN 3 
            ELSE 4 
          END,
          created_at ASC
        LIMIT 1
        `, [currentCompanyId]);
            if (companyAdminResult.rows.length > 0) {
                targetUserId = companyAdminResult.rows[0].id;
            }
            else {
                if (req.file) {
                    fs_1.default.unlinkSync(req.file.path);
                }
                return res.status(404).json({
                    error: "No admin user found for this company"
                });
            }
        }
        else if (!isGodMode && !isSuperadmin && currentCompanyId && userCompanyId && userCompanyId !== currentCompanyId) {
            // Regular users cannot modify avatar in different company context
            if (req.file) {
                fs_1.default.unlinkSync(req.file.path);
            }
            return res.status(403).json({
                error: "Cannot modify avatar in different company context"
            });
        }
        // Get old avatar to delete it
        const oldAvatarResult = await db.query(`SELECT avatar FROM users WHERE id = $1`, [targetUserId]);
        if (!oldAvatarResult.rows.length) {
            fs_1.default.unlinkSync(req.file.path);
            return res.status(404).json({ error: "User not found" });
        }
        const oldAvatar = oldAvatarResult.rows[0]?.avatar;
        // 🔒 BUG FIX: If targetUserId differs from current user, rename the file to use correct user ID
        let finalFilename = req.file.filename;
        const currentFilenameUserId = req.user?.id;
        if (targetUserId !== currentFilenameUserId) {
            // Extract file extension
            const ext = path_1.default.extname(req.file.filename);
            // Generate correct filename with targetUserId
            finalFilename = `avatar-${targetUserId}-${Date.now()}${ext}`;
            // Rename file on disk
            const oldPath = req.file.path;
            const newPath = path_1.default.join(path_1.default.dirname(oldPath), finalFilename);
            try {
                fs_1.default.renameSync(oldPath, newPath);
                console.log(`✅ Renamed avatar file: ${req.file.filename} → ${finalFilename}`);
            }
            catch (renameErr) {
                console.error("Failed to rename avatar file:", renameErr);
                fs_1.default.unlinkSync(oldPath);
                return res.status(500).json({ error: "Failed to process avatar file" });
            }
        }
        // Generate the URL for the new avatar
        const avatarUrl = `/uploads/avatars/${finalFilename}`;
        // Update user avatar in database
        const { rows } = await db.query(`
      UPDATE users
      SET avatar = $1, profile_updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND active = true
      RETURNING
        id,
        email,
        full_name,
        phone,
        avatar,
        job_title,
        department,
        address,
        timezone,
        language,
        role,
        company_id,
        employee_id
      `, [avatarUrl, targetUserId]);
        if (!rows.length) {
            // Delete uploaded file if user not found
            fs_1.default.unlinkSync(req.file.path);
            return res.status(404).json({ error: "User not found" });
        }
        // Delete old avatar file if it exists and is a local file
        if (oldAvatar && oldAvatar.startsWith("/uploads/avatars/")) {
            const oldFilePath = path_1.default.join(process.cwd(), oldAvatar);
            if (fs_1.default.existsSync(oldFilePath)) {
                try {
                    fs_1.default.unlinkSync(oldFilePath);
                }
                catch (err) {
                    console.warn("Could not delete old avatar:", err);
                }
            }
        }
        res.json({
            message: "Avatar updated successfully",
            profile: rows[0],
        });
    }
    catch (err) {
        // Delete uploaded file on error
        if (req.file) {
            try {
                fs_1.default.unlinkSync(req.file.path);
            }
            catch (unlinkErr) {
                console.warn("Could not delete uploaded file:", unlinkErr);
            }
        }
        console.error("profile.updateAvatar:", err);
        res.status(500).json({ error: "Failed to update avatar" });
    }
};
exports.updateAvatar = updateAvatar;
/* ========================================================
   DELETE USER AVATAR
======================================================== */
const deleteAvatar = async (req, res) => {
    const db = req.db;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const userCompanyId = req.user?.company_id;
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    try {
        // Get current company context
        const contextResult = await db.query(`
      SELECT
        NULLIF(current_setting('app.current_company_id', true), '')::int AS current_company_id,
        NULLIF(current_setting('app.god_mode', true), '') AS god_mode
    `);
        const currentCompanyId = contextResult.rows[0]?.current_company_id;
        const isGodMode = contextResult.rows[0]?.god_mode === 'true';
        const isSuperadmin = userRole === 'superadmin';
        let targetUserId = userId;
        // If superadmin is impersonating a company, delete that company's admin avatar
        if (isSuperadmin && !isGodMode && currentCompanyId && currentCompanyId !== userCompanyId) {
            const companyAdminResult = await db.query(`
        SELECT id FROM users 
        WHERE company_id = $1 
          AND active = true 
          AND role IN ('admin', 'owner', 'superadmin')
        ORDER BY 
          CASE role 
            WHEN 'owner' THEN 1 
            WHEN 'admin' THEN 2 
            WHEN 'superadmin' THEN 3 
            ELSE 4 
          END,
          created_at ASC
        LIMIT 1
        `, [currentCompanyId]);
            if (companyAdminResult.rows.length > 0) {
                targetUserId = companyAdminResult.rows[0].id;
            }
            else {
                return res.status(404).json({
                    error: "No admin user found for this company"
                });
            }
        }
        else if (!isGodMode && !isSuperadmin && currentCompanyId && userCompanyId && userCompanyId !== currentCompanyId) {
            // Regular users cannot modify avatar in different company context
            return res.status(403).json({
                error: "Cannot modify avatar in different company context"
            });
        }
        // Get current avatar
        const avatarResult = await db.query(`SELECT avatar FROM users WHERE id = $1`, [targetUserId]);
        const currentAvatar = avatarResult.rows[0]?.avatar;
        // Update database to remove avatar
        const { rows } = await db.query(`
      UPDATE users
      SET avatar = NULL, profile_updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND active = true
      RETURNING id, email, full_name, avatar
      `, [targetUserId]);
        if (!rows.length) {
            return res.status(404).json({ error: "User not found" });
        }
        // Delete avatar file if it exists and is a local file
        if (currentAvatar && currentAvatar.startsWith("/uploads/avatars/")) {
            const filePath = path_1.default.join(process.cwd(), currentAvatar);
            if (fs_1.default.existsSync(filePath)) {
                try {
                    fs_1.default.unlinkSync(filePath);
                }
                catch (err) {
                    console.warn("Could not delete avatar file:", err);
                }
            }
        }
        res.json({
            message: "Avatar deleted successfully",
            profile: rows[0],
        });
    }
    catch (err) {
        console.error("profile.deleteAvatar:", err);
        res.status(500).json({ error: "Failed to delete avatar" });
    }
};
exports.deleteAvatar = deleteAvatar;
/* ========================================================
   CHANGE PASSWORD
======================================================== */
const changePassword = async (req, res) => {
    const db = req.db;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const userCompanyId = req.user?.company_id;
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    try {
        // Get current company context
        const contextResult = await db.query(`
      SELECT
        NULLIF(current_setting('app.current_company_id', true), '')::int AS current_company_id,
        NULLIF(current_setting('app.god_mode', true), '') AS god_mode
    `);
        const currentCompanyId = contextResult.rows[0]?.current_company_id;
        const isGodMode = contextResult.rows[0]?.god_mode === 'true';
        const isSuperadmin = userRole === 'superadmin';
        let targetUserId = userId;
        // If superadmin is impersonating a company, change that company's admin password
        if (isSuperadmin && !isGodMode && currentCompanyId && currentCompanyId !== userCompanyId) {
            const companyAdminResult = await db.query(`
        SELECT id FROM users 
        WHERE company_id = $1 
          AND active = true 
          AND role IN ('admin', 'owner', 'superadmin')
        ORDER BY 
          CASE role 
            WHEN 'owner' THEN 1 
            WHEN 'admin' THEN 2 
            WHEN 'superadmin' THEN 3 
            ELSE 4 
          END,
          created_at ASC
        LIMIT 1
        `, [currentCompanyId]);
            if (companyAdminResult.rows.length > 0) {
                targetUserId = companyAdminResult.rows[0].id;
            }
            else {
                return res.status(404).json({
                    error: "No admin user found for this company"
                });
            }
        }
        else if (!isGodMode && !isSuperadmin && currentCompanyId && userCompanyId && userCompanyId !== currentCompanyId) {
            // Regular users cannot change password in different company context
            return res.status(403).json({
                error: "Cannot change password in different company context"
            });
        }
        const { currentPassword, newPassword } = req.body;
        // Validate input
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                error: "Current password and new password are required"
            });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({
                error: "New password must be at least 6 characters long"
            });
        }
        // Get current password hash
        const userResult = await db.query(`SELECT password_hash FROM users WHERE id = $1 AND active = true`, [targetUserId]);
        if (!userResult.rows.length) {
            return res.status(404).json({ error: "User not found" });
        }
        const user = userResult.rows[0];
        // Verify current password
        const isValidPassword = await bcrypt_1.default.compare(currentPassword, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                error: "Current password is incorrect"
            });
        }
        // Hash new password
        const newPasswordHash = await bcrypt_1.default.hash(newPassword, 10);
        // Update password
        await db.query(`
      UPDATE users
      SET password_hash = $1, profile_updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND active = true
      `, [newPasswordHash, targetUserId]);
        res.json({
            message: "Password changed successfully",
        });
    }
    catch (err) {
        console.error("profile.changePassword:", err);
        res.status(500).json({ error: "Failed to change password" });
    }
};
exports.changePassword = changePassword;
