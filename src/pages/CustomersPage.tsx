import React, { useEffect, useMemo, useState } from "react";
import styles from "./CustomersPage.module.css";

import DashboardNavbar from "../components/DashboardNavbar";
import Footer from "../components/Footer";
import { logout } from "../services/api";
import { fetchJobs } from "../services/jobs";
import { useCompany } from "../context/CompanyContext";
import type { CalendarJob } from "../types/calendar";

type CustomerRow = {
  name: string;
  address: string;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  jobCount: number;
  hasActiveJob: boolean;
};

const CustomersPage: React.FC = () => {
  const { companyId } = useCompany();

  const [jobs, setJobs] = useState<CalendarJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const list = await fetchJobs();
        setJobs(Array.isArray(list) ? list : []);
      } finally {
        setLoading(false);
      }
    };

    if (companyId) {
      load().catch((e) => {
        console.error("Failed to load jobs for customers page:", e);
        setLoading(false);
      });
    } else {
      setJobs([]);
    }
  }, [companyId]);

  const customers = useMemo<CustomerRow[]>(() => {
    const byName = new Map<string, CustomerRow>();
    for (const job of jobs) {
      const keyRaw = job.client || "Unknown customer";
      const key = keyRaw.trim() || "Unknown customer";
      const existing = byName.get(key);
      const address = job.address || existing?.address || "";
      const contactName = job.contact_name ?? existing?.contactName ?? null;
      const contactEmail = job.contact_email ?? existing?.contactEmail ?? null;
      const contactPhone = job.contact_phone ?? existing?.contactPhone ?? null;
      const hasActiveJobForThisRow =
        job.status === "active" ||
        job.status === "return" ||
        job.status === "quote";
      if (existing) {
        existing.jobCount += 1;
        existing.address = address;
        existing.contactName = contactName;
        existing.contactEmail = contactEmail;
        existing.contactPhone = contactPhone;
        existing.hasActiveJob = existing.hasActiveJob || hasActiveJobForThisRow;
      } else {
        byName.set(key, {
          name: key,
          address,
          contactName,
          contactEmail,
          contactPhone,
          jobCount: 1,
          hasActiveJob: hasActiveJobForThisRow,
        });
      }
    }
    return Array.from(byName.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [jobs]);

  const visibleCustomers = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter((c) => {
      const haystack = [
        c.name,
        c.address,
        c.contactName ?? "",
        c.contactPhone ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [customers, search]);

  return (
    <div className={styles.dashboardShell}>
      <div className={styles.dashboardBg}>
        <DashboardNavbar onLogout={logout} />
        <div className={styles.centerPageRow}>
          <div className={`${styles.tableCardModern} ${styles.centerPageCard}`}>
            <div className={styles.tableHeader}>
              <div className={styles.tableHeaderLeft}>
                <div className={styles.tableHeaderTopRow}>
                  <h3 className={styles.tableTitle}>Customers</h3>
                  <div className={styles.tableHeaderRightTools}>
                    <div className={styles.jobToolbar}>
                      <div className={styles.jobSearch}>
                        <svg
                          className={styles.jobSearchIcon}
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            d="M21 21l-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                        <input
                          className={styles.jobSearchInput}
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Search customers, address, or contact…"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className={styles.tableHeaderMetaRow}>
                  <div className={styles.tableSubtitle}>
                    <span className={styles.tablePill}>
                      {loading
                        ? "Loading customers…"
                        : `${visibleCustomers.length} customers`}
                    </span>
                    <span className={styles.tableHint}>
                      Customer details are automatically derived from your jobs.
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.tableTopDivider} />
            <div className={styles.tableScrollWrap}>
              <table className={styles.jobsTableModern}>
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Customer</th>
                    <th>Postal Address</th>
                    <th>Default Customer Contact</th>
                    <th>Phone</th>
                    <th>Jobs</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className={styles.tableStateCell}>
                        <div className={styles.tableState}>
                          <div className={styles.skeletonLineLg} />
                          <div className={styles.skeletonLineSm} />
                        </div>
                      </td>
                    </tr>
                  ) : visibleCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={styles.tableStateCell}>
                        <div className={styles.tableEmpty}>
                          <div className={styles.tableEmptyIcon}><img src="/leaf-fall.png" alt="Leaf icon" /></div>
                          <div className={styles.tableEmptyTitle}>
                            No customers found
                          </div>
                          <div className={styles.tableEmptyText}>
                            Try adjusting your search or create a new job to add
                            customers.
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    visibleCustomers.map((c) => (
                      <tr key={c.name} className={styles.jobRow}>
                        <td>
                          <span
                            className={
                              c.hasActiveJob
                                ? styles.statusActive
                                : styles.statusPending
                            }
                          >
                            {c.hasActiveJob ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </td>
                        <td>
                          <div className={styles.customerCell}>{c.name}</div>
                        </td>
                        <td>
                          <div className={styles.customerCell}>
                            {c.address || "—"}
                          </div>
                        </td>
                        <td>
                          <div className={styles.customerCell}>
                            {c.contactName || c.contactEmail || "—"}
                          </div>
                        </td>
                        <td>
                          <div className={styles.customerCell}>
                            {c.contactPhone || "—"}
                          </div>
                        </td>
                        <td>
                          <div className={styles.customerCell}>
                            {c.jobCount === 0
                              ? "No jobs"
                              : c.jobCount === 1
                                ? "1 job"
                                : `${c.jobCount} jobs`}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CustomersPage;
