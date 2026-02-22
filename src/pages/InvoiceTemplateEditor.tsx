import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCompany } from "../context/CompanyContext";
import api from "../services/api";
import styles from "./InvoiceTemplateEditor.module.css";

interface TemplateData {
  id?: number;
  company_id: number;
  name: string;
  is_default: boolean;
  status: "active" | "inactive";

  // Styling
  main_color: string;
  accent_color: string;
  text_color: string;
  font_size: "small" | "medium" | "large";
  indent_customer_address: boolean;
  orientation: "portrait" | "landscape";

  // Content
  document_title: string;
  show_line_quantities: boolean;
  show_line_prices: boolean;
  show_line_totals: boolean;
  show_section_totals: boolean;
  show_line_items: boolean;
  show_labour_quantities: boolean;
  show_labour_prices: boolean;
  show_labour_totals: boolean;
  show_labour_section_totals: boolean;
  show_labour_items: boolean;
  show_material_quantities: boolean;
  show_material_prices: boolean;
  show_material_totals: boolean;
  show_material_section_totals: boolean;
  show_material_items: boolean;
  default_description: string;
  default_footer: string;

  // Line Items (sections configuration)
  sections: any[];
}

interface CompanyData {
  business_name: string;
  abn: string;
  company_address?: string;
  company_city?: string;
  company_state?: string;
  company_postal_code?: string;
  company_phone?: string;
  company_email?: string;
  company_website?: string;
  logo_url?: string;
}

const InvoiceTemplateEditor: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { companyId } = useCompany();
  const templateId = searchParams.get("id");

  const [activeTab, setActiveTab] = useState<
    "styling" | "content" | "lineitems"
  >("styling");
  const [templateData, setTemplateData] = useState<TemplateData>({
    company_id: companyId || 0,
    name: "Invoice Template 1",
    is_default: false,
    status: "active",
    main_color: "#FFFFFF",
    accent_color: "#FFFFFF",
    text_color: "#000000",
    font_size: "medium",
    indent_customer_address: false,
    orientation: "portrait",
    document_title: "Tax Invoice",
    show_line_quantities: true,
    show_line_prices: true,
    show_line_totals: true,
    show_section_totals: true,
    show_line_items: true,
    show_labour_quantities: true,
    show_labour_prices: true,
    show_labour_totals: true,
    show_labour_section_totals: true,
    show_labour_items: true,
    show_material_quantities: true,
    show_material_prices: true,
    show_material_totals: true,
    show_material_section_totals: true,
    show_material_items: true,
    default_description:
      "Thank you for the opportunity to work on your property. If you have any concerns please contact the office and we will answer any questions.\n\nOur aim is to make every customer a repeat, referring customer.",
    default_footer:
      "Invoices are due to be paid by the due date. Please make deposits to our bank account number as specified and include your invoice number as reference.\n\nAny queries on this invoice should be notified to us within 7 days. Please bring to our attention any concerns you may have with the invoice.",
    sections: [],
  });

  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Load template and company data
  useEffect(() => {
    const loadData = async () => {
      if (!companyId) return;

      try {
        setLoading(true);

        // Load company data from general settings
        const generalSettings = await api.get<any>(
          `/general-settings/${companyId}`,
        );
        if (generalSettings?.settings) {
          setCompanyData({
            business_name:
              generalSettings.settings.business_name || "Your Company",
            abn: generalSettings.settings.abn || "",
            company_phone: generalSettings.settings.company_phone || "",
            company_email: generalSettings.settings.company_email || "",
            company_address: generalSettings.settings.company_address || "",
            company_city: generalSettings.settings.company_city || "",
            company_state: generalSettings.settings.company_state || "",
            company_postal_code:
              generalSettings.settings.company_postal_code || "",
            logo_url: generalSettings.settings.logo_url || "",
          });
        }

        // Load existing template if editing
        if (templateId) {
          const template = await api.get<TemplateData>(
            `/invoice-templates/${templateId}`,
          );
          if (template) {
            setTemplateData(template);
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [companyId, templateId]);

  const handleInputChange = (field: keyof TemplateData, value: any) => {
    setTemplateData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!companyId) return;

    try {
      setSaving(true);

      const payload = {
        ...templateData,
        company_id: companyId,
      };

      let result;
      if (templateId) {
        result = await api.put<TemplateData>(
          `/invoice-templates/${templateId}`,
          payload,
        );
      } else {
        result = await api.post<TemplateData>("/invoice-templates", payload);
      }

      if (result) {
        setMessage({ type: "success", text: "Template saved successfully!" });
        setTimeout(() => {
          navigate("/dashboard/settings?tab=invoice-settings");
        }, 1500);
      }
    } catch (error: any) {
      console.error("Error saving template:", error);
      setMessage({
        type: "error",
        text: error.message || "Failed to save template",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSetAsDefault = async () => {
    // TODO: Implement set as default functionality
    handleInputChange("is_default", true);
  };

  if (loading) {
    return <div className={styles.container}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button
          className={styles.backButton}
          onClick={() => navigate("/dashboard/settings?tab=invoice-settings")}
        >
          ← Back to Templates
        </button>
        <div className={styles.headerActions}>
          <button className={styles.helpButton}>📚 Need help?</button>
        </div>
      </div>

      {/* Title Bar */}
      <div className={styles.titleBar}>
        <div className={styles.titleGroup}>
          <input
            type="text"
            className={styles.templateName}
            value={templateData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
          />
          <button className={styles.editNameButton}>✏️</button>
        </div>
        <div className={styles.titleActions}>
          <button
            className={styles.secondaryButton}
            onClick={handleSetAsDefault}
          >
            Set as default invoice
          </button>
          <button
            className={styles.primaryButton}
            onClick={handleSave}
            disabled={saving}
          >
            ✓ {saving ? "Saving..." : "Saved"}
          </button>
        </div>
      </div>

      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "styling" ? styles.active : ""}`}
          onClick={() => setActiveTab("styling")}
        >
          Styling
        </button>
        <button
          className={`${styles.tab} ${activeTab === "content" ? styles.active : ""}`}
          onClick={() => setActiveTab("content")}
        >
          Content
        </button>
        <button
          className={`${styles.tab} ${activeTab === "lineitems" ? styles.active : ""}`}
          onClick={() => setActiveTab("lineitems")}
        >
          Line Items
        </button>
      </div>

      <div className={styles.editorLayout}>
        {/* Left Panel - Settings */}
        <div className={styles.settingsPanel}>
          {/* Styling Tab */}
          {activeTab === "styling" && (
            <div className={styles.tabContent}>
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Template styling</h3>
                <p className={styles.sectionSubtitle}>
                  Customise templates default styling - changes are applied to
                  new documents only.
                </p>

                <div className={styles.formGroup}>
                  <label>Main Colour</label>
                  <div className={styles.colorInput}>
                    <input
                      type="color"
                      value={templateData.main_color}
                      onChange={(e) =>
                        handleInputChange("main_color", e.target.value)
                      }
                    />
                    <input
                      type="text"
                      value={templateData.main_color}
                      onChange={(e) =>
                        handleInputChange("main_color", e.target.value)
                      }
                      placeholder="#FFFFFF"
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Accent Colour</label>
                  <div className={styles.colorInput}>
                    <input
                      type="color"
                      value={templateData.accent_color}
                      onChange={(e) =>
                        handleInputChange("accent_color", e.target.value)
                      }
                    />
                    <input
                      type="text"
                      value={templateData.accent_color}
                      onChange={(e) =>
                        handleInputChange("accent_color", e.target.value)
                      }
                      placeholder="#FFFFFF"
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Company details text Colour</label>
                  <div className={styles.colorInput}>
                    <input
                      type="color"
                      value={templateData.text_color}
                      onChange={(e) =>
                        handleInputChange("text_color", e.target.value)
                      }
                    />
                    <input
                      type="text"
                      value={templateData.text_color}
                      onChange={(e) =>
                        handleInputChange("text_color", e.target.value)
                      }
                      placeholder="#000000"
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Default Font Size</label>
                  <p className={styles.helpText}>
                    This applies to header content, section titles and line
                    items.
                  </p>
                  <select
                    value={templateData.font_size}
                    onChange={(e) =>
                      handleInputChange("font_size", e.target.value)
                    }
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.toggleLabel}>
                    <span>Indent Customer Address</span>
                    <input
                      type="checkbox"
                      checked={templateData.indent_customer_address}
                      onChange={(e) =>
                        handleInputChange(
                          "indent_customer_address",
                          e.target.checked,
                        )
                      }
                      className={styles.toggle}
                    />
                  </label>
                  <p className={styles.helpText}>
                    Indent the customer's address for printing or mailing.
                  </p>
                </div>

                <div className={styles.formGroup}>
                  <label>Invoice orientation</label>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        value="portrait"
                        checked={templateData.orientation === "portrait"}
                        onChange={(e) =>
                          handleInputChange("orientation", e.target.value)
                        }
                      />
                      <span>Portrait</span>
                    </label>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        value="landscape"
                        checked={templateData.orientation === "landscape"}
                        onChange={(e) =>
                          handleInputChange("orientation", e.target.value)
                        }
                      />
                      <span>Landscape</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content Tab */}
          {activeTab === "content" && (
            <div className={styles.tabContent}>
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Template content</h3>
                <p className={styles.sectionSubtitle}>
                  Customise templates default content - changes are applied to
                  new documents only.
                </p>

                <div className={styles.formGroup}>
                  <label>Default Document Title</label>
                  <input
                    type="text"
                    value={templateData.document_title}
                    onChange={(e) =>
                      handleInputChange("document_title", e.target.value)
                    }
                    placeholder="Tax Invoice"
                  />
                </div>

                <div className={styles.formGroup}>
                  <h4>Custom section formatting options</h4>
                  <div className={styles.checkboxList}>
                    <label>
                      <input
                        type="checkbox"
                        checked={templateData.show_line_quantities}
                        onChange={(e) =>
                          handleInputChange(
                            "show_line_quantities",
                            e.target.checked,
                          )
                        }
                      />
                      <span>Show line item quantities</span>
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={templateData.show_line_prices}
                        onChange={(e) =>
                          handleInputChange(
                            "show_line_prices",
                            e.target.checked,
                          )
                        }
                      />
                      <span>Show line item prices</span>
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={templateData.show_line_totals}
                        onChange={(e) =>
                          handleInputChange(
                            "show_line_totals",
                            e.target.checked,
                          )
                        }
                      />
                      <span>Show line item totals</span>
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={templateData.show_section_totals}
                        onChange={(e) =>
                          handleInputChange(
                            "show_section_totals",
                            e.target.checked,
                          )
                        }
                      />
                      <span>Show section totals</span>
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={templateData.show_line_items}
                        onChange={(e) =>
                          handleInputChange("show_line_items", e.target.checked)
                        }
                      />
                      <span>Show line items</span>
                    </label>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <h4>Imported labour section formatting options</h4>
                  <div className={styles.infoBox}>
                    <span className={styles.infoIcon}>ℹ️</span>
                    <span>
                      These defaults will only be applied when importing job
                      phases or quote/estimate sections onto an invoice.
                    </span>
                  </div>
                  <div className={styles.checkboxList}>
                    <label>
                      <input
                        type="checkbox"
                        checked={templateData.show_labour_quantities}
                        onChange={(e) =>
                          handleInputChange(
                            "show_labour_quantities",
                            e.target.checked,
                          )
                        }
                      />
                      <span>Show line item quantities</span>
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={templateData.show_labour_prices}
                        onChange={(e) =>
                          handleInputChange(
                            "show_labour_prices",
                            e.target.checked,
                          )
                        }
                      />
                      <span>Show line item prices</span>
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={templateData.show_labour_totals}
                        onChange={(e) =>
                          handleInputChange(
                            "show_labour_totals",
                            e.target.checked,
                          )
                        }
                      />
                      <span>Show line item totals</span>
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={templateData.show_labour_section_totals}
                        onChange={(e) =>
                          handleInputChange(
                            "show_labour_section_totals",
                            e.target.checked,
                          )
                        }
                      />
                      <span>Show section totals</span>
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={templateData.show_labour_items}
                        onChange={(e) =>
                          handleInputChange(
                            "show_labour_items",
                            e.target.checked,
                          )
                        }
                      />
                      <span>Show line items</span>
                    </label>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <h4>Imported material section formatting options</h4>
                  <div className={styles.infoBox}>
                    <span className={styles.infoIcon}>ℹ️</span>
                    <span>
                      These defaults will only be applied when importing job
                      phases or quote/estimate sections onto an invoice.
                    </span>
                  </div>
                  <div className={styles.checkboxList}>
                    <label>
                      <input
                        type="checkbox"
                        checked={templateData.show_material_quantities}
                        onChange={(e) =>
                          handleInputChange(
                            "show_material_quantities",
                            e.target.checked,
                          )
                        }
                      />
                      <span>Show line item quantities</span>
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={templateData.show_material_prices}
                        onChange={(e) =>
                          handleInputChange(
                            "show_material_prices",
                            e.target.checked,
                          )
                        }
                      />
                      <span>Show line item prices</span>
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={templateData.show_material_totals}
                        onChange={(e) =>
                          handleInputChange(
                            "show_material_totals",
                            e.target.checked,
                          )
                        }
                      />
                      <span>Show line item totals</span>
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={templateData.show_material_section_totals}
                        onChange={(e) =>
                          handleInputChange(
                            "show_material_section_totals",
                            e.target.checked,
                          )
                        }
                      />
                      <span>Show section totals</span>
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={templateData.show_material_items}
                        onChange={(e) =>
                          handleInputChange(
                            "show_material_items",
                            e.target.checked,
                          )
                        }
                      />
                      <span>Show line items</span>
                    </label>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Default Description</label>
                  <textarea
                    className={styles.richTextarea}
                    value={templateData.default_description}
                    onChange={(e) =>
                      handleInputChange("default_description", e.target.value)
                    }
                    rows={4}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Default Footer</label>
                  <textarea
                    className={styles.richTextarea}
                    value={templateData.default_footer}
                    onChange={(e) =>
                      handleInputChange("default_footer", e.target.value)
                    }
                    rows={4}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Line Items Tab */}
          {activeTab === "lineitems" && (
            <div className={styles.tabContent}>
              <div className={styles.infoBox}>
                <span className={styles.infoIcon}>ℹ️</span>
                <span>
                  Changes to sections and line items are saved automatically.
                </span>
              </div>

              <div className={styles.emptyState}>
                <button className={styles.addSectionButton}>
                  + Add New Section
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Preview */}
        <div className={styles.previewPanel}>
          <div className={styles.previewContainer}>
            <div
              className={styles.invoicePreview}
              style={{
                fontSize:
                  templateData.font_size === "small"
                    ? "0.85rem"
                    : templateData.font_size === "large"
                      ? "1.1rem"
                      : "1rem",
              }}
            >
              {/* Company Header */}
              <div className={styles.invoiceHeader}>
                {companyData?.logo_url && (
                  <div className={styles.companyLogo}>
                    <img src={companyData.logo_url} alt="Company logo" />
                  </div>
                )}
                <div
                  className={styles.companyDetails}
                  style={{ color: templateData.text_color }}
                >
                  <h3>{companyData?.business_name || "Your Company"}</h3>
                  <p>{companyData?.company_address || "5a Harmeet Close"}</p>
                  <p>
                    {companyData?.company_city
                      ? `${companyData.company_city}, ${companyData.company_state || ""} ${companyData.company_postal_code || ""}`
                      : "Mulgrave, 3170"}
                  </p>
                  <p>Victoria</p>
                  <p>{companyData?.company_email || "info@company.com"}</p>
                  <p>{companyData?.company_phone || "1300 303 750"}</p>
                </div>
              </div>

              {/* Invoice Details */}
              <div className={styles.invoiceInfo}>
                <div
                  className={styles.customerInfo}
                  style={{
                    marginLeft: templateData.indent_customer_address
                      ? "40px"
                      : "0",
                  }}
                >
                  <p>
                    <strong>Attention Name</strong>
                  </p>
                  <p>123 Street</p>
                  <p>Suburb</p>
                  <p>City, 1234</p>
                  <p>Region</p>
                </div>
                <div className={styles.invoiceMetadata}>
                  <p>
                    <strong>Site Address</strong>
                  </p>
                  <p>123 Street</p>
                  <p>Suburb</p>
                  <p>City, 1234</p>
                  <p>Region</p>
                </div>
                <div className={styles.invoiceNumbers}>
                  <p>
                    <strong>Invoice number:</strong> INV-DRAFT
                  </p>
                  <p>
                    <strong>Job number:</strong> 123455
                  </p>
                  <p>
                    <strong>Invoice Date:</strong> Sun Feb 22 2026
                  </p>
                  <p>
                    <strong>Due Date:</strong> Sun Mar 08 2026
                  </p>
                  <p>
                    <strong>GST Number:</strong> 33118605451
                  </p>
                </div>
              </div>

              {/* Title */}
              <h2 className={styles.invoiceTitle}>
                {templateData.document_title} |{" "}
                <span style={{ color: "#999" }}>INV-DRAFT</span>
              </h2>

              {/* Description */}
              <div className={styles.invoiceDescription}>
                {templateData.default_description}
              </div>

              {/* Line Items */}
              <div className={styles.invoiceSection}>
                <h3>Example Section</h3>
                <p className={styles.sectionDescription}>
                  Example Section Description
                </p>

                {templateData.show_line_items && (
                  <table className={styles.invoiceTable}>
                    <thead>
                      <tr>
                        <th>Example Item</th>
                        {templateData.show_line_quantities && <th>Qty</th>}
                        {templateData.show_line_prices && <th>Price</th>}
                        {templateData.show_line_totals && <th>Total</th>}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td></td>
                        {templateData.show_line_quantities && <td>1.00</td>}
                        {templateData.show_line_prices && <td>$100.00</td>}
                        {templateData.show_line_totals && <td>$100.00</td>}
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>

              {/* Totals */}
              <div className={styles.invoiceTotals}>
                <div className={styles.totalRow}>
                  <span>Subtotal</span>
                  <span>$100.00</span>
                </div>
                <div className={styles.totalRow}>
                  <span>Tax Amount</span>
                  <span>$15.00</span>
                </div>
                <div className={styles.totalRow}>
                  <strong>Total</strong>
                  <strong>$115.00</strong>
                </div>
              </div>

              {/* Footer */}
              <div className={styles.invoiceFooter}>
                {templateData.default_footer}
                <p className={styles.footerDetails}>
                  <small>
                    BSB Number: 013 231 Bank Account: 1078 53001 Invoice number:
                    INV-DRAFT
                  </small>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceTemplateEditor;
