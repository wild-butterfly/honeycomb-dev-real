import React from "react";

import { useCompany } from "../context/CompanyContext";

function getCurrentUserRole(): string | null {
  const userStr = localStorage.getItem("user");
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      return user?.role ?? null;
    } catch {
      // ignore malformed user data
    }
  }

  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload));
    return decoded?.role ?? null;
  } catch {
    return null;
  }
}

export default function CompanySwitcher() {
  const {
    companies,

    companyId,

    setCompanyId,
  } = useCompany();

  const role = getCurrentUserRole();
  const isSuperAdmin = role === "superadmin";

  const uniqueCompanies = Array.from(
    new Map(companies.map((company) => [company.name, company])).values(),
  );

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <select
      value={companyId ?? ""}
      onChange={(e) =>
        setCompanyId(e.target.value ? Number(e.target.value) : null)
      }
    >
      {/* GOD MODE - Only for superadmins */}
      {isSuperAdmin && <option value="">🌍 God Mode</option>}

      {/* COMPANIES */}

      {uniqueCompanies.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
