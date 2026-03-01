import styles from "./Toast.module.css";

type Props = {
  message: string;
  type?: "success" | "error";
  onClose?: () => void;
};

export default function Toast({ message, type = "success", onClose }: Props) {
  return (
    <div className={`${styles.toast} ${type === "error" ? styles.toastError : ""}`}>
      <span className={styles.icon}>{type === "error" ? "✕" : "✓"}</span>
      {message}
      {onClose && (
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          ×
        </button>
      )}
    </div>
  );
}
