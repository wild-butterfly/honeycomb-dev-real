// src/pages/JobSummaryPage.tsx
// Created by Honeycomb © 2026

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import LeftSidebar from "../components/LeftSidebar";
import styles from "./JobSummaryPage.module.css";
import { apiGet } from "../services/api";

import PhaseCard from "../components/PhaseCard";
import CustomerCard from "../components/CustomerCard";
import TeamScheduleCard from "../components/TeamScheduleCard";
import FinancialOverviewCard from "../components/FinancialOverviewCard";
import ActivitySection from "../components/ActivitySection";

interface JobDoc {
  id: string;
  title?: string;
  client?: string;
  address?: string;
  phone?: string;
  email?: string;
  notes?: string;
  status?: string;

  completion?: number;
  started_date?: string;

  assigned_staff?: number;
  scheduled_hours?: number;
  completed_hours?: number;
  next_visit?: string;
  upcoming_booking?: string;

  revenue?: number;
  costs?: number;

  priority?: string;
  updated_at?: string;
}

const formatDate = (value?: string) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return "—";
  }
};

const JobSummaryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<JobDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        const data = await apiGet<any>(`/jobs/${id}`);
        const raw = data?.job ?? data;

        console.log("RAW JOB:", raw);

        // 🔥 FRONTEND NORMALIZATION LAYER
        const normalized: JobDoc = {
          id: raw.id,
          title: raw.title,
          client: raw.client ?? raw.contact_name ?? "",
          address: raw.address,
          phone: raw.phone ?? raw.contact_phone,
          email: raw.email ?? raw.contact_email,
          notes: raw.notes,
          status: raw.status ?? "quoted",

          // PHASE
          completion: raw.completion ?? 0,
          started_date: raw.started_date ?? raw.start_time ?? raw.created_at,

          // TEAM
          assigned_staff:
            raw.assigned_staff ??
            (Array.isArray(raw.assignments) ? raw.assignments.length : 0),

          scheduled_hours:
            raw.scheduled_hours ??
            (Array.isArray(raw.schedules)
              ? raw.schedules.reduce(
                  (sum: number, s: any) =>
                    sum +
                    ((new Date(s.end_time).getTime() -
                      new Date(s.start_time).getTime()) /
                      3600000 || 0),
                  0,
                )
              : 0),

          completed_hours:
            raw.completed_hours ??
            (Array.isArray(raw.labour_entries)
              ? raw.labour_entries.reduce(
                  (sum: number, l: any) => sum + (l.hours || 0),
                  0,
                )
              : 0),

          next_visit:
            raw.next_visit ??
            (Array.isArray(raw.schedules) && raw.schedules.length > 0
              ? raw.schedules[0].start_time
              : undefined),

          revenue: raw.revenue ?? 0,
          costs: raw.costs ?? 0,

          priority: raw.priority ?? "Normal",
          updated_at: raw.updated_at,
        };

        setJob(normalized);
      } catch (error) {
        console.error("Failed to load job:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  if (loading) {
    return (
      <div className={styles.pageWrapper}>
        <LeftSidebar />
        <div className={styles.main}>
          <div className={styles.pageContainer}>
            <div style={{ padding: "40px 0" }}>Loading job...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className={styles.pageWrapper}>
        <LeftSidebar />
        <div className={styles.main}>
          <div className={styles.pageContainer}>
            <div style={{ padding: "40px 0" }}>Job not found</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <LeftSidebar />

      <div className={styles.main}>
        <div className={styles.pageContainer}>
          <PhaseCard job={job} />

          <div className={styles.twoColumnRow}>
            <CustomerCard job={job} />
            <TeamScheduleCard job={job} />
          </div>

          <FinancialOverviewCard job={job} />

          <ActivitySection job={job} />
        </div>
      </div>
    </div>
  );
};

export default JobSummaryPage;
