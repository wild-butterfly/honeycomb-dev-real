import { Request, Response } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";


export const switchCompany = async (
  req: any,
  res: Response
) => {

  try {

    const { company_id } = req.body;

    if (!company_id) {

      return res.status(400).json({
        error: "company_id required"
      });

    }

    const user = req.user;


    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        company_id: company_id,
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

    console.error(err);

    res.status(500).json({
      error: "Switch company failed"
    });

  }

};
