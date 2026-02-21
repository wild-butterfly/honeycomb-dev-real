import React, { useEffect, useMemo, useState } from "react";
import DashboardNavbar from "../components/DashboardNavbar";
import Footer from "../components/Footer";
import styles from "./AdminServiceCatalogsPage.module.css";
import type {
  ServiceCatalog,
  ServiceCatalogItem,
} from "../types/serviceCatalogs";
import {
  createServiceCatalog,
  createServiceCatalogItem,
  deleteServiceCatalog,
  deleteServiceCatalogItem,
  getServiceCatalogItems,
  getServiceCatalogs,
  updateServiceCatalog,
  updateServiceCatalogItem,
} from "../services/serviceCatalogs";

const emptyItem = {
  name: "",
  description: "",
  unit: "",
  cost_price: 0,
  sell_price: 0,
  tax_rate: 10,
};

export default function AdminServiceCatalogsPage() {
  const [serviceCatalogs, setServiceCatalogs] = useState<ServiceCatalog[]>([]);
  const [selectedServiceCatalogId, setSelectedServiceCatalogId] = useState<
    number | null
  >(null);
  const [items, setItems] = useState<ServiceCatalogItem[]>([]);
  const [newCatalogName, setNewCatalogName] = useState("");
  const [newItem, setNewItem] = useState({ ...emptyItem });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCatalogs();
  }, []);

  useEffect(() => {
    if (selectedServiceCatalogId) {
      loadItems(selectedServiceCatalogId);
    } else {
      setItems([]);
    }
  }, [selectedServiceCatalogId]);

  const activeCatalog = useMemo(
    () =>
      serviceCatalogs.find(
        (catalog) => catalog.id === selectedServiceCatalogId,
      ) || null,
    [serviceCatalogs, selectedServiceCatalogId],
  );

  const loadCatalogs = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getServiceCatalogs();
      setServiceCatalogs(data);
      setSelectedServiceCatalogId(data[0]?.id ?? null);
    } catch (err: any) {
      setError("Failed to load service catalogs");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async (serviceCatalogId: number) => {
    try {
      setLoading(true);
      setError("");
      const data = await getServiceCatalogItems(serviceCatalogId);
      setItems(data);
    } catch (err: any) {
      setError("Failed to load service catalog items");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCatalog = async () => {
    if (!newCatalogName.trim()) return;
    try {
      const created = await createServiceCatalog({
        name: newCatalogName.trim(),
      });
      setServiceCatalogs((prev) => [...prev, created]);
      setNewCatalogName("");
      setSelectedServiceCatalogId(created.id);
    } catch (err: any) {
      setError("Failed to create service catalog");
      console.error(err);
    }
  };

  const handleUpdateCatalog = async (catalog: ServiceCatalog) => {
    try {
      const updated = await updateServiceCatalog(catalog.id, {
        name: catalog.name,
        is_active: catalog.is_active,
      });
      setServiceCatalogs((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (err: any) {
      setError("Failed to update service catalog");
      console.error(err);
    }
  };

  const handleDeleteCatalog = async (id: number) => {
    if (!window.confirm("Delete this service catalog?")) return;
    try {
      await deleteServiceCatalog(id);
      const remaining = serviceCatalogs.filter((catalog) => catalog.id !== id);
      setServiceCatalogs(remaining);
      setSelectedServiceCatalogId(remaining[0]?.id ?? null);
    } catch (err: any) {
      setError("Failed to delete service catalog");
      console.error(err);
    }
  };

  const handleCreateItem = async () => {
    if (!selectedServiceCatalogId || !newItem.name.trim()) return;
    try {
      const created = await createServiceCatalogItem(selectedServiceCatalogId, {
        ...newItem,
        name: newItem.name.trim(),
      });
      setItems((prev) => [...prev, created]);
      setNewItem({ ...emptyItem });
    } catch (err: any) {
      setError("Failed to create service catalog item");
      console.error(err);
    }
  };

  const handleUpdateItem = async (item: ServiceCatalogItem) => {
    if (!selectedServiceCatalogId) return;
    try {
      const updated = await updateServiceCatalogItem(
        selectedServiceCatalogId,
        item.id,
        {
          name: item.name,
          description: item.description,
          unit: item.unit,
          cost_price: item.cost_price,
          sell_price: item.sell_price,
          tax_rate: item.tax_rate,
        },
      );
      setItems((prev) =>
        prev.map((row) => (row.id === item.id ? updated : row)),
      );
    } catch (err: any) {
      setError("Failed to update service catalog item");
      console.error(err);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!selectedServiceCatalogId) return;
    if (!window.confirm("Delete this item?")) return;
    try {
      await deleteServiceCatalogItem(selectedServiceCatalogId, itemId);
      setItems((prev) => prev.filter((row) => row.id !== itemId));
    } catch (err: any) {
      setError("Failed to delete service catalog item");
      console.error(err);
    }
  };

  return (
    <>
      <DashboardNavbar />
      <div className={styles.pageWrapper}>
        <main className={styles.page}>
          <div className={styles.header}>
            <div>
              <h1>Admin Service Catalogs</h1>
              <p>Manage service catalogs and items for Quick Invoice.</p>
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <section className={styles.section}>
            <h2>Service Catalogs</h2>
            <div className={styles.addRow}>
              <input
                className={styles.input}
                placeholder="New service catalog name"
                value={newCatalogName}
                onChange={(e) => setNewCatalogName(e.target.value)}
              />
              <button
                className={styles.primaryBtn}
                onClick={handleCreateCatalog}
              >
                Add Service Catalog
              </button>
            </div>

            {loading && serviceCatalogs.length === 0 && (
              <div className={styles.loading}>Loading...</div>
            )}

            <div className={styles.list}>
              {serviceCatalogs.map((catalog) => (
                <div key={catalog.id} className={styles.listRow}>
                  <input
                    className={styles.input}
                    value={catalog.name}
                    onChange={(e) =>
                      setServiceCatalogs((prev) =>
                        prev.map((row) =>
                          row.id === catalog.id
                            ? { ...row, name: e.target.value }
                            : row,
                        ),
                      )
                    }
                  />
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={catalog.is_active}
                      onChange={(e) =>
                        setServiceCatalogs((prev) =>
                          prev.map((row) =>
                            row.id === catalog.id
                              ? { ...row, is_active: e.target.checked }
                              : row,
                          ),
                        )
                      }
                    />
                    Active
                  </label>
                  <button
                    className={styles.secondaryBtn}
                    onClick={() => handleUpdateCatalog(catalog)}
                  >
                    Save
                  </button>
                  <button
                    className={styles.dangerBtn}
                    onClick={() => handleDeleteCatalog(catalog.id)}
                  >
                    Delete
                  </button>
                  <button
                    className={styles.ghostBtn}
                    onClick={() => setSelectedServiceCatalogId(catalog.id)}
                  >
                    Manage Items
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <h2>Service Catalog Items</h2>
            <div className={styles.selectRow}>
              <select
                className={styles.select}
                value={selectedServiceCatalogId ?? ""}
                onChange={(e) =>
                  setSelectedServiceCatalogId(Number(e.target.value))
                }
              >
                {serviceCatalogs.map((catalog) => (
                  <option key={catalog.id} value={catalog.id}>
                    {catalog.name}
                  </option>
                ))}
              </select>
              <span className={styles.helperText}>
                {activeCatalog
                  ? `Managing ${activeCatalog.name}`
                  : "Select a service catalog"}
              </span>
            </div>

            <div className={styles.card}>
              <div className={styles.gridHeader}>
                <div>Name</div>
                <div>Cost</div>
                <div>Sell</div>
                <div>Tax %</div>
                <div></div>
              </div>

              <div className={styles.gridRow}>
                <input
                  className={styles.input}
                  placeholder="Item name"
                  value={newItem.name}
                  onChange={(e) =>
                    setNewItem({ ...newItem, name: e.target.value })
                  }
                />
                <input
                  className={styles.input}
                  type="number"
                  placeholder="Cost"
                  value={newItem.cost_price}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      cost_price: Number(e.target.value),
                    })
                  }
                />
                <input
                  className={styles.input}
                  type="number"
                  placeholder="Sell"
                  value={newItem.sell_price}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      sell_price: Number(e.target.value),
                    })
                  }
                />
                <input
                  className={styles.input}
                  type="number"
                  placeholder="Tax %"
                  value={newItem.tax_rate}
                  onChange={(e) =>
                    setNewItem({ ...newItem, tax_rate: Number(e.target.value) })
                  }
                />
                <button
                  className={styles.primaryBtn}
                  onClick={handleCreateItem}
                >
                  Add Item
                </button>
              </div>

              {items.map((item) => (
                <div key={item.id} className={styles.gridRow}>
                  <input
                    className={styles.input}
                    value={item.name}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((row) =>
                          row.id === item.id
                            ? { ...row, name: e.target.value }
                            : row,
                        ),
                      )
                    }
                  />
                  <input
                    className={styles.input}
                    type="number"
                    value={item.cost_price}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((row) =>
                          row.id === item.id
                            ? { ...row, cost_price: Number(e.target.value) }
                            : row,
                        ),
                      )
                    }
                  />
                  <input
                    className={styles.input}
                    type="number"
                    value={item.sell_price}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((row) =>
                          row.id === item.id
                            ? { ...row, sell_price: Number(e.target.value) }
                            : row,
                        ),
                      )
                    }
                  />
                  <input
                    className={styles.input}
                    type="number"
                    value={item.tax_rate}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((row) =>
                          row.id === item.id
                            ? { ...row, tax_rate: Number(e.target.value) }
                            : row,
                        ),
                      )
                    }
                  />
                  <div className={styles.gridActions}>
                    <button
                      className={styles.secondaryBtn}
                      onClick={() => handleUpdateItem(item)}
                    >
                      Save
                    </button>
                    <button
                      className={styles.dangerBtn}
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
      <Footer />
    </>
  );
}
