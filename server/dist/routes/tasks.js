"use strict";
// server/src/routes/tasks.ts
// Created by Honeycomb © 2026
// Tasks routes (RLS safe)
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controller = __importStar(require("../controllers/tasksController"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const dbContext_1 = require("../middleware/dbContext");
const router = (0, express_1.Router)();
/* =================================================
   AUTH
   User must be logged in
================================================= */
router.use(authMiddleware_1.requireAuth);
/* =================================================
   RLS CONTEXT
   Sets current_company_id for PostgreSQL RLS
================================================= */
router.use(dbContext_1.withDbContext);
/* =================================================
   ROUTES
================================================= */
/* -------------------------------------------------
   Get all tasks (company scoped)
   Everyone can view
------------------------------------------------- */
router.get("/", controller.getAll);
/* -------------------------------------------------
   Create task
   Admin + Manager only
------------------------------------------------- */
router.post("/", (0, authMiddleware_1.requireRole)(["admin", "manager"]), controller.create);
/* -------------------------------------------------
   Mark task complete
------------------------------------------------- */
router.put("/:id/complete", (0, authMiddleware_1.requireRole)(["admin", "manager"]), controller.complete);
/* -------------------------------------------------
   Delete ALL completed tasks
   ⚠ MUST come BEFORE /:id route
------------------------------------------------- */
router.delete("/completed", (0, authMiddleware_1.requireRole)(["admin", "manager"]), controller.deleteCompleted);
/* -------------------------------------------------
   Delete single task by id
   ⚠ Dynamic route LAST
------------------------------------------------- */
router.delete("/:id", (0, authMiddleware_1.requireRole)(["admin"]), controller.remove);
exports.default = router;
