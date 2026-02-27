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

interface InvoiceTemplateEditorProps {
  isModal?: boolean;
  onClose?: () => void;
  templateId?: number | null;
  onSave?: () => void;
  companyId?: number | null;
}

const InvoiceTemplateEditor: React.FC<InvoiceTemplateEditorProps> = ({
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
    name: "Invoice Template 1",
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
    // Keep description background in sync with highlight by default
    description_background_color: "#fafafa",
    description_border_color: "#fbbf24",
    description_text_color: "#374151",
    table_header_style: "solid",
    indent_customer_address: false,
    orientation: "portrait",
    show_company_logo: true,
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

      const response = await fetch(
        `${API_BASE}/invoice-templates/preview-pdf`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(impersonateCompany
              ? { "X-Company-Id": impersonateCompany }
              : {}),
          },
          body: JSON.stringify({
            template: templateData,
            company: companyData,
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to generate preview PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "invoice-template-preview.pdf";
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
      if (!companyId) {
        console.warn("⚠️ Waiting for companyId to load...");
        return;
      }

      try {
        setLoading(true);

        // Set user logo from auth context - ensure it's available
        let avatarUrl = "";
        if (user?.avatar) {
          avatarUrl = user.avatar;
          console.log("User avatar URL:", avatarUrl);
          setUserLogo(avatarUrl);
        } else {
          console.log("No user avatar available in auth context");
        }

        // Load company data from general settings
        const generalSettings = await api.get<any>(
          `/general-settings/${companyId}`,
        );
        if (generalSettings?.settings) {
          // Use company logo from general settings only
          const logoUrl = generalSettings.settings.logo_url || "";
          console.log("Company logo URL from settings:", logoUrl);
          console.log("Full general settings:", generalSettings.settings);

          const newCompanyData: CompanyData = {
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
          };

          console.log(
            "Setting companyData with logo_url:",
            newCompanyData.logo_url,
          );
          setCompanyData(newCompanyData);
        }

        // Load existing template if editing
        if (currentTemplateId) {
          console.log("Loading template:", currentTemplateId);
          const template = await api.get<TemplateData>(
            `/invoice-templates/template/${currentTemplateId}`,
          );
          if (template) {
            console.log("Loaded template data:", template);
            console.log("Loaded sections:", template.sections);
            console.log("Loaded name:", template.name);

            // Validate that template has required fields
            if (!template.name) {
              console.warn(
                "⚠️ Template loaded but name is missing, using default",
              );
              template.name = "Invoice Template 1";
            }

            // DEBUG: Log individual visibility columns as received
            console.log("=== VISIBILITY COLUMNS AS RECEIVED ===");
            console.log(
              "show_company_logo:",
              template.show_company_logo,
              "type:",
              typeof template.show_company_logo,
            );
            console.log(
              "show_line_items:",
              template.show_line_items,
              "type:",
              typeof template.show_line_items,
            );
            console.log(
              "show_line_quantities:",
              template.show_line_quantities,
              "type:",
              typeof template.show_line_quantities,
            );
            console.log(
              "show_line_prices:",
              template.show_line_prices,
              "type:",
              typeof template.show_line_prices,
            );
            console.log(
              "show_line_totals:",
              template.show_line_totals,
              "type:",
              typeof template.show_line_totals,
            );
            console.log(
              "show_section_totals:",
              template.show_section_totals,
              "type:",
              typeof template.show_section_totals,
            );
            console.log(
              "show_labour_items:",
              template.show_labour_items,
              "type:",
              typeof template.show_labour_items,
            );
            console.log(
              "show_labour_quantities:",
              template.show_labour_quantities,
              "type:",
              typeof template.show_labour_quantities,
            );
            console.log(
              "show_labour_prices:",
              template.show_labour_prices,
              "type:",
              typeof template.show_labour_prices,
            );
            console.log(
              "show_labour_totals:",
              template.show_labour_totals,
              "type:",
              typeof template.show_labour_totals,
            );
            console.log(
              "show_labour_section_totals:",
              template.show_labour_section_totals,
              "type:",
              typeof template.show_labour_section_totals,
            );
            console.log(
              "show_material_items:",
              template.show_material_items,
              "type:",
              typeof template.show_material_items,
            );
            console.log(
              "show_material_quantities:",
              template.show_material_quantities,
              "type:",
              typeof template.show_material_quantities,
            );
            console.log(
              "show_material_prices:",
              template.show_material_prices,
              "type:",
              typeof template.show_material_prices,
            );
            console.log(
              "show_material_totals:",
              template.show_material_totals,
              "type:",
              typeof template.show_material_totals,
            );
            console.log(
              "show_material_section_totals:",
              template.show_material_section_totals,
              "type:",
              typeof template.show_material_section_totals,
            );

            // Ensure all visibility columns default to true if they're undefined/null
            const templateWithDefaults: TemplateData = {
              ...template,
              // Ensure name is always set to a non-empty string
              name:
                template.name && template.name.trim()
                  ? template.name
                  : "Invoice Template 1",
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

            console.log("=== VISIBILITY COLUMNS AFTER DEFAULTS ===");
            console.log(
              "show_line_items (final):",
              templateWithDefaults.show_line_items,
            );
            console.log("Template with defaults:", templateWithDefaults);
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
      console.error("❌ Cannot save: companyId is not available");
      setMessage({
        type: "error",
        text: "Error: Company information not loaded. Please refresh the page.",
      });
      return;
    }

    try {
      setSaving(true);

      // Ensure sections is properly formatted - MUST include sections in payload
      const sectionsToSave = Array.isArray(templateData.sections)
        ? templateData.sections
        : [];

      console.log("=== DEBUGGING SECTIONS ===");
      console.log("templateData.sections:", templateData.sections);
      console.log("templateData.sections type:", typeof templateData.sections);
      console.log(
        "templateData.sections is array?",
        Array.isArray(templateData.sections),
      );
      console.log("sectionsToSave:", sectionsToSave);
      console.log("sectionsToSave length:", sectionsToSave.length);

      const payload = {
        ...templateData,
        company_id: companyId,
        sections: sectionsToSave,
      };

      console.log("=== SAVE START ===");
      console.log("Template name:", payload.name);
      console.log("Sections count:", payload.sections.length);
      console.log("Sections data:", payload.sections);
      console.log("show_company_logo:", payload.show_company_logo);
      console.log("=== VISIBILITY COLUMNS BEING SENT ===");
      console.log(
        "show_line_items:",
        payload.show_line_items,
        "type:",
        typeof payload.show_line_items,
      );
      console.log(
        "show_line_quantities:",
        payload.show_line_quantities,
        "type:",
        typeof payload.show_line_quantities,
      );
      console.log(
        "show_line_prices:",
        payload.show_line_prices,
        "type:",
        typeof payload.show_line_prices,
      );
      console.log(
        "show_line_totals:",
        payload.show_line_totals,
        "type:",
        typeof payload.show_line_totals,
      );
      console.log(
        "show_section_totals:",
        payload.show_section_totals,
        "type:",
        typeof payload.show_section_totals,
      );
      console.log(
        "show_labour_items:",
        payload.show_labour_items,
        "type:",
        typeof payload.show_labour_items,
      );
      console.log(
        "show_labour_quantities:",
        payload.show_labour_quantities,
        "type:",
        typeof payload.show_labour_quantities,
      );
      console.log(
        "show_labour_prices:",
        payload.show_labour_prices,
        "type:",
        typeof payload.show_labour_prices,
      );
      console.log(
        "show_labour_totals:",
        payload.show_labour_totals,
        "type:",
        typeof payload.show_labour_totals,
      );
      console.log(
        "show_labour_section_totals:",
        payload.show_labour_section_totals,
        "type:",
        typeof payload.show_labour_section_totals,
      );
      console.log(
        "show_material_items:",
        payload.show_material_items,
        "type:",
        typeof payload.show_material_items,
      );
      console.log(
        "show_material_quantities:",
        payload.show_material_quantities,
        "type:",
        typeof payload.show_material_quantities,
      );
      console.log(
        "show_material_prices:",
        payload.show_material_prices,
        "type:",
        typeof payload.show_material_prices,
      );
      console.log(
        "show_material_totals:",
        payload.show_material_totals,
        "type:",
        typeof payload.show_material_totals,
      );
      console.log(
        "show_material_section_totals:",
        payload.show_material_section_totals,
        "type:",
        typeof payload.show_material_section_totals,
      );
      console.log("Full payload keys:", Object.keys(payload));
      console.log("Saving template payload:", JSON.stringify(payload, null, 2));

      let result;
      if (currentTemplateId) {
        console.log("Updating existing template:", currentTemplateId);
        result = await api.put<TemplateData>(
          `/invoice-templates/${currentTemplateId}`,
          payload,
        );
      } else {
        console.log("Creating new template");
        result = await api.post<TemplateData>("/invoice-templates", payload);
      }

      console.log("=== SAVE RESULT ===");
      console.log("Result:", result);
      console.log("Result sections:", result?.sections);
      console.log("Result sections type:", typeof result?.sections);
      console.log("=== VISIBILITY COLUMNS IN RESULT ===");
      console.log(
        "result.show_line_items:",
        result?.show_line_items,
        "type:",
        typeof result?.show_line_items,
      );
      console.log(
        "result.show_line_quantities:",
        result?.show_line_quantities,
        "type:",
        typeof result?.show_line_quantities,
      );
      console.log(
        "result.show_line_prices:",
        result?.show_line_prices,
        "type:",
        typeof result?.show_line_prices,
      );
      console.log(
        "result.show_line_totals:",
        result?.show_line_totals,
        "type:",
        typeof result?.show_line_totals,
      );
      console.log(
        "result.show_section_totals:",
        result?.show_section_totals,
        "type:",
        typeof result?.show_section_totals,
      );
      console.log("Save complete");

      if (result) {
        // Update template data with the result to ensure all fields are preserved
        console.log("Updating templateData with result");
        console.log(
          "Result has sections?",
          !!result.sections,
          "Sections:",
          result.sections,
        );
        console.log("Result keys:", Object.keys(result || {}));

        // Ensure we don't lose any fields - merge with current state
        const resultSections = Array.isArray(result.sections)
          ? result.sections
          : typeof result.sections === "string"
            ? JSON.parse(result.sections)
            : [];

        const updatedTemplate: TemplateData = {
          ...templateData,
          ...result,
          // Explicitly preserve arrays and objects
          sections: resultSections || templateData.sections || [],
        };

        console.log("Updated template sections:", updatedTemplate.sections);
        console.log("Updated template name:", updatedTemplate.name);

        setTemplateData(updatedTemplate);

        // Reload company data to ensure logo is preserved
        console.log("Reloading company data after save");
        try {
          const generalSettings = await api.get<any>(
            `/general-settings/${companyId}`,
          );
          if (generalSettings?.settings) {
            const logoUrl = generalSettings.settings.logo_url || "";
            console.log("Reloaded logo URL after save:", logoUrl);
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

        // Auto-dismiss success message after 3 seconds
        setTimeout(() => {
          setMessage(null);
        }, 3000);

        // Update template ID if newly created
        if (!currentTemplateId && result.id) {
          console.log("New template created with ID:", result.id);
          setCurrentTemplateId(result.id.toString());
        }

        // Keep modal open for continued editing
        if (!isModal) {
          // In full page mode, navigate back after a short delay
          setTimeout(() => {
            navigate("/dashboard/settings?tab=invoice-settings");
          }, 1500);
        } else {
          // In modal mode, call the callback if provided
          if (onSaveCallback) {
            onSaveCallback();
          }
        }
      }
    } catch (error: any) {
      console.error("Error saving template:", error);

      // Check for specific database constraint errors
      let errorMessage = "Failed to save template";
      if (
        error.message &&
        (error.message.includes("null value in column") ||
          error.message.includes("violates not-null constraint"))
      ) {
        errorMessage = "Template already saved - no changes since last save";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setMessage({
        type: "error",
        text: errorMessage,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (isModal && onClose) {
      onClose();
    } else {
      navigate("/dashboard/settings?tab=invoice-settings");
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

    // Validate that we have all required fields, especially name
    if (!templateData.name || templateData.name.trim() === "") {
      setMessage({
        type: "error",
        text: "Template name is missing. Please save the template first.",
      });
      return;
    }

    try {
      const payload = {
        ...templateData,
        company_id: companyId,
        is_default: true,
      };

      console.log("=== SETTING AS DEFAULT ===");
      console.log("Template ID:", currentTemplateId);
      console.log(
        "Current templateData.name:",
        templateData.name,
        "| Type:",
        typeof templateData.name,
      );
      console.log(
        "Template name in payload:",
        payload.name,
        "| Type:",
        typeof payload.name,
      );
      console.log("Company ID:", payload.company_id);
      console.log("Full payload keys:", Object.keys(payload));
      console.log("Full payload:", payload);

      const result = await api.put<TemplateData>(
        `/invoice-templates/${currentTemplateId}`,
        payload,
      );

      if (result) {
        setTemplateData((prev) => ({ ...prev, is_default: true }));

        // Reload company data to ensure logo is preserved
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
          console.error("Error reloading company data:", error);
        }

        setMessage({ type: "success", text: "Set as default successfully!" });

        // Auto-dismiss success message
        setTimeout(() => {
          setMessage(null);
        }, 3000);
      }
    } catch (error: any) {
      console.error("Error setting as default:", error);

      let errorMessage = "Failed to set as default";
      if (
        error.message &&
        (error.message.includes("null value") ||
          error.message.includes("violates not-null"))
      ) {
        errorMessage =
          "Template must be saved with all required fields before setting as default";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setMessage({ type: "error", text: errorMessage });
    }
  };

  const handleRefreshLogo = async () => {
    if (!companyId) return;

    try {
      // Reload company data and user avatar
      const generalSettings = await api.get<any>(
        `/general-settings/${companyId}`,
      );

      let avatarUrl = "";
      if (user?.avatar) {
        avatarUrl = user.avatar;
        setUserLogo(avatarUrl);
      }

      if (generalSettings?.settings) {
        const logoUrl = avatarUrl || generalSettings.settings.logo_url || "";
        console.log("Logo refreshed:", logoUrl);

        setCompanyData((prev) =>
          prev
            ? {
                ...prev,
                logo_url: logoUrl,
              }
            : null,
        );
      }

      setMessage({
        type: "success",
        text: "Logo refreshed! Check the preview.",
      });
    } catch (error) {
      console.error("Error refreshing logo:", error);
      setMessage({
        type: "error",
        text: "Failed to refresh logo",
      });
    }
  };

  if (loading) {
    return <div className={styles.container}>Loading...</div>;
  }

  const tableHeaderGradientColor =
    templateData.table_header_gradient_color || templateData.main_color;
  const previewFontSize =
    templateData.font_size === "small"
      ? "0.85rem"
      : templateData.font_size === "large"
        ? "1.1rem"
        : "1rem";

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
              Set as default invoice
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
                    Customise templates default styling - changes are applied to
                    new documents only.
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

                  {/* Description background now follows Highlight Colour picker */}

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
                    <p
                      className={styles.helpText}
                      style={{
                        marginTop: "10px",
                        fontSize: "12px",
                        color: "#666",
                      }}
                    >
                      Click to reload your latest profile avatar. Changes appear
                      immediately in the preview on the right.
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

                  {/* Live Preview Notice */}
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
                      placeholder="Tax Invoice"
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

                  {/* Column Visibility Controls */}
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

                  {/* Sections List */}
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

                            {/* Items in Section */}
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

                            {/* Add Line Item Button */}
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

                  {/* Add New Section Button */}
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
                            filter: blackWhiteMode ? "grayscale(1)" : "none",
                          }}
                          onError={(e) => {
                            console.log(
                              "Logo failed to load:",
                              companyData?.logo_url,
                            );
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
                    <p style={{ color: templateData.text_color }}>Victoria</p>
                    <p style={{ color: templateData.text_color }}>
                      {companyData?.company_email || "info@company.com"}
                    </p>
                    <p style={{ color: templateData.text_color }}>
                      {companyData?.company_phone || "1300 303 750"}
                    </p>
                  </div>
                </div>

                {/* Invoice Details */}
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
                      <strong>ABN:</strong> 33118605451
                    </p>
                  </div>
                </div>

                {/* Title */}
                <h2
                  className={styles.invoiceTitle}
                  style={{ color: templateData.main_color }}
                >
                  {templateData.document_title} |{" "}
                  <span style={{ color: "#999" }}>INV-DRAFT</span>
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
                      borderColor: templateData.border_color,
                      borderWidth: templateData.border_width,
                      backgroundColor: templateData.highlight_color,
                      color: templateData.text_color,
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
                        borderTop: `${Math.max(parseInt(templateData.border_width), 2)}px solid ${templateData.main_color}`,
                        color: templateData.main_color,
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
                    <small>
                      BSB Number: 013 231 Bank Account: 1078 53001 Invoice
                      number: INV-DRAFT
                    </small>
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

export default InvoiceTemplateEditor;
