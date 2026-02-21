// serviceCatalogs.controller.ts
// Admin-managed service catalogs and items

import { Request, Response } from "express";

const toNumber = (value: unknown, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

/* ===============================
   SERVICE CATALOGS
================================ */
export const getServiceCatalogs = async (req: Request, res: Response) => {
  const db = (req as any).db;

  try {
    const result = await db.query(
      `
      SELECT
        id,
        name,
        is_active,
        to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS') AS created_at,
        to_char(updated_at, 'YYYY-MM-DD"T"HH24:MI:SS') AS updated_at
      FROM service_catalogs
      WHERE (
        current_setting('app.god_mode') = 'true'
        OR company_id = current_setting('app.current_company_id')::bigint
      )
      ORDER BY name ASC
      `
    );

    return res.json(result.rows);
  } catch (err) {
    console.error("serviceCatalogs.getServiceCatalogs error:", err);
    return res.status(500).json({ error: "Failed to load service catalogs" });
  }
};

export const createServiceCatalog = async (req: Request, res: Response) => {
  const db = (req as any).db;
  const { name, is_active = true } = req.body || {};

  if (!name || String(name).trim() === "") {
    return res.status(400).json({ error: "Name is required" });
  }

  try {
    const result = await db.query(
      `
      INSERT INTO service_catalogs (company_id, name, is_active)
      VALUES (current_setting('app.current_company_id')::bigint, $1, $2)
      RETURNING
        id,
        name,
        is_active,
        to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS') AS created_at,
        to_char(updated_at, 'YYYY-MM-DD"T"HH24:MI:SS') AS updated_at
      `,
      [name.trim(), Boolean(is_active)]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("serviceCatalogs.createServiceCatalog error:", err);
    return res.status(500).json({ error: "Failed to create service catalog" });
  }
};

export const updateServiceCatalog = async (req: Request, res: Response) => {
  const db = (req as any).db;
  const serviceCatalogId = Number(req.params.id);
  const { name, is_active } = req.body || {};

  try {
    const result = await db.query(
      `
      UPDATE service_catalogs
      SET
        name = COALESCE($1, name),
        is_active = COALESCE($2, is_active),
        updated_at = NOW()
      WHERE id = $3 AND (
        current_setting('app.god_mode') = 'true'
        OR company_id = current_setting('app.current_company_id')::bigint
      )
      RETURNING
        id,
        name,
        is_active,
        to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS') AS created_at,
        to_char(updated_at, 'YYYY-MM-DD"T"HH24:MI:SS') AS updated_at
      `,
      [name ? String(name).trim() : null, is_active, serviceCatalogId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Service catalog not found" });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("serviceCatalogs.updateServiceCatalog error:", err);
    return res.status(500).json({ error: "Failed to update service catalog" });
  }
};

export const deleteServiceCatalog = async (req: Request, res: Response) => {
  const db = (req as any).db;
  const serviceCatalogId = Number(req.params.id);

  try {
    const result = await db.query(
      `
      DELETE FROM service_catalogs
      WHERE id = $1 AND (
        current_setting('app.god_mode') = 'true'
        OR company_id = current_setting('app.current_company_id')::bigint
      )
      RETURNING id
      `,
      [serviceCatalogId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Service catalog not found" });
    }

    return res.json({ id: serviceCatalogId });
  } catch (err) {
    console.error("serviceCatalogs.deleteServiceCatalog error:", err);
    return res.status(500).json({ error: "Failed to delete service catalog" });
  }
};

/* ===============================
   SERVICE CATALOG ITEMS
================================ */
export const getServiceCatalogItems = async (req: Request, res: Response) => {
  const db = (req as any).db;
  const serviceCatalogId = Number(req.params.id);

  try {
    const result = await db.query(
      `
      SELECT
        i.id,
        i.service_catalog_id,
        i.name,
        i.description,
        i.unit,
        i.cost_price,
        i.sell_price,
        i.tax_rate,
        i.is_favorite,
        to_char(i.created_at, 'YYYY-MM-DD"T"HH24:MI:SS') AS created_at,
        to_char(i.updated_at, 'YYYY-MM-DD"T"HH24:MI:SS') AS updated_at
      FROM service_catalog_items i
      JOIN service_catalogs b ON b.id = i.service_catalog_id
      WHERE i.service_catalog_id = $1 AND (
        current_setting('app.god_mode') = 'true'
        OR b.company_id = current_setting('app.current_company_id')::bigint
      )
      ORDER BY i.name ASC
      `,
      [serviceCatalogId]
    );

    return res.json(result.rows);
  } catch (err) {
    console.error("serviceCatalogs.getServiceCatalogItems error:", err);
    return res.status(500).json({ error: "Failed to load service catalog items" });
  }
};

export const createServiceCatalogItem = async (req: Request, res: Response) => {
  const db = (req as any).db;
  const serviceCatalogId = Number(req.params.id);
  const {
    name,
    description,
    unit,
    cost_price,
    sell_price,
    tax_rate,
    is_favorite = false,
  } = req.body || {};

  if (!name || String(name).trim() === "") {
    return res.status(400).json({ error: "Name is required" });
  }

  try {
    const catalogCheck = await db.query(
      `
      SELECT id
      FROM service_catalogs
      WHERE id = $1 AND (
        current_setting('app.god_mode') = 'true'
        OR company_id = current_setting('app.current_company_id')::bigint
      )
      `,
      [serviceCatalogId]
    );

    if (!catalogCheck.rows.length) {
      return res.status(404).json({ error: "Service catalog not found" });
    }

    const result = await db.query(
      `
      INSERT INTO service_catalog_items
      (
        service_catalog_id,
        company_id,
        name,
        description,
        unit,
        cost_price,
        sell_price,
        tax_rate,
        is_favorite
      )
      VALUES
      (
        $1,
        current_setting('app.current_company_id')::bigint,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8
      )
      RETURNING
        id,
        service_catalog_id,
        name,
        description,
        unit,
        cost_price,
        sell_price,
        tax_rate,
        is_favorite,
        to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS') AS created_at,
        to_char(updated_at, 'YYYY-MM-DD"T"HH24:MI:SS') AS updated_at
      `,
      [
        serviceCatalogId,
        String(name).trim(),
        description || null,
        unit || null,
        toNumber(cost_price),
        toNumber(sell_price),
        toNumber(tax_rate, 10),
        Boolean(is_favorite),
      ]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("serviceCatalogs.createServiceCatalogItem error:", err);
    return res.status(500).json({ error: "Failed to create service catalog item" });
  }
};

export const updateServiceCatalogItem = async (req: Request, res: Response) => {
  const db = (req as any).db;
  const serviceCatalogId = Number(req.params.id);
  const itemId = Number(req.params.itemId);
  const {
    name,
    description,
    unit,
    cost_price,
    sell_price,
    tax_rate,
    is_favorite,
  } = req.body || {};

  try {
    const result = await db.query(
      `
      UPDATE service_catalog_items i
      SET
        name = COALESCE($1, i.name),
        description = COALESCE($2, i.description),
        unit = COALESCE($3, i.unit),
        cost_price = COALESCE($4, i.cost_price),
        sell_price = COALESCE($5, i.sell_price),
        tax_rate = COALESCE($6, i.tax_rate),
        is_favorite = COALESCE($7, i.is_favorite),
        updated_at = NOW()
      FROM service_catalogs b
      WHERE i.id = $8
        AND i.service_catalog_id = $9
        AND b.id = i.service_catalog_id
        AND (
          current_setting('app.god_mode') = 'true'
          OR b.company_id = current_setting('app.current_company_id')::bigint
        )
      RETURNING
        i.id,
        i.service_catalog_id,
        i.name,
        i.description,
        i.unit,
        i.cost_price,
        i.sell_price,
        i.tax_rate,
        i.is_favorite,
        to_char(i.created_at, 'YYYY-MM-DD"T"HH24:MI:SS') AS created_at,
        to_char(i.updated_at, 'YYYY-MM-DD"T"HH24:MI:SS') AS updated_at
      `,
      [
        name ? String(name).trim() : null,
        description ?? null,
        unit ?? null,
        cost_price !== undefined ? toNumber(cost_price) : null,
        sell_price !== undefined ? toNumber(sell_price) : null,
        tax_rate !== undefined ? toNumber(tax_rate) : null,
        is_favorite !== undefined ? Boolean(is_favorite) : null,
        itemId,
        serviceCatalogId,
      ]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Service catalog item not found" });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("serviceCatalogs.updateServiceCatalogItem error:", err);
    return res.status(500).json({ error: "Failed to update service catalog item" });
  }
};

export const deleteServiceCatalogItem = async (req: Request, res: Response) => {
  const db = (req as any).db;
  const serviceCatalogId = Number(req.params.id);
  const itemId = Number(req.params.itemId);

  try {
    const result = await db.query(
      `
      DELETE FROM service_catalog_items i
      USING service_catalogs b
      WHERE i.id = $1
        AND i.service_catalog_id = $2
        AND b.id = i.service_catalog_id
        AND (
          current_setting('app.god_mode') = 'true'
          OR b.company_id = current_setting('app.current_company_id')::bigint
        )
      RETURNING i.id
      `,
      [itemId, serviceCatalogId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Service catalog item not found" });
    }

    return res.json({ id: itemId });
  } catch (err) {
    console.error("serviceCatalogs.deleteServiceCatalogItem error:", err);
    return res.status(500).json({ error: "Failed to delete service catalog item" });
  }
};

export const getFavoriteItems = async (req: Request, res: Response) => {
  const db = (req as any).db;

  try {
    const result = await db.query(
      `
      SELECT
        i.id,
        i.service_catalog_id,
        i.name,
        i.description,
        i.unit,
        i.cost_price,
        i.sell_price,
        i.tax_rate,
        i.is_favorite,
        b.name AS service_catalog_name
      FROM service_catalog_items i
      JOIN service_catalogs b ON b.id = i.service_catalog_id
      WHERE i.is_favorite = true AND (
        current_setting('app.god_mode') = 'true'
        OR b.company_id = current_setting('app.current_company_id')::bigint
      )
      ORDER BY b.name ASC, i.name ASC
      `
    );

    return res.json(result.rows);
  } catch (err) {
    console.error("serviceCatalogs.getFavoriteItems error:", err);
    return res.status(500).json({ error: "Failed to load favorites" });
  }
};
