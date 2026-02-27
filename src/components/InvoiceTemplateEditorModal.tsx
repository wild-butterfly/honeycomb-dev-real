import React, { useEffect } from "react";
import InvoiceTemplateEditor from "../pages/InvoiceTemplateEditor";
import styles from "./InvoiceTemplateEditorModal.module.css";

interface InvoiceTemplateEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateId?: number | null;
  onSave?: () => void;
}

const InvoiceTemplateEditorModal: React.FC<InvoiceTemplateEditorModalProps> = ({
  isOpen,
  onClose,
  templateId,
  onSave,
}) => {
  // Add body class when modal is open to hide sidebar
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("invoice-modal-open");
    } else {
      document.body.classList.remove("invoice-modal-open");
    }

    return () => {
      document.body.classList.remove("invoice-modal-open");
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
          <InvoiceTemplateEditor
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

export default InvoiceTemplateEditorModal;
