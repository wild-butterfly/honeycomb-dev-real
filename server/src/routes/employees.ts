// server/routes/employees.ts
// Created by Clevermode © 2026
// 🔐 RLS SAFE

import { Router } from "express";
import * as controller from "../controllers/employees.controller";
import { withDbContext } from "../middleware/dbContext";

const router = Router();

/*
  🔐 Every employees request runs inside
  a request-scoped DB transaction with RLS context
*/
router.use(withDbContext);

router.get("/", controller.getAll);
router.get("/:id", controller.getOne);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

export default router;
