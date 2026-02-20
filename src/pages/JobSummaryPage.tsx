// src/pages/JobSummaryPage.tsx
// Created by Honeycomb © 2026

import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import LeftSidebar from "../components/LeftSidebar";
import DashboardNavbar from "../components/DashboardNavbar";
import Footer from "../components/Footer";
import styles from "./JobSummaryPage.module.css";
import { apiGet, logout } from "../services/api";

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
  const [loading, setLoading] = useState(true);

  /* ================= LOAD ================= */

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        const [jobRes, aRes, eRes, lRes] = await Promise.all([
          apiGet<any>(`/jobs/${id}`),
          apiGet<any[]>(`/assignments?job_id=${id}`),
          apiGet<Employee[]>(`/employees`),
          apiGet<JobLabourEntryResponse[]>(`/jobs/${id}/labour`),
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

  /* ================= DERIVED ================= */

  const assignees = useMemo(() => {
    const map = new Map<number, string>();

    assignments.forEach((a) => {
      const emp = employees.find((e) => e.id === a.employee_id);
      if (emp) map.set(emp.id, emp.name);
    });

    return Array.from(map.entries()).map(([id, name]) => ({
      id,
      name,
    }));
  }, [assignments, employees]);

  const scheduledHours = useMemo(() => {
    return (
      Math.round(
        assignments.reduce((sum, a) => {
          const diff = (a.end.getTime() - a.start.getTime()) / (1000 * 60 * 60);
          return sum + diff;
        }, 0) * 10,
      ) / 10
    );
  }, [assignments]);

  const loggedHours = useMemo(() => {
    return (
      Math.round(
        labourEntries.reduce((sum, entry) => {
          return sum + (entry.hours ?? 0);
        }, 0) * 10,
      ) / 10
    );
  }, [labourEntries]);

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
            />

            {/* CUSTOMER + TEAM */}
            <div className={styles.twoColumnRow}>
              <CustomerCard job={job} />

              <TeamScheduleCard
                job={{
                  ...job,
                  assigned_staff: assignees.length,
                  scheduled_hours: scheduledHours,
                  logged_hours: loggedHours,
                }}
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
