// Invoice API service for frontend
// This handles all invoice-related API calls

import { Invoice, InvoiceLineItem, QuickInvoiceData, InvoiceSummary, InvoiceMargins, XeroConfig } from '../types/invoice';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Helper function for API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `API Error: ${response.status}`);
  }

  return response.json();
}

// Invoice CRUD operations
export const invoiceApi = {
  // Get all invoices
  getAll: async (): Promise<{ invoices: Invoice[]; summary: InvoiceSummary }> => {
    return apiCall('/api/invoices');
  },

  // Get invoices for a specific job
  getByJobId: async (jobId: string): Promise<{ invoices: Invoice[]; summary: InvoiceSummary }> => {
    return apiCall(`/api/jobs/${jobId}/invoices`);
  },

  // Get a single invoice by ID
  getById: async (invoiceId: string): Promise<{ invoice: Invoice; margins: InvoiceMargins }> => {
    return apiCall(`/api/invoices/${invoiceId}`);
  },

  // Create a new invoice
  create: async (data: QuickInvoiceData): Promise<Invoice> => {
    return apiCall('/api/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update an existing invoice
  update: async (invoiceId: string, data: Partial<Invoice>): Promise<Invoice> => {
    return apiCall(`/api/invoices/${invoiceId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete an invoice
  delete: async (invoiceId: string): Promise<void> => {
    return apiCall(`/api/invoices/${invoiceId}`, {
      method: 'DELETE',
    });
  },

  // Duplicate an invoice
  duplicate: async (invoiceId: string): Promise<Invoice> => {
    return apiCall(`/api/invoices/${invoiceId}/duplicate`, {
      method: 'POST',
    });
  },

  // Approve an invoice (change from draft to approved)
  approve: async (invoiceId: string): Promise<Invoice> => {
    return apiCall(`/api/invoices/${invoiceId}/approve`, {
      method: 'POST',
    });
  },

  // Mark invoice as sent
  markAsSent: async (invoiceId: string): Promise<Invoice> => {
    return apiCall(`/api/invoices/${invoiceId}/mark-sent`, {
      method: 'POST',
    });
  },

  // Add payment to invoice
  addPayment: async (invoiceId: string, payment: { amount: number; date: string; method: string }): Promise<Invoice> => {
    return apiCall(`/api/invoices/${invoiceId}/payments`, {
      method: 'POST',
      body: JSON.stringify(payment),
    });
  },

  // Download invoice PDF
  downloadPDF: async (invoiceId: string): Promise<Blob> => {
    const response = await fetch(`${API_BASE_URL}/api/invoices/${invoiceId}/pdf`);
    if (!response.ok) throw new Error('Failed to download PDF');
    return response.blob();
  },

  // Get invoice preview HTML
  getPreview: async (invoiceId: string): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/api/invoices/${invoiceId}/preview`);
    if (!response.ok) throw new Error('Failed to get preview');
    return response.text();
  },
};

// Xero integration operations
export const xeroApi = {
  // Get Xero configuration status
  getConfig: async (): Promise<XeroConfig> => {
    return apiCall('/api/xero/config');
  },

  // Connect to Xero (returns authorization URL)
  connect: async (): Promise<{ authUrl: string }> => {
    return apiCall('/api/xero/connect', {
      method: 'POST',
    });
  },

  // Disconnect from Xero
  disconnect: async (): Promise<void> => {
    return apiCall('/api/xero/disconnect', {
      method: 'POST',
    });
  },

  // Sync a single invoice to Xero
  syncInvoice: async (invoiceId: string): Promise<Invoice> => {
    return apiCall(`/api/invoices/${invoiceId}/sync-xero`, {
      method: 'POST',
    });
  },

  // Sync all invoices to Xero
  syncAll: async (): Promise<{ synced: number; errors: number }> => {
    return apiCall('/api/xero/sync-all', {
      method: 'POST',
    });
  },

  // Get Xero contacts (customers)
  getContacts: async (): Promise<any[]> => {
    return apiCall('/api/xero/contacts');
  },

  // Create a new contact in Xero
  createContact: async (contact: any): Promise<any> => {
    return apiCall('/api/xero/contacts', {
      method: 'POST',
      body: JSON.stringify(contact),
    });
  },
};

// Export all together
export default {
  invoice: invoiceApi,
  xero: xeroApi,
};
