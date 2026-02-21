import React from "react";
import { InvoiceLineItem } from "../types/invoice";
import { FiTrash2 } from "react-icons/fi";
import styles from "./InvoiceLineItemComponent.module.css";

interface InvoiceLineItemComponentProps {
  item: InvoiceLineItem;
  onUpdate: (itemId: string, field: keyof InvoiceLineItem, value: any) => void;
  onRemove: (itemId: string) => void;
}

const InvoiceLineItemComponent: React.FC<InvoiceLineItemComponentProps> = ({
  item,
  onUpdate,
  onRemove,
}) => {
  return (
    <div className={styles.lineItem}>
      <input
        type="text"
        className={styles.inputName}
        value={item.name}
        onChange={(e) => onUpdate(item.id, "name", e.target.value)}
        placeholder="Item name"
      />
      <input
        type="number"
        className={styles.inputNum}
        value={item.quantity}
        onChange={(e) =>
          onUpdate(item.id, "quantity", parseFloat(e.target.value) || 0)
        }
        min="0"
        step="0.01"
      />
      <input
        type="number"
        className={styles.inputNum}
        value={item.cost}
        onChange={(e) =>
          onUpdate(item.id, "cost", parseFloat(e.target.value) || 0)
        }
        min="0"
        step="0.01"
      />
      <input
        type="number"
        className={styles.inputNum}
        value={item.price}
        onChange={(e) =>
          onUpdate(item.id, "price", parseFloat(e.target.value) || 0)
        }
        min="0"
        step="0.01"
      />
      <div className={styles.percentageCell}>
        <input
          type="number"
          className={styles.inputPercent}
          value={item.markup}
          onChange={(e) =>
            onUpdate(item.id, "markup", parseFloat(e.target.value) || 0)
          }
          min="0"
          step="0.1"
        />
        <span className={styles.percentSymbol}>%</span>
      </div>
      <div className={styles.percentageCell}>
        <input
          type="number"
          className={styles.inputPercent}
          value={item.tax}
          onChange={(e) =>
            onUpdate(item.id, "tax", parseFloat(e.target.value) || 0)
          }
          min="0"
          step="0.1"
        />
        <span className={styles.percentSymbol}>%</span>
      </div>
      <div className={styles.percentageCell}>
        <input
          type="number"
          className={styles.inputPercent}
          value={item.discount}
          onChange={(e) =>
            onUpdate(item.id, "discount", parseFloat(e.target.value) || 0)
          }
          min="0"
          step="0.1"
        />
        <span className={styles.percentSymbol}>%</span>
      </div>
      <span className={styles.totalDisplay}>${item.total.toFixed(2)}</span>
      <button
        className={styles.removeBtn}
        onClick={() => onRemove(item.id)}
        title="Remove item"
      >
        {FiTrash2({})}
      </button>
    </div>
  );
};

export default InvoiceLineItemComponent;
