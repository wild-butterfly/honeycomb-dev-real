import { Request, Response } from "express";
import { pool } from "../db";

const DEFAULT_REASONS = [
  { name: "Travel Time",           paid: true  },
  { name: "Office Work",           paid: true  },
  { name: "Prep Work",             paid: true  },
  { name: "Supervision / Training",paid: true  },
  { name: "Quotes / Estimates",    paid: true  },
  { name: "Unpaid Lunch",          paid: false },
  { name: "Annual Leave",          paid: true  },
  { name: "Stat Holiday",          paid: true  },
  { name: "Sick Leave",            paid: true  },
  { name: "Paid breaks",           paid: true  },
  { name: "Unpaid breaks",         paid: false },
  { name: "Other",                 paid: true  },
];

/* =========================================================
   GET all active labour reasons for a company
   Auto-seeds defaults for companies with no records yet
========================================================= */
export const getLabourReasons = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;

    let result = await pool.query(
      `SELECT id, name, paid
       FROM labour_reasons
       WHERE company_id = $1 AND is_active = true
       ORDER BY id ASC`,
      [companyId]
    );

    // Auto-seed defaults for this company if they have none
    if (result.rows.length === 0) {
      const values = DEFAULT_REASONS.map(
        (_, i) => `($1, $${i * 2 + 2}, $${i * 2 + 3})`
      ).join(", ");
      const params: any[] = [companyId];
      DEFAULT_REASONS.forEach((r) => params.push(r.name, r.paid));

      await pool.query(
        `INSERT INTO labour_reasons (company_id, name, paid)
         VALUES ${values}
         ON CONFLICT (company_id, name) DO NOTHING`,
        params
      );

      result = await pool.query(
        `SELECT id, name, paid
         FROM labour_reasons
         WHERE company_id = $1 AND is_active = true
         ORDER BY id ASC`,
        [companyId]
      );
    }

    return res.json(result.rows);
  } catch (error) {
    console.error("Error fetching labour reasons:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: `Failed to fetch labour reasons: ${msg}` });
  }
};

/* =========================================================
   ADD a new labour reason for a company
========================================================= */
export const addLabourReason = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const { name, paid } = req.body;

    if (!name || paid === undefined) {
      return res.status(400).json({ error: "name and paid are required" });
    }

    const result = await pool.query(
      `INSERT INTO labour_reasons (company_id, name, paid)
       VALUES ($1, $2, $3)
       ON CONFLICT (company_id, name)
       DO UPDATE SET paid = EXCLUDED.paid, is_active = true, updated_at = CURRENT_TIMESTAMP
       RETURNING id, name, paid`,
      [companyId, name.trim(), paid]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error adding labour reason:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: `Failed to add labour reason: ${msg}` });
  }
};

/* =========================================================
   DELETE (soft-delete) a labour reason
========================================================= */
export const deleteLabourReason = async (req: Request, res: Response) => {
  try {
    const { companyId, reasonId } = req.params;

    const result = await pool.query(
      `UPDATE labour_reasons
       SET is_active = false, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND company_id = $2
       RETURNING id`,
      [reasonId, companyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Labour reason not found" });
    }

    return res.json({ message: "Labour reason deleted" });
  } catch (error) {
    console.error("Error deleting labour reason:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: `Failed to delete labour reason: ${msg}` });
  }
};
