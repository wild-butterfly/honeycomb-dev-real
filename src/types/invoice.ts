// Invoice types for the invoicing system

export interface InvoiceLineItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  cost: number;
  price: number;
  markup: number; // percentage
  tax: number; // percentage (e.g., 10 for GST)
  discount: number; // percentage
  total: number;
}

export type InvoiceType = 'DRAFT' | 'APPROVED' | 'SENT' | 'PAID' | 'OVERDUE' | 'VOID';
export type InvoiceDeliveryStatus = 'NOT_SENT' | 'SENT' | 'VIEWED' | 'DOWNLOADED';
export type InvoiceStatus = 'DRAFT' | 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';

export type PaymentPeriod = 'CUSTOM' | '30_DAYS' | '21_DAYS' | '14_DAYS' | '7_DAYS' | '5_DAYS' | 'ON_COMPLETION';
export type CardPaymentFeeOption = 'ABSORB' | 'PASS_ON' | 'COMPANY_SETTING';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  jobId: string;
  jobName: string;
  customerId: string;
  customerName: string;
  onlinePaymentsEnabled?: boolean;
  
  // Invoice details
  type: InvoiceType;
  deliveryStatus: InvoiceDeliveryStatus;
  status: InvoiceStatus;
  
  // Line items
  lineItems: InvoiceLineItem[];
  
  // Payment terms
  paymentPeriod: PaymentPeriod;
  customPaymentDate?: string;
  cardPaymentFee: CardPaymentFeeOption;
  
  // Financial details
  subtotal: number;
  taxAmount: number; // GST amount
  totalWithTax: number;
  amountPaid: number;
  amountUnpaid: number;
  
  // Margins and discounts
  labourDiscount: number; // percentage
  materialDiscount: number;
  materialMarkup: number;
  
  // Dates
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  dueDate?: string;
  paidAt?: string;
  
  // Additional info
  notes?: string;
  letterhead?: string;
  
  // Xero integration
  xeroInvoiceId?: string;
  xeroSyncStatus?: 'NOT_SYNCED' | 'SYNCED' | 'ERROR';
  xeroLastSyncAt?: string;
}

export interface InvoiceMargins {
  overallCost: number;
  chargedSoFar: number;
  labourCost: number;
  labourCharge: number;
  materialCost: number;
  materialCharge: number;
  totalCost: number;
  totalCharge: number;
  totalMargin: number; // percentage
  grossProfit: number;
  grossMargin: number; // percentage
  invoiceProgress: number; // percentage
}

export interface InvoiceSummary {
  totalClaimed: number;
  totalGst: number;
  totalUnpaid: number;
  totalPaid: number;
}

export interface QuickInvoiceData {
  jobId: string;
  customerId: string;
  lineItems: InvoiceLineItem[];
  paymentPeriod: PaymentPeriod;
  cardPaymentFee: CardPaymentFeeOption;
  notes?: string;
  companyId?: number | null;
  templateId?: number | null;
  template?: any;
}

export interface XeroConfig {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  isConnected: boolean;
  lastSyncAt?: string;
}
