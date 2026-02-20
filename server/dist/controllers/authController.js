"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.switchCompany = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const switchCompany = async (req, res) => {
    try {
        const { company_id } = req.body;
        if (!company_id) {
            return res.status(400).json({
                error: "company_id required"
            });
        }
        const user = req.user;
        const token = jsonwebtoken_1.default.sign({
            id: user.id,
            role: user.role,
            company_id: company_id,
            employee_id: user.employee_id
        }, JWT_SECRET, { expiresIn: "7d" });
        res.json({
            token
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: "Switch company failed"
        });
    }
};
exports.switchCompany = switchCompany;
