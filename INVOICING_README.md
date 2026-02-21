# Invoicing System - Honeycomb Dev

A comprehensive invoicing system similar to Fergus, with Xero integration capability.

## Features

### Core Invoicing

- **Quick Invoice Creation**: Rapidly create draft invoices from job data
- **Line Item Management**: Add, edit, and remove invoice line items with:
  - Quantity, cost, price
  - Markup percentages
  - Tax (GST) calculations
  - Discount support
- **Invoice Types**: Draft, Approved, Sent, Paid, Overdue
- **Payment Terms**: Flexible payment periods (7, 14, 21, 30 days, custom dates, on completion)
- **Card Payment Fees**: Configure how payment processing fees are handled

### Job Integration

- **Job Margins Display**: Visual representation of job costs vs. charges
- **Gross Profit Tracking**: See profitability for current job and including this invoice
- **Invoice Progress**: Track how much of the job has been invoiced
- **Labour & Material Breakdowns**: Detailed cost analysis with markup/discount controls

### Xero Integration

- **Sync to Xero**: Push invoices to your Xero account
- **Bi-directional sync**: Keep invoice statuses synchronized
- **Contact management**: Sync customers as Xero contacts
- **Status tracking**: See which invoices are synced to Xero

### Invoice Management

- **List View**: Tabular display of all invoices with sorting and filtering
- **Invoice Summary**: See total claimed, GST, unpaid, and paid amounts at a glance
- **Invoice Actions**:
  - Edit invoice details
  - Download PDF
  - Preview invoice
  - Duplicate invoice
  - Mark as sent
  - Add payments
  - Delete invoice

## File Structure

```
src/
├── types/
│   └── invoice.ts                    # TypeScript types and interfaces
├── pages/
│   ├── InvoicingPage.tsx            # Main invoicing page
│   ├── InvoicingPage.module.css
│   ├── InvoiceEditPage.tsx          # Invoice editing interface
│   └── InvoiceEditPage.module.css
├── components/
│   ├── InvoiceList.tsx              # Invoice table display
│   ├── InvoiceList.module.css
│   ├── InvoiceSummaryCard.tsx       # Summary stats card
│   ├── InvoiceSummaryCard.module.css
│   ├── QuickInvoiceModal.tsx        # Quick invoice creation modal
│   ├── QuickInvoiceModal.module.css
│   ├── InvoiceLineItemComponent.tsx # Individual line item row
│   ├── InvoiceLineItemComponent.module.css
│   ├── InvoiceMarginsDisplay.tsx    # Job margins and profit display
│   └── InvoiceMarginsDisplay.module.css
└── services/
    └── invoiceService.ts            # API service for invoices and Xero
```

## Routes

- `/dashboard/invoices` - View all invoices across all jobs
- `/dashboard/invoices/:invoiceId/edit` - Edit a specific invoice
- `/dashboard/jobs/:jobId/invoicing` - View/manage invoices for a specific job

## Usage

### Creating an Invoice

1. Navigate to a job's invoicing page
2. Click the "Quick Invoice" button
3. The modal will pre-populate line items from job phases
4. Add/edit line items as needed
5. Set payment terms and card payment fee options
6. Click "Create Invoice" to generate a draft

### Editing an Invoice

1. Click on an invoice from the list view
2. Edit line items, quantities, prices, markups, etc.
3. Apply labour/material discounts or markups
4. Set payment terms
5. Click "Save" to update or "Approve" to finalize a draft

### Managing Margins

The invoice edit page shows:

- **Job Margins Chart**: Visual comparison of overall job cost vs. charged amount
- **Gross Profit Cards**: Current job profit and profit including this invoice
- **Markup/Discount Controls**: Apply percentage-based adjustments to:
  - Labour discount
  - Material discount
  - Material markup
- **Cost Breakdown Table**: Detailed breakdown by labour and materials

### Syncing to Xero

1. Configure Xero integration (see below)
2. Open the invoice options menu (three dots)
3. Click "Sync to Xero"
4. Invoice will be created in your Xero account
5. A "Xero" badge will appear on synced invoices

## Backend Setup Required

The frontend expects these API endpoints:

### Invoice Endpoints

- `GET /api/invoices` - Get all invoices
- `GET /api/jobs/:jobId/invoices` - Get invoices for a job
- `GET /api/invoices/:id` - Get single invoice with margins
- `POST /api/invoices` - Create new invoice
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice
- `POST /api/invoices/:id/duplicate` - Duplicate invoice
- `POST /api/invoices/:id/approve` - Approve draft invoice
- `POST /api/invoices/:id/mark-sent` - Mark as sent
- `POST /api/invoices/:id/payments` - Add payment
- `GET /api/invoices/:id/pdf` - Download PDF
- `GET /api/invoices/:id/preview` - Preview HTML

### Xero Integration Endpoints

- `GET /api/xero/config` - Get Xero connection status
- `POST /api/xero/connect` - Initiate Xero OAuth
- `POST /api/xero/disconnect` - Disconnect Xero
- `POST /api/invoices/:id/sync-xero` - Sync single invoice to Xero
- `POST /api/xero/sync-all` - Sync all invoices
- `GET /api/xero/contacts` - Get Xero contacts
- `POST /api/xero/contacts` - Create Xero contact

## Xero Integration Setup

### 1. Create a Xero App

1. Go to https://developer.xero.com/
2. Create a new app
3. Select "Web App" as the app type
4. Set the redirect URI to: `http://localhost:3001/api/xero/callback` (for development)
5. Note your Client ID and Client Secret

### 2. Configure Environment Variables

Add to your `.env` file:

```env
XERO_CLIENT_ID=your_client_id_here
XERO_CLIENT_SECRET=your_client_secret_here
XERO_REDIRECT_URI=http://localhost:3001/api/xero/callback
```

