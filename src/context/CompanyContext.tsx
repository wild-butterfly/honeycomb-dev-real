// Created by Clevermode © 2025

import React, { createContext, useContext, useEffect, useState } from "react";

import { apiGet } from "../services/api";

/* =====================================================
TYPES
===================================================== */

type Company = {
  id: number;
  name: string;
};

type CompanyContextType = {
  companyId: number | null;

  setCompanyId: (id: number | null) => void;

  companies: Company[];

  loading: boolean;

  isGodMode: boolean;
};

/* =====================================================
CONTEXT
===================================================== */

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

/* =====================================================
PROVIDER
===================================================== */

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [companyId, setCompanyIdState] = useState<number | null>(null);

  const [companies, setCompanies] = useState<Company[]>([]);

  const [loading, setLoading] = useState(true);

  /* =====================================================
SET COMPANY (GOD MODE SWITCH)
===================================================== */

  const setCompanyId = (id: number | null) => {
    console.log("Switch company →", id);

    setCompanyIdState(id);

    if (id === null) {
      localStorage.removeItem("impersonateCompany");
    } else {
      localStorage.setItem("impersonateCompany", String(id));
    }
  };

  /* =====================================================
INIT
===================================================== */

  useEffect(() => {
    const init = async () => {
      try {
        const impersonate = localStorage.getItem("impersonateCompany");

        /* LOAD COMPANIES */

        const list = await apiGet<Company[]>("/companies");

        setCompanies(Array.isArray(list) ? list : []);

        /* GOD MODE ACTIVE */

        if (impersonate === null) {
          console.log("God mode active");

          setCompanyIdState(null);

          return;
        }

        /* NORMAL MODE */

        const me = await apiGet<any>("/me");

        if (me?.company_id) {
          setCompanyIdState(me.company_id);
        }
      } catch {
        console.log("Company init failed");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  /* =====================================================
PROVIDER
===================================================== */

  return (
    <CompanyContext.Provider
      value={{
        companyId,

        setCompanyId,

        companies,

        loading,

        isGodMode: companyId === null,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
};

/* =====================================================
HOOK
===================================================== */

export const useCompany = () => {
  const ctx = useContext(CompanyContext);

  if (!ctx) {
    throw new Error("useCompany must be used inside CompanyProvider");
  }

  return ctx;
};
