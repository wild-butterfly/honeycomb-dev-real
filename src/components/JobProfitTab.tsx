/**
 * Job Profit Tab Component
 *
 * Displays financial summary for a job:
 * - Revenue
 * - Labour Cost
 * - Material Cost
 * - Other Cost
 * - Total Cost
 * - Profit (revenue - total_cost)
 * - Margin ((profit / revenue) * 100)
 */

import React, { useEffect, useState } from "react";
import styles from "./JobProfitTab.module.css";
import { JobFinancials, JobFinancialsInput } from "../types/JobFinancials";
import {
  getJobFinancials,
  updateJobFinancials,
  createJobFinancials,
} from "../services/jobFinancials";
import Toast from "./Toast";
import { formatCurrency, formatPercentage } from "../types/JobFinancials";

interface JobProfitTabProps {
  jobId: string;
}

const JobProfitTab: React.FC<JobProfitTabProps> = ({ jobId }) => {
  const [financials, setFinancials] = useState<JobFinancials | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<JobFinancialsInput>({
    labour_cost: 0,
    material_cost: 0,
    other_cost: 0,
    revenue: 0,
  });

  // Load financials
  useEffect(() => {
    const loadFinancials = async () => {
      setLoading(true);
      try {
        const data = await getJobFinancials(jobId);
        setFinancials(data);
        setFormData({
          labour_cost: data.labour_cost,
          material_cost: data.material_cost,
          other_cost: data.other_cost,
          revenue: data.revenue,
        });
      } catch (err) {
        console.error("Failed to load job financials:", err);
        setToast({
          type: "error",
          message: "Failed to load financial data",
        });
      } finally {
        setLoading(false);
      }
    };

    loadFinancials();
  }, [jobId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!financials) {
        // Create new record
        const created = await createJobFinancials(jobId, formData);
        setFinancials(created);
        setToast({ type: "success", message: "Financial data saved" });
      } else {
        // Update existing record
        const updated = await updateJobFinancials(jobId, formData);
        setFinancials(updated);
        setToast({ type: "success", message: "Financial data updated" });
      }
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to save financials:", err);
      setToast({ type: "error", message: "Failed to save financial data" });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (financials) {
      setFormData({
        labour_cost: financials.labour_cost,
        material_cost: financials.material_cost,
        other_cost: financials.other_cost,
        revenue: financials.revenue,
      });
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className={styles.profitTab}>
        <div className={styles.loading}>Loading financial data...</div>
      </div>
    );
  }

  if (!financials) {
    return (
      <div className={styles.profitTab}>
        <div className={styles.empty}>
          <p>No financial data yet</p>
          <button className={styles.btn} onClick={() => setIsEditing(true)}>
            Add Financial Data
          </button>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className={styles.profitTab}>
        <div className={styles.editForm}>
          <h3>Edit Financial Data</h3>

          <div className={styles.formGroup}>
            <label className={styles.label}>Revenue</label>
            <input
              type="number"
              className={styles.input}
              value={formData.revenue || 0}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  revenue: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="0.00"
              step="0.01"
            />
          </div>

          <div className={styles.costSection}>
            <h4 className={styles.costTitle}>Costs</h4>

            <div className={styles.formGroup}>
              <label className={styles.label}>Labour Cost</label>
              <input
                type="number"
                className={styles.input}
                value={formData.labour_cost || 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    labour_cost: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0.00"
                step="0.01"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Material Cost</label>
              <input
                type="number"
                className={styles.input}
                value={formData.material_cost || 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    material_cost: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0.00"
                step="0.01"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Other Cost</label>
              <input
                type="number"
                className={styles.input}
                value={formData.other_cost || 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    other_cost: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0.00"
                step="0.01"
              />
            </div>
          </div>

          <div className={styles.formActions}>
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.profitTab}>
      <div className={styles.header}>
        <h3 className={styles.title}>Financial Summary</h3>
        <button className={styles.editBtn} onClick={() => setIsEditing(true)}>
          Edit
        </button>
      </div>

      <div className={styles.summary}>
        {/* Revenue */}
        <div className={styles.summaryRow}>
          <div className={styles.rowLabel}>Revenue</div>
          <div className={styles.rowValue} style={{ color: "#059669" }}>
            {formatCurrency(financials.revenue)}
          </div>
        </div>

        {/* Costs */}
        <div className={styles.costSummary}>
          <div className={styles.costHeader}>Costs</div>

          <div className={styles.costRow}>
            <div className={styles.costLabel}>Labour</div>
            <div className={styles.costValue}>
              {formatCurrency(financials.labour_cost)}
            </div>
          </div>

          <div className={styles.costRow}>
            <div className={styles.costLabel}>Materials</div>
            <div className={styles.costValue}>
              {formatCurrency(financials.material_cost)}
            </div>
          </div>

          <div className={styles.costRow}>
            <div className={styles.costLabel}>Other</div>
            <div className={styles.costValue}>
              {formatCurrency(financials.other_cost)}
            </div>
          </div>

          <div className={styles.costDivider} />

          <div className={styles.costRow}>
            <div className={styles.costLabel}>
              <strong>Total Cost</strong>
            </div>
            <div className={styles.costValue}>
              <strong>{formatCurrency(financials.total_cost)}</strong>
            </div>
          </div>
        </div>

        {/* Profit & Margin */}
        <div className={styles.profitSection}>
          <div className={styles.profitRow}>
            <div className={styles.profitLabel}>Profit</div>
            <div
              className={styles.profitValue}
              style={{
                color: financials.profit >= 0 ? "#059669" : "#dc2626",
              }}
            >
              {formatCurrency(financials.profit)}
            </div>
          </div>

          <div className={styles.profitRow}>
            <div className={styles.profitLabel}>Margin</div>
            <div
              className={styles.marginValue}
              style={{
                backgroundColor: financials.margin >= 0 ? "#d1fae5" : "#fee2e2",
                color: financials.margin >= 0 ? "#059669" : "#dc2626",
              }}
            >
              {formatPercentage(financials.margin)}
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default JobProfitTab;
