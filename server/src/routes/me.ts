import { Router } from "express";
import { withDbContext } from "../middleware/dbContext";
import { requireAuth } from "../middleware/authMiddleware";
import * as profileController from "../controllers/profile.controller";

const router = Router();

/* 🔐 Require login first */
router.use(requireAuth);

/* 🔐 Then attach DB context */
router.use(withDbContext);

router.get("/", async (req, res) => {

  const db = (req as any).db;

  try {

    const result = await db.query(`
      SELECT
        NULLIF(
          current_setting('app.current_company_id', true),
          ''
        )::int AS company_id
    `);

    res.json({
      company_id: result.rows[0]?.company_id ?? null,
    });

  } catch (err) {

    console.error("GET /me failed", err);

    res.status(500).json({
      error: "Failed to load session",
    });

  }

});

/* =====================================================
   PROFILE MANAGEMENT ROUTES
===================================================== */

// Get current user profile
router.get("/profile", profileController.getProfile);

// Update current user profile
router.put("/profile", profileController.updateProfile);

// Upload/update avatar
router.post(
  "/avatar",
  profileController.avatarUpload.single("avatar"),
  profileController.updateAvatar
);

// Delete avatar
router.delete("/avatar", profileController.deleteAvatar);

// Change password
router.put("/password", profileController.changePassword);

export default router;