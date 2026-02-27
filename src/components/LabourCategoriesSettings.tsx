import React, { useState } from "react";
import { FiTrash2, FiPlus } from "react-icons/fi";
import { useLabourReasons } from "../context/LabourReasonsContext";
import styles from "./LabourCategoriesSettings.module.css";

const LabourCategoriesSettings: React.FC = () => {
  const { reasons, addReason, deleteReason } = useLabourReasons();
  const [modalOpen, setModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPaid, setNewPaid] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const openModal = () => {
    setNewTitle("");
    setNewPaid(true);
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    addReason(newTitle.trim(), newPaid);
    closeModal();
  };

  const handleDelete = (id: number) => {
    deleteReason(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className={styles.page}>
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>Custom Uncharged Reasons</h2>
          <button className={styles.newBtn} onClick={openModal}>
            {FiPlus({ size: 15 })}
            New Reason
          </button>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>
                Reason <span className={styles.sortIcon}>⇅</span>
              </th>
              <th className={styles.th}>
                Paid or Unpaid <span className={styles.sortIcon}>⇅</span>
              </th>
              <th className={styles.thAction} />
            </tr>
          </thead>
          <tbody>
            {reasons.map((reason, idx) => (
              <tr key={reason.id} className={idx % 2 === 1 ? styles.rowAlt : styles.row}>
                <td className={styles.tdName}>{reason.name}</td>
                <td className={styles.tdBadge}>
                  <span className={reason.paid ? styles.badgePaid : styles.badgeUnpaid}>
                    {reason.paid ? "PAID" : "UNPAID"}
                  </span>
                </td>
                <td className={styles.tdAction}>
                  {deleteConfirmId === reason.id ? (
                    <div className={styles.confirmInline}>
                      <span className={styles.confirmText}>Delete?</span>
                      <button
                        className={styles.confirmYes}
                        onClick={() => handleDelete(reason.id)}
                      >
                        Yes
                      </button>
                      <button
                        className={styles.confirmNo}
                        onClick={() => setDeleteConfirmId(null)}
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      className={styles.deleteBtn}
                      onClick={() => setDeleteConfirmId(reason.id)}
                      title="Delete reason"
                    >
                      {FiTrash2({ size: 15 })}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className={styles.overlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>New Uncharged Reason</h3>
              <button className={styles.closeBtn} onClick={closeModal}>
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <label className={styles.fieldLabel}>Title</label>
              <input
                className={styles.input}
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Travel Time"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />

              <div className={styles.radioGroup}>
                <span className={styles.fieldLabel}>This reason will be</span>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="paidStatus"
                    checked={newPaid}
                    onChange={() => setNewPaid(true)}
                  />
                  Paid
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="paidStatus"
                    checked={!newPaid}
                    onChange={() => setNewPaid(false)}
                  />
                  Unpaid
                </label>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={closeModal}>
                Cancel
              </button>
              <button
                className={styles.createBtn}
                onClick={handleCreate}
                disabled={!newTitle.trim()}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabourCategoriesSettings;
