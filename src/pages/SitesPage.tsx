import React, { useEffect, useState, useMemo } from "react";
import { useCompany } from "../context/CompanyContext";
import api from "../services/api";
import DashboardNavbar from "../components/DashboardNavbar";
import Footer from "../components/Footer";
import styles from "./SitesPage.module.css";

interface Site {
  id: number;
  address: string;
  status: string;
  contact_name?: string;
  phone?: string;
  jobs_count?: number;
}

const SitesPage: React.FC = () => {
  const { companyId } = useCompany();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchSites = async () => {
      setLoading(true);
      const jobs = await api.get<any[]>(`/jobs?company_id=${companyId}`);
      const siteMap: { [address: string]: Site } = {};
      (jobs || []).forEach((job) => {
        const address = job.site_address || job.address || "(No Address)";
        if (!siteMap[address]) {
          siteMap[address] = {
            id: job.id,
            address,
            status: job.status || "ACTIVE",
            contact_name: job.contact_name || job.customer_name || "",
            phone: job.phone || job.customer_phone || "",
            jobs_count: 1,
          };
        } else {
          siteMap[address].jobs_count = (siteMap[address].jobs_count || 1) + 1;
        }
      });
      setSites(Object.values(siteMap));
      setLoading(false);
    };
    fetchSites();
  }, [companyId]);

  const visibleSites = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return sites;
    return sites.filter((site) => {
      const haystack = [site.address, site.contact_name ?? "", site.phone ?? ""]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [sites, search]);

  return (
    <div className={styles.dashboardShell}>
      <div className={styles.dashboardBg}>
        <DashboardNavbar />
        <div className={styles.centerPageRow}>
          <div className={`${styles.tableCardModern} ${styles.centerPageCard}`}>
            <div className={styles.tableHeader}>
              <div className={styles.tableHeaderLeft}>
                <div className={styles.tableHeaderTopRow}>
                  <h3 className={styles.tableTitle}>Sites</h3>
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
                          placeholder="Search sites, address, or contact…"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className={styles.tableHeaderMetaRow}>
                  <div className={styles.tableSubtitle}>
                    <span className={styles.tablePill}>
                      {loading
                        ? "Loading sites…"
                        : `${visibleSites.length} sites`}
                    </span>
                    <span className={styles.tableHint}>
                      Site details are automatically derived from your jobs.
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
                    <th>Site</th>
                    <th>Postal Address</th>
                    <th>Default Site Contact</th>
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
                  ) : visibleSites.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={styles.tableStateCell}>
                        <div className={styles.tableEmpty}>
                          <div className={styles.tableEmptyIcon}>🏗️</div>
                          <div className={styles.tableEmptyTitle}>
                            No sites found
                          </div>
                          <div className={styles.tableEmptyText}>
                            Try adjusting your search or create a new job to add
                            sites.
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    visibleSites.map((site) => (
                      <tr key={site.id} className={styles.jobRow}>
                        <td>
                          <span
                            className={
                              site.status === "ACTIVE"
                                ? styles.statusActive
                                : styles.statusPending
                            }
                          >
                            {site.status}
                          </span>
                        </td>
                        <td>
                          <div className={styles.customerCell}>
                            {site.address}
                          </div>
                        </td>
                        <td>
                          <div className={styles.customerCell}>
                            {site.address}
                          </div>
                        </td>
                        <td>
                          <div className={styles.customerCell}>
                            {site.contact_name || "—"}
                          </div>
                        </td>
                        <td>
                          <div className={styles.customerCell}>
                            {site.phone || "—"}
                          </div>
                        </td>
                        <td>
                          <div className={styles.customerCell}>
                            {site.jobs_count === 0
                              ? "No jobs"
                              : site.jobs_count === 1
                                ? "1 job"
                                : `${site.jobs_count} jobs`}
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

export default SitesPage;
