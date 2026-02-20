// src/pages/CostReportPage.tsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  CurrencyDollarIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/solid";
import DashboardNavbar from "../components/DashboardNavbar";
import LeftSidebar from "../components/LeftSidebar";
import Footer from "../components/Footer";
import CostReportTable from "../components/CostReportTable";
import { CostEntry, CostReportData } from "../types/costReport";
import styles from "./CostReportPage.module.css";

const CostReportPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [costData, setCostData] = useState<CostReportData>({
    jobId: "A1TT-28234",
    jobName: "Test & Tag - 16/02/2026",
    totalCost: 67.5,
    totalPrice: 225.0,
    totalMarkup: 233.33,
    entries: [
      {
        id: "1",
        jobPhase: "A1TT-28234a",
        type: "Time Entry",
        name: "Askin Fear 16/02/2026",
        qty: 2.25,
        unitCost: 30.0,
        totalCost: 67.5,
        unitPrice: 100.0,
        totalPrice: 225.0,
        markupPercent: 233.33,
        transactionDate: "16/02/2026",
        dateEntered: "16/02/2026",
        status: "To Invoice",
      },
      {
        id: "2",
        jobPhase: "A1TT-28234a",
        type: "Time Entry",
        name: "Daniel Fear 16/02/2026",
        qty: 2.25,
        unitCost: 0.0,
        totalCost: 0.0,
        unitPrice: 0.0,
        totalPrice: 0.0,
        markupPercent: 0,
        transactionDate: "16/02/2026",
        dateEntered: "16/02/2026",
        status: "To Invoice",
      },
    ],
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    // TODO: Fetch cost report data from API
    // const data = await apiGet(`/jobs/${jobId}/cost-report`);
    // setCostData(data);
  }, [jobId]);

  const filteredEntries = costData.entries.filter(
    (entry) =>
      entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.jobPhase.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.type.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);
  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleExportCSV = () => {
    // TODO: Implement CSV export
    const csvContent = [
      [
        "JOB PHASE",
        "TYPE",
        "NAME",
        "QTY",
        "UNIT COST",
        "TOTAL COST",
        "UNIT PRICE",
        "TOTAL PRICE",
        "MARKUP %",
        "TRANSACTION DATE",
        "DATE ENTERED",
        "STATUS",
      ],
      ...costData.entries.map((entry) => [
        entry.jobPhase,
        entry.type,
        entry.name,
        entry.qty,
        entry.unitCost,
        entry.totalCost,
        entry.unitPrice,
        entry.totalPrice,
        entry.markupPercent,
        entry.transactionDate,
        entry.dateEntered,
        entry.status,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cost-report-${costData.jobId}.csv`;
    a.click();
  };

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
                  <CurrencyDollarIcon className={styles.pageIcon} />
                  Cost Report
                </h1>
                <p className={styles.pageSubtitle}>
                  Detailed cost breakdown for {costData.jobName}
                </p>
              </div>
              <button className={styles.exportBtn} onClick={handleExportCSV}>
                <ArrowDownTrayIcon className={styles.exportIcon} />
                CSV
              </button>
            </div>

            {/* Summary Section */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                Cost Report for {costData.jobId}
              </h2>

              <div className={styles.summaryGrid}>
                <div className={styles.summaryCard}>
                  <span className={styles.summaryLabel}>Total Cost</span>
                  <span className={styles.summaryValue}>
                    ${costData.totalCost.toFixed(2)}
                  </span>
                </div>
                <div className={styles.summaryCard}>
                  <span className={styles.summaryLabel}>Total Price</span>
                  <span className={styles.summaryValue}>
                    ${costData.totalPrice.toFixed(2)}
                  </span>
                </div>
                <div className={styles.summaryCard}>
                  <span className={styles.summaryLabel}>Total Markup</span>
                  <span className={styles.summaryValue}>
                    {costData.totalMarkup.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Cost Table */}
            <div className={styles.section}>
              <div className={styles.tableHeader}>
                <h2 className={styles.sectionTitle}>Cost Entries</h2>
                <input
                  type="text"
                  placeholder="Filter table"
                  className={styles.filterInput}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <CostReportTable entries={paginatedEntries} />

              {/* Pagination */}
              <div className={styles.paginationContainer}>
                <span className={styles.paginationInfo}>
                  Showing {Math.max(1, (currentPage - 1) * itemsPerPage + 1)} to{" "}
                  {Math.min(currentPage * itemsPerPage, filteredEntries.length)}{" "}
                  of {filteredEntries.length} entries
                </span>
                <div className={styles.paginationButtons}>
                  <button
                    className={styles.paginationBtn}
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  >
                    ← Previous
                  </button>
                  <button
                    className={styles.paginationBtn}
                    disabled={currentPage >= totalPages}
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                  >
                    Next →
                  </button>
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

export default CostReportPage;
