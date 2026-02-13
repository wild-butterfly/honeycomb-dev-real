// server/src/db.ts
// Created by Honeycomb © 2026
// PostgreSQL Connection Pool

import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

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

export const pool = new Pool({
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

pool.on("connect", () => {
  console.log("PostgreSQL connected");
});

pool.on("error", (err) => {
  console.error("Unexpected PG pool error:", err);
});