"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const labourController_1 = require("../controllers/labourController");
const dbContext_1 = require("../middleware/dbContext");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
/*
  🔐 Must be authenticated
*/
router.use(authMiddleware_1.requireAuth);
/*
  🔐 Attach DB transaction + RLS context
*/
router.use(dbContext_1.withDbContext);
/* ===============================
   LABOUR ROUTES
================================ */
/*
  Admin & Manager can view all.
  Employee can view (RLS + job policy already filters).
*/
router.get("/jobs/:jobId/labour", (0, authMiddleware_1.requireRole)(["admin", "manager", "employee"]), labourController_1.getLabourEntries);
/*
  Admin can add for anyone.
  Employee can add only for themselves.
*/
router.post("/jobs/:jobId/labour", (0, authMiddleware_1.requireRole)(["admin", "employee"]), labourController_1.addLabourEntry);
/*
  Only admin can delete labour
*/
router.delete("/labour/:id", (0, authMiddleware_1.requireRole)(["admin"]), labourController_1.deleteLabourEntry);
exports.default = router;
