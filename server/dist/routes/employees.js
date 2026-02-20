"use strict";
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
const controller = __importStar(require("../controllers/employees.controller"));
const dbContext_1 = require("../middleware/dbContext");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
/* =====================================================
   GLOBAL MIDDLEWARE
===================================================== */
// 🔐 Must be logged in
router.use(authMiddleware_1.requireAuth);
// 🔐 Attach DB + RLS context
router.use(dbContext_1.withDbContext);
/* =====================================================
   EMPLOYEES ROUTES
===================================================== */
/*
  SUPERADMIN → everything (auto bypass in requireRole)
  ADMIN      → full company access
  MANAGER    → read only
*/
/* ================= LIST ================= */
// Admin & Manager can list
router.get("/", (0, authMiddleware_1.requireRole)(["admin", "manager"]), controller.getAll);
/* ================= GET ONE ================= */
router.get("/:id", (0, authMiddleware_1.requireRole)(["admin", "manager"]), controller.getOne);
/* ================= CREATE ================= */
// Only admin create
router.post("/", (0, authMiddleware_1.requireRole)(["admin"]), controller.create);
/* ================= UPDATE ================= */
// Only admin update
router.put("/:id", (0, authMiddleware_1.requireRole)(["admin"]), controller.update);
/* ================= DELETE ================= */
// Only admin delete
router.delete("/:id", (0, authMiddleware_1.requireRole)(["admin"]), controller.remove);
exports.default = router;
