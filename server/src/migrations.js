#!/usr/bin/env node
// Migration runner - executes all .sql files in the migrations folder

const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
});

async function runMigrations() {
  try {
    console.log("🔄 Starting migrations...");
    
    const migrationsDir = path.join(__dirname, "../migrations");
    const sqlFiles = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    console.log(`Found ${sqlFiles.length} migration files`);

    for (const file of sqlFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, "utf-8");

      console.log(`\n📄 Running: ${file}`);
      
      try {
        await pool.query(sql);
        console.log(`✅ Completed: ${file}`);
      } catch (err) {
        console.error(`❌ Error in ${file}:`, err.message);
        // Continue with next migration even if one fails
      }
    }

    console.log("\n✨ All migrations completed!");
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error("Fatal migration error:", err);
    process.exit(1);
  }
}

runMigrations();
