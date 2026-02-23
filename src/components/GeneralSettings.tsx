import React, { useState, useEffect, useRef } from "react";
import { useCompany } from "../context/CompanyContext";
import api from "../services/api";
import {
  getGeneralSettings,
  updateGeneralSettings,
  addTax,
  removeTax,
  addCustomerSource,
  removeCustomerSource,
} from "../services/generalSettings.service";
import styles from "./GeneralSettings.module.css";

interface TaxItem {
  id: string;
  name: string;
  rate: number;
}

interface CustomerSource {
  id: string;
  name: string;
}

interface FormData {
  businessName: string;
  abn: string;
  payeeName: string;
  bsbNumber: string;
  bankAccountNumber: string;
  jobNumberPrefix: string;
  startingJobNumber: string;
  currency: string;
  dateFormat: string;
  timezone: string;
  autoAssignPhase: boolean;
  showStateOnInvoices: boolean;
  autoArchiveUnpriced: boolean;
  unpricedJobsCleanupDays: string;
  expiredQuotesCleanupDays: string;
  inactiveJobsCleanupDays: string;
  autoArchiveAge: string;
}

const GeneralSettings: React.FC = () => {
  const { companyId } = useCompany();

  // Debug logging
  useEffect(() => {
    console.log(
      "GeneralSettings mounted with companyId from context:",
      companyId,
    );
    console.log("API Base URL should be:", process.env.REACT_APP_API_URL);
  }, [companyId]);
  const [formData, setFormData] = useState<FormData>({
    businessName: "Your Company",
    abn: "",
    payeeName: "",
    bsbNumber: "",
    bankAccountNumber: "",
    jobNumberPrefix: "JOB",
    startingJobNumber: "1000",
    currency: "AUD",
    dateFormat: "DD/MM/YYYY",
    timezone: "Australia/Melbourne",
    autoAssignPhase: true,
    showStateOnInvoices: true,
    autoArchiveUnpriced: true,
    unpricedJobsCleanupDays: "60",
    expiredQuotesCleanupDays: "30",
    inactiveJobsCleanupDays: "Never",
    autoArchiveAge: "120",
  });

  const [taxes, setTaxes] = useState<TaxItem[]>([]);
  const [customerSources, setCustomerSources] = useState<CustomerSource[]>([]);
  const [newSourceValue, setNewSourceValue] = useState("");
  const [selectedTaxValue, setSelectedTaxValue] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [companyLogo, setCompanyLogo] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const predefinedTaxes = [
    { name: "GST", rate: 10 },
    { name: "State Tax", rate: 8.5 },
    { name: "Local Tax", rate: 5 },
    { name: "Service Tax", rate: 15 },
  ];

  // Load data on mount
  useEffect(() => {
    const loadSettings = async () => {
      if (!companyId) {
        console.log("No companyId selected, skipping load");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getGeneralSettings(companyId);
        setFormData((prev) => ({
          ...prev,
          businessName: data.settings.business_name || prev.businessName,
          abn: data.settings.abn || "",
          payeeName: data.settings.payee_name || "",
          bsbNumber: data.settings.bsb_number || "",
          bankAccountNumber: data.settings.bank_account_number || "",
          jobNumberPrefix:
            data.settings.job_number_prefix || prev.jobNumberPrefix,
          startingJobNumber:
            data.settings.starting_job_number?.toString() ||
            prev.startingJobNumber,
          currency: data.settings.currency || prev.currency,
          dateFormat: data.settings.date_format || prev.dateFormat,
          timezone: data.settings.timezone || prev.timezone,
          autoAssignPhase:
            data.settings.auto_assign_phase ?? prev.autoAssignPhase,
          showStateOnInvoices:
            data.settings.show_state_on_invoices ?? prev.showStateOnInvoices,
          autoArchiveUnpriced:
            data.settings.auto_archive_unpriced ?? prev.autoArchiveUnpriced,
          unpricedJobsCleanupDays:
            data.settings.unpriced_jobs_cleanup_days?.toString() ||
            prev.unpricedJobsCleanupDays,
          expiredQuotesCleanupDays:
            data.settings.expired_quotes_cleanup_days?.toString() ||
            prev.expiredQuotesCleanupDays,
          inactiveJobsCleanupDays:
            data.settings.inactive_jobs_cleanup_days?.toString() ||
            prev.inactiveJobsCleanupDays,
          autoArchiveAge:
            data.settings.auto_archive_stale_days?.toString() ||
            prev.autoArchiveAge,
        }));
        setTaxes(data.taxes);
        setCustomerSources(data.customerSources);
        setCompanyLogo(data.settings.logo_url || "");
      } catch (error) {
        console.error("Failed to load settings:", error);
        setMessage({
          type: "error",
          text: "Failed to load settings. Using defaults.",
        });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [companyId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, type, value } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAddTax = async (taxName: string, rate: number) => {
    console.log("handleAddTax called with:", { taxName, rate, companyId });
    if (!companyId) {
      setMessage({ type: "error", text: "Please select a company first" });
      return;
    }
    try {
      setSaving(true);
      const result = await addTax(companyId, taxName, rate);
      console.log("addTax response:", result);
      setTaxes([...taxes, { id: Date.now().toString(), name: taxName, rate }]);
      setMessage({
        type: "success",
        text: `Tax "${taxName}" added successfully`,
      });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error("Error adding tax:", error);
      setMessage({
        type: "error",
        text: `Failed to add tax: ${error.message || "Unknown error"}`,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveTax = async (id: string) => {
    if (!companyId) {
      setMessage({ type: "error", text: "Please select a company first" });
      return;
    }
    try {
      setSaving(true);
      await removeTax(companyId, id);
      setTaxes(taxes.filter((tax) => tax.id !== id));
      setMessage({ type: "success", text: "Tax removed successfully" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: "error", text: "Failed to remove tax" });
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddCustomerSource = async (sourceName: string) => {
    if (!companyId) {
      setMessage({ type: "error", text: "Please select a company first" });
      return;
    }
    console.log("handleAddCustomerSource called with:", {
      sourceName,
      companyId,
    });
    const trimmedName = sourceName.trim();
    if (!trimmedName) {
      console.log("Trimmed name is empty");
      return;
    }
    if (
      customerSources.some(
        (s) => s.name.toLowerCase() === trimmedName.toLowerCase(),
      )
    ) {
      console.log("Source already exists");
      setMessage({ type: "error", text: "This source already exists" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    try {
      setSaving(true);
      const result = await addCustomerSource(companyId, trimmedName);
      console.log("addCustomerSource response:", result);
      setCustomerSources([
        ...customerSources,
        { id: Date.now().toString(), name: trimmedName },
      ]);
      setNewSourceValue("");
      setMessage({
        type: "success",
        text: `Source "${trimmedName}" added successfully`,
      });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error("Error adding customer source:", error);
      setMessage({
        type: "error",
        text: `Failed to add source: ${error.message || "Unknown error"}`,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveCustomerSource = async (id: string) => {
    if (!companyId) {
      setMessage({ type: "error", text: "Please select a company first" });
      return;
    }
    try {
      setSaving(true);
      await removeCustomerSource(companyId, id);
      setCustomerSources(customerSources.filter((source) => source.id !== id));
      setMessage({
        type: "success",
        text: "Customer source removed successfully",
      });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: "error", text: "Failed to remove customer source" });
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !companyId) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "File size must not exceed 5MB" });
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Please select an image file" });
      return;
    }

    setUploadingLogo(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("logo", file);

      console.log("Uploading logo for company:", companyId);

      const data = await api.post<{ settings: any }>(
        `/general-settings/${companyId}/logo`,
        formData,
      );

      console.log("Logo upload response:", data);

      if (data?.settings?.logo_url) {
        setCompanyLogo(data.settings.logo_url);
        setMessage({
          type: "success",
          text: "Company logo updated successfully!",
        });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({
          type: "error",
          text: "Logo uploaded but not reflected. Please refresh.",
        });
      }
    } catch (error: any) {
      console.error("Failed to upload logo:", error);
      const errorMsg = error?.message || "Failed to upload company logo";
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setUploadingLogo(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteLogo = async () => {
    if (!window.confirm("Are you sure you want to delete the company logo?")) {
      return;
    }

    if (!companyId) return;

    setUploadingLogo(true);
    setMessage(null);

    try {
      console.log("Deleting logo for company:", companyId);

      const data = await api.delete<{ settings: any }>(
        `/general-settings/${companyId}/logo`,
      );

      console.log("Logo delete response:", data);

      if (data?.settings) {
        setCompanyLogo("");
        setMessage({
          type: "success",
          text: "Company logo deleted successfully!",
        });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error: any) {
      console.error("Failed to delete logo:", error);
      const errorMsg = error?.message || "Failed to delete company logo";
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("handleSubmit called with companyId:", companyId);
    if (!companyId) {
      setMessage({ type: "error", text: "Please select a company first" });
      return;
    }
    try {
      setSaving(true);
      const payload = {
        business_name: formData.businessName,
        abn: formData.abn,
        payee_name: formData.payeeName,
        bsb_number: formData.bsbNumber,
        bank_account_number: formData.bankAccountNumber,
        job_number_prefix: formData.jobNumberPrefix,
        starting_job_number: formData.startingJobNumber,
        currency: formData.currency,
        date_format: formData.dateFormat,
        timezone: formData.timezone,
        auto_assign_phase: formData.autoAssignPhase,
        show_state_on_invoices: formData.showStateOnInvoices,
        auto_archive_unpriced: formData.autoArchiveUnpriced,
        unpriced_jobs_cleanup_days: formData.unpricedJobsCleanupDays,
        expired_quotes_cleanup_days: formData.expiredQuotesCleanupDays,
        inactive_jobs_cleanup_days:
          formData.inactiveJobsCleanupDays === "Never"
            ? null
            : formData.inactiveJobsCleanupDays,
        auto_archive_stale_days: formData.autoArchiveAge,
      };
      console.log("Sending payload:", payload);
      const result = await updateGeneralSettings(companyId, payload);
      console.log("updateGeneralSettings response:", result);
      setMessage({
        type: "success",
        text: "General settings saved successfully",
      });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error("Error saving settings:", error);
      setMessage({
        type: "error",
        text: `Failed to save settings: ${error.message || "Unknown error"}`,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      {message && (
        <div className={`${styles.notification} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>Loading settings...</div>
      ) : !companyId ? (
        <div className={styles.loading}>
          Please select a company from the dropdown
        </div>
      ) : (
        <>
          <div className={styles.header}>
            <h1>General Settings</h1>
            <p>Configure your business and system preferences</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Company Logo Section */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Company Logo</h2>
              </div>
              <div className={styles.logoSection}>
                <div className={styles.logoWrapper}>
                  {companyLogo ? (
                    <img
                      src={
                        companyLogo.startsWith("http")
                          ? companyLogo
                          : `http://localhost:3001${companyLogo}`
                      }
                      alt="Company logo"
                      className={styles.logoImage}
                    />
                  ) : (
                    <div className={styles.logoPlaceholder}>
                      <div className={styles.logoInitials}>LOGO</div>
                    </div>
                  )}
                  {uploadingLogo && (
                    <div className={styles.logoOverlay}>
                      <div className={styles.spinner}></div>
                    </div>
                  )}
                </div>
                <div className={styles.logoActions}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    style={{ display: "none" }}
                  />
                  <button
                    type="button"
                    onClick={handleLogoClick}
                    disabled={uploadingLogo}
                    className={styles.uploadButton}
                  >
                    {uploadingLogo ? "Uploading..." : "Upload Logo"}
                  </button>
                  {companyLogo && (
                    <button
                      type="button"
                      onClick={handleDeleteLogo}
                      disabled={uploadingLogo}
                      className={styles.deleteButton}
                    >
                      Delete Logo
                    </button>
                  )}
                  <p className={styles.logoHint}>
                    JPG, PNG, GIF or WebP. Max size 5MB. This logo appears on
                    invoices.
                  </p>
                </div>
              </div>
            </section>

            {/* Account Settings */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Account Settings</h2>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="businessName">Business Name</label>
                <input
                  type="text"
                  id="businessName"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="abn">
                  ABN <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  id="abn"
                  name="abn"
                  placeholder="11 123 456 789"
                  value={formData.abn}
                  onChange={handleChange}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="payeeName">
                  Payee Name <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  id="payeeName"
                  name="payeeName"
                  value={formData.payeeName}
                  onChange={handleChange}
                  className={styles.input}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="bsbNumber">
                    BSB Number <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    id="bsbNumber"
                    name="bsbNumber"
                    placeholder="000 000"
                    value={formData.bsbNumber}
                    onChange={handleChange}
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="bankAccountNumber">
                    Bank Account Number{" "}
                    <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    id="bankAccountNumber"
                    name="bankAccountNumber"
                    value={formData.bankAccountNumber}
                    onChange={handleChange}
                    className={styles.input}
                  />
                </div>
              </div>
            </section>

            {/* Job Settings */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Job Settings</h2>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="jobNumberPrefix">Job Number Prefix</label>
                  <input
                    type="text"
                    id="jobNumberPrefix"
                    name="jobNumberPrefix"
                    value={formData.jobNumberPrefix}
                    onChange={handleChange}
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="startingJobNumber">Starting Job Number</label>
                  <input
                    type="number"
                    id="startingJobNumber"
                    name="startingJobNumber"
                    value={formData.startingJobNumber}
                    onChange={handleChange}
                    className={styles.input}
                  />
                </div>
              </div>
            </section>

            {/* System Settings */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>System Settings</h2>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="currency">Currency</label>
                  <select
                    id="currency"
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className={styles.select}
                  >
                    <option value="AUD">$ Australian Dollar</option>
                    <option value="USD">$ US Dollar</option>
                    <option value="EUR">€ Euro</option>
                    <option value="GBP">£ British Pound</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="dateFormat">Date Format</label>
                  <select
                    id="dateFormat"
                    name="dateFormat"
                    value={formData.dateFormat}
                    onChange={handleChange}
                    className={styles.select}
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="timezone">Time Zone</label>
                <select
                  id="timezone"
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleChange}
                  className={styles.select}
                >
                  <option value="Australia/Melbourne">
                    Australia/Melbourne (UTC +10:00)
                  </option>
                  <option value="Australia/Sydney">
                    Australia/Sydney (UTC +10:00)
                  </option>
                  <option value="Australia/Brisbane">
                    Australia/Brisbane (UTC +10:00)
                  </option>
                  <option value="Australia/Perth">
                    Australia/Perth (UTC +08:00)
                  </option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">
                    America/New_York (UTC -5:00)
                  </option>
                </select>
              </div>
            </section>

            {/* Miscellaneous Settings */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Miscellaneous Settings</h2>
              </div>

              <div className={styles.checkboxGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="autoAssignPhase"
                    checked={formData.autoAssignPhase}
                    onChange={handleChange}
                    className={styles.checkbox}
                  />
                  <span>Auto-assign jobs to job phase</span>
                  <span className={styles.tooltip}>ℹ</span>
                </label>
                <p className={styles.checkboxHint}>
                  Automatically move jobs to the next phase when actions are
                  performed
                </p>
              </div>

              <div className={styles.checkboxGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="showStateOnInvoices"
                    checked={formData.showStateOnInvoices}
                    onChange={handleChange}
                    className={styles.checkbox}
                  />
                  <span>Show state/region on invoices & quotes</span>
                  <span className={styles.tooltip}>ℹ</span>
                </label>
                <p className={styles.checkboxHint}>
                  Display customer location on generated documents
                </p>
              </div>

              <div className={styles.checkboxGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="autoArchiveUnpriced"
                    checked={formData.autoArchiveUnpriced}
                    onChange={handleChange}
                    className={styles.checkbox}
                  />
                  <span>
                    Automatically archive stale unpriced jobs after 90 days
                  </span>
                  <span className={styles.tooltip}>ℹ</span>
                </label>
                <p className={styles.checkboxHint}>
                  Jobs without pricing will be automatically moved to archive
                </p>
              </div>
            </section>

            {/* Taxes */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Taxes</h2>
                <p className={styles.sectionHint}>
                  Only new invoices will be affected
                </p>
              </div>

              <div className={styles.tagContainer}>
                {taxes.map((tax) => (
                  <div key={tax.id} className={styles.tag}>
                    <div className={styles.tagContent}>
                      <span className={styles.tagLabel}>{tax.name}</span>
                      <span className={styles.tagValue}>{tax.rate}%</span>
                    </div>
                    <button
                      type="button"
                      className={styles.tagRemove}
                      onClick={() => handleRemoveTax(tax.id)}
                      disabled={saving}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div className={styles.addRow}>
                <select
                  className={styles.selectSmall}
                  value={selectedTaxValue}
                  onChange={(e) => setSelectedTaxValue(e.target.value)}
                >
                  <option value="">Select a tax type to add</option>
                  {predefinedTaxes.map((tax) => (
                    <option key={tax.name} value={tax.name}>
                      {tax.name} ({tax.rate}%)
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className={styles.addButton}
                  disabled={!selectedTaxValue || saving}
                  onClick={() => {
                    console.log(
                      "Add Tax button clicked, selectedTaxValue:",
                      selectedTaxValue,
                      "saving:",
                      saving,
                    );
                    const selected = predefinedTaxes.find(
                      (t) => t.name === selectedTaxValue,
                    );
                    console.log("Selected tax:", selected);
                    if (selected) {
                      handleAddTax(selected.name, selected.rate);
                    }
                  }}
                >
                  + Add Tax
                </button>
              </div>
            </section>

            {/* Customer Sources */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Customer Sources</h2>
                <p className={styles.sectionHint}>
                  Track where your customers come from
                </p>
              </div>

              <div className={styles.tagContainer}>
                {customerSources.map((source) => (
                  <div key={source.id} className={styles.sourceTag}>
                    <span className={styles.tagLabel}>{source.name}</span>
                    <button
                      type="button"
                      className={styles.tagRemove}
                      onClick={() => handleRemoveCustomerSource(source.id)}
                      disabled={saving}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div className={styles.addRow}>
                <input
                  type="text"
                  className={styles.selectSmall}
                  placeholder="Enter a customer source (e.g., Google Search, Referral)"
                  value={newSourceValue}
                  onChange={(e) => setNewSourceValue(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      console.log(
                        "Enter pressed, newSourceValue:",
                        newSourceValue,
                      );
                      handleAddCustomerSource(newSourceValue);
                    }
                  }}
                />
                <button
                  type="button"
                  className={styles.addButton}
                  onClick={() => {
                    console.log(
                      "Add Source button clicked, newSourceValue:",
                      newSourceValue,
                      "saving:",
                      saving,
                    );
                    handleAddCustomerSource(newSourceValue);
                  }}
                  disabled={!newSourceValue || saving}
                >
                  + Add Source
                </button>
              </div>
            </section>

            {/* Cleanup Settings */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Automatic Job Cleanup</h2>
                <p className={styles.sectionHint}>
                  Automatically manage old and stale jobs
                </p>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="unpricedJobsCleanupDays">
                  Move unpriced jobs to stale status after
                </label>
                <div className={styles.inputWithUnit}>
                  <input
                    type="number"
                    id="unpricedJobsCleanupDays"
                    name="unpricedJobsCleanupDays"
                    value={formData.unpricedJobsCleanupDays}
                    onChange={handleChange}
                    min="1"
                    max="365"
                    className={styles.input}
                  />
                  <span className={styles.unit}>Days</span>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="expiredQuotesCleanupDays">
                  Move expired quotes to stale status after
                </label>
                <div className={styles.inputWithUnit}>
                  <input
                    type="number"
                    id="expiredQuotesCleanupDays"
                    name="expiredQuotesCleanupDays"
                    value={formData.expiredQuotesCleanupDays}
                    onChange={handleChange}
                    min="1"
                    max="365"
                    className={styles.input}
                  />
                  <span className={styles.unit}>Days</span>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="inactiveJobsCleanupDays">
                  Move inactive jobs to stale status after
                </label>
                <select
                  id="inactiveJobsCleanupDays"
                  name="inactiveJobsCleanupDays"
                  value={formData.inactiveJobsCleanupDays}
                  onChange={handleChange}
                  className={styles.select}
                >
                  <option value="Never">Never</option>
                  <option value="30">30 Days</option>
                  <option value="60">60 Days</option>
                  <option value="90">90 Days</option>
                  <option value="180">6 Months</option>
                  <option value="365">1 Year</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="autoArchiveAge">
                  Automatically archive stale jobs after
                </label>
                <div className={styles.inputWithUnit}>
                  <input
                    type="number"
                    id="autoArchiveAge"
                    name="autoArchiveAge"
                    value={formData.autoArchiveAge}
                    onChange={handleChange}
                    min="1"
                    max="365"
                    className={styles.input}
                  />
                  <span className={styles.unit}>Days</span>
                </div>
              </div>

              <div className={styles.cleanupInfo}>
                <p>
                  These settings help keep your job list organized by
                  automatically managing jobs that haven't been updated for a
                  while.
                </p>
              </div>
            </section>
            <div className={styles.actions}>
              <button type="submit" className={styles.saveButton}>
                Save Changes
              </button>
              <button type="button" className={styles.cancelButton}>
                Cancel
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default GeneralSettings;