For frontend:

```env
REACT_APP_API_URL=http://localhost:3001
```

### 3. Backend Implementation

You'll need to implement OAuth 2.0 flow with Xero. Key steps:

1. **Authorization**: Redirect user to Xero login
2. **Callback**: Handle OAuth callback and exchange code for tokens
3. **Token Storage**: Securely store access and refresh tokens
4. **API Calls**: Use tokens to create/update invoices in Xero

Useful libraries:

- Node.js: `xero-node` (official Xero SDK)
- OAuth: `passport-xero` or implement custom OAuth flow

### 4. Invoice Mapping

Map your invoice data to Xero's format:

```typescript
{
  Type: "ACCREC",  // Accounts Receivable
  Contact: {
    ContactID: customer.xeroContactId
  },
  LineItems: invoice.lineItems.map(item => ({
    Description: item.name,
    Quantity: item.quantity,
    UnitAmount: item.price,
    TaxType: "OUTPUT",  // GST on sales
    TaxAmount: item.total * (item.tax / 100)
  })),
  Date: invoice.createdAt,
  DueDate: invoice.dueDate,
  Status: "DRAFT" | "SUBMITTED",
  InvoiceNumber: invoice.invoiceNumber
}
```

## Database Schema (Suggested)

```sql
CREATE TABLE invoices (
  id VARCHAR(36) PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  job_id VARCHAR(36) NOT NULL,
  customer_id VARCHAR(36) NOT NULL,
  type VARCHAR(20) NOT NULL,
  delivery_status VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  payment_period VARCHAR(20) NOT NULL,
  card_payment_fee VARCHAR(20) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) NOT NULL,
  total_with_tax DECIMAL(10, 2) NOT NULL,
  amount_paid DECIMAL(10, 2) DEFAULT 0,
  amount_unpaid DECIMAL(10, 2) NOT NULL,
  labour_discount DECIMAL(5, 2) DEFAULT 0,
  material_discount DECIMAL(5, 2) DEFAULT 0,
  material_markup DECIMAL(5, 2) DEFAULT 0,
  notes TEXT,
  xero_invoice_id VARCHAR(100),
  xero_sync_status VARCHAR(20),
  xero_last_sync_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  sent_at DATETIME,
  due_date DATETIME,
  paid_at DATETIME,
  FOREIGN KEY (job_id) REFERENCES jobs(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE invoice_line_items (
  id VARCHAR(36) PRIMARY KEY,
  invoice_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  quantity DECIMAL(10, 2) NOT NULL,
  cost DECIMAL(10, 2) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  markup DECIMAL(5, 2) DEFAULT 0,
  tax DECIMAL(5, 2) DEFAULT 10,
  discount DECIMAL(5, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

CREATE TABLE invoice_payments (
  id VARCHAR(36) PRIMARY KEY,
  invoice_id VARCHAR(36) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date DATETIME NOT NULL,
  payment_method VARCHAR(50),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);
```

## Customization

### Styling

All components use CSS Modules. To customize:

1. Edit the corresponding `.module.css` file
2. Colors follow the Honeycomb theme (yellow/gold accents: `#ffd600`, `#b99a2a`)
3. Key CSS variables to override:
   - Primary button: `#0052cc`
   - Success/paid: `#00b894`
   - Warning/unpaid: `#e17055`
   - Danger/delete: `#d32f2f`

### Invoice Number Format

Default format is auto-generated. To customize, modify the backend invoice creation endpoint:

```typescript
// Example: INV-2026-001
invoiceNumber: `INV-${new Date().getFullYear()}-${String(seq).padStart(3, "0")}`;
```

### Tax Rates

Default GST is 10%. To change:

1. Update the default in `QuickInvoiceModal.tsx` (line ~19)
2. Update the default in `InvoiceEditPage.tsx` when adding line items

### Payment Terms

To add custom payment terms, edit:

- Type definition in `src/types/invoice.ts`
- Dropdown options in `QuickInvoiceModal.tsx` and `InvoiceEditPage.tsx`

## Testing

### Manual Testing Checklist

- [ ] Create a quick invoice from a job
- [ ] Add/edit/remove line items
- [ ] Calculate totals correctly (subtotal + GST)
- [ ] Apply discounts and markups
- [ ] Save draft invoice
- [ ] Approve draft → changes to UNPAID
- [ ] Mark invoice as sent
- [ ] Add payment to invoice
- [ ] Download invoice PDF
- [ ] Duplicate invoice
- [ ] Delete invoice
- [ ] Sync to Xero (if configured)

## Troubleshooting

### Invoices not loading

- Check that backend API is running on port 3001
- Verify `REACT_APP_API_URL` environment variable
- Check browser console for CORS errors

### Xero sync fails

- Verify Xero credentials in `.env`
- Check OAuth tokens haven't expired
- Ensure customer exists as Xero contact
- Review Xero API response in network tab

### Totals calculate incorrectly

- Verify line item calculations in `QuickInvoiceModal.tsx` and `InvoiceEditPage.tsx`
- Check that all percentages are properly divided by 100
- Ensure floating-point precision is handled

## Future Enhancements

- [ ] Recurring invoices
- [ ] Invoice templates/branding
- [ ] Email invoices directly to customers
- [ ] Multi-currency support
- [ ] Batch invoice operations
- [ ] Advanced filtering and search
- [ ] Invoice aging reports
- [ ] Payment reminders
- [ ] Integration with other accounting software (QuickBooks, MYOB)
- [ ] Invoice approval workflow

## Support

For questions or issues with the invoicing system, please check:

1. This README
2. Backend API documentation
3. Xero API documentation: https://developer.xero.com/documentation/

## License

Part of the Honeycomb Dev project. All rights reserved.
