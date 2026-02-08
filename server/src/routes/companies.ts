import { Router } from "express";
import * as controller from "../controllers/companies.controller";

const router = Router();

router.get("/", controller.getAll);
router.post("/", controller.create);
router.get("/:id/employees", controller.getEmployees);

export default router;