import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { FiTrash2, FiPlus, FiEdit2 } from "react-icons/fi";
import {
  getServiceCatalogs,
  createServiceCatalog,
  updateServiceCatalog,
  deleteServiceCatalog,
} from "../services/serviceCatalogs";
import type { ServiceCatalog } from "../types/serviceCatalogs";
import styles from "./ServiceCatalogSettings.module.css";

const emptyCatalogForm = () => ({ name: "", is_active: true });

const ServiceCatalogSettings: React.FC = () => {
  const [catalogs, setCatalogs] = useState<ServiceCatalog[]>([]);
  const [catalogsLoading, setCatalogsLoading] = useState(true);

  const [modal, setModal] = useState<"closed" | "add" | "edit">("closed");
  const [editingCatalog, setEditingCatalog] = useState<ServiceCatalog | null>(null);
  const [form, setForm] = useState(emptyCatalogForm());
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  /* ── load ───────────────────────────────────────────── */
  const loadCatalogs = useCallback(async () => {
    setCatalogsLoading(true);
    try {
      const data = await getServiceCatalogs();
      setCatalogs(data);
    } finally {
      setCatalogsLoading(false);
    }
  }, []);

  useEffect(() => { loadCatalogs(); }, [loadCatalogs]);

  useEffect(() => {
    document.body.classList.toggle("labour-categories-modal-open", modal !== "closed");
    return () => document.body.classList.remove("labour-categories-modal-open");
  }, [modal]);

  /* ── modal helpers ──────────────────────────────────── */
  const openAdd = () => {
    setForm(emptyCatalogForm());
    setEditingCatalog(null);
    setModal("add");
  };

  const openEdit = (c: ServiceCatalog) => {
    setForm({ name: c.name, is_active: c.is_active });
    setEditingCatalog(c);
    setModal("edit");
  };

  const closeModal = () => { setModal("closed"); setEditingCatalog(null); };

  /* ── CRUD ───────────────────────────────────────────── */
  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (modal === "add") {
        const created = await createServiceCatalog({ name: form.name.trim(), is_active: form.is_active });
        setCatalogs((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      } else if (modal === "edit" && editingCatalog) {
        const updated = await updateServiceCatalog(editingCatalog.id, {
          name: form.name.trim(),
          is_active: form.is_active,
        });
        setCatalogs((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      }
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    await deleteServiceCatalog(id);
    setCatalogs((prev) => prev.filter((c) => c.id !== id));
    setDeleteConfirmId(null);
  };

  /* ── render ─────────────────────────────────────────── */
  return (
    <div className={styles.page}>
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>Service Catalogs</h2>
          <button className={styles.newBtn} onClick={openAdd}>
            {FiPlus({ size: 15 })} New Catalog
          </button>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Name <span className={styles.sortIcon}>⇅</span></th>
              <th className={styles.th}>Status <span className={styles.sortIcon}>⇅</span></th>
              <th className={styles.thAction} />
            </tr>
          </thead>
          <tbody>
            {catalogsLoading ? (
              <tr><td colSpan={3} className={styles.emptyRow}>Loading…</td></tr>
            ) : catalogs.length === 0 ? (
              <tr><td colSpan={3} className={styles.emptyRow}>No catalogs yet. Create one above.</td></tr>
            ) : (
              catalogs.map((cat, idx) => (
                <tr key={cat.id} className={idx % 2 === 1 ? styles.rowAlt : styles.row}>
                  <td className={styles.tdName}>{cat.name}</td>
                  <td className={styles.tdBadge}>
                    <span className={cat.is_active ? styles.badgeActive : styles.badgeInactive}>
                      {cat.is_active ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>
                  <td className={styles.tdAction}>
                    {deleteConfirmId === cat.id ? (
                      <div className={styles.confirmInline}>
                        <span className={styles.confirmText}>Delete?</span>
                        <button className={styles.confirmYes} onClick={() => handleDelete(cat.id)}>Yes</button>
                        <button className={styles.confirmNo} onClick={() => setDeleteConfirmId(null)}>No</button>
                      </div>
                    ) : (
                      <div className={styles.actionBtns}>
                        <button className={styles.editBtn} onClick={() => openEdit(cat)} title="Edit">
                          {FiEdit2({ size: 14 })}
                        </button>
                        <button className={styles.deleteBtn} onClick={() => setDeleteConfirmId(cat.id)} title="Delete">
                          {FiTrash2({ size: 14 })}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── MODAL ──────────────────────────────────────── */}
      {modal !== "closed" && createPortal(
        <div
          className={styles.overlay}
          onMouseDown={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {modal === "add" ? "New Service Catalog" : "Edit Service Catalog"}
              </h3>
              <button className={styles.closeBtn} onClick={closeModal}>✕</button>
            </div>

            <div className={styles.modalBody}>
              <div>
                <label className={styles.fieldLabel}>Catalog Name</label>
                <input
                  className={styles.input}
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Plumbing Services"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                />
              </div>

              <div className={styles.toggleRow}>
                <span className={styles.fieldLabel} style={{ margin: 0 }}>Active</span>
                <button
                  type="button"
                  className={`${styles.toggle} ${form.is_active ? styles.toggleOn : styles.toggleOff}`}
                  onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
                >
                  <span className={styles.toggleThumb} />
                </button>
                <span className={styles.toggleLabel}>{form.is_active ? "Active" : "Inactive"}</span>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={closeModal}>Cancel</button>
              <button
                className={styles.createBtn}
                onClick={handleSave}
                disabled={!form.name.trim() || saving}
              >
                {saving ? "Saving…" : modal === "add" ? "Create" : "Save"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ServiceCatalogSettings;
