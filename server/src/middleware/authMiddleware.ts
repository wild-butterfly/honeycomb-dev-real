import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

/* =====================================================
   CONFIG
===================================================== */

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

/* =====================================================
   TYPES
===================================================== */

export interface AuthUser {
  id: number;
  role: string;
  company_id?: number;     // optional for superadmin
  employee_id?: number;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

/* =====================================================
   REQUIRE AUTH
===================================================== */

export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {

    return res.status(401).json({
      error: "No token provided"
    });

  }

  const token = authHeader.split(" ")[1];

  try {

    const decoded = jwt.verify(
      token,
      JWT_SECRET
    ) as any;

    /* ===== BASIC VALIDATION ===== */

    if (
      typeof decoded.id !== "number" ||
      typeof decoded.role !== "string"
    ) {

      return res.status(401).json({
        error: "Invalid token payload"
      });

    }

    /* ===== COMPANY RULE ===== */

    // superadmin company optional
    if (
      decoded.role !== "superadmin" &&
      typeof decoded.company_id !== "number"
    ) {

      return res.status(401).json({
        error: "Invalid token payload"
      });

    }

    /* ===== SET USER ===== */

    req.user = {
      id: decoded.id,
      role: decoded.role,
      company_id: decoded.company_id,
      employee_id: decoded.employee_id
    };

    next();

  }
  catch (err) {

    return res.status(401).json({
      error: "Invalid token"
    });

  }

}

/* =====================================================
   REQUIRE ROLE
===================================================== */

export function requireRole(roles: string[]) {

  return (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {

    if (!req.user) {

      return res.status(401).json({
        error: "Unauthorized"
      });

    }

    /* superadmin bypass */

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

/* =====================================================
   REQUIRE EMPLOYEE LINK
===================================================== */

export function requireEmployeeLink(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {

  if (!req.user) {

    return res.status(401).json({
      error: "Unauthorized"
    });

  }

  /* superadmin bypass */

  if (req.user.role === "superadmin") {
    return next();
  }

  if (
    req.user.role === "employee" &&
    !req.user.employee_id
  ) {

    return res.status(403).json({
      error: "Employee not linked"
    });

  }

  next();

}