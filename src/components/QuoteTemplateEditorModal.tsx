import React, { useEffect } from "react";
import QuoteTemplateEditor from "../pages/QuoteTemplateEditor";
import styles from "./InvoiceTemplateEditorModal.module.css";

interface QuoteTemplateEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateId?: number | null;
  onSave?: () => void;
}

const QuoteTemplateEditorModal: React.FC<QuoteTemplateEditorModalProps> = ({
  isOpen,
  onClose,
  templateId,
  onSave,
}) => {
  // Add body class when modal is open to hide sidebar
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("quote-modal-open");
    } else {
      document.body.classList.remove("quote-modal-open");
    }

    return () => {
      document.body.classList.remove("quote-modal-open");
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button className={styles.closeButton} onClick={onClose}>
          ×
        </button>
        <div className={styles.editorWrapper}>
          <QuoteTemplateEditor
            isModal={true}
            onClose={onClose}
            templateId={templateId}
            onSave={onSave}
          />
        </div>
      </div>
    </div>
  );
};

export default QuoteTemplateEditorModal;
