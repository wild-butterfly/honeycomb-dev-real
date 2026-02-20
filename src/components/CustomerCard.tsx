// src/components/CustomerCard.tsx
// Honeycomb © 2026

import React from "react";
import styles from "./CustomerCard.module.css";

import {
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";

interface Props {
  job: any;
}

const CustomerCard: React.FC<Props> = ({ job }) => {
  const clientName = job?.client || job?.contact_name || "—";
  const contactPhone = job?.contact_phone || job?.phone || "";
  const contactEmail = job?.contact_email || job?.email || "";

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <BuildingOfficeIcon className={styles.headerIcon} />

        <div className={styles.title}>Customer</div>
      </div>

      <div className={styles.body}>
        {/* CLIENT */}

        <div className={styles.row}>
          <UserIcon className={styles.icon} />

          <div>
            <div className={styles.label}>Client</div>

            <div className={styles.value}>{clientName}</div>
          </div>
        </div>

        {/* ADDRESS */}

        <div className={styles.row}>
          <MapPinIcon className={styles.icon} />

          <div>
            <div className={styles.label}>Address</div>

            <div className={styles.value}>{job?.address || "—"}</div>
          </div>
        </div>

        {/* PHONE */}

        <div className={styles.row}>
          <PhoneIcon className={styles.icon} />

          <div>
            <div className={styles.label}>Phone</div>

            {contactPhone ? (
              <a href={`tel:${contactPhone}`} className={styles.link}>
                {contactPhone}
              </a>
            ) : (
              <div className={styles.muted}>—</div>
            )}
          </div>
        </div>

        {/* EMAIL */}

        <div className={styles.row}>
          <EnvelopeIcon className={styles.icon} />

          <div>
            <div className={styles.label}>Email</div>

            {contactEmail ? (
              <a href={`mailto:${contactEmail}`} className={styles.link}>
                {contactEmail}
              </a>
            ) : (
              <div className={styles.muted}>—</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerCard;
