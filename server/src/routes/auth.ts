// server/src/routes/auth.ts

import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../db";

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


      if (!result.rows.length)
        return res.status(401).json({
          error: "Invalid credentials"
        });


      const user = result.rows[0];


      const validPassword =
        await bcrypt.compare(
          password,
          user.password_hash
        );


      if (!validPassword)
        return res.status(401).json({
          error: "Invalid credentials"
        });



      /* ============================================
         CREATE TOKEN
      ============================================ */

      const token =
        jwt.sign(

          {
            id: user.id,
            role: user.role,
            company_id: user.company_id,
            employee_id: user.employee_id
          },

          JWT_SECRET,

          {
            expiresIn: "7d"
          }

        );



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

  }
);




/* =====================================================
   REGISTER
===================================================== */

router.post(
  "/register",
  async (req: Request, res: Response) => {

    const {
      email,
      password,
      company_name
    } = req.body;


    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required"
      });
    }


    try {

      // Check if user already exists
      const existingUser = await pool.query(
        `SELECT id FROM users WHERE email = $1`,
        [email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({
          error: "Email already registered"
        });
      }

      // 1. Create company
      const companyResult = await pool.query(
        `
        INSERT INTO companies
        (name, billing_status)
        VALUES ($1, 'trial')
        RETURNING id
        `,
        [company_name || `New Company`]
      );

      const company_id = companyResult.rows[0].id;

      // 2. Hash password
      const hashed = await bcrypt.hash(password, 10);

      // 3. Create user as admin
      const userResult = await pool.query(
        `
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
        `,
        [
          company_id,
          email,
          hashed
        ]
      );

      const user = userResult.rows[0];

      // 4. Generate JWT token
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          company_id
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

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

  }
);




/* =====================================================
   SWITCH COMPANY
   (Enterprise / God mode)
===================================================== */

router.post(
  "/switch-company",
  async (req: Request, res: Response) => {

    try {

      const auth =
        req.headers.authorization;

      if (!auth)
        return res.status(401).json({
          error: "No token"
        });


      const token =
        auth.split(" ")[1];


      const decoded: any =
        jwt.verify(
          token,
          JWT_SECRET
        );


      const {
        company_id
      } = req.body;



      if (!company_id)
        return res.status(400).json({
          error: "company_id required"
        });



      /* create NEW token with new company */

      const newToken =
        jwt.sign(

          {

            id: decoded.id,
            role: decoded.role,
            company_id,
            employee_id: decoded.employee_id

          },

          JWT_SECRET,

          {

            expiresIn: "7d"

          }

        );



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

  }
);




/* =====================================================
   EXPORT
===================================================== */

export default router;