//companyContext.tsx

import React, { createContext, useContext, useEffect, useState } from "react";

import api, { setImpersonationCompany } from "../services/api";

/* =====================================================
TYPES
===================================================== */

export interface Company {
  id: number;
  name: string;
}

interface CompanyContextType {
  companies: Company[];
  companyId: number | null;
  loading: boolean;
  setCompanyId: (id: number | null) => void;
  reloadCompanies: () => Promise<void>;
}

/* =====================================================
CONTEXT
===================================================== */

const CompanyContext = createContext<CompanyContextType | null>(null);

export const useCompany = () => {
  const ctx = useContext(CompanyContext);

  if (!ctx) throw new Error("useCompany must be inside CompanyProvider");

  return ctx;
};

/* =====================================================
PROVIDER
===================================================== */

export const CompanyProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [companies, setCompanies] = useState<Company[]>([]);

  const [companyId, setCompanyIdState] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);

  /* =====================================================
LOAD COMPANIES
===================================================== */

  const reloadCompanies = async () => {
    setLoading(true);

    try {
      const data = await api.get<Company[]>("/companies");

      setCompanies(data ?? []);
    } catch (err: any) {
      // Silently handle errors (e.g., when logging out and no token exists)
      const errorMessage = err?.message || String(err);
      if (!errorMessage.includes("No token provided")) {
        console.error("Failed to load companies:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
SWITCH COMPANY (FINAL FIX)
===================================================== */

  const setCompanyId = (id: number | null) => {
    setCompanyIdState(id);

    // ⭐ THIS IS THE ONLY LINE YOU NEED

    setImpersonationCompany(id);
  };

  /* =====================================================
INIT
===================================================== */

  useEffect(() => {
    reloadCompanies();
  }, []);

  /* =====================================================
PROVIDER
===================================================== */

  return (
    <CompanyContext.Provider
      value={{
        companies,
        companyId,
        loading,
        setCompanyId,
        reloadCompanies,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
};
