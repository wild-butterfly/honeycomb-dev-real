"use strict";
// server/src/db.ts
// Created by Honeycomb © 2026
// PostgreSQL Connection Pool
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
/* =========================================================
   VALIDATE REQUIRED ENV VARIABLES
========================================================= */
const requiredEnv = [
    "PGHOST",
    "PGUSER",
    "PGPASSWORD",
    "PGDATABASE",
];
for (const key of requiredEnv) {
    if (!process.env[key]) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
}
/* =========================================================
   CREATE POOL
========================================================= */
exports.pool = new pg_1.Pool({
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    // 🔥 Production tuning
    max: 20, // max connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
/* =========================================================
   OPTIONAL: Pool Events (Debugging)
========================================================= */
exports.pool.on("connect", () => {
    console.log("PostgreSQL connected");
});
exports.pool.on("error", (err) => {
    console.error("Unexpected PG pool error:", err);
});
