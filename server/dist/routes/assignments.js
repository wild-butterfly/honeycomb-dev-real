"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const assignments_controller_1 = require("../controllers/assignments.controller");
const dbContext_1 = require("../middleware/dbContext");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
/* 🔐 AUTH FIRST */
router.use(authMiddleware_1.requireAuth);
/* 🔐 RLS CONTEXT */
router.use(dbContext_1.withDbContext);
/* ===============================
   BULK ACTIONS
================================ */
/* complete → admin + employee */
router.put("/complete", assignments_controller_1.completeAssignments);
/* reopen → admin + employee */
router.put("/reopen", assignments_controller_1.reopenAssignments);
/* ===============================
   CRUD
================================ */
/* get assignments */
router.get("/", assignments_controller_1.getAllAssignments);
/* create assignment → admin only */
router.post("/", (0, authMiddleware_1.requireRole)(["admin"]), assignments_controller_1.createAssignment);
/* update assignment → admin only */
router.put("/:id", (0, authMiddleware_1.requireRole)(["admin"]), assignments_controller_1.updateAssignment);
/* delete → admin only */
router.delete("/:id", (0, authMiddleware_1.requireRole)(["admin"]), assignments_controller_1.deleteAssignment);
exports.default = router;
