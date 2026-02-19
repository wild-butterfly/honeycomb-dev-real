import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../db";

import { switchCompany } from "../controllers/authController";
import { requireAuth } from "../middleware/authMiddleware";


const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";


/* =====================================================
   LOGIN
===================================================== */

router.post(
  "/login",
  async (req: Request, res: Response) => {

    const { email, password } = req.body;

    try {

      const result = await pool.query(
        `
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
        `,
        [email]
      );

      if (result.rows.length === 0) {

        return res.status(401).json({
          error: "Invalid credentials"
        });

      }

      const user = result.rows[0];


      const validPassword = await bcrypt.compare(
        password,
        user.password_hash
      );


      if (!validPassword) {

        return res.status(401).json({
          error: "Invalid credentials"
        });

      }


      const token = jwt.sign(
        {
          id: user.id,
          role: user.role,
          company_id: user.company_id,
          employee_id: user.employee_id
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );


      res.json({
        token
      });

    }
    catch (err) {

      console.error("LOGIN ERROR:", err);

      res.status(500).json({
        error: "Login failed"
      });

    }

  }
);



/* =====================================================
   REGISTER
===================================================== */

router.post(
  "/register",
  async (req: Request, res: Response) => {

    const {
      company_id,
      email,
      password,
      role
    } = req.body;

    try {

      const hashed = await bcrypt.hash(
        password,
        10
      );


      const result = await pool.query(
        `
        INSERT INTO users
        (
          company_id,
          email,
          password_hash,
          role
        )
        VALUES
        ($1, $2, $3, $4)
        RETURNING id
        `,
        [
          company_id,
          email,
          hashed,
          role
        ]
      );


      res.json({
        user_id: result.rows[0].id
      });

    }
    catch (err) {

      console.error("REGISTER ERROR:", err);

      res.status(500).json({
        error: "Registration failed"
      });

    }

  }
);



/* =====================================================
   SWITCH COMPANY (GOD MODE)
===================================================== */

router.post(
  "/switch-company",
  requireAuth,
  switchCompany
);



/* =====================================================
   EXPORT
===================================================== */

export default router;