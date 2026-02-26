import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCompany } from "../context/CompanyContext";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { EyeIcon, PencilIcon } from "@heroicons/react/24/outline";
import styles from "./InvoiceTemplateEditor.module.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3001/api";

interface TemplateData {
  id?: number;
  company_id: number;
  name: string;
  is_default: boolean;
  status: "active" | "inactive";

  // Styling
  main_color: string;
  text_color: string;
  highlight_color: string;
  font_size: "small" | "medium" | "large";
  header_background_color: string;
  border_color: string;
  border_width: "1px" | "2px" | "3px";
  table_header_background_color: string;
  table_header_gradient_color: string;
  table_header_text_color: string;
  description_background_color: string;
  description_border_color: string;
  description_text_color: string;
  table_header_style: "solid" | "gradient";
  indent_customer_address: boolean;
  orientation: "portrait" | "landscape";
  show_company_logo: boolean;

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

type StyleSnapshot = Pick<
  TemplateData,
  | "main_color"
  | "text_color"
  | "highlight_color"
  | "header_background_color"
  | "border_color"
  | "table_header_background_color"
  | "table_header_gradient_color"
  | "table_header_text_color"
  | "description_background_color"
  | "description_border_color"
  | "description_text_color"
>;

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

interface QuoteTemplateEditorProps {
  isModal?: boolean;
  onClose?: () => void;
  templateId?: number | null;
  onSave?: () => void;
  companyId?: number | null;
}

const QuoteTemplateEditor: React.FC<QuoteTemplateEditorProps> = ({
  isModal = false,
  onClose,
  templateId: propTemplateId,
  onSave: onSaveCallback,
  companyId: propCompanyId,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const contextCompanyId = useCompany().companyId;
  const companyId = propCompanyId || contextCompanyId;
  const urlTemplateId = searchParams.get("id");
  const initialTemplateId = propTemplateId?.toString() || urlTemplateId;
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(
    initialTemplateId || null,
  );

  const [activeTab, setActiveTab] = useState<
    "styling" | "content" | "lineitems"
  >("styling");
  const [userLogo, setUserLogo] = useState<string>("");

  const { user } = useAuth();

  const [templateData, setTemplateData] = useState<TemplateData>({
    company_id: companyId || 0,
    name: "Quote Template 1",
    is_default: false,
    status: "active",
    main_color: "#fbbf24",
    text_color: "#1f2937",
    highlight_color: "#fafafa",
    font_size: "medium",
    header_background_color: "#ffffff",
    border_color: "#fbbf24",
    border_width: "1px",
    table_header_background_color: "#fbbf24",
    table_header_gradient_color: "#f59e0b",
    table_header_text_color: "#ffffff",
    description_background_color: "#fafafa",
    description_border_color: "#fbbf24",
    description_text_color: "#374151",
    table_header_style: "solid",
    indent_customer_address: false,
    orientation: "portrait",
    show_company_logo: true,
    document_title: "Quote",
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
      "Thank you for the opportunity to quote on your project. This quote is valid for the period stated. Please contact us if you have any questions.\n\nOur aim is to provide quality service and make every customer a repeat, referring customer.",
    default_footer:
      "This quote is valid for the period stated above. Please review and accept at your earliest convenience.\n\nIf you have any queries on this quote please contact us within 7 days. We look forward to working with you.",
    sections: [],
  });

  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [blackWhiteMode, setBlackWhiteMode] = useState(false);
  const [styleBeforeBw, setStyleBeforeBw] = useState<StyleSnapshot | null>(
    null,
  );

  const previewPanelRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(0.6);
  const [naturalPreviewH, setNaturalPreviewH] = useState(842);

  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout>;
    const compute = () => {
      if (!previewRef.current || !previewPanelRef.current) return;
      const panel = previewPanelRef.current;
      const preview = previewRef.current;
      const availW = panel.clientWidth - 28;
      const availH = panel.clientHeight - 28;
      const baseW = templateData.orientation === "landscape" ? 842 : 595;
      const h = preview.scrollHeight;
      if (h === 0 || availW === 0) return;
      setNaturalPreviewH(h);
      setPreviewScale(Math.min(availW / baseW, availH / h));
    };
    const debounced = () => {
      clearTimeout(timerId);
      timerId = setTimeout(compute, 50);
    };
    debounced();
    const obs = new ResizeObserver(debounced);
    if (previewPanelRef.current) obs.observe(previewPanelRef.current);
    return () => {
      clearTimeout(timerId);
      obs.disconnect();
    };
  }, [templateData]);

  const detectBlackWhiteMode = (template: TemplateData) => {
    return (
      (template.border_color || "").toLowerCase() === "#111111" &&
      (template.table_header_background_color || "").toLowerCase() === "#6b7280"
    );
  };

  const handlePreviewPdf = async () => {
    if (!companyData) {
      setMessage({ type: "error", text: "Company data is not available yet." });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const impersonateCompany = localStorage.getItem("impersonateCompany");

      const response = await fetch(`${API_BASE}/quote-templates/preview-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(impersonateCompany ? { "X-Company-Id": impersonateCompany } : {}),
        },
        body: JSON.stringify({
          template: templateData,
          company: companyData,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to generate preview PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "quote-template-preview.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Preview PDF error:", error);
      setMessage({ type: "error", text: "Failed to download preview PDF." });
    }
  };

  // Load template and company data
  useEffect(() => {
    const loadData = async () => {
      if (!companyId) return;

      try {
        setLoading(true);
        if (user?.avatar) {
          setUserLogo(user.avatar);
        }

        const generalSettings = await api.get<any>(
          `/general-settings/${companyId}`,
        );
        if (generalSettings?.settings) {
          const logoUrl = generalSettings.settings.logo_url || "";
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
            logo_url: logoUrl,
          });
        }

        if (currentTemplateId) {
          const template = await api.get<TemplateData>(
            `/quote-templates/template/${currentTemplateId}`,
          );
          if (template) {
            const defaultMainColor = "#fbbf24";
            const defaultBorderColor =
              template.border_color && template.border_color.trim()
                ? template.border_color
                : template.main_color && template.main_color.trim()
                  ? template.main_color
                  : defaultMainColor;
            const templateWithDefaults: TemplateData = {
              ...template,
              main_color:
                template.main_color && template.main_color.trim()
                  ? template.main_color
                  : defaultMainColor,
              text_color:
                template.text_color && template.text_color.trim()
                  ? template.text_color
                  : "#1f2937",
              highlight_color:
                template.highlight_color && template.highlight_color.trim()
                  ? template.highlight_color
                  : "#fafafa",
              font_size:
                template.font_size === "small" ||
                template.font_size === "medium" ||
                template.font_size === "large"
                  ? template.font_size
                  : "medium",
              header_background_color:
                template.header_background_color &&
                template.header_background_color.trim()
                  ? template.header_background_color
                  : "#ffffff",
              border_color: defaultBorderColor,
              border_width:
                template.border_width === "1px" ||
                template.border_width === "2px" ||
                template.border_width === "3px"
                  ? template.border_width
                  : "1px",
              table_header_background_color:
                template.table_header_background_color &&
                template.table_header_background_color.trim()
                  ? template.table_header_background_color
                  : defaultBorderColor,
              table_header_gradient_color:
                template.table_header_gradient_color &&
                template.table_header_gradient_color.trim()
                  ? template.table_header_gradient_color
                  : defaultBorderColor,
              table_header_text_color:
                template.table_header_text_color &&
                template.table_header_text_color.trim()
                  ? template.table_header_text_color
                  : "#ffffff",
              description_background_color:
                template.description_background_color &&
                template.description_background_color.trim()
                  ? template.description_background_color
                  : "#fafafa",
              description_border_color:
                template.description_border_color &&
                template.description_border_color.trim()
                  ? template.description_border_color
                  : defaultBorderColor,
              description_text_color:
                template.description_text_color &&
                template.description_text_color.trim()
                  ? template.description_text_color
                  : "#374151",
              table_header_style:
                template.table_header_style === "gradient" ? "gradient" : "solid",
              orientation:
                template.orientation === "landscape" ? "landscape" : "portrait",
              document_title:
                template.document_title && template.document_title.trim()
                  ? template.document_title
                  : "Quote",
              name:
                template.name && template.name.trim()
                  ? template.name
                  : "Quote Template 1",
              show_company_logo:
                template.show_company_logo !== undefined
                  ? template.show_company_logo
                  : true,
              show_section_totals:
                template.show_section_totals !== undefined
                  ? template.show_section_totals
                  : true,
              show_line_items:
                template.show_line_items !== undefined
                  ? template.show_line_items
                  : true,
              show_line_quantities:
                template.show_line_quantities !== undefined
                  ? template.show_line_quantities
                  : true,
              show_line_prices:
                template.show_line_prices !== undefined
                  ? template.show_line_prices
                  : true,
              show_line_totals:
                template.show_line_totals !== undefined
                  ? template.show_line_totals
                  : true,
              show_labour_items:
                template.show_labour_items !== undefined
                  ? template.show_labour_items
                  : true,
              show_labour_quantities:
                template.show_labour_quantities !== undefined
                  ? template.show_labour_quantities
                  : true,
              show_labour_prices:
                template.show_labour_prices !== undefined
                  ? template.show_labour_prices
                  : true,
              show_labour_totals:
                template.show_labour_totals !== undefined
                  ? template.show_labour_totals
                  : true,
              show_labour_section_totals:
                template.show_labour_section_totals !== undefined
                  ? template.show_labour_section_totals
                  : true,
              show_material_items:
                template.show_material_items !== undefined
                  ? template.show_material_items
                  : true,
              show_material_quantities:
                template.show_material_quantities !== undefined
                  ? template.show_material_quantities
                  : true,
              show_material_prices:
                template.show_material_prices !== undefined
                  ? template.show_material_prices
                  : true,
              show_material_totals:
                template.show_material_totals !== undefined
                  ? template.show_material_totals
                  : true,
              show_material_section_totals:
                template.show_material_section_totals !== undefined
                  ? template.show_material_section_totals
                  : true,
              sections: Array.isArray(template.sections)
                ? template.sections
                : [],
            };
            setTemplateData(templateWithDefaults);
            setBlackWhiteMode(detectBlackWhiteMode(templateWithDefaults));
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [companyId, currentTemplateId, user]);

  const handleInputChange = (field: keyof TemplateData, value: any) => {
    setTemplateData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleToggleBlackWhiteMode = (enabled: boolean) => {
    setBlackWhiteMode(enabled);
    setTemplateData((prev) => {
      if (enabled) {
        setStyleBeforeBw({
          main_color: prev.main_color,
          text_color: prev.text_color,
          highlight_color: prev.highlight_color,
          header_background_color: prev.header_background_color,
          border_color: prev.border_color,
          table_header_background_color: prev.table_header_background_color,
          table_header_gradient_color: prev.table_header_gradient_color,
          table_header_text_color: prev.table_header_text_color,
          description_background_color: prev.description_background_color,
          description_border_color: prev.description_border_color,
          description_text_color: prev.description_text_color,
        });

        return {
          ...prev,
          main_color: "#111111",
          text_color: "#111111",
          highlight_color: "#f8f9fa",
          header_background_color: "#ffffff",
          border_color: "#111111",
          table_header_background_color: "#6b7280",
          table_header_gradient_color: "#4b5563",
          table_header_text_color: "#ffffff",
          description_background_color: "#f8f9fa",
          description_border_color: "#111111",
          description_text_color: "#111111",
        };
      }

      if (styleBeforeBw) {
        return {
          ...prev,
          ...styleBeforeBw,
        };
      }

      return {
        ...prev,
        header_background_color: "#ffffff",
        border_color: prev.main_color,
        table_header_background_color: prev.main_color,
        table_header_gradient_color: prev.main_color,
        table_header_text_color: "#ffffff",
        description_border_color: prev.main_color,
      };
    });
  };

  const handleSave = async () => {
    if (!companyId) {
      setMessage({
        type: "error",
        text: "Error: Company information not loaded. Please refresh the page.",
      });
      return;
    }

    try {
      setSaving(true);

      const sectionsToSave = Array.isArray(templateData.sections)
        ? templateData.sections
        : [];

      const payload = {
        ...templateData,
        company_id: companyId,
        sections: sectionsToSave,
        highlight_color: templateData.highlight_color,
      };

      let result;
      if (currentTemplateId) {
        result = await api.put<TemplateData>(
          `/quote-templates/${currentTemplateId}`,
          payload,
        );
      } else {
        result = await api.post<TemplateData>("/quote-templates", payload);
      }

      if (result) {
        const resultSections = Array.isArray(result.sections)
          ? result.sections
          : typeof result.sections === "string"
            ? JSON.parse(result.sections)
            : [];

        const updatedTemplate: TemplateData = {
          ...templateData,
          ...result,
          sections: resultSections || templateData.sections || [],
        };

        setTemplateData(updatedTemplate);

        try {
          const generalSettings = await api.get<any>(
            `/general-settings/${companyId}`,
          );
          if (generalSettings?.settings) {
            const logoUrl = generalSettings.settings.logo_url || "";
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
              logo_url: logoUrl,
            });
          }
        } catch (error) {
          console.error("Error reloading company data after save:", error);
        }

        setMessage({
          type: "success",
          text: currentTemplateId
            ? "Changes saved successfully!"
            : "Template created successfully!",
        });
        setTimeout(() => setMessage(null), 3000);

        if (!currentTemplateId && result.id) {
          setCurrentTemplateId(result.id.toString());
        }

        if (!isModal) {
          setTimeout(() => {
            navigate("/dashboard/settings?tab=quote-settings");
          }, 1500);
        } else {
          if (onSaveCallback) {
            onSaveCallback();
          }
        }
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

  const handleBack = () => {
    if (isModal && onClose) {
      onClose();
    } else {
      navigate("/dashboard/settings?tab=quote-settings");
    }
  };

  const handleAddSection = () => {
    const newSection = {
      id: Date.now(),
      name: "New Section",
      description: "",
      items: [],
    };
    setTemplateData((prev) => ({
      ...prev,
      sections: [...(prev.sections || []), newSection],
    }));
    setMessage({ type: "success", text: "New section added!" });
  };

  const handleAddLineItem = (sectionId: number) => {
    setTemplateData((prev) => ({
      ...prev,
      sections: prev.sections.map((section: any) =>
        section.id === sectionId
          ? {
              ...section,
              items: [
                ...(section.items || []),
                {
                  id: Date.now(),
                  name: "New Item",
                  description: "",
                  quantity: 1,
                  price: 0,
                },
              ],
            }
          : section,
      ),
    }));
    setMessage({ type: "success", text: "Line item added!" });
  };

  const handleSetAsDefault = async () => {
    if (!companyId || !currentTemplateId) {
      setMessage({
        type: "error",
        text: "Cannot set template as default. Save first.",
      });
      return;
    }

    try {
      const payload = {
        ...templateData,
        company_id: companyId,
        is_default: true,
        highlight_color: templateData.highlight_color,
      };

      const result = await api.put<TemplateData>(
        `/quote-templates/${currentTemplateId}`,
        payload,
      );

      if (result) {
        setTemplateData((prev) => ({
          ...prev,
          is_default: true,
          highlight_color: result.highlight_color,
        }));
        setMessage({ type: "success", text: "Set as default successfully!" });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Failed to set as default",
      });
    }
  };

  const handleRefreshLogo = async () => {
    if (!companyId) return;

    try {
      const generalSettings = await api.get<any>(
        `/general-settings/${companyId}`,
      );

      if (user?.avatar) {
        setUserLogo(user.avatar);
      }

      if (generalSettings?.settings) {
        const logoUrl = userLogo || generalSettings.settings.logo_url || "";
        setCompanyData((prev) =>
          prev ? { ...prev, logo_url: logoUrl } : null,
        );
      }

      setMessage({
        type: "success",
        text: "Logo refreshed! Check the preview.",
      });
    } catch (error) {
      setMessage({ type: "error", text: "Failed to refresh logo" });
    }
  };

  if (loading) {
    return <div className={styles.container}>Loading...</div>;
  }

  const previewFontSize =
    templateData.font_size === "small"
      ? "0.85rem"
      : templateData.font_size === "large"
        ? "1.1rem"
        : "1rem";
  const previewBorderWidth =
    Number.parseFloat(templateData.border_width || "1") || 1;

  return (
    <>
      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          <span>{message.text}</span>
          <button
            className={styles.messageClose}
            onClick={() => setMessage(null)}
            aria-label="Close notification"
          >
            ✕
          </button>
        </div>
      )}
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <button className={styles.backButton} onClick={handleBack}>
            ← Back to Templates
          </button>
        </div>

        {/* Title Bar */}
        <div className={styles.titleBar}>
          <div className={styles.titleGroup}>
            <label className={styles.templateLabel}>Template Name:</label>
            <input
              type="text"
              className={styles.templateName}
              value={templateData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter template name (required)"
            />
            <button className={styles.editNameButton} type="button">
              <PencilIcon className={styles.pencilIcon} />
            </button>
          </div>
          <div className={styles.titleActions}>
            <button
              className={styles.secondaryButton}
              onClick={handlePreviewPdf}
              type="button"
            >
              Download PDF Preview
            </button>
            <button
              className={styles.secondaryButton}
              onClick={handleSetAsDefault}
            >
              Set as default quote
            </button>
            <button
              className={styles.primaryButton}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "SAVING..." : "SAVE"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === "styling" ? styles.active : ""}`}
            onClick={() => setActiveTab("styling")}
            type="button"
          >
            Styling
          </button>
          <button
            className={`${styles.tab} ${activeTab === "content" ? styles.active : ""}`}
            onClick={() => setActiveTab("content")}
            type="button"
          >
            Content
          </button>
          <button
            className={`${styles.tab} ${activeTab === "lineitems" ? styles.active : ""}`}
            onClick={() => setActiveTab("lineitems")}
            type="button"
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
                    Customise template default styling — changes are applied to
                    new quotes only.
                  </p>

                  <div className={styles.formGroup}>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        marginBottom: 0,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={blackWhiteMode}
                        onChange={(e) =>
                          handleToggleBlackWhiteMode(e.target.checked)
                        }
                      />
                      <span>Black and White Mode</span>
                    </label>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Theme Colour</label>
                    <p className={styles.helpText}>
                      This color will be applied to borders, headers, and
                      summary sections
                    </p>
                    <div className={styles.colorInput}>
                      <input
                        type="color"
                        value={templateData.main_color}
                        onChange={(e) => {
                          const color = e.target.value;
                          setBlackWhiteMode(false);
                          handleInputChange("main_color", color);
                          handleInputChange("border_color", color);
                          handleInputChange("description_border_color", color);
                          handleInputChange(
                            "table_header_background_color",
                            color,
                          );
                          handleInputChange("table_header_gradient_color", color);
                          handleInputChange(
                            "header_background_color",
                            "#ffffff",
                          );
                        }}
                      />
                      <input
                        type="text"
                        value={templateData.main_color}
                        onChange={(e) => {
                          const color = e.target.value;
                          setBlackWhiteMode(false);
                          handleInputChange("main_color", color);
                          handleInputChange("border_color", color);
                          handleInputChange("description_border_color", color);
                          handleInputChange(
                            "table_header_background_color",
                            color,
                          );
                          handleInputChange("table_header_gradient_color", color);
                          handleInputChange(
                            "header_background_color",
                            "#ffffff",
                          );
                        }}
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
                    <label>Highlight Colour</label>
                    <p className={styles.helpText}>
                      Background color for company details, description section,
                      section headers, table row highlights and totals box.
                    </p>
                    <div className={styles.colorInput}>
                      <input
                        type="color"
                        value={templateData.highlight_color}
                        onChange={(e) =>
                          handleInputChange("highlight_color", e.target.value)
                        }
                      />
                      <input
                        type="text"
                        value={templateData.highlight_color}
                        onChange={(e) =>
                          handleInputChange("highlight_color", e.target.value)
                        }
                        placeholder="#fafafa"
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
                    <label>Border Width</label>
                    <select
                      value={templateData.border_width}
                      onChange={(e) =>
                        handleInputChange("border_width", e.target.value)
                      }
                    >
                      <option value="1px">Thin (1px)</option>
                      <option value="2px">Medium (2px)</option>
                      <option value="3px">Thick (3px)</option>
                    </select>
                  </div>

                  {/* Description Section Styling */}
                  <div className={styles.sectionDivider}>
                    <h4>Description Section Styling</h4>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Description Text Color</label>
                    <div className={styles.colorInput}>
                      <input
                        type="color"
                        value={templateData.description_text_color}
                        onChange={(e) =>
                          handleInputChange(
                            "description_text_color",
                            e.target.value,
                          )
                        }
                      />
                      <input
                        type="text"
                        value={templateData.description_text_color}
                        onChange={(e) =>
                          handleInputChange(
                            "description_text_color",
                            e.target.value,
                          )
                        }
                        placeholder="#374151"
                      />
                    </div>
                  </div>

                  {/* Table Header Styling */}
                  <div className={styles.sectionDivider}>
                    <h4>Table Header Style</h4>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Header Background Color</label>
                    <div className={styles.colorInput}>
                      <input
                        type="color"
                        value={templateData.table_header_background_color}
                        onChange={(e) =>
                          handleInputChange(
                            "table_header_background_color",
                            e.target.value,
                          )
                        }
                      />
                      <input
                        type="text"
                        value={templateData.table_header_background_color}
                        onChange={(e) =>
                          handleInputChange(
                            "table_header_background_color",
                            e.target.value,
                          )
                        }
                        placeholder="#FFD600"
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Header Text Color</label>
                    <div className={styles.colorInput}>
                      <input
                        type="color"
                        value={templateData.table_header_text_color}
                        onChange={(e) =>
                          handleInputChange(
                            "table_header_text_color",
                            e.target.value,
                          )
                        }
                      />
                      <input
                        type="text"
                        value={templateData.table_header_text_color}
                        onChange={(e) =>
                          handleInputChange(
                            "table_header_text_color",
                            e.target.value,
                          )
                        }
                        placeholder="#FFFFFF"
                      />
                    </div>
                    <p className={styles.helpText}>
                      Text color for table header cells
                    </p>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.toggleLabel}>
                      <span>Show Company Logo</span>
                      <input
                        type="checkbox"
                        checked={templateData.show_company_logo}
                        onChange={(e) =>
                          handleInputChange(
                            "show_company_logo",
                            e.target.checked,
                          )
                        }
                        className={styles.toggle}
                      />
                    </label>
                    <p className={styles.helpText}>
                      Display your company logo from your profile avatar.
                    </p>
                    <button
                      type="button"
                      onClick={handleRefreshLogo}
                      className={styles.secondaryButton}
                      style={{ marginTop: "10px", width: "100%" }}
                    >
                      🔄 Refresh Logo
                    </button>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Quote orientation</label>
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
                    Customise template default content — changes are applied to
                    new quotes only.
                  </p>

                  <div
                    className={styles.infoBox}
                    style={{
                      marginBottom: "20px",
                      backgroundColor: "#f0f9ff",
                      borderLeft: "4px solid #0284c7",
                    }}
                  >
                    <span className={styles.infoIcon}>✨</span>
                    <span>
                      <strong>Live Preview:</strong> All changes appear
                      instantly in the preview on the right. Click{" "}
                      <strong>SAVE</strong> to keep your changes.
                    </span>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Default Document Title</label>
                    <input
                      type="text"
                      value={templateData.document_title}
                      onChange={(e) =>
                        handleInputChange("document_title", e.target.value)
                      }
                      placeholder="Quote"
                    />
                  </div>

                  <div
                    className={`${styles.formGroup} ${styles.formGroupSpaced}`}
                  >
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
                <div className={styles.lineItemsContainer}>
                  <h3>Manage Sections</h3>

                  {(!templateData.sections ||
                    templateData.sections.length === 0) && (
                    <div className={styles.columnControlsSection}>
                      <h4>Column Visibility</h4>
                      <div className={styles.columnControls}>
                        <label className={styles.columnToggle}>
                          <input
                            type="checkbox"
                            checked={templateData.show_section_totals ?? true}
                            onChange={(e) =>
                              handleInputChange(
                                "show_section_totals",
                                e.target.checked,
                              )
                            }
                          />
                          <span className={styles.columnName}>Summary</span>
                          <EyeIcon className={styles.eyeIcon} />
                        </label>
                        <label className={styles.columnToggle}>
                          <input
                            type="checkbox"
                            checked={templateData.show_line_items ?? true}
                            onChange={(e) =>
                              handleInputChange(
                                "show_line_items",
                                e.target.checked,
                              )
                            }
                          />
                          <span className={styles.columnName}>Line Items</span>
                          <EyeIcon className={styles.eyeIcon} />
                        </label>
                        <label className={styles.columnToggle}>
                          <input
                            type="checkbox"
                            checked={templateData.show_line_quantities ?? true}
                            onChange={(e) =>
                              handleInputChange(
                                "show_line_quantities",
                                e.target.checked,
                              )
                            }
                          />
                          <span className={styles.columnName}>Quantity</span>
                          <EyeIcon className={styles.eyeIcon} />
                        </label>
                        <label className={styles.columnToggle}>
                          <input
                            type="checkbox"
                            checked={templateData.show_line_prices ?? true}
                            onChange={(e) =>
                              handleInputChange(
                                "show_line_prices",
                                e.target.checked,
                              )
                            }
                          />
                          <span className={styles.columnName}>Price</span>
                          <EyeIcon className={styles.eyeIcon} />
                        </label>
                        <label className={styles.columnToggle}>
                          <input
                            type="checkbox"
                            checked={templateData.show_line_totals ?? true}
                            onChange={(e) =>
                              handleInputChange(
                                "show_line_totals",
                                e.target.checked,
                              )
                            }
                          />
                          <span className={styles.columnName}>Total</span>
                          <EyeIcon className={styles.eyeIcon} />
                        </label>
                      </div>
                    </div>
                  )}

                  <div className={styles.sectionsSection}>
                    <h4>Sections ({templateData.sections?.length || 0})</h4>
                    {templateData.sections &&
                    templateData.sections.length > 0 ? (
                      <div className={styles.sectionsListWrapper}>
                        {templateData.sections.map((section: any) => (
                          <div key={section.id} className={styles.sectionCard}>
                            <div className={styles.sectionCardHeader}>
                              <div className={styles.sectionInputs}>
                                <input
                                  type="text"
                                  value={section.name || ""}
                                  onChange={(e) => {
                                    const updatedSections =
                                      templateData.sections.map((s: any) =>
                                        s.id === section.id
                                          ? { ...s, name: e.target.value }
                                          : s,
                                      );
                                    handleInputChange(
                                      "sections",
                                      updatedSections,
                                    );
                                  }}
                                  className={styles.sectionTitleInput}
                                  placeholder="Section title (e.g., Labour, Materials)"
                                />
                                <textarea
                                  value={section.description || ""}
                                  onChange={(e) => {
                                    const updatedSections =
                                      templateData.sections.map((s: any) =>
                                        s.id === section.id
                                          ? {
                                              ...s,
                                              description: e.target.value,
                                            }
                                          : s,
                                      );
                                    handleInputChange(
                                      "sections",
                                      updatedSections,
                                    );
                                  }}
                                  className={styles.sectionDescInput}
                                  placeholder="Section description (optional)"
                                  rows={2}
                                />
                              </div>
                              <button
                                className={styles.removeSectionButton}
                                onClick={() => {
                                  const updatedSections =
                                    templateData.sections.filter(
                                      (s: any) => s.id !== section.id,
                                    );
                                  handleInputChange(
                                    "sections",
                                    updatedSections,
                                  );
                                }}
                                title="Remove section"
                                type="button"
                              >
                                ✕
                              </button>
                            </div>

                            {section.items && section.items.length > 0 && (
                              <div className={styles.sectionItems}>
                                <p className={styles.itemsLabel}>
                                  Items ({section.items.length})
                                </p>
                                {section.items.map((item: any, idx: number) => (
                                  <div key={idx} className={styles.itemRow}>
                                    <div className={styles.itemTopRow}>
                                      <div className={styles.itemFieldWide}>
                                        <label className={styles.itemLabel}>
                                          Item Name
                                        </label>
                                        <input
                                          type="text"
                                          value={item.name || ""}
                                          onChange={(e) => {
                                            const updatedSections =
                                              templateData.sections.map(
                                                (s: any) =>
                                                  s.id === section.id
                                                    ? {
                                                        ...s,
                                                        items: s.items.map(
                                                          (
                                                            it: any,
                                                            i: number,
                                                          ) =>
                                                            i === idx
                                                              ? {
                                                                  ...it,
                                                                  name: e.target
                                                                    .value,
                                                                }
                                                              : it,
                                                        ),
                                                      }
                                                    : s,
                                              );
                                            handleInputChange(
                                              "sections",
                                              updatedSections,
                                            );
                                          }}
                                          placeholder="Item name"
                                          className={styles.itemInput}
                                        />
                                      </div>
                                      <div className={styles.itemActions}>
                                        <button
                                          onClick={() => {
                                            const updatedSections =
                                              templateData.sections.map(
                                                (s: any) =>
                                                  s.id === section.id
                                                    ? {
                                                        ...s,
                                                        items: s.items.filter(
                                                          (_: any, i: number) =>
                                                            i !== idx,
                                                        ),
                                                      }
                                                    : s,
                                              );
                                            handleInputChange(
                                              "sections",
                                              updatedSections,
                                            );
                                          }}
                                          className={styles.itemRemoveButton}
                                          type="button"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    </div>
                                    <div className={styles.itemBottomRow}>
                                      <div className={styles.itemField}>
                                        <label className={styles.itemLabel}>
                                          Qty
                                        </label>
                                        <input
                                          type="number"
                                          value={item.quantity || 1}
                                          onChange={(e) => {
                                            const updatedSections =
                                              templateData.sections.map(
                                                (s: any) =>
                                                  s.id === section.id
                                                    ? {
                                                        ...s,
                                                        items: s.items.map(
                                                          (
                                                            it: any,
                                                            i: number,
                                                          ) =>
                                                            i === idx
                                                              ? {
                                                                  ...it,
                                                                  quantity:
                                                                    parseFloat(
                                                                      e.target
                                                                        .value,
                                                                    ) || 1,
                                                                }
                                                              : it,
                                                        ),
                                                      }
                                                    : s,
                                              );
                                            handleInputChange(
                                              "sections",
                                              updatedSections,
                                            );
                                          }}
                                          placeholder="Qty"
                                          className={styles.itemInput}
                                        />
                                      </div>
                                      <div className={styles.itemField}>
                                        <label className={styles.itemLabel}>
                                          Price
                                        </label>
                                        <input
                                          type="number"
                                          value={item.price || 0}
                                          onChange={(e) => {
                                            const updatedSections =
                                              templateData.sections.map(
                                                (s: any) =>
                                                  s.id === section.id
                                                    ? {
                                                        ...s,
                                                        items: s.items.map(
                                                          (
                                                            it: any,
                                                            i: number,
                                                          ) =>
                                                            i === idx
                                                              ? {
                                                                  ...it,
                                                                  price:
                                                                    parseFloat(
                                                                      e.target
                                                                        .value,
                                                                    ) || 0,
                                                                }
                                                              : it,
                                                        ),
                                                      }
                                                    : s,
                                              );
                                            handleInputChange(
                                              "sections",
                                              updatedSections,
                                            );
                                          }}
                                          placeholder="Price"
                                          className={styles.itemInput}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            <button
                              className={styles.addLineItemBtn}
                              onClick={() => handleAddLineItem(section.id)}
                              type="button"
                            >
                              + Add a line item
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className={styles.noSectionsMsg}>
                        No sections yet. Create your first section below.
                      </p>
                    )}
                  </div>

                  <button
                    className={styles.addNewSectionBtn}
                    onClick={handleAddSection}
                    type="button"
                  >
                    + Add New Section
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Preview */}
          <div className={styles.previewPanel} ref={previewPanelRef}>
            <div
              className={styles.previewContainer}
              style={{
                width: (templateData.orientation === "landscape" ? 842 : 595) * previewScale,
                height: naturalPreviewH * previewScale,
              }}
            >
              <div
                className={`${styles.invoicePreview} ${
                  templateData.orientation === "landscape"
                    ? styles.landscapeOrientation
                    : ""
                }`}
                ref={previewRef}
                style={{
                  ...({
                    "--template-font-size": previewFontSize,
                    "--highlight-color": templateData.highlight_color,
                    transform: `scale(${previewScale})`,
                    transformOrigin: "top left",
                  } as React.CSSProperties),
                }}
              >
                {/* Company Header */}
                <div
                  className={styles.invoiceHeader}
                  style={{
                    backgroundColor: templateData.header_background_color,
                    borderBottom: `${templateData.border_width} solid ${templateData.border_color}`,
                    padding: "20px",
                  }}
                >
                  {templateData.show_company_logo &&
                    companyData?.logo_url &&
                    companyData.logo_url.trim() !== "" && (
                      <div className={styles.companyLogo}>
                        <img
                          src={companyData.logo_url}
                          alt="Company logo"
                          style={{
                            maxWidth: "150px",
                            maxHeight: "100px",
                            objectFit: "contain",
                          }}
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.parentElement!.style.display = "none";
                          }}
                        />
                      </div>
                    )}
                  {templateData.show_company_logo &&
                    (!companyData?.logo_url ||
                      companyData.logo_url.trim() === "") && (
                      <div className={styles.companyLogoPlaceholder}>
                        <div
                          className={styles.logoInitials}
                          style={{ color: templateData.main_color }}
                        >
                          {companyData?.business_name
                            ?.charAt(0)
                            ?.toUpperCase() || "CO"}
                        </div>
                      </div>
                    )}
                  <div
                    className={styles.companyDetails}
                    style={{
                      color: templateData.text_color,
                      backgroundColor: templateData.highlight_color,
                      padding: "16px",
                    }}
                  >
                    <h3
                      style={{
                        color: templateData.text_color,
                        fontSize: "1.1rem",
                        fontWeight: "bold",
                        marginTop: "0",
                      }}
                    >
                      {companyData?.business_name || "Your Company"}
                    </h3>
                    <p style={{ color: templateData.text_color }}>
                      {companyData?.company_address || "5a Harmeet Close"}
                    </p>
                    <p style={{ color: templateData.text_color }}>
                      {companyData?.company_city
                        ? `${companyData.company_city}, ${companyData.company_state || ""} ${companyData.company_postal_code || ""}`
                        : "Mulgrave, 3170"}
                    </p>
                    <p style={{ color: templateData.text_color }}>
                      {companyData?.company_email || "info@company.com"}
                    </p>
                    <p style={{ color: templateData.text_color }}>
                      {companyData?.company_phone || "1300 303 750"}
                    </p>
                  </div>
                </div>

                {/* Quote Details */}
                <div className={styles.invoiceInfo}>
                  <div className={styles.customerInfo}>
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
                    <p>Sample Customer</p>
                    <p>456 Job Site Road</p>
                    <p>Mulgrave VIC 3170</p>
                  </div>
                  <div className={styles.invoiceNumbers}>
                    <p>
                      <strong>Quote number:</strong> QUO-DRAFT
                    </p>
                    <p>
                      <strong>Job number:</strong> 123455
                    </p>
                    <p>
                      <strong>Quote Date:</strong> {new Date().toDateString()}
                    </p>
                    <p>
                      <strong>Valid Until:</strong>{" "}
                      {new Date(
                        Date.now() + 14 * 24 * 60 * 60 * 1000,
                      ).toDateString()}
                    </p>
                    <p>
                      <strong>ABN:</strong>{" "}
                      {companyData?.abn || "33 118 605 451"}
                    </p>
                  </div>
                </div>

                {/* Title */}
                <h2
                  className={styles.invoiceTitle}
                  style={{ color: templateData.main_color }}
                >
                  {templateData.document_title} |{" "}
                  <span style={{ color: "#999" }}>QUO-DRAFT</span>
                </h2>

                {/* Description */}
                <div
                  className={styles.invoiceDescription}
                  style={{
                    backgroundColor: templateData.highlight_color,
                    borderLeftColor: templateData.description_border_color,
                    color: templateData.description_text_color,
                  }}
                >
                  {templateData.default_description}
                </div>

                {/* Line Items */}
                <div className={styles.invoiceSection}>
                  <h3 style={{ color: templateData.main_color }}>
                    Example Section
                  </h3>
                  <p className={styles.sectionDescription}>
                    Example Section Description
                  </p>

                  {templateData.show_line_items && (
                    <>
                      <table className={styles.invoiceTable}>
                        <thead>
                          <tr>
                            <th
                              style={{
                                color: templateData.table_header_text_color,
                                padding: "12px 16px",
                                fontWeight: "700",
                                backgroundColor:
                                  templateData.table_header_background_color ||
                                  templateData.main_color,
                              }}
                            >
                              Item Name
                            </th>
                            {templateData.show_line_quantities && (
                              <th
                                style={{
                                  color: templateData.table_header_text_color,
                                  padding: "12px 16px",
                                  fontWeight: "700",
                                  backgroundColor:
                                    templateData.table_header_background_color ||
                                    templateData.main_color,
                                }}
                              >
                                Quantity
                              </th>
                            )}
                            {templateData.show_line_prices && (
                              <th
                                style={{
                                  color: templateData.table_header_text_color,
                                  padding: "12px 16px",
                                  fontWeight: "700",
                                  backgroundColor:
                                    templateData.table_header_background_color ||
                                    templateData.main_color,
                                }}
                              >
                                Price
                              </th>
                            )}
                            {templateData.show_line_totals && (
                              <th
                                style={{
                                  color: templateData.table_header_text_color,
                                  padding: "12px 16px",
                                  fontWeight: "700",
                                  backgroundColor:
                                    templateData.table_header_background_color ||
                                    templateData.main_color,
                                }}
                              >
                                Total
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody style={{ color: templateData.text_color }}>
                          <tr>
                            <td style={{ padding: "10px 16px" }}></td>
                            {templateData.show_line_quantities && (
                              <td style={{ padding: "10px 16px" }}>1.00</td>
                            )}
                            {templateData.show_line_prices && (
                              <td style={{ padding: "10px 16px" }}>$100.00</td>
                            )}
                            {templateData.show_line_totals && (
                              <td style={{ padding: "10px 16px" }}>$100.00</td>
                            )}
                          </tr>
                          {templateData.sections &&
                            templateData.sections.length > 0 && (
                              <>
                                {templateData.sections.map(
                                  (section: any) =>
                                    section.items &&
                                    section.items.length > 0 && (
                                      <React.Fragment key={section.id}>
                                        <tr
                                          style={{
                                            fontWeight: "600",
                                            color: templateData.main_color,
                                          }}
                                        >
                                          <td
                                            colSpan={4}
                                            style={{
                                              padding: "10px 16px",
                                              backgroundColor:
                                                templateData.highlight_color,
                                            }}
                                          >
                                            {section.name}
                                          </td>
                                        </tr>
                                        {section.items.map(
                                          (item: any, idx: number) => (
                                            <tr
                                              key={idx}
                                              style={{
                                                backgroundColor:
                                                  idx % 2 === 1
                                                    ? templateData.highlight_color
                                                    : "transparent",
                                              }}
                                            >
                                              <td
                                                style={{ padding: "10px 16px" }}
                                              >
                                                {item.name || item.description}
                                              </td>
                                              {templateData.show_line_quantities && (
                                                <td
                                                  style={{
                                                    padding: "10px 16px",
                                                  }}
                                                >
                                                  {item.quantity || 1}
                                                </td>
                                              )}
                                              {templateData.show_line_prices && (
                                                <td
                                                  style={{
                                                    padding: "10px 16px",
                                                  }}
                                                >
                                                  $
                                                  {(item.price || 0).toFixed(2)}
                                                </td>
                                              )}
                                              {templateData.show_line_totals && (
                                                <td
                                                  style={{
                                                    padding: "10px 16px",
                                                  }}
                                                >
                                                  $
                                                  {(
                                                    (item.quantity || 1) *
                                                    (item.price || 0)
                                                  ).toFixed(2)}
                                                </td>
                                              )}
                                            </tr>
                                          ),
                                        )}
                                      </React.Fragment>
                                    ),
                                )}
                              </>
                            )}
                        </tbody>
                      </table>
                      <div
                        style={{
                          borderBottom: `${templateData.border_width} solid ${templateData.border_color}`,
                          marginBottom: "20px",
                        }}
                      />
                    </>
                  )}
                </div>

                {/* Totals */}
                {templateData.show_section_totals && (
                  <div
                    className={styles.invoiceTotals}
                    style={{
                      backgroundColor: templateData.highlight_color,
                      border: `${templateData.border_width} solid ${templateData.border_color}`,
                      borderRadius: "10px",
                      color: templateData.text_color,
                      boxShadow: "0 2px 8px rgba(251,191,36,0.08)",
                      padding: "18px 22px",
                      maxWidth: "280px",
                    }}
                  >
                    <div className={styles.totalRow}>
                      <span>Subtotal</span>
                      <span>$100.00</span>
                    </div>
                    <div className={styles.totalRow}>
                      <span>Tax Amount</span>
                      <span>$15.00</span>
                    </div>
                    <div
                      className={styles.totalRow}
                      style={{
                        borderTop: `${Math.max(previewBorderWidth, 2)}px solid ${templateData.main_color}`,
                        color: templateData.main_color,
                        paddingTop: "16px",
                        marginTop: "12px",
                        fontWeight: 800,
                        fontSize: "1.15em",
                      }}
                    >
                      <strong>Total</strong>
                      <strong>$115.00</strong>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div
                  className={styles.invoiceFooter}
                  style={{
                    borderTopColor: templateData.border_color,
                    borderTopWidth: templateData.border_width,
                  }}
                >
                  {templateData.default_footer}
                  <p className={styles.footerDetails}>
                    <small>Quote number: QUO-DRAFT</small>
                  </p>
                  <p className={styles.pageNumber}>
                    <small>Page 1 / 1</small>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default QuoteTemplateEditor;
