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
const controller = __importStar(require("../controllers/jobs.controller"));
const dbContext_1 = require("../middleware/dbContext");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
/* 🔐 RLS context */
router.use(authMiddleware_1.requireAuth);
router.use(dbContext_1.withDbContext);
/* ===============================
   JOB CRUD
================================ */
/* GET ALL */
router.get("/", controller.getAll);
/* ⭐ ACTIVITY FIRST */
router.get("/:id/activity", controller.getActivity);
/* GET ONE */
router.get("/:id", controller.getOne);
/* CREATE */
router.post("/", (0, authMiddleware_1.requireRole)(["admin"]), controller.create);
/* UPDATE */
router.put("/:id", (0, authMiddleware_1.requireRole)(["admin"]), controller.update);
/* DELETE */
router.delete("/:id", (0, authMiddleware_1.requireRole)(["admin"]), controller.remove);
/* ===============================
   ASSIGNMENTS
================================ */
router.put("/:id/assign", (0, authMiddleware_1.requireRole)(["admin"]), controller.assignEmployee);
router.put("/:id/unassign", (0, authMiddleware_1.requireRole)(["admin"]), controller.unassignEmployee);
/* ===============================
   JOB → LABOUR
================================ */
/* VIEW labour → admin + employee */
router.get("/:id/labour", controller.getLabour);
/* ADD labour → admin + employee */
router.post("/:id/labour", controller.addLabour);
/* UPDATE labour → admin + employee */
router.put("/:jobId/labour/:labourId", controller.updateLabour);
/* DELETE labour → admin only */
router.delete("/:jobId/labour/:labourId", (0, authMiddleware_1.requireRole)(["admin"]), controller.deleteLabour);
exports.default = router;
