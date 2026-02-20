// src/types/costReport.ts
export interface CostEntry {
  id: string;
  jobPhase: string;
  type: "Time Entry" | "Material" | "Expense" | "Labour";
  name: string;
  qty: number;
  unitCost: number;
  totalCost: number;
  unitPrice: number;
  totalPrice: number;
  markupPercent: number;
  transactionDate: string;
  dateEntered: string;
  status: "To Invoice" | "Invoiced" | "Paid" | "Pending";
}

export interface CostReportData {
  jobId: string;
  jobName: string;
  totalCost: number;
  totalPrice: number;
  totalMarkup: number;
  entries: CostEntry[];
}
