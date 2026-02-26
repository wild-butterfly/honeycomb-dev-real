import React, { useEffect, useState } from "react";
import { useCompany } from "../context/CompanyContext";
import api from "../services/api";
import QuoteTemplateEditorModal from "../components/QuoteTemplateEditorModal";
import ConfirmModal from "../components/ConfirmModal";
import styles from "./InvoiceSettingsPage.module.css";

interface QuoteSettings {
  id?: number;
  company_id: number;
  default_expiry_days?: string;
  send_confirmation_email?: boolean;
  send_confirmation_sms?: boolean;
  send_followup_sms?: boolean;
  require_deposit?: boolean;
  deposit_amount?: string;
  deposit_type?: "fixed" | "percentage";
  deposit_template?: string;
  custom_quote_notes?: string;
  quote_footer?: string;
  attach_pdf_email?: boolean;
  show_employee_on_quote?: boolean;
}

interface QuoteTemplate {
  id: number;
  name: string;
  status: "active" | "inactive";
  is_default: boolean;
  main_color?: string;
  accent_color?: string;
  font_size?: string;
  created_at: string;
}

const QuoteSettingsPage: React.FC = () => {
  const { companyId } = useCompany();
  const [activeTab, setActiveTab] = useState<"general" | "templates">(
    "general",
  );
  const [formData, setFormData] = useState<QuoteSettings | null>(null);
  const [templates, setTemplates] = useState<QuoteTemplate[]>([]);
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
    if (!compId) return [];
    try {
      const templatesData = await api.get<QuoteTemplate[]>(
        `/quote-templates/${compId}`,
      );
      setTemplates(templatesData || []);
      return templatesData || [];
    } catch (error) {
      console.error("Error loading quote templates:", error);
      return [];
    }
  };

  // Load existing settings
  useEffect(() => {
    const loadSettings = async () => {
      if (!companyId) return;

      try {
        setLoading(true);
        const data = await api.get<QuoteSettings>(
          `/quote-settings/${companyId}`,
        );

        if (data) {
          setFormData(data);
        } else {
          setFormData({
            company_id: companyId,
            default_expiry_days: "30",
            send_confirmation_email: true,
            send_confirmation_sms: false,
            send_followup_sms: false,
            require_deposit: false,
            deposit_amount: "",
            deposit_type: "percentage",
            deposit_template: "",
            custom_quote_notes: "",
            quote_footer: "",
            attach_pdf_email: true,
            show_employee_on_quote: true,
          });
        }

        const templatesData = await loadTemplates(companyId);
        if (templatesData && templatesData.length > 0) {
          setActiveTab("templates");
        } else {
          setActiveTab("general");
        }
      } catch (error) {
        console.error("Error loading quote settings:", error);
        setFormData({
          company_id: companyId,
          default_expiry_days: "30",
          send_confirmation_email: true,
          send_confirmation_sms: false,
          send_followup_sms: false,
          require_deposit: false,
          deposit_amount: "",
          deposit_type: "percentage",
          deposit_template: "",
          custom_quote_notes: "",
          quote_footer: "",
          attach_pdf_email: true,
          show_employee_on_quote: true,
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
        default_expiry_days: formData.default_expiry_days || "30",
        send_confirmation_email: formData.send_confirmation_email ?? true,
        send_confirmation_sms: formData.send_confirmation_sms ?? false,
        send_followup_sms: formData.send_followup_sms ?? false,
        require_deposit: formData.require_deposit ?? false,
        deposit_amount: formData.deposit_amount || null,
        deposit_type: formData.deposit_type || "percentage",
        deposit_template: formData.deposit_template || null,
        custom_quote_notes: formData.custom_quote_notes || null,
        quote_footer: formData.quote_footer || null,
        attach_pdf_email: formData.attach_pdf_email ?? true,
        show_employee_on_quote: formData.show_employee_on_quote ?? true,
      };

      const result = await api.post<QuoteSettings>("/quote-settings", payload);

      if (result) {
        setFormData(result);
        setMessage({
          type: "success",
          text: "Quote settings saved successfully!",
        });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error: any) {
      console.error("Error saving quote settings:", error);
      setMessage({
        type: "error",
        text: error.message || "Failed to save quote settings",
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
      loadTemplates(companyId);
    }
  }, [activeTab, companyId]);

  const handleTemplateSaved = async () => {
    if (companyId) {
      await loadTemplates(companyId);
    }
  };

  const handleDeleteTemplate = (id: number) => {
    setTemplateToDelete(id);
    setIsConfirmModalOpen(true);
  };

  const confirmDeleteTemplate = async () => {
    if (templateToDelete === null) return;

    try {
      await api.delete(`/quote-templates/${templateToDelete}`);
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

      await api.post("/quote-templates", newTemplate);
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
      await api.put(`/quote-templates/${id}`, { is_default: true });
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
        <h1>Quote Settings</h1>
        <p>Configure quote preferences and templates</p>
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
          Quote Templates
        </button>
      </div>

      {/* General Settings Tab */}
      {activeTab === "general" && (
        <div className={styles.form}>
          {/* General Settings */}
          <fieldset className={styles.section}>
            <legend className={styles.sectionTitle}>General Settings</legend>

            <div className={styles.formGroup}>
              <label htmlFor="default_expiry_days">
                Default days until quote expiry
              </label>
              <select
                id="default_expiry_days"
                name="default_expiry_days"
                value={formData.default_expiry_days || "30"}
                onChange={handleInputChange}
              >
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
                <option value="60">60 days</option>
                <option value="90">90 days</option>
              </select>
              <p className={styles.helpText}>
                How long quotes remain valid before expiring
              </p>
            </div>
          </fieldset>

          {/* Email Settings */}
          <fieldset className={styles.section}>
            <legend className={styles.sectionTitle}>Email Settings</legend>

            <div className={styles.checkboxGroup}>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  name="send_confirmation_email"
                  checked={formData.send_confirmation_email ?? true}
                  onChange={handleInputChange}
                />
                <span>
                  Send customer a confirmation email when quote is sent
                </span>
              </label>
              <p className={styles.helpText}>
                Automatically send an email confirmation to the customer when a
                quote is issued
              </p>
            </div>

            <div className={styles.checkboxGroup}>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  name="attach_pdf_email"
                  checked={formData.attach_pdf_email ?? true}
                  onChange={handleInputChange}
                />
                <span>Always attach quote PDF to emails</span>
              </label>
              <p className={styles.helpText}>
                Automatically attach PDF when sending quote emails
              </p>
            </div>
          </fieldset>

          {/* SMS Settings */}
          <fieldset className={styles.section}>
            <legend className={styles.sectionTitle}>SMS Settings</legend>

            <div className={styles.checkboxGroup}>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  name="send_confirmation_sms"
                  checked={formData.send_confirmation_sms ?? false}
                  onChange={handleInputChange}
                />
                <span>Send customer an SMS when quote is sent</span>
              </label>
              <p className={styles.helpText}>
                Send an SMS notification to the customer when a quote is issued
              </p>
            </div>

            <div className={styles.checkboxGroup}>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  name="send_followup_sms"
                  checked={formData.send_followup_sms ?? false}
                  onChange={handleInputChange}
                />
                <span>Send follow-up SMS if quote has not been accepted</span>
              </label>
              <p className={styles.helpText}>
                Automatically send a follow-up SMS reminder for pending quotes
              </p>
            </div>
          </fieldset>

          {/* Deposit Settings */}
          <fieldset className={styles.section}>
            <legend className={styles.sectionTitle}>Deposit Settings</legend>

            <div className={styles.checkboxGroup}>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  name="require_deposit"
                  checked={formData.require_deposit ?? false}
                  onChange={handleInputChange}
                />
                <span>Require a deposit when quote is accepted</span>
              </label>
              <p className={styles.helpText}>
                Customers will be prompted to pay a deposit upon accepting the
                quote
              </p>
            </div>

            {formData.require_deposit && (
              <>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="deposit_type">Deposit type</label>
                    <select
                      id="deposit_type"
                      name="deposit_type"
                      value={formData.deposit_type || "percentage"}
                      onChange={handleInputChange}
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed amount ($)</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="deposit_amount">
                      Deposit amount{" "}
                      {formData.deposit_type === "fixed" ? "($)" : "(%)"}
                    </label>
                    <input
                      type="number"
                      id="deposit_amount"
                      name="deposit_amount"
                      value={formData.deposit_amount || ""}
                      onChange={handleInputChange}
                      placeholder={
                        formData.deposit_type === "fixed"
                          ? "e.g. 250"
                          : "e.g. 20"
                      }
                      min="0"
                    />
                  </div>
                </div>
              </>
            )}
          </fieldset>

          {/* Removed duplicate Deposit Template and Quote Content sections. Data is now managed in QuoteTemplateEditor. */}

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

      {/* Quote Templates Tab */}
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
                  <p>No quote templates created yet</p>
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
      <QuoteTemplateEditorModal
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

export default QuoteSettingsPage;
