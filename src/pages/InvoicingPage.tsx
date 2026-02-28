import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import InvoiceList from "../components/InvoiceList";
import QuickInvoiceModal from "../components/QuickInvoiceModal";
import InvoiceSidePanel from "../components/InvoiceSidePanel";
import InvoiceSummaryCard from "../components/InvoiceSummaryCard";
import { Invoice, InvoiceSummary } from "../types/invoice";
import DashboardNavbar from "../components/DashboardNavbar";
import LeftSidebar from "../components/LeftSidebar";
import Footer from "../components/Footer";
import styles from "./InvoicingPage.module.css";
import { FiPlus } from "react-icons/fi";
import { apiGet, apiPost, apiDelete } from "../services/api";
import {
  DocumentDuplicateIcon,
  DocumentTextIcon,
  BoltIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

interface InvoicingPageProps {
  jobId?: string;
}

const InvoicingPage: React.FC<InvoicingPageProps> = ({ jobId: propJobId }) => {
  const { id: paramJobId } = useParams<{ id: string }>();
  const jobId = propJobId || paramJobId;
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<InvoiceSummary>({
    totalClaimed: 0,
    totalGst: 0,
    totalUnpaid: 0,
    totalPaid: 0,
  });
  const [showQuickInvoiceModal, setShowQuickInvoiceModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [xeroConnected, setXeroConnected] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);

  useEffect(() => {
    checkXeroConnection();
    if (jobId) {
      loadInvoices();
    } else {
      loadAllInvoices();
    }
  }, [jobId]);

  const checkXeroConnection = async () => {
    try {
      const data = await apiGet<any>("/xero/config");
      setXeroConnected(data.isConnected || false);
    } catch (error) {
      console.error("Error checking Xero connection:", error);
      setXeroConnected(false);
    }
  };

  const loadInvoices = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      const data = await apiGet<any>(`/jobs/${jobId}/invoices`);
      setInvoices(data.invoices || []);
      setSummary(
        data.summary || {
          totalClaimed: 0,
          totalGst: 0,
          totalUnpaid: 0,
          totalPaid: 0,
        },
      );
      // Check if this is first time (no invoices and no history)
      setIsFirstTime((data.invoices || []).length === 0 && !data.hasHistory);
    } catch (error) {
      console.error("Error loading invoices:", error);
      setIsFirstTime(true); // Assume first time if error
    } finally {
      setLoading(false);
    }
  };

  const loadAllInvoices = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      const data = await apiGet<any>("/invoices");
      setInvoices(data.invoices || []);
      setSummary(
        data.summary || {
          totalClaimed: 0,
          totalGst: 0,
          totalUnpaid: 0,
          totalPaid: 0,
        },
      );
      // Check if this is first time (no invoices and no history)
      setIsFirstTime((data.invoices || []).length === 0 && !data.hasHistory);
    } catch (error) {
      console.error("Error loading invoices:", error);
      setIsFirstTime(true); // Assume first time if error
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuickInvoice = async (invoiceData: any) => {
    try {
      setLoading(true);
      // Create invoice with data from modal
      const payload = {
        ...invoiceData,
        jobId,
      };

      const newInvoice = await apiPost<any>("/invoices", payload);
      setInvoices([...invoices, newInvoice]);
      setShowQuickInvoiceModal(false);
      setSelectedInvoice(newInvoice);
      setSidePanelOpen(true);
    } catch (error) {
      console.error("Error creating invoice:", error);
      alert("Failed to create invoice. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditInvoice = (invoiceId: string) => {
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    if (invoice) {
      setSelectedInvoice(invoice);
      setSidePanelOpen(true);
    }
  };

  const handleViewInvoice = (invoiceId: string) => {
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    if (invoice) {
      setSelectedInvoice(invoice);
      setSidePanelOpen(true);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!window.confirm("Are you sure you want to delete this invoice?")) {
      return;
    }

    try {
      await apiDelete(`/invoices/${invoiceId}`);
      setInvoices(invoices.filter((inv) => inv.id !== invoiceId));
      console.log(`✅ Invoice ${invoiceId} deleted successfully`);
    } catch (error) {
      console.error("Error deleting invoice:", error);
      alert("Failed to delete invoice. Please try again.");
    }
  };

  const handleDuplicateInvoice = async (invoiceId: string) => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/invoices/${invoiceId}/duplicate`, {
        method: "POST",
      });
      const duplicatedInvoice = await response.json();
      setInvoices([...invoices, duplicatedInvoice]);
    } catch (error) {
      console.error("Error duplicating invoice:", error);
    }
  };

  const handleSyncToXero = async (invoiceId: string) => {
    try {
      console.log("Xero sync triggered for invoice:", invoiceId);
      alert(
        `Xero sync for invoice ${invoiceId} is ready. Backend endpoint needed at /api/invoices/${invoiceId}/sync-xero`,
      );
      // TODO: Implement backend Xero sync endpoint
    } catch (error) {
      console.error("Error syncing to Xero:", error);
    }
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      console.log("Download triggered for invoice:", invoiceId);

      const token = localStorage.getItem("token");
      if (!token) {
        alert("Authentication required");
        return;
      }

      // Fetch PDF from backend
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let detail = response.statusText;
        try {
          const body = await response.json();
          detail = body.details || body.error || response.statusText;
        } catch {}
        throw new Error(`Failed to download invoice: ${detail}`);
      }

      // Create blob from response
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Invoice-${invoiceId}.pdf`;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log("Invoice downloaded successfully");
    } catch (error: any) {
      console.error("Error downloading invoice:", error);
      alert(`Failed to download invoice: ${error.message}`);
    }
  };

  return (
    <>
      <DashboardNavbar />
      <div className={styles.pageWrapper}>
        <LeftSidebar />
        <main className={styles.main}>
          <div className={styles.pageContainer}>
            <div className={styles.pageHeader}>
              <div>
                <h1 className={styles.pageTitle}>
                  <DocumentDuplicateIcon className={styles.pageIcon} />
                  Invoicing
                </h1>
                <p className={styles.subtitle}>
                  Manage invoices and sync with Xero
                </p>
              </div>
              <button
                className={styles.quickInvoiceBtn}
                onClick={() => setShowQuickInvoiceModal(true)}
                disabled={!jobId}
              >
                {FiPlus({})} Quick Invoice
              </button>
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Summary</h2>
              <InvoiceSummaryCard summary={summary} />
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Invoices</h2>
              {loading && <div className={styles.loading}>Loading...</div>}

              {!loading &&
                invoices.length === 0 &&
                !xeroConnected &&
                isFirstTime && (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyStateIcon}>
                      <DocumentTextIcon />
                    </div>
                    <h3 className={styles.emptyStateTitle}>
                      Start Invoicing Your Clients
                    </h3>
                    <p className={styles.emptyStateDescription}>
                      Create professional invoices in seconds. Pull data from
                      completed labour entries and send directly to your
                      customers.
                    </p>

                    <div className={styles.emptyStateFeatures}>
                      <div className={styles.feature}>
                        <BoltIcon className={styles.featureIcon} />
                        <div>
                          <h4 className={styles.featureTitle}>Quick Invoice</h4>
                          <p className={styles.featureText}>
                            Auto-populate from labour entries
                          </p>
                        </div>
                      </div>
                      <div className={styles.feature}>
                        <CloudArrowUpIcon className={styles.featureIcon} />
                        <div>
                          <h4 className={styles.featureTitle}>
                            Xero Integration
                          </h4>
                          <p className={styles.featureText}>
                            Sync directly to your accounting
                          </p>
                        </div>
                      </div>
                      <div className={styles.feature}>
                        <CheckCircleIcon className={styles.featureIcon} />
                        <div>
                          <h4 className={styles.featureTitle}>
                            Track Payments
                          </h4>
                          <p className={styles.featureText}>
                            Monitor paid & unpaid invoices
                          </p>
                        </div>
                      </div>
                    </div>

                    {jobId && (
                      <button
                        className={styles.emptyStateCTA}
                        onClick={() => setShowQuickInvoiceModal(true)}
                      >
                        {FiPlus({})} Create Your First Invoice
                      </button>
                    )}
                  </div>
                )}

              {!loading &&
                invoices.length === 0 &&
                (xeroConnected || !isFirstTime) && (
                  <div className={styles.emptyStateSimple}>
                    <DocumentTextIcon className={styles.emptyStateSimpleIcon} />
                    <p className={styles.emptyStateSimpleText}>
                      No invoices found for this job
                    </p>
                    {jobId && (
                      <button
                        className={styles.emptyStateSimpleBtn}
                        onClick={() => setShowQuickInvoiceModal(true)}
                      >
                        {FiPlus({})} Create Invoice
                      </button>
                    )}
                  </div>
                )}

              {!loading && invoices.length > 0 && (
                <InvoiceList
                  invoices={invoices}
                  onView={handleViewInvoice}
                  onEdit={handleEditInvoice}
                  onDelete={handleDeleteInvoice}
                  onDuplicate={handleDuplicateInvoice}
                  onSyncToXero={handleSyncToXero}
                />
              )}
            </div>

            {showQuickInvoiceModal && jobId && (
              <QuickInvoiceModal
                jobId={jobId}
                onClose={() => setShowQuickInvoiceModal(false)}
                onCreate={handleCreateQuickInvoice}
              />
            )}

            {selectedInvoice && (
              <InvoiceSidePanel
                invoice={selectedInvoice}
                isOpen={sidePanelOpen}
                onClose={() => {
                  setSidePanelOpen(false);
                  setSelectedInvoice(null);
                }}
                onEdit={handleEditInvoice}
                onDownload={handleDownloadInvoice}
                onSyncXero={handleSyncToXero}
              />
            )}
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
};

export default InvoicingPage;
