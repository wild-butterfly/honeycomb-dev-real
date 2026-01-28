import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import styles from "./ConfirmModal.module.css";

interface ConfirmModalProps {
  title: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}) => {
  return (
    <div className={styles.confirmOverlay}>
      <div className={styles.confirmModal}>
        <div className={styles.confirmIcon}>
          <ExclamationTriangleIcon width={26} height={26} />
        </div>

        <h4 className={styles.confirmTitle}>{title}</h4>

        <p className={styles.confirmText}>{description}</p>

        <div className={styles.confirmActions}>
          <button className={styles.confirmCancel} onClick={onCancel}>
            {cancelText}
          </button>

          <button className={styles.confirmDanger} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
