import React, { useState } from "react";
import { InvoiceMargins } from "../types/invoice";
import styles from "./InvoiceMarginsDisplay.module.css";

interface InvoiceMarginsDisplayProps {
  margins: InvoiceMargins;
  labourDiscount: number;
  materialDiscount: number;
  materialMarkup: number;
  onApplyLabourDiscount: (discount: number) => void;
  onApplyMaterialDiscount: (discount: number) => void;
  onApplyMaterialMarkup: (markup: number) => void;
}

const InvoiceMarginsDisplay: React.FC<InvoiceMarginsDisplayProps> = ({
  margins,
  labourDiscount,
  materialDiscount,
  materialMarkup,
  onApplyLabourDiscount,
  onApplyMaterialDiscount,
  onApplyMaterialMarkup,
}) => {
  const [tempLabourDiscount, setTempLabourDiscount] = useState(labourDiscount);
  const [tempMaterialDiscount, setTempMaterialDiscount] =
    useState(materialDiscount);
  const [tempMaterialMarkup, setTempMaterialMarkup] = useState(materialMarkup);

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatPercent = (percent: number) => {
    return `${percent.toFixed(0)}%`;
  };

  return (
    <div className={styles.marginsSection}>
      <h2 className={styles.title}>Job Margins</h2>

      <div className={styles.chartContainer}>
        <div className={styles.marginsChart}>
          <div className={styles.chartRow}>
            <div className={styles.chartLabel}>Overall Cost</div>
            <div className={styles.chartBars}>
              <div className={styles.barContainer}>
                <div className={styles.barJob} style={{ width: "100%" }}>
                  {formatCurrency(margins.overallCost)}
                </div>
              </div>
            </div>
          </div>

          <div className={styles.chartRow}>
            <div className={styles.chartLabel}>Charged So Far</div>
            <div className={styles.chartBars}>
              <div className={styles.barContainer}>
                <div
                  className={styles.barInvoice}
                  style={{
                    width: `${(margins.chargedSoFar / margins.overallCost) * 100}%`,
                  }}
                >
                  {formatCurrency(margins.chargedSoFar)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <div className={`${styles.legendColor} ${styles.legendJob}`}></div>
            <span>Job</span>
          </div>
          <div className={styles.legendItem}>
            <div
              className={`${styles.legendColor} ${styles.legendInvoice}`}
            ></div>
            <span>This Invoice</span>
          </div>
        </div>
      </div>

      <div className={styles.grossProfitSection}>
        <h3 className={styles.subtitle}>Gross Profit</h3>
        <div className={styles.profitCards}>
          <div className={styles.profitCard}>
            <div className={styles.profitAmount}>
              {formatCurrency(margins.grossProfit)}
            </div>
            <div className={styles.profitLabel}>
              {formatPercent(margins.grossMargin)} Gross Margin
            </div>
            <div className={styles.profitSubtext}>Current Job</div>
          </div>

          <div className={styles.profitCard}>
            <div className={styles.profitAmount}>
              {formatCurrency(
                margins.grossProfit * (margins.invoiceProgress / 100),
              )}
            </div>
            <div className={styles.profitLabel}>
              {formatPercent(margins.grossMargin)} Gross Margin
            </div>
            <div className={styles.profitSubtext}>Including this Invoice</div>
          </div>
        </div>

        <div className={styles.progressBar}>
          <div className={styles.progressLabel}>Invoice Progress</div>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${margins.invoiceProgress}%` }}
            ></div>
          </div>
          <div className={styles.progressText}>
            {formatPercent(margins.invoiceProgress)}
          </div>
        </div>
      </div>

      <h3 className={styles.subtitle}>Apply Markups And Discounts</h3>

      <div className={styles.discountsGrid}>
        <div className={styles.discountRow}>
          <label className={styles.discountLabel}>Labour Discount</label>
          <div className={styles.discountControl}>
            <input
              type="number"
              className={styles.discountInput}
              value={tempLabourDiscount}
              onChange={(e) =>
                setTempLabourDiscount(parseFloat(e.target.value) || 0)
              }
              min="0"
              max="100"
              step="0.1"
            />
            <span className={styles.percentSymbol}>%</span>
            <button
              className={styles.applyBtn}
              onClick={() => onApplyLabourDiscount(tempLabourDiscount)}
            >
              Apply
            </button>
          </div>
        </div>

        <div className={styles.discountRow}>
          <label className={styles.discountLabel}>Material Discount</label>
          <div className={styles.discountControl}>
            <input
              type="number"
              className={styles.discountInput}
              value={tempMaterialDiscount}
              onChange={(e) =>
                setTempMaterialDiscount(parseFloat(e.target.value) || 0)
              }
              min="0"
              max="100"
              step="0.1"
            />
            <span className={styles.percentSymbol}>%</span>
            <button
              className={styles.applyBtn}
              onClick={() => onApplyMaterialDiscount(tempMaterialDiscount)}
            >
              Apply
            </button>
          </div>
        </div>

        <div className={styles.discountRow}>
          <label className={styles.discountLabel}>Material Markup</label>
          <div className={styles.discountControl}>
            <input
              type="number"
              className={styles.discountInput}
              value={tempMaterialMarkup}
              onChange={(e) =>
                setTempMaterialMarkup(parseFloat(e.target.value) || 0)
              }
              min="0"
              step="0.1"
            />
            <span className={styles.percentSymbol}>%</span>
            <button
              className={styles.applyBtn}
              onClick={() => onApplyMaterialMarkup(tempMaterialMarkup)}
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      <div className={styles.costBreakdown}>
        <table className={styles.breakdownTable}>
          <thead>
            <tr>
              <th></th>
              <th>Cost</th>
              <th>Charge</th>
              <th>Discount</th>
              <th>Total</th>
              <th>Margin</th>
              <th>Profit</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={styles.categoryLabel}>Labour</td>
              <td>{formatCurrency(margins.labourCost)}</td>
              <td>{formatCurrency(margins.labourCharge)}</td>
              <td>{formatCurrency(0)}</td>
              <td>{formatCurrency(margins.labourCharge)}</td>
              <td>
                {formatPercent(
                  ((margins.labourCharge - margins.labourCost) /
                    margins.labourCharge) *
                    100,
                )}
              </td>
              <td>
                {formatCurrency(margins.labourCharge - margins.labourCost)}
              </td>
            </tr>
            <tr>
              <td className={styles.categoryLabel}>Materials</td>
              <td>{formatCurrency(margins.materialCost)}</td>
              <td>{formatCurrency(margins.materialCharge)}</td>
              <td>{formatCurrency(0)}</td>
              <td>{formatCurrency(margins.materialCharge)}</td>
              <td>
                {formatPercent(
                  ((margins.materialCharge - margins.materialCost) /
                    margins.materialCharge) *
                    100,
                )}
              </td>
              <td>
                {formatCurrency(margins.materialCharge - margins.materialCost)}
              </td>
            </tr>
            <tr className={styles.totalRow}>
              <td className={styles.categoryLabel}>Total</td>
              <td>{formatCurrency(margins.totalCost)}</td>
              <td>{formatCurrency(margins.totalCharge)}</td>
              <td>{formatCurrency(0)}</td>
              <td>{formatCurrency(margins.totalCharge)}</td>
              <td>{formatPercent(margins.totalMargin)}</td>
              <td>{formatCurrency(margins.grossProfit)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvoiceMarginsDisplay;
