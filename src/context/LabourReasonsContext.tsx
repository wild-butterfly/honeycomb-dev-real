import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { LabourReason, labourReasons as defaultReasons } from "../config/labourReasons";
import {
  fetchLabourReasons,
  createLabourReason,
  removeLabourReason,
} from "../services/labourReasons.service";
import { useCompany } from "./CompanyContext";

interface LabourReasonsContextValue {
  reasons: LabourReason[];
  loading: boolean;
  addReason: (name: string, paid: boolean) => Promise<void>;
  deleteReason: (id: number) => Promise<void>;
}

const LabourReasonsContext = createContext<LabourReasonsContextValue | null>(null);

export const LabourReasonsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { companyId } = useCompany();
  const [reasons, setReasons] = useState<LabourReason[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    fetchLabourReasons(companyId)
      .then((data) => setReasons(data.length > 0 ? data : defaultReasons))
      .catch(() => setReasons(defaultReasons))
      .finally(() => setLoading(false));
  }, [companyId]);

  const addReason = useCallback(async (name: string, paid: boolean) => {
    if (!companyId) return;
    const created = await createLabourReason(companyId, name, paid);
    if (created) setReasons((prev) => [...prev, created]);
  }, [companyId]);

  const deleteReason = useCallback(async (id: number) => {
    if (!companyId) return;
    await removeLabourReason(companyId, id);
    setReasons((prev) => prev.filter((r) => r.id !== id));
  }, [companyId]);

  return (
    <LabourReasonsContext.Provider value={{ reasons, loading, addReason, deleteReason }}>
      {children}
    </LabourReasonsContext.Provider>
  );
};

export function useLabourReasons(): LabourReasonsContextValue {
  const ctx = useContext(LabourReasonsContext);
  if (!ctx) throw new Error("useLabourReasons must be used inside LabourReasonsProvider");
  return ctx;
}
