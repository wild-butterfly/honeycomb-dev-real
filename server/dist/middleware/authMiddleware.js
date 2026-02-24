"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireRole = requireRole;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
/* =====================================================
REQUIRE AUTH
===================================================== */
async function requireAuth(req, res, next) {
    // Allow OPTIONS preflight requests to pass through
    if (req.method === "OPTIONS") {
        return next();
    }
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader ||
            !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                error: "No token provided"
            });
        }
        const token = authHeader.split(" ")[1];
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (err) {
        console.error("AUTH ERROR:", err);
        return res.status(401).json({
            error: "Invalid token"
        });
    }
}
/* =====================================================
REQUIRE ROLE
===================================================== */
function requireRole(roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: "Unauthorized"
            });
        }
        if (req.user.role === "superadmin") {
            return next();
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                error: "Forbidden"
            });
        }
        next();
    };
}
