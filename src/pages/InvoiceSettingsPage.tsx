import React, { useEffect, useState } from "react";
import { useCompany } from "../context/CompanyContext";
import api from "../services/api";
import styles from "./InvoiceSettingsPage.module.css";

interface InvoiceSettings {
  id?: number;
  company_id: number;
  company_name?: string;
  company_address?: string;
  company_city?: string;
  company_state?: string;
  company_postal_code?: string;
  company_phone?: string;
  company_email?: string;
  company_website?: string;
  company_logo_url?: string;
  tax_registration_number?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_sort_code?: string;
  bank_code?: string;
  iban?: string;
  swift_code?: string;
  custom_invoice_notes?: string;
  payment_terms?: string;
}

const InvoiceSettingsPage: React.FC = () => {
  const { companyId } = useCompany();
  const [formData, setFormData] = useState<InvoiceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Load existing settings
  useEffect(() => {
    const loadSettings = async () => {
      if (!companyId) return;

      try {
        setLoading(true);
        const data = await api.get<InvoiceSettings>(
          `/invoice-settings/${companyId}`,
        );

        if (data) {
          setFormData(data);
        } else {
          // Initialize new settings
          setFormData({
            company_id: companyId,
          });
        }
      } catch (error) {
        console.error("Error loading invoice settings:", error);
        // Initialize new settings if not found
        setFormData({
          company_id: companyId,
        });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [companyId]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) =>
      prev ? { ...prev, [name]: value || undefined } : null,
    );
  };

  const handleSave = async () => {
    if (!formData || !companyId) return;

    try {
      setSaving(true);

      const payload = {
        company_id: companyId,
        company_name: formData.company_name || null,
        company_address: formData.company_address || null,
        company_city: formData.company_city || null,
        company_state: formData.company_state || null,
        company_postal_code: formData.company_postal_code || null,
        company_phone: formData.company_phone || null,
        company_email: formData.company_email || null,
        company_website: formData.company_website || null,
        company_logo_url: formData.company_logo_url || null,
        tax_registration_number: formData.tax_registration_number || null,
        bank_name: formData.bank_name || null,
        bank_account_number: formData.bank_account_number || null,
        bank_sort_code: formData.bank_sort_code || null,
        bank_code: formData.bank_code || null,
        iban: formData.iban || null,
        swift_code: formData.swift_code || null,
        custom_invoice_notes: formData.custom_invoice_notes || null,
        payment_terms: formData.payment_terms || null,
      };

      const result = await api.post<InvoiceSettings>(
        "/invoice-settings",
        payload,
      );

      if (result) {
        setFormData(result);
        setMessage({
          type: "success",
          text: "Invoice settings saved successfully!",
        });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error: any) {
      console.error("Error saving invoice settings:", error);
      setMessage({
        type: "error",
        text: error.message || "Failed to save invoice settings",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.container}>Loading...</div>;
  }

  if (!formData) {
    return <div className={styles.container}>Error loading settings</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Invoice Settings</h1>
        <p>Configure your company details for invoice generation</p>
      </div>

      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <div className={styles.form}>
        {/* Company Information Section */}
        <fieldset className={styles.section}>
          <legend className={styles.sectionTitle}>Company Information</legend>

          <div className={styles.formGroup}>
            <label htmlFor="company_name">Company Name</label>
            <input
              type="text"
              id="company_name"
              name="company_name"
              value={formData.company_name || ""}
              onChange={handleInputChange}
              placeholder="Your company name"
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="company_address">Street Address</label>
              <input
                type="text"
                id="company_address"
                name="company_address"
                value={formData.company_address || ""}
                onChange={handleInputChange}
                placeholder="Street address"
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="company_city">City</label>
              <input
                type="text"
                id="company_city"
                name="company_city"
                value={formData.company_city || ""}
                onChange={handleInputChange}
                placeholder="City"
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="company_state">State/Province</label>
              <input
                type="text"
                id="company_state"
                name="company_state"
                value={formData.company_state || ""}
                onChange={handleInputChange}
                placeholder="State or province"
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="company_postal_code">Postal Code</label>
              <input
                type="text"
                id="company_postal_code"
                name="company_postal_code"
                value={formData.company_postal_code || ""}
                onChange={handleInputChange}
                placeholder="Postal or ZIP code"
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="company_phone">Phone Number</label>
              <input
                type="tel"
                id="company_phone"
                name="company_phone"
                value={formData.company_phone || ""}
                onChange={handleInputChange}
                placeholder="Phone number"
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="company_email">Email Address</label>
              <input
                type="email"
                id="company_email"
                name="company_email"
                value={formData.company_email || ""}
                onChange={handleInputChange}
                placeholder="contact@company.com"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="company_website">Website</label>
            <input
              type="url"
              id="company_website"
              name="company_website"
              value={formData.company_website || ""}
              onChange={handleInputChange}
              placeholder="https://www.company.com"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="company_logo_url">Company Logo URL</label>
            <input
              type="url"
              id="company_logo_url"
              name="company_logo_url"
              value={formData.company_logo_url || ""}
              onChange={handleInputChange}
              placeholder="https://example.com/logo.png"
            />
            {formData.company_logo_url && (
              <div className={styles.logoPreview}>
                <img src={formData.company_logo_url} alt="Company logo" />
              </div>
            )}
          </div>
        </fieldset>

        {/* Tax Information Section */}
        <fieldset className={styles.section}>
          <legend className={styles.sectionTitle}>Tax Information</legend>

          <div className={styles.formGroup}>
            <label htmlFor="tax_registration_number">
              Tax Registration Number / VAT ID
            </label>
            <input
              type="text"
              id="tax_registration_number"
              name="tax_registration_number"
              value={formData.tax_registration_number || ""}
              onChange={handleInputChange}
              placeholder="e.g., VAT ID or Tax registration number"
            />
          </div>
        </fieldset>

        {/* Bank Information Section */}
        <fieldset className={styles.section}>
          <legend className={styles.sectionTitle}>Bank Details</legend>

          <div className={styles.formGroup}>
            <label htmlFor="bank_name">Bank Name</label>
            <input
              type="text"
              id="bank_name"
              name="bank_name"
              value={formData.bank_name || ""}
              onChange={handleInputChange}
              placeholder="Bank name"
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="bank_account_number">Account Number</label>
              <input
                type="text"
                id="bank_account_number"
                name="bank_account_number"
                value={formData.bank_account_number || ""}
                onChange={handleInputChange}
                placeholder="Account number"
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="bank_sort_code">Sort Code</label>
              <input
                type="text"
                id="bank_sort_code"
                name="bank_sort_code"
                value={formData.bank_sort_code || ""}
                onChange={handleInputChange}
                placeholder="Sort code (XX-XX-XX)"
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="iban">IBAN</label>
              <input
                type="text"
                id="iban"
                name="iban"
                value={formData.iban || ""}
                onChange={handleInputChange}
                placeholder="International Bank Account Number"
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="swift_code">SWIFT/BIC Code</label>
              <input
                type="text"
                id="swift_code"
                name="swift_code"
                value={formData.swift_code || ""}
                onChange={handleInputChange}
                placeholder="SWIFT code"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="bank_code">Bank Code</label>
            <input
              type="text"
              id="bank_code"
              name="bank_code"
              value={formData.bank_code || ""}
              onChange={handleInputChange}
              placeholder="Bank code"
            />
          </div>
        </fieldset>

        {/* Invoice Defaults Section */}
        <fieldset className={styles.section}>
          <legend className={styles.sectionTitle}>Invoice Defaults</legend>

          <div className={styles.formGroup}>
            <label htmlFor="payment_terms">Payment Terms</label>
            <input
              type="text"
              id="payment_terms"
              name="payment_terms"
              value={formData.payment_terms || ""}
              onChange={handleInputChange}
              placeholder="e.g., Net 30, Due upon receipt"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="custom_invoice_notes">Custom Invoice Notes</label>
            <textarea
              id="custom_invoice_notes"
              name="custom_invoice_notes"
              value={formData.custom_invoice_notes || ""}
              onChange={handleInputChange}
              placeholder="Any additional notes to include on invoices"
              rows={4}
            />
          </div>
        </fieldset>

        {/* Save Button */}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.saveButton}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceSettingsPage;
