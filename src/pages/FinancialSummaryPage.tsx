// src/pages/FinancialSummaryPage.tsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import DashboardNavbar from "../components/DashboardNavbar";
import LeftSidebar from "../components/LeftSidebar";
import Footer from "../components/Footer";
import styles from "./FinancialSummaryPage.module.css";

interface FinancialData {
  billableAmount: number;
  invoicedCosts: number;
  uninvoicedCosts: number;
  labourCosts: number;
  materialCosts: number;
  totalCosts: number;
  potentialProfit: number;
  profitMargin: number;
  labourHours: number;
}

const FinancialSummaryPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [financialData, setFinancialData] = useState<FinancialData>({
    billableAmount: 187.5,
    invoicedCosts: 0,
    uninvoicedCosts: 80.0,
    labourCosts: 80.0,
    materialCosts: 0,
    totalCosts: 80.0,
    potentialProfit: 107.5,
    profitMargin: 57.33,
    labourHours: 2.5,
  });

  useEffect(() => {
    // TODO: Fetch financial data from API
    // const data = await apiGet(`/jobs/${jobId}/financial-summary`);
    // setFinancialData(data);
  }, [jobId]);

  const costPercentage =
    (financialData.totalCosts / financialData.billableAmount) * 100;
  const profitPercentage =
    (financialData.potentialProfit / financialData.billableAmount) * 100;

  return (
    <>
      <DashboardNavbar />

      <div className={styles.pageWrapper}>
        <LeftSidebar />

        <div className={styles.main}>
          <div className={styles.pageContainer}>
            {/* Header */}
            <div className={styles.pageHeader}>
              <div>
                <h1 className={styles.pageTitle}>💰 Financial Summary</h1>
                <p className={styles.pageSubtitle}>
                  Track costs, profit margins, and financial health
                </p>
              </div>
              <button className={styles.downloadBtn}>Download CSV</button>
            </div>

            {/* Overall Position */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Overall Position</h2>

              <div className={styles.profitCard}>
                <div className={styles.profitAmount}>
                  <span className={styles.profitLabel}>
                    Current Potential Profit
                  </span>
                  <span className={styles.profitValue}>
                    ${financialData.potentialProfit.toFixed(2)}
                  </span>
                  <span className={styles.profitPercent}>
                    {profitPercentage.toFixed(1)}%
                  </span>
                </div>
                <div className={styles.costAmount}>
                  <span className={styles.costLabel}>Costs Uninvoiced</span>
                  <span className={styles.costValue}>
                    ${financialData.uninvoicedCosts.toFixed(2)}
                  </span>
                  <span className={styles.costPercent}>
                    {costPercentage.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Progress Bars */}
              <div className={styles.progressSection}>
                <div className={styles.progressRow}>
                  <span className={styles.progressLabel}>Cost</span>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFillCost}
                      style={{ width: `${costPercentage}%` }}
                    />
                  </div>
                  <span className={styles.progressValue}>
                    {costPercentage.toFixed(1)}%
                  </span>
                </div>

                <div className={styles.progressRow}>
                  <span className={styles.progressLabel}>Potential Profit</span>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFillProfit}
                      style={{ width: `${profitPercentage}%` }}
                    />
                  </div>
                  <span className={styles.progressValue}>
                    {profitPercentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Financial Metrics */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Financial Overview</h2>

              <div className={styles.metricsGrid}>
                <div className={styles.metricCard}>
                  <span className={styles.metricLabel}>
                    Billable/Priced Amount
                  </span>
                  <span className={styles.metricValue}>
                    ${financialData.billableAmount.toFixed(2)}
                  </span>
                </div>

                <div className={styles.metricCard}>
                  <span className={styles.metricLabel}>Invoiced Costs</span>
                  <span className={styles.metricValue}>
                    ${financialData.invoicedCosts.toFixed(2)}
                  </span>
                </div>

                <div className={styles.metricCard}>
                  <span className={styles.metricLabel}>Uninvoiced Costs</span>
                  <span className={styles.metricValue}>
                    ${financialData.uninvoicedCosts.toFixed(2)}
                  </span>
                </div>

                <div className={styles.metricCard}>
                  <span className={styles.metricLabel}>Potential Profit</span>
                  <span
                    className={styles.metricValue + " " + styles.valueProfit}
                  >
                    ${financialData.potentialProfit.toFixed(2)}
                  </span>
                </div>

                <div className={styles.metricCard}>
                  <span className={styles.metricLabel}>Profit Margin</span>
                  <span
                    className={styles.metricValue + " " + styles.valueProfit}
                  >
                    {financialData.profitMargin.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Cost Breakdown</h2>

              <div className={styles.breakdownGrid}>
                <div className={styles.breakdownCard}>
                  <div className={styles.breakdownHeader}>
                    <span className={styles.breakdownTitle}>Labour Costs</span>
                    <span className={styles.breakdownAmount}>
                      ${financialData.labourCosts.toFixed(2)}
                    </span>
                  </div>
                  <div className={styles.breakdownBar}>
                    <div
                      className={styles.breakdownFillLabour}
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div className={styles.breakdownMeta}>
                    <span>{financialData.labourHours} hours</span>
                    <span>100%</span>
                  </div>
                </div>

                <div className={styles.breakdownCard}>
                  <div className={styles.breakdownHeader}>
                    <span className={styles.breakdownTitle}>
                      Material Costs
                    </span>
                    <span className={styles.breakdownAmount}>
                      ${financialData.materialCosts.toFixed(2)}
                    </span>
                  </div>
                  <div className={styles.breakdownBar}>
                    <div
                      className={styles.breakdownFillMaterial}
                      style={{ width: "0%" }}
                    />
                  </div>
                  <div className={styles.breakdownMeta}>
                    <span>No data</span>
                    <span>0%</span>
                  </div>
                </div>

                <div className={styles.breakdownCard}>
                  <div className={styles.breakdownHeader}>
                    <span className={styles.breakdownTitle}>
                      Total Current Costs
                    </span>
                    <span className={styles.breakdownAmount}>
                      ${financialData.totalCosts.toFixed(2)}
                    </span>
                  </div>
                  <div className={styles.breakdownBar}>
                    <div
                      className={styles.breakdownFillTotal}
                      style={{ width: `${costPercentage}%` }}
                    />
                  </div>
                  <div className={styles.breakdownMeta}>
                    <span>Of billable amount</span>
                    <span>{costPercentage.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default FinancialSummaryPage;
