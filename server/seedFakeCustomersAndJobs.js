#!/usr/bin/env node
/**
 * Seed fake customers and jobs for a specific company.
 *
 * Usage:
 *   node seedFakeCustomersAndJobs.js --company=1 --customers=6 --jobs=18
 *   node seedFakeCustomersAndJobs.js --company=2
 */

const { Pool } = require("pg");
const dotenv = require("dotenv");

dotenv.config();

const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
});

function getArg(name, fallback) {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (!arg) return fallback;
  return arg.split("=")[1];
}

function pick(arr, index) {
  return arr[index % arr.length];
}

async function getColumns(client, tableName) {
  const { rows } = await client.query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
    `,
    [tableName]
  );
  return new Set(rows.map((r) => r.column_name));
}

async function tableExists(client, tableName) {
  const { rows } = await client.query(
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = $1
      ) AS exists
    `,
    [tableName]
  );
  return Boolean(rows[0]?.exists);
}

function buildInsert(tableName, record, allowedColumns) {
  const keys = Object.keys(record).filter((k) => allowedColumns.has(k));
  if (!keys.length) {
    throw new Error(`No valid columns found for INSERT into ${tableName}`);
  }

  const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
  const sql = `INSERT INTO ${tableName} (${keys.join(", ")}) VALUES (${placeholders}) RETURNING *`;
  const values = keys.map((k) => record[k]);
  return { sql, values };
}

function fakeCustomers(count) {
  const companies = [
    "Summit Electrical Group",
    "Northgate Property Services",
    "Atlas Building Systems",
    "Harbor Facilities Management",
    "Prime Retail Operations",
    "Vertex Industrial Solutions",
    "Crescent Hospitality Group",
    "Unified Care Partners",
  ];
  const sources = ["Referral", "Google Search", "Existing Client", "Website"];
  const suburbs = ["Richmond", "Clayton", "Dandenong", "Geelong", "Southbank"];
  const states = ["Victoria", "New South Wales", "Queensland"];
  const contacts = [
    ["Ava", "Taylor"],
    ["Noah", "Mitchell"],
    ["Isla", "Walker"],
    ["Liam", "Hughes"],
    ["Mia", "Evans"],
    ["Lucas", "Parker"],
  ];

  return Array.from({ length: count }).map((_, i) => {
    const [first, last] = pick(contacts, i);
    const company = `${pick(companies, i)} ${i + 1}`;
    return {
      company_name: company,
      customer_source: pick(sources, i),
      main_contact_first_name: first,
      main_contact_last_name: last,
      main_contact_title: "Facilities Manager",
      main_contact_type: "Mobile",
      main_contact_value: `04${String(10000000 + i).slice(-8)}`,
      main_secondary_contact_type: "Email",
      main_contact_email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
      address_line1: `${100 + i} Example Street`,
      address_line2: "",
      suburb: pick(suburbs, i),
      city: "Melbourne",
      state_region: pick(states, i),
      postcode: `${3000 + i}`,
      country: "Australia",
      same_as_main_contact: true,
      same_as_physical_address: true,
      pricing_tier: "Always use default",
      payment_terms: "14 days",
      card_payment_fee: "Company Setting",
      attach_invoice_pdf: false,
    };
  });
}

function fakeJobs(count, customerRows) {
  const statuses = [
    "pending",
    "pricing",
    "scheduling",
    "in_progress",
    "back_costing",
    "invoicing",
    "payment",
    "active",
    "completed",
  ];
  const jobTypes = ["Routine Test & Tag", "Compliance Inspection", "Safety Audit"];

  return Array.from({ length: count }).map((_, i) => {
    const customer = customerRows[i % customerRows.length] || {};
    const customerName = customer.company_name || `Customer ${i + 1}`;
    const first = customer.main_contact_first_name || "Contact";
    const last = customer.main_contact_last_name || `${i + 1}`;
    const email =
      customer.main_contact_email || `contact${i + 1}@example.com`;
    const phone = customer.main_contact_value || `04${String(20000000 + i).slice(-8)}`;
    const address = [customer.address_line1, customer.suburb, customer.state_region]
      .filter(Boolean)
      .join(", ");

    return {
      title: `A1TT-${28000 + i} ${pick(jobTypes, i)}`,
      status: pick(statuses, i),
      client: customerName,
      address: address || `${200 + i} Job Site Road, Melbourne`,
      notes: `Seeded demo job ${i + 1}`,
      contact_name: `${first} ${last}`,
      contact_email: email,
      contact_phone: phone,
      customer_id: customer.id || null,
      site_address: address || null,
      job_number: `JOB-${12000 + i}`,
      customer_order_number: `CO-${9000 + i}`,
    };
  });
}

async function main() {
  const client = await pool.connect();
  try {
    const companyArg = getArg("company", "");
    const customersCount = Number(getArg("customers", "6"));
    const jobsCount = Number(getArg("jobs", "18"));

    if (!Number.isFinite(customersCount) || customersCount < 1) {
      throw new Error("--customers must be a positive number");
    }
    if (!Number.isFinite(jobsCount) || jobsCount < 1) {
      throw new Error("--jobs must be a positive number");
    }

    let companyId = Number(companyArg);
    if (!companyId) {
      const { rows } = await client.query(
        `SELECT id FROM companies ORDER BY id ASC LIMIT 1`
      );
      if (!rows.length) throw new Error("No company found in companies table");
      companyId = Number(rows[0].id);
    }

    console.log(`Using company_id=${companyId}`);

    const jobsExists = await tableExists(client, "jobs");
    if (!jobsExists) throw new Error("jobs table does not exist");
    const jobsColumns = await getColumns(client, "jobs");

    const customersExists = await tableExists(client, "customers");
    const customerColumns = customersExists
      ? await getColumns(client, "customers")
      : null;

    await client.query("BEGIN");

    let insertedCustomers = [];

    if (customersExists && customerColumns) {
      const customerSeeds = fakeCustomers(customersCount);
      for (const seed of customerSeeds) {
        const record = {
          company_id: companyId,
          ...seed,
        };
        const { sql, values } = buildInsert("customers", record, customerColumns);
        const { rows } = await client.query(sql, values);
        insertedCustomers.push(rows[0]);
      }
      console.log(`Inserted ${insertedCustomers.length} customers`);
    } else {
      console.log("customers table not found, skipping customer inserts");
    }

    const jobSeeds = fakeJobs(jobsCount, insertedCustomers);
    let insertedJobs = 0;
    for (const seed of jobSeeds) {
      const record = {
        company_id: companyId,
        ...seed,
      };
      const { sql, values } = buildInsert("jobs", record, jobsColumns);
      await client.query(sql, values);
      insertedJobs += 1;
    }

    await client.query("COMMIT");
    console.log(`Inserted ${insertedJobs} jobs`);
    console.log("Seed complete");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
