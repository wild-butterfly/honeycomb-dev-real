// src/pages/FinancialSummaryPage.tsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ChartBarIcon, ArrowDownTrayIcon } from "@heroicons/react/24/solid";
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
                <h1 className={styles.pageTitle}>
                  <ChartBarIcon className={styles.pageIcon} />
                  Financial Status
                </h1>
                <p className={styles.pageSubtitle}>
                  Quick overview of this job's financial health
                </p>
              </div>
              <button className={styles.downloadBtn}>
                <ArrowDownTrayIcon className={styles.downloadIcon} />
                Download Report
              </button>
            </div>

            {/* Overall Position - Simple Status */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Overall Position</h2>

              <div className={styles.statusContainer}>
                <div className={styles.statusBox}>
                  <div className={styles.statusLabel}>💵 Expected Profit</div>
                  <div
                    className={styles.statusValue}
                    style={{ color: "#10b981" }}
                  >
                    ${financialData.potentialProfit.toFixed(2)}
                  </div>
                  <div className={styles.statusDetail}>
                    {profitPercentage.toFixed(1)}% of what we're charging
                  </div>
                </div>

                <div className={styles.statusBox}>
                  <div className={styles.statusLabel}>💳 Costs Unpaid</div>
                  <div
                    className={styles.statusValue}
                    style={{ color: "#ea580c" }}
                  >
                    ${financialData.uninvoicedCosts.toFixed(2)}
                  </div>
                  <div className={styles.statusDetail}>
                    {costPercentage.toFixed(1)}% of what we're charging
                  </div>
                </div>
              </div>

              {/* Simple Progress Bars */}
              <div className={styles.simpleProgressSection}>
                <div className={styles.progressItem}>
                  <div className={styles.progressItemLabel}>
                    <span>Spending</span>
                    <span>{costPercentage.toFixed(1)}%</span>
                  </div>
                  <div className={styles.simpleProgressBar}>
                    <div
                      className={styles.progressBarFill}
                      style={{
                        width: `${Math.min(costPercentage, 100)}%`,
                        backgroundColor: "#ea580c",
                      }}
                    />
                  </div>
                </div>

                <div className={styles.progressItem}>
                  <div className={styles.progressItemLabel}>
                    <span>Profit Potential</span>
                    <span>{profitPercentage.toFixed(1)}%</span>
                  </div>
                  <div className={styles.simpleProgressBar}>
                    <div
                      className={styles.progressBarFill}
                      style={{
                        width: `${Math.min(profitPercentage, 100)}%`,
                        backgroundColor: "#10b981",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Overview */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Financial Overview</h2>

              <div className={styles.metricsSimpleGrid}>
                <div className={styles.metricSimpleCard}>
                  <div className={styles.metricSimpleLabel}>Total Price</div>
                  <div className={styles.metricSimpleValue}>
                    ${financialData.billableAmount.toFixed(2)}
                  </div>
                </div>

                <div className={styles.metricSimpleCard}>
                  <div className={styles.metricSimpleLabel}>Labour Costs</div>
                  <div className={styles.metricSimpleValue}>
                    ${financialData.labourCosts.toFixed(2)}
                  </div>
                </div>

                <div className={styles.metricSimpleCard}>
                  <div className={styles.metricSimpleLabel}>Material Costs</div>
                  <div className={styles.metricSimpleValue}>
                    ${financialData.materialCosts.toFixed(2)}
                  </div>
                </div>

                <div className={styles.metricSimpleCard}>
                  <div className={styles.metricSimpleLabel}>Total Spent</div>
                  <div className={styles.metricSimpleValue}>
                    ${financialData.totalCosts.toFixed(2)}
                  </div>
                </div>

                <div className={styles.metricSimpleCard}>
                  <div className={styles.metricSimpleLabel}>Invoiced</div>
                  <div className={styles.metricSimpleValue}>
                    ${financialData.invoicedCosts.toFixed(2)}
                  </div>
                </div>

                <div className={styles.metricSimpleCard}>
                  <div className={styles.metricSimpleLabel}>
                    Still To Invoice
                  </div>
                  <div className={styles.metricSimpleValue}>
                    ${financialData.uninvoicedCosts.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Cost Breakdown - Horizontal Bar Chart */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                Where is the Budget Going?
              </h2>

              <div className={styles.costBreakdownSimple}>
                <div className={styles.costBreakdownRow}>
                  <div className={styles.costLabel}>Labour</div>
                  <div className={styles.costBarContainer}>
                    <div
                      className={styles.costBar}
                      style={{
                        width: `${(financialData.labourCosts / financialData.totalCosts) * 100 || 0}%`,
                        backgroundColor: "#3b82f6",
                      }}
                    />
                  </div>
                  <div className={styles.costValue}>
                    ${financialData.labourCosts.toFixed(2)}
                  </div>
                </div>

                <div className={styles.costBreakdownRow}>
                  <div className={styles.costLabel}>Materials</div>
                  <div className={styles.costBarContainer}>
                    <div
                      className={styles.costBar}
                      style={{
                        width: `${(financialData.materialCosts / financialData.totalCosts) * 100 || 0}%`,
                        backgroundColor: "#10b981",
                      }}
                    />
                  </div>
                  <div className={styles.costValue}>
                    ${financialData.materialCosts.toFixed(2)}
                  </div>
                </div>

                <div className={styles.costBreakdownRow}>
                  <div className={styles.costLabel}>Other Costs</div>
                  <div className={styles.costBarContainer}>
                    <div
                      className={styles.costBar}
                      style={{
                        width: `${((financialData.totalCosts - financialData.labourCosts - financialData.materialCosts) / financialData.totalCosts) * 100 || 0}%`,
                        backgroundColor: "#f59e0b",
                      }}
                    />
                  </div>
                  <div className={styles.costValue}>
                    $
                    {(
                      financialData.totalCosts -
                      financialData.labourCosts -
                      financialData.materialCosts
                    ).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Labour Hours */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Labour Info</h2>

              <div className={styles.labourGrid}>
                <div className={styles.labourCard}>
                  <div className={styles.labourLabel}>Hours Spent</div>
                  <div className={styles.labourValue}>
                    {financialData.labourHours.toFixed(1)} hrs
                  </div>
                </div>

                <div className={styles.labourCard}>
                  <div className={styles.labourLabel}>Labour Cost per Hour</div>
                  <div className={styles.labourValue}>
                    $
                    {(
                      financialData.labourCosts / financialData.labourHours
                    ).toFixed(2)}
                    /hr
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
