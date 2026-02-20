"use strict";
// server/src/routes/auth.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../db");
const router = express_1.default.Router();
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
/* =====================================================
   LOGIN
===================================================== */
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await db_1.pool.query(`
        SELECT
          id,
          email,
          password_hash,
          role,
          company_id,
          employee_id
        FROM users
        WHERE email = $1
        AND active = true
        `, [email]);
        if (!result.rows.length)
            return res.status(401).json({
                error: "Invalid credentials"
            });
        const user = result.rows[0];
        const validPassword = await bcrypt_1.default.compare(password, user.password_hash);
        if (!validPassword)
            return res.status(401).json({
                error: "Invalid credentials"
            });
        /* ============================================
           CREATE TOKEN
        ============================================ */
        const token = jsonwebtoken_1.default.sign({
            id: user.id,
            role: user.role,
            company_id: user.company_id,
            employee_id: user.employee_id
        }, JWT_SECRET, {
            expiresIn: "7d"
        });
        /* ============================================
           RETURN TOKEN
        ============================================ */
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                company_id: user.company_id,
                employee_id: user.employee_id
            }
        });
    }
    catch (err) {
        console.error("LOGIN ERROR:", err);
        res.status(500).json({
            error: "Login failed"
        });
    }
});
/* =====================================================
   REGISTER
===================================================== */
router.post("/register", async (req, res) => {
    const { email, password, company_name } = req.body;
    if (!email || !password) {
        return res.status(400).json({
            error: "Email and password are required"
        });
    }
    try {
        // Check if user already exists
        const existingUser = await db_1.pool.query(`SELECT id FROM users WHERE email = $1`, [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                error: "Email already registered"
            });
        }
        // 1. Create company
        const companyResult = await db_1.pool.query(`
        INSERT INTO companies
        (name, billing_status)
        VALUES ($1, 'trial')
        RETURNING id
        `, [company_name || `New Company`]);
        const company_id = companyResult.rows[0].id;
        // 2. Hash password
        const hashed = await bcrypt_1.default.hash(password, 10);
        // 3. Create user as admin
        const userResult = await db_1.pool.query(`
        INSERT INTO users
        (
          company_id,
          email,
          password_hash,
          role
        )
        VALUES
        ($1, $2, $3, 'admin')
        RETURNING id, email, role
        `, [
            company_id,
            email,
            hashed
        ]);
        const user = userResult.rows[0];
        // 4. Generate JWT token
        const token = jsonwebtoken_1.default.sign({
            id: user.id,
            email: user.email,
            role: user.role,
            company_id
        }, JWT_SECRET, { expiresIn: "7d" });
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                company_id
            }
        });
    }
    catch (err) {
        console.error("REGISTER ERROR:", err);
        res.status(500).json({
            error: "Registration failed"
        });
    }
});
/* =====================================================
   SWITCH COMPANY
   (Enterprise / God mode)
===================================================== */
router.post("/switch-company", async (req, res) => {
    try {
        const auth = req.headers.authorization;
        if (!auth)
            return res.status(401).json({
                error: "No token"
            });
        const token = auth.split(" ")[1];
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const { company_id } = req.body;
        if (!company_id)
            return res.status(400).json({
                error: "company_id required"
            });
        /* create NEW token with new company */
        const newToken = jsonwebtoken_1.default.sign({
            id: decoded.id,
            role: decoded.role,
            company_id,
            employee_id: decoded.employee_id
        }, JWT_SECRET, {
            expiresIn: "7d"
        });
        res.json({
            token: newToken
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: "Switch failed"
        });
    }
});
/* =====================================================
   EXPORT
===================================================== */
exports.default = router;
