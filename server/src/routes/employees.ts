// server/routes/employees.ts
// Created by Clevermode © 2026

import { Router } from "express";
import * as controller from "../controllers/employees.controller";

const router = Router();

router.get("/", controller.getAll);
router.get("/:id", controller.getOne);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

export default router;