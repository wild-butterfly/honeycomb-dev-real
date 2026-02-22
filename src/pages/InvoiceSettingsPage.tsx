import React, { useEffect, useState } from "react";
import { useCompany } from "../context/CompanyContext";
import api from "../services/api";
import styles from "./InvoiceSettingsPage.module.css";

interface InvoiceSettings {
  id?: number;
  company_id: number;
  tax_calculation_method?: string;
  default_payment_term?: string;
  custom_invoice_notes?: string;
  invoice_footer?: string;
  attach_pdf_email?: boolean;
  show_employee_on_invoice?: boolean;
}

interface InvoiceTemplate {
  id: number;
  name: string;
  status: "active" | "inactive";
  is_default: boolean;
  main_color?: string;
  accent_color?: string;
  font_size?: string;
  created_at: string;
}

const InvoiceSettingsPage: React.FC = () => {
  const { companyId } = useCompany();
  const [activeTab, setActiveTab] = useState<"general" | "templates">(
    "general",
  );
  const [formData, setFormData] = useState<InvoiceSettings | null>(null);
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
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
            tax_calculation_method: "subtotal",
            default_payment_term: "14",
            attach_pdf_email: true,
            show_employee_on_invoice: true,
          });
        }

        // Load templates
        const templatesData = await api.get<InvoiceTemplate[]>(
          `/invoice-templates/${companyId}`,
        );
        setTemplates(templatesData || []);
      } catch (error) {
        console.error("Error loading invoice settings:", error);
        // Initialize new settings if not found
        setFormData({
          company_id: companyId,
          tax_calculation_method: "subtotal",
          default_payment_term: "14",
          attach_pdf_email: true,
          show_employee_on_invoice: true,
        });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [companyId]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) =>
      prev ? { ...prev, [name]: type === "checkbox" ? checked : value } : null,
    );
  };

  const handleSave = async () => {
    if (!formData || !companyId) return;

    try {
      setSaving(true);

      const payload = {
        company_id: companyId,
        tax_calculation_method: formData.tax_calculation_method || null,
        default_payment_term: formData.default_payment_term || null,
        custom_invoice_notes: formData.custom_invoice_notes || null,
        invoice_footer: formData.invoice_footer || null,
        attach_pdf_email: formData.attach_pdf_email ?? true,
        show_employee_on_invoice: formData.show_employee_on_invoice ?? true,
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

  const handleCreateTemplate = () => {
    // TODO: Open template editor modal
    alert("Template editor coming soon!");
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
        <p>Configure invoice preferences and templates</p>
      </div>

      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "general" ? styles.active : ""}`}
          onClick={() => setActiveTab("general")}
        >
          General Settings
        </button>
        <button
          className={`${styles.tab} ${activeTab === "templates" ? styles.active : ""}`}
          onClick={() => setActiveTab("templates")}
        >
          Invoice Templates
        </button>
      </div>

      {/* General Settings Tab */}
      {activeTab === "general" && (
        <div className={styles.form}>
          <fieldset className={styles.section}>
            <legend className={styles.sectionTitle}>Tax Calculation</legend>

            <div className={styles.formGroup}>
              <label htmlFor="tax_calculation_method">
                Tax calculation method
              </label>
              <select
                id="tax_calculation_method"
                name="tax_calculation_method"
                value={formData.tax_calculation_method || "subtotal"}
                onChange={handleInputChange}
              >
                <option value="subtotal">
                  Calculate tax on document sub-total
                </option>
                <option value="lineitem">
                  Calculate tax on each line item
                </option>
              </select>
              <p className={styles.helpText}>
                Choose how tax is calculated on your invoices
              </p>
            </div>
          </fieldset>

          <fieldset className={styles.section}>
            <legend className={styles.sectionTitle}>Payment Terms</legend>

            <div className={styles.formGroup}>
              <label htmlFor="default_payment_term">Default payment term</label>
              <select
                id="default_payment_term"
                name="default_payment_term"
                value={formData.default_payment_term || "14"}
                onChange={handleInputChange}
              >
                <option value="0">Due upon receipt</option>
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
                <option value="60">60 days</option>
                <option value="90">90 days</option>
              </select>
            </div>
          </fieldset>

          <fieldset className={styles.section}>
            <legend className={styles.sectionTitle}>Invoice Content</legend>

            <div className={styles.formGroup}>
              <label htmlFor="custom_invoice_notes">
                Default invoice notes
              </label>
              <textarea
                id="custom_invoice_notes"
                name="custom_invoice_notes"
                value={formData.custom_invoice_notes || ""}
                onChange={handleInputChange}
                placeholder="Add default notes that appear on all invoices..."
                rows={4}
              />
              <p className={styles.helpText}>
                These notes will appear in the body of your invoices
              </p>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="invoice_footer">Default invoice footer</label>
              <textarea
                id="invoice_footer"
                name="invoice_footer"
                value={formData.invoice_footer || ""}
                onChange={handleInputChange}
                placeholder="Thank you for your business. Please pay via accounts details below or via Mastercard / VISA..."
                rows={4}
              />
              <p className={styles.helpText}>
                This text appears at the bottom of all invoices
              </p>
            </div>
          </fieldset>

          <fieldset className={styles.section}>
            <legend className={styles.sectionTitle}>Display Options</legend>

            <div className={styles.checkboxGroup}>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  name="attach_pdf_email"
                  checked={formData.attach_pdf_email ?? true}
                  onChange={handleInputChange}
                />
                <span>Always attach invoice PDF to emails</span>
              </label>
              <p className={styles.helpText}>
                Automatically attach PDF when sending invoice emails
              </p>
            </div>

            <div className={styles.checkboxGroup}>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  name="show_employee_on_invoice"
                  checked={formData.show_employee_on_invoice ?? true}
                  onChange={handleInputChange}
                />
                <span>Show employee name on invoice for labour items</span>
              </label>
              <p className={styles.helpText}>
                Display which employee worked on labour line items
              </p>
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
      )}

      {/* Templates Tab */}
      {activeTab === "templates" && (
        <div className={styles.templatesContainer}>
          <div className={styles.templatesHeader}>
            <div className={styles.searchBar}>
              <input
                type="text"
                placeholder="Search templates..."
                className={styles.searchInput}
              />
            </div>
            <button
              className={styles.newTemplateButton}
              onClick={handleCreateTemplate}
            >
              + New Template
            </button>
          </div>

          <div className={styles.templatesList}>
            <div className={styles.templatesTable}>
              <div className={styles.tableHeader}>
                <div className={styles.col}>STATUS</div>
                <div className={styles.col}>TEMPLATE NAME</div>
                <div className={styles.col}>DATE CREATED</div>
                <div className={styles.col}></div>
              </div>

              {templates.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>No templates created yet</p>
                  <button
                    className={styles.createFirstButton}
                    onClick={handleCreateTemplate}
                  >
                    Create your first template
                  </button>
                </div>
              ) : (
                templates.map((template) => (
                  <div key={template.id} className={styles.tableRow}>
                    <div className={styles.col}>
                      <span
                        className={`${styles.badge} ${template.status === "active" ? styles.badgeActive : styles.badgeInactive}`}
                      >
                        {template.status.toUpperCase()}
                      </span>
                      {template.is_default && (
                        <span
                          className={`${styles.badge} ${styles.badgeDefault}`}
                        >
                          DEFAULT
                        </span>
                      )}
                    </div>
                    <div className={styles.col}>
                      <a href="#" className={styles.templateName}>
                        {template.name}
                      </a>
                    </div>
                    <div className={styles.col}>
                      {new Date(template.created_at).toLocaleDateString()}
                    </div>
                    <div className={styles.col}>
                      <button className={styles.menuButton}>⋯</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={styles.pagination}>
            <span>
              Showing 1 - {templates.length} of {templates.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceSettingsPage;
