import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PoolClient } from "pg";

const JWT_SECRET =
  process.env.JWT_SECRET || "supersecret";


/* =====================================================
TYPES
===================================================== */

export interface AuthUser {

  id: number;
  role: string;

  company_id?: number;

  employee_id?: number;

}


export interface AuthRequest extends Request {

  user?: AuthUser;

  db?: PoolClient;

}



/* =====================================================
REQUIRE AUTH
===================================================== */

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
)
{

  try
  {

    const authHeader =
      req.headers.authorization;


    if (!authHeader ||
        !authHeader.startsWith("Bearer "))
    {

      return res.status(401).json({
        error: "No token provided"
      });

    }


    const token =
      authHeader.split(" ")[1];


    const decoded =
      jwt.verify(
        token,
        JWT_SECRET
      ) as AuthUser;


    req.user = decoded;


    next();

  }
  catch (err)
  {

    console.error(
      "AUTH ERROR:",
      err
    );


    return res.status(401).json({
      error: "Invalid token"
    });

  }

}



/* =====================================================
REQUIRE ROLE
===================================================== */

export function requireRole(
  roles: string[]
)
{

  return (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) =>
  {

    if (!req.user)
    {

      return res.status(401).json({
        error: "Unauthorized"
      });

    }


    if (
      req.user.role === "superadmin"
    )
    {

      return next();

    }


    if (
      !roles.includes(
        req.user.role
      )
    )
    {

      return res.status(403).json({
        error: "Forbidden"
      });

    }


    next();

  };

}