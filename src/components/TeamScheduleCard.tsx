// src/components/TeamScheduleCard.tsx
// Honeycomb © 2026

import React from "react";
import styles from "./TeamScheduleCard.module.css";

import {
  BuildingOffice2Icon,
  MapPinIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";

interface Props {
  job: any;
  sites?: Array<{
    id: string;
    name: string;
    address: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
  }>;
}

const TeamScheduleCard: React.FC<Props> = ({ job, sites = [] }) => {
  const currentAddress = String(
    job?.site_address || job?.address || job?.location || "",
  )
    .trim()
    .toLowerCase();

  const currentSite =
    sites.find((s) => String(s.id) === String(job?.id)) ||
    sites.find((s) => s.address.trim().toLowerCase() === currentAddress) ||
    sites[0];

  const siteName =
    job?.site_name || job?.site || job?.job_site_name || job?.location_name ||
    currentSite?.name ||
    job?.title ||
    "—";
  const siteAddress =
    job?.site_address || currentSite?.address || job?.address || job?.location || "—";
  const siteContact =
    job?.site_contact_name || job?.contact_name || currentSite?.contactName || job?.client || "—";
  const siteEmail =
    job?.site_contact_email || job?.contact_email || currentSite?.contactEmail || job?.email || "";
  const sitePhone =
    job?.site_contact_phone ||
    job?.site_phone ||
    job?.contact_phone ||
    currentSite?.contactPhone ||
    job?.phone ||
    "";

  const otherSites = sites.filter(
    (s) =>
      s.address.trim().toLowerCase() !== siteAddress.trim().toLowerCase(),
  );

  return (
    <div className={styles.card}>
      {/* HEADER */}

      <div className={styles.header}>
        <BuildingOffice2Icon className={styles.headerIcon} />

        <div className={styles.title}>Site</div>
      </div>

      {/* BODY */}

      <div className={styles.body}>
        {/* ASSIGNED */}

        <div className={styles.row}>
          <BuildingOffice2Icon className={styles.icon} />

          <div>
            <div className={styles.label}>Site Name</div>

            <div className={styles.value}>{siteName}</div>
          </div>
        </div>

        {/* SCHEDULED */}

        <div className={styles.row}>
          <MapPinIcon className={styles.icon} />

          <div>
            <div className={styles.label}>Site Address</div>

            <div className={styles.value}>{siteAddress}</div>
          </div>
        </div>

        {/* LOGGED */}

        <div className={styles.row}>
          <UserIcon className={styles.icon} />

          <div>
            <div className={styles.label}>Site Contact</div>

            <div className={styles.value}>{siteContact}</div>
          </div>
        </div>

        <div className={styles.row}>
          <EnvelopeIcon className={styles.icon} />

          <div>
            <div className={styles.label}>Email</div>
            <div className={styles.value}>{siteEmail || "—"}</div>
          </div>
        </div>

        {/* PHONE */}

        <div className={styles.row}>
          <PhoneIcon className={styles.icon} />

          <div>
            <div className={styles.label}>Phone</div>
            <div className={styles.value}>{sitePhone || "—"}</div>
          </div>
        </div>

        {otherSites.length > 0 ? (
          <>
            <div className={styles.divider} />
            <div className={styles.extraTitle}>Other Sites</div>
            <div className={styles.siteList}>
              {otherSites.slice(0, 3).map((site) => (
                <div key={`${site.id}-${site.address}`} className={styles.siteItem}>
                  {site.address}
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default TeamScheduleCard;
