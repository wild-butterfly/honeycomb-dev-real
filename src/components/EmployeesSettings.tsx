import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight } from "react-icons/fi";
import {
  Employee,
  fetchEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "../services/employees";
import styles from "./EmployeesSettings.module.css";

const ROLE_OPTIONS = [
  "Administrator",
  "Manager",
  "Technician",
  "Apprentice",
  "Supervisor",
  "Contractor",
  "Office Staff",
];

type ModalMode = "add" | "edit";

const initForm = () => ({ name: "", role: "", rate: "" });

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const EmployeesSettings: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("add");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(initForm());
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchEmployees()
      .then(setEmployees)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (modalOpen) {
      document.body.classList.add("employees-modal-open");
    } else {
      document.body.classList.remove("employees-modal-open");
    }

    return () => {
      document.body.classList.remove("employees-modal-open");
    };
  }, [modalOpen]);

  const openAdd = () => {
    setForm(initForm());
    setModalMode("add");
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (emp: Employee) => {
    setForm({ name: emp.name, role: emp.role ?? "", rate: String(emp.rate) });
    setModalMode("edit");
    setEditingId(emp.id);
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (modalMode === "add") {
        const created = await createEmployee({
          name: form.name.trim(),
          role: form.role.trim() || null,
          rate: parseFloat(form.rate) || 0,
        });
        if (created) setEmployees((prev) => [...prev, created]);
      } else if (editingId !== null) {
        const updated = await updateEmployee(editingId, {
          name: form.name.trim(),
          role: form.role.trim() || null,
          rate: parseFloat(form.rate) || 0,
        });
        if (updated)
          setEmployees((prev) => prev.map((e) => (e.id === editingId ? updated : e)));
      }
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (emp: Employee) => {
    const updated = await updateEmployee(emp.id, { active: !emp.active });
    if (updated)
      setEmployees((prev) => prev.map((e) => (e.id === emp.id ? updated : e)));
  };

  const handleDelete = async (id: number) => {
    setDeleteError(null);
    try {
      await deleteEmployee(id);
      setEmployees((prev) => prev.filter((e) => e.id !== id));
      setDeleteConfirmId(null);
    } catch (err: any) {
      setDeleteError(err?.message ?? "Cannot delete employee");
    }
  };

  const activeCount = employees.filter((e) => e.active).length;

  return (
    <div className={styles.page}>
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div className={styles.headerLeft}>
            <h2 className={styles.tableTitle}>Employees</h2>
            <span className={styles.countBadge}>{activeCount} active</span>
          </div>
          <button className={styles.newBtn} onClick={openAdd}>
            {FiPlus({ size: 15 })}
            Add Employee
          </button>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading…</div>
        ) : employees.length === 0 ? (
          <div className={styles.empty}>
            No employees yet. Click <strong>Add Employee</strong> to get started.
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Employee</th>
                <th className={styles.th}>Role</th>
                <th className={styles.th}>Rate ($/hr)</th>
                <th className={styles.th}>Status</th>
                <th className={styles.thAction} />
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, idx) => (
                <tr key={emp.id} className={idx % 2 === 1 ? styles.rowAlt : styles.row}>
                  <td className={styles.tdName}>
                    <div className={styles.avatarRow}>
                      <span
                        className={styles.avatar}
                        style={{ opacity: emp.active ? 1 : 0.45 }}
                      >
                        {getInitials(emp.name)}
                      </span>
                      <span className={emp.active ? styles.nameText : styles.nameTextInactive}>
                        {emp.name}
                      </span>
                    </div>
                  </td>
                  <td className={styles.td}>{emp.role ?? <span className={styles.muted}>—</span>}</td>
                  <td className={styles.td}>
                    {emp.rate > 0 ? (
                      <span className={styles.rateText}>${Number(emp.rate).toFixed(2)}</span>
                    ) : (
                      <span className={styles.muted}>—</span>
                    )}
                  </td>
                  <td className={styles.td}>
                    <button
                      className={emp.active ? styles.toggleOn : styles.toggleOff}
                      onClick={() => handleToggleActive(emp)}
                      title={emp.active ? "Deactivate" : "Activate"}
                    >
                      {emp.active
                        ? FiToggleRight({ size: 20 })
                        : FiToggleLeft({ size: 20 })}
                      {emp.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className={styles.tdAction}>
                    {deleteConfirmId === emp.id ? (
                      <div className={styles.confirmInline}>
                        {deleteError && (
                          <span className={styles.deleteErrText}>{deleteError}</span>
                        )}
                        {!deleteError && <span className={styles.confirmText}>Delete?</span>}
                        {!deleteError && (
                          <button
                            className={styles.confirmYes}
                            onClick={() => handleDelete(emp.id)}
                          >
                            Yes
                          </button>
                        )}
                        <button
                          className={styles.confirmNo}
                          onClick={() => { setDeleteConfirmId(null); setDeleteError(null); }}
                        >
                          {deleteError ? "Close" : "No"}
                        </button>
                      </div>
                    ) : (
                      <div className={styles.actionBtns}>
                        <button
                          className={styles.editBtn}
                          onClick={() => openEdit(emp)}
                          title="Edit"
                        >
                          {FiEdit2({ size: 14 })}
                        </button>
                        <button
                          className={styles.deleteBtn}
                          onClick={() => { setDeleteConfirmId(emp.id); setDeleteError(null); }}
                          title="Delete"
                        >
                          {FiTrash2({ size: 14 })}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && createPortal(
        <div
          className={styles.overlay}
          onMouseDown={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {modalMode === "add" ? "Add Employee" : "Edit Employee"}
              </h3>
              <button className={styles.closeBtn} onClick={closeModal}>✕</button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Full Name *</label>
                <input
                  className={styles.input}
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Jason Fear"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Role</label>
                <select
                  className={styles.select}
                  value={form.role}
                  onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                >
                  <option value="">— Select role —</option>
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Hourly Rate ($)</label>
                <input
                  className={styles.input}
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.rate}
                  onChange={(e) => setForm((p) => ({ ...p, rate: e.target.value }))}
                  placeholder="e.g. 80.00"
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={closeModal}>Cancel</button>
              <button
                className={styles.saveBtn}
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
              >
                {saving ? "Saving…" : modalMode === "add" ? "Add Employee" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default EmployeesSettings;
