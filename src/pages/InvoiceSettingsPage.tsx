import React, { useEffect, useState } from "react";
import { useCompany } from "../context/CompanyContext";
import api from "../services/api";
import InvoiceTemplateEditorModal from "../components/InvoiceTemplateEditorModal";
import ConfirmModal from "../components/ConfirmModal";
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
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(
    null,
  );

  // Confirm modal state
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<number | null>(null);

  // Load templates
  const loadTemplates = async (compId: number) => {
    if (!compId) {
      console.warn("❌ No companyId, skipping template load");
      return [];
    }
    try {
      console.log("📋 Loading templates for company:", compId);
      const templatesData = await api.get<InvoiceTemplate[]>(
        `/invoice-templates/${compId}`,
      );
      console.log("✅ Loaded templates:", templatesData);
      setTemplates(templatesData || []);
      return templatesData || [];
    } catch (error) {
      console.error("❌ Error loading templates:", error);
      return [];
    }
  };

  // Load existing settings
  useEffect(() => {
    const loadSettings = async () => {
      console.log("⚙️ loadSettings() called, companyId:", companyId);
      if (!companyId) {
        console.warn("⚠️ No companyId, skipping load");
        return;
      }

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
            company_name: "",
            company_address: "",
            company_city: "",
            company_state: "",
            company_postal_code: "",
            company_phone: "",
            company_email: "",
            company_website: "",
            tax_calculation_method: "subtotal",
            default_payment_term: "14",
            attach_pdf_email: true,
            show_employee_on_invoice: true,
          });
        }

        // Load templates and auto-switch if they exist
        const templatesData = await loadTemplates(companyId);
        if (templatesData && templatesData.length > 0) {
          console.log(
            "📌 Found existing templates, auto-switching to templates tab",
          );
          setActiveTab("templates");
        } else {
          console.log("📌 No templates found, staying on general tab");
          setActiveTab("general");
        }
      } catch (error) {
        console.error("Error loading invoice settings:", error);
        // Initialize new settings if not found
        setFormData({
          company_id: companyId,
          company_name: "",
          company_address: "",
          company_city: "",
          company_state: "",
          company_postal_code: "",
          company_phone: "",
          company_email: "",
          company_website: "",
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
        company_name: formData.company_name || null,
        company_address: formData.company_address || null,
        company_city: formData.company_city || null,
        company_state: formData.company_state || null,
        company_postal_code: formData.company_postal_code || null,
        company_phone: formData.company_phone || null,
        company_email: formData.company_email || null,
        company_website: formData.company_website || null,
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
    setSelectedTemplateId(null);
    setIsModalOpen(true);
  };

  const handleEditTemplate = (templateId: number) => {
    setSelectedTemplateId(templateId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTemplateId(null);
  };

  // Reload templates when templates tab is active
  useEffect(() => {
    if (activeTab === "templates" && companyId) {
      console.log("📋 Templates tab is active, loading templates...");
      loadTemplates(companyId);
    }
  }, [activeTab, companyId]);

  const handleTemplateSaved = async () => {
    // Reload templates after saving
    if (companyId) {
      await loadTemplates(companyId);
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    setTemplateToDelete(id);
    setIsConfirmModalOpen(true);
  };

  const confirmDeleteTemplate = async () => {
    if (templateToDelete === null) return;

    try {
      await api.delete(`/invoice-templates/${templateToDelete}`);
      setMessage({ type: "success", text: "Template deleted successfully" });
      if (companyId) {
        await loadTemplates(companyId);
      }
      setOpenMenuId(null);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Failed to delete template",
      });
    } finally {
      setIsConfirmModalOpen(false);
      setTemplateToDelete(null);
    }
  };

  const handleDuplicateTemplate = async (id: number) => {
    try {
      const template = templates.find((t) => t.id === id);
      if (!template) return;

      const newTemplate = {
        ...template,
        id: undefined,
        name: `${template.name} (Copy)`,
        is_default: false,
      };

      await api.post("/invoice-templates", newTemplate);
      setMessage({ type: "success", text: "Template duplicated successfully" });
      if (companyId) {
        await loadTemplates(companyId);
      }
      setOpenMenuId(null);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Failed to duplicate template",
      });
    }
  };

  const handleSetAsDefault = async (id: number) => {
    try {
      await api.put(`/invoice-templates/${id}`, { is_default: true });
      setMessage({ type: "success", text: "Template set as default" });
      if (companyId) {
        await loadTemplates(companyId);
      }
      setOpenMenuId(null);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Failed to set template as default",
      });
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
            <legend className={styles.sectionTitle}>Company Details</legend>
            <p className={styles.helpText}>
              This information appears on your invoices and quotes
            </p>

            <div className={styles.formGroup}>
              <label htmlFor="company_name">Business Name</label>
              <input
                type="text"
                id="company_name"
                name="company_name"
                value={formData.company_name || ""}
                onChange={handleInputChange}
                placeholder="Your Company Name"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="company_address">Street Address</label>
              <input
                type="text"
                id="company_address"
                name="company_address"
                value={formData.company_address || ""}
                onChange={handleInputChange}
                placeholder="123 Business Street"
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="company_city">City/Suburb</label>
                <input
                  type="text"
                  id="company_city"
                  name="company_city"
                  value={formData.company_city || ""}
                  onChange={handleInputChange}
                  placeholder="Melbourne"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="company_postal_code">Postcode</label>
                <input
                  type="text"
                  id="company_postal_code"
                  name="company_postal_code"
                  value={formData.company_postal_code || ""}
                  onChange={handleInputChange}
                  placeholder="3000"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="company_state">State</label>
              <input
                type="text"
                id="company_state"
                name="company_state"
                value={formData.company_state || ""}
                onChange={handleInputChange}
                placeholder="Victoria"
              />
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
                  placeholder="1300 123 456"
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
                  placeholder="info@company.com"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="company_website">Website (Optional)</label>
              <input
                type="url"
                id="company_website"
                name="company_website"
                value={formData.company_website || ""}
                onChange={handleInputChange}
                placeholder="https://www.company.com"
              />
            </div>
          </fieldset>

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
                        {template.status
                          ? template.status.toUpperCase()
                          : "INACTIVE"}
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
                      <button
                        className={styles.templateName}
                        onClick={() => handleEditTemplate(template.id)}
                      >
                        {template.name}
                      </button>
                    </div>
                    <div className={styles.col}>
                      {new Date(template.created_at).toLocaleDateString()}
                    </div>
                    <div className={styles.col}>
                      <div className={styles.menuWrapper}>
                        <button
                          className={styles.menuButton}
                          onClick={() =>
                            setOpenMenuId(
                              openMenuId === template.id ? null : template.id,
                            )
                          }
                        >
                          ⋯
                        </button>
                        {openMenuId === template.id && (
                          <div className={styles.dropdown}>
                            <button
                              className={styles.dropdownItem}
                              onClick={() => handleEditTemplate(template.id)}
                            >
                              Edit
                            </button>
                            <button
                              className={styles.dropdownItem}
                              onClick={() =>
                                handleDuplicateTemplate(template.id)
                              }
                            >
                              Duplicate
                            </button>
                            {!template.is_default && (
                              <button
                                className={styles.dropdownItem}
                                onClick={() => handleSetAsDefault(template.id)}
                              >
                                Set as Default
                              </button>
                            )}
                            <button
                              className={`${styles.dropdownItem} ${styles.dangerItem}`}
                              onClick={() => handleDeleteTemplate(template.id)}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
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

      {/* Template Editor Modal */}
      <InvoiceTemplateEditorModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        templateId={selectedTemplateId}
        onSave={handleTemplateSaved}
      />

      {/* Delete Confirmation Modal */}
      {isConfirmModalOpen && (
        <ConfirmModal
          title="Delete Template"
          description="Are you sure you want to delete this template? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={confirmDeleteTemplate}
          onCancel={() => {
            setIsConfirmModalOpen(false);
            setTemplateToDelete(null);
          }}
        />
      )}
    </div>
  );
};

export default InvoiceSettingsPage;
