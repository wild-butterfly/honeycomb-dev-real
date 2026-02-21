// serviceCatalogs.ts
// Admin service catalog routes

import { Router } from "express";
import {
  getServiceCatalogs,
  createServiceCatalog,
  updateServiceCatalog,
  deleteServiceCatalog,
  getServiceCatalogItems,
  createServiceCatalogItem,
  updateServiceCatalogItem,
  deleteServiceCatalogItem,
  getFavoriteItems,
} from "../controllers/serviceCatalogs.controller";
import { withDbContext } from "../middleware/dbContext";
import { requireAuth, requireRole } from "../middleware/authMiddleware";

const router = Router();

router.use(requireAuth);
router.use(withDbContext);

/* ===============================
   SERVICE CATALOGS
================================ */
router.get("/service-catalogs", getServiceCatalogs);
router.post("/service-catalogs", requireRole(["admin"]), createServiceCatalog);
router.put("/service-catalogs/:id", requireRole(["admin"]), updateServiceCatalog);
router.delete("/service-catalogs/:id", requireRole(["admin"]), deleteServiceCatalog);

/* ===============================
   SERVICE CATALOG ITEMS
================================ */
router.get("/service-catalogs/:id/items", getServiceCatalogItems);
router.post(
  "/service-catalogs/:id/items",
  requireRole(["admin"]),
  createServiceCatalogItem
);
router.put(
  "/service-catalogs/:id/items/:itemId",
  requireRole(["admin"]),
  updateServiceCatalogItem
);
router.delete(
  "/service-catalogs/:id/items/:itemId",
  requireRole(["admin"]),
  deleteServiceCatalogItem
);

/* ===============================
   FAVORITES (legacy route)
================================ */
router.get("/service-catalogs-favorites", getFavoriteItems);

export default router;
