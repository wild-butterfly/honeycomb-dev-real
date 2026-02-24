"use strict";
// serviceCatalogs.ts
// Admin service catalog routes
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const serviceCatalogs_controller_1 = require("../controllers/serviceCatalogs.controller");
const dbContext_1 = require("../middleware/dbContext");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.requireAuth);
router.use(dbContext_1.withDbContext);
/* ===============================
   SERVICE CATALOGS
================================ */
router.get("/service-catalogs", serviceCatalogs_controller_1.getServiceCatalogs);
router.post("/service-catalogs", (0, authMiddleware_1.requireRole)(["admin"]), serviceCatalogs_controller_1.createServiceCatalog);
router.put("/service-catalogs/:id", (0, authMiddleware_1.requireRole)(["admin"]), serviceCatalogs_controller_1.updateServiceCatalog);
router.delete("/service-catalogs/:id", (0, authMiddleware_1.requireRole)(["admin"]), serviceCatalogs_controller_1.deleteServiceCatalog);
/* ===============================
   SERVICE CATALOG ITEMS
================================ */
router.get("/service-catalogs/:id/items", serviceCatalogs_controller_1.getServiceCatalogItems);
router.post("/service-catalogs/:id/items", (0, authMiddleware_1.requireRole)(["admin"]), serviceCatalogs_controller_1.createServiceCatalogItem);
router.put("/service-catalogs/:id/items/:itemId", (0, authMiddleware_1.requireRole)(["admin"]), serviceCatalogs_controller_1.updateServiceCatalogItem);
router.delete("/service-catalogs/:id/items/:itemId", (0, authMiddleware_1.requireRole)(["admin"]), serviceCatalogs_controller_1.deleteServiceCatalogItem);
/* ===============================
   FAVORITES (legacy route)
================================ */
router.get("/service-catalogs-favorites", serviceCatalogs_controller_1.getFavoriteItems);
exports.default = router;
