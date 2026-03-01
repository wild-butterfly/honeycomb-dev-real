// src/pages/JobSummaryPage.tsx
// Created by Honeycomb © 2026

import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import LeftSidebar from "../components/LeftSidebar";
import DashboardNavbar from "../components/DashboardNavbar";
import Footer from "../components/Footer";
import styles from "./JobSummaryPage.module.css";
import { apiGet, apiPut, logout } from "../services/api";

import PhaseCard from "../components/PhaseCard";
import CustomerCard from "../components/CustomerCard";
import TeamScheduleCard from "../components/TeamScheduleCard";
import FinancialOverviewCard from "../components/FinancialOverviewCard";
import ActivitySection from "../components/ActivitySection";

import type { Assignment, Employee, LabourEntry } from "../types/calendar";

/* ================= TYPES ================= */

interface JobDoc {
  id: string;
  title?: string;
  client?: string;
  address?: string;
  site_address?: string;
  location?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  phone?: string;
  email?: string;
  notes?: string;
  status?: string;
  priority?: string;
  quoted?: number;
  invoiced?: number;
  paid?: number;
}

type JobLabourEntryResponse = {
  id?: number | string;
  employee_id?: number | string;
  worked_hours?: number | null;
  rate?: number | null;
};

/* ================= COMPONENT ================= */

const JobSummaryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [job, setJob] = useState<JobDoc | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [labourEntries, setLabourEntries] = useState<LabourEntry[]>([]);
  const [allJobs, setAllJobs] = useState<JobDoc[]>([]);
  const [loading, setLoading] = useState(true);

  /* ================= LOAD ================= */

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        const [jobRes, aRes, eRes, lRes, jobsRes] = await Promise.all([
          apiGet<any>(`/jobs/${id}`),
          apiGet<any[]>(`/assignments?job_id=${id}`),
          apiGet<Employee[]>(`/employees`),
          apiGet<JobLabourEntryResponse[]>(`/jobs/${id}/labour`),
          apiGet<JobDoc[]>(`/jobs`),
        ]);

        const resolvedJob: JobDoc = jobRes?.job ?? jobRes;
        setJob(resolvedJob);

        /* === ASSIGNMENTS === */
        const mappedAssignments: Assignment[] = (aRes ?? []).map((a) => ({
          id: Number(a.id),
          employee_id: Number(a.employee_id),
          start: new Date(a.start_time?.replace?.(" ", "T") ?? a.start_time),
          end: new Date(a.end_time),
          completed: Boolean(a.completed),
        }));

        setAssignments(mappedAssignments);

        /* === EMPLOYEES === */
        setEmployees(eRes ?? []);
        setAllJobs(jobsRes ?? []);

        /* === LABOUR === */
        const mappedLabour: LabourEntry[] = (lRes ?? []).map((entry) => ({
          id: Number(entry.id ?? 0),
          job_id: Number(id),
          employee_id: Number(entry.employee_id ?? 0),
          hours: Number(entry.worked_hours ?? 0),
          rate: Number(entry.rate ?? 0),
        }));

        setLabourEntries(mappedLabour);
      } catch (err) {
        console.error("Failed loading summary page:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  /* ================= STATUS CHANGE ================= */

  const handleStatusChange = async (newPhaseKey: string) => {
    if (!id || !job) return;
    // Optimistic update
    setJob((prev) => prev ? { ...prev, status: newPhaseKey } : prev);
    try {
      await apiPut(`/jobs/${id}`, { status: newPhaseKey });
    } catch (err) {
      console.error("Failed to update job status:", err);
      // Revert on failure
      setJob((prev) => prev ? { ...prev, status: job.status } : prev);
    }
  };

  /* ================= DERIVED ================= */

  const customerSites = useMemo(() => {
    if (!job?.client) return [];

    const currentJobId = String(job.id);
    const clientKey = job.client.trim().toLowerCase();
    const byAddress = new Map<
      string,
      {
        id: string;
        name: string;
        address: string;
        contactName: string;
        contactEmail: string;
        contactPhone: string;
      }
    >();

    for (const j of allJobs) {
      if ((j.client || "").trim().toLowerCase() !== clientKey) continue;

      const address = (j.site_address || j.address || j.location || "").trim();
      if (!address) continue;

      const key = address.toLowerCase();
      const candidate = {
        id: String(j.id),
        name: (j.title || "").trim(),
        address,
        contactName: j.contact_name || "",
        contactEmail: j.contact_email || "",
        contactPhone: j.contact_phone || j.phone || "",
      };

      const existing = byAddress.get(key);
      if (!existing || candidate.id === currentJobId) {
        byAddress.set(key, candidate);
      }
    }

    const sites = Array.from(byAddress.values());
    sites.sort((a, b) => (a.id === currentJobId ? -1 : b.id === currentJobId ? 1 : 0));
    return sites;
  }, [allJobs, job]);

  /* ================= RENDER ================= */

  let content = <div className={styles.pageWrapper}>Loading…</div>;

  if (!loading && !job) {
    content = <div className={styles.pageWrapper}>Job not found</div>;
  }

  if (!loading && job) {
    content = (
      <div className={styles.pageWrapper}>
        <LeftSidebar />

        <div className={styles.main}>
          <div className={styles.pageContainer}>
            {/* HERO */}
            <PhaseCard
              job={job}
              assignments={assignments}
              employees={employees}
              labourEntries={labourEntries}
              onStatusChange={handleStatusChange}
            />

            {/* CUSTOMER + TEAM */}
            <div className={styles.twoColumnRow}>
              <CustomerCard job={job} />

              <TeamScheduleCard
                job={{
                  ...job,
                }}
                sites={customerSites}
              />
            </div>

            <FinancialOverviewCard job={job} />

            <ActivitySection jobId={Number(job.id)} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <DashboardNavbar onLogout={logout} />
      {content}
      <Footer />
    </>
  );
};

export default JobSummaryPage;
