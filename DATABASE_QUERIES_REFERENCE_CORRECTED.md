# Database Queries Reference - Invoice Templates (CORRECTED)

## Overview

Both **InvoiceSettingsPage** and **PDF Download** use the same database table: `invoice_templates`

⚠️ **IMPORTANT**: When running queries directly in PostgreSQL client (DBeaver, pgAdmin), replace `$1`, `$2` etc. with actual values. The `$1` syntax is for Node.js backend code only.

---

## Database Queries Used

### 1. **LIST ALL TEMPLATES FOR A COMPANY** (InvoiceSettingsPage)

**File**: `server/src/controllers/invoiceTemplate.controller.ts` - `getCompanyTemplates()`  
**Route**: `GET /invoice-templates/:companyId`  
**Used by**: Invoice Settings Page - Templates Tab

#### ✅ Backend Code (Use in Node.js):

```sql
SELECT * FROM invoice_templates
WHERE company_id = $1
ORDER BY is_default DESC, created_at DESC
```

Parameters: `$1` = company_id

#### ✅ Direct Database Query (Use in PostgreSQL):

```sql
SELECT * FROM invoice_templates
WHERE company_id = 1
ORDER BY is_default DESC, created_at DESC;
```

_Replace `1` with your actual company_id_

---

### 2. **GET DEFAULT TEMPLATE FOR PDF GENERATION** (PDF Download)

**File**: `server/src/controllers/pdf.controller.ts` - `generateInvoicePdf()`  
**Route**: `GET /api/invoices/:id/pdf`  
**Used by**: Invoice Download Button

#### ✅ Backend Code (Use in Node.js):

```sql
SELECT * FROM public.invoice_templates
WHERE company_id = $1 AND is_default = true
ORDER BY created_at DESC LIMIT 1
```

Parameters: `$1` = invoice.company_id

#### ✅ Direct Database Query (Use in PostgreSQL):

```sql
SELECT * FROM public.invoice_templates
WHERE company_id = 1 AND is_default = true
ORDER BY created_at DESC LIMIT 1;
```

_Replace `1` with your actual company_id_

---

### 3. **GET A SINGLE TEMPLATE** (Template Editor)

**File**: `server/src/controllers/invoiceTemplate.controller.ts` - `getTemplate()`  
**Route**: `GET /invoice-templates/template/:id`  
**Used by**: InvoiceTemplateEditor when editing a template

#### ✅ Backend Code (Use in Node.js):

```sql
SELECT * FROM invoice_templates
WHERE id = $1
```

Parameters: `$1` = template id

#### ✅ Direct Database Query (Use in PostgreSQL):

```sql
SELECT * FROM invoice_templates
WHERE id = 5;
```

_Replace `5` with your actual template id_

---

### 4. **CREATE NEW TEMPLATE**

**File**: `server/src/controllers/invoiceTemplate.controller.ts` - `createTemplate()`  
**Route**: `POST /invoice-templates`

#### First: If setting as default, unset other defaults

```sql
UPDATE invoice_templates
SET is_default = false
WHERE company_id = 1;
```

#### Then: Insert new template

```sql
INSERT INTO invoice_templates (
  company_id, name, is_default, status,
  main_color, accent_color, text_color, font_size,
  document_title, default_description, default_footer,
  show_line_items, show_line_quantities, show_line_prices, show_line_totals,
  show_company_logo
) VALUES (
  1,                              -- company_id
  'My Custom Template',           -- name
  true,                           -- is_default
  'active',                       -- status
  '#FFFFFF',                      -- main_color
  '#FFFFFF',                      -- accent_color
  '#000000',                      -- text_color
  'medium',                       -- font_size
  'INVOICE',                      -- document_title
  'Thank you for your business',  -- default_description
  'Payment due within 30 days',   -- default_footer
  true,                           -- show_line_items
  true,                           -- show_line_quantities
  true,                           -- show_line_prices
  true,                           -- show_line_totals
  true                            -- show_company_logo
) RETURNING *;
```

---

### 5. **UPDATE TEMPLATE**

**File**: `server/src/controllers/invoiceTemplate.controller.ts` - `updateTemplate()`  
**Route**: `PUT /invoice-templates/:id`

```sql
UPDATE invoice_templates
SET
  name = 'Updated Template Name',
  is_default = true,
  status = 'active',
  main_color = '#ffe066',
  text_color = '#1a1a1a',
  document_title = 'INVOICE',
  default_description = 'Updated description',
  default_footer = 'Updated footer',
  table_header_background_color = '#fbbf24',
  table_header_text_color = '#ffffff',
  show_line_quantities = true,
  show_line_prices = true,
  show_line_totals = true
WHERE id = 5
RETURNING *;
```

_Replace `5` with your actual template id_

---

### 6. **DELETE TEMPLATE**

**File**: `server/src/controllers/invoiceTemplate.controller.ts` - `deleteTemplate()`  
**Route**: `DELETE /invoice-templates/:id`

#### ✅ Backend Code (Use in Node.js):

```sql
DELETE FROM invoice_templates WHERE id = $1
```

Parameters: `$1` = template id

#### ✅ Direct Database Query (Use in PostgreSQL):

```sql
DELETE FROM invoice_templates WHERE id = 5;
```

_Replace `5` with your actual template id_

---

## Key Columns in `invoice_templates` Table

### Styling Columns (Used by PDF)

- `table_header_background_color` - Table header background color
- `table_header_text_color` - Table header text color
- `text_color` - Main text color
- `border_color` - Border color
- `header_background_color` - Header section background
- `description_background_color` - Description section background
- `description_text_color` - Description section text color

### Content Columns (Used by PDF)

- `document_title` - Invoice title (default: "INVOICE")
- `default_description` - Invoice description/notes
- `default_footer` - Invoice footer text

### Visibility Columns (Used by PDF)

- `show_line_items` - Show/hide line items section
- `show_line_quantities` - Show quantity column
- `show_line_prices` - Show price column
- `show_line_totals` - Show total column
- `show_section_totals` - Show section totals
- `show_labour_items` - Show labour items
- `show_labour_quantities` - Show labour quantities
- `show_labour_prices` - Show labour prices
- `show_labour_totals` - Show labour totals
- `show_material_items` - Show material items
- `show_material_quantities` - Show material quantities
- `show_material_prices` - Show material prices
- `show_material_totals` - Show material totals
- `show_company_logo` - Show company logo

### Status Fields

- `is_default` - Boolean flag for default template
- `status` - 'active' or 'inactive'
- `company_id` - Foreign key to companies table

---

## ✅ Quick Database Tests

### Find your company_id first:

```sql
SELECT id, name FROM companies LIMIT 5;
```

### Check all templates for your company:

```sql
SELECT id, name, is_default, status, created_at
FROM invoice_templates
WHERE company_id = 1
ORDER BY is_default DESC, created_at DESC;
```

### Check which template is marked as default:

```sql
SELECT id, name, company_id, is_default,
       table_header_background_color, text_color,
       document_title, default_description, default_footer
FROM invoice_templates
WHERE company_id = 1 AND is_default = true;
```

### See template styling colors:

```sql
SELECT id, name,
       table_header_background_color,
       table_header_text_color,
       text_color,
       border_color,
       description_text_color
FROM invoice_templates
WHERE company_id = 1;
```

### See template visibility settings:

```sql
SELECT id, name,
       show_line_items, show_line_quantities, show_line_prices, show_line_totals,
       show_labour_items, show_labour_quantities, show_labour_prices, show_labour_totals,
       show_material_items, show_material_quantities, show_material_prices, show_material_totals,
       show_company_logo
FROM invoice_templates
WHERE company_id = 1;
```

### Count templates per company:

```sql
SELECT company_id, COUNT(*) as total_templates,
       SUM(CASE WHEN is_default = true THEN 1 ELSE 0 END) as default_count
FROM invoice_templates
GROUP BY company_id;
```

### Check last 10 invoices and their assigned templates:

```sql
SELECT
  i.id,
  i.invoice_number,
  i.company_id,
  t.id as template_id,
  t.name as template_name,
  t.is_default
FROM invoices i
LEFT JOIN invoice_templates t ON i.company_id = t.company_id AND t.is_default = true
ORDER BY i.created_at DESC
LIMIT 10;
```

---

## How Both Pages Use Same Data

```
┌──────────────────────────────────────────────────────────────┐
│ InvoiceSettingsPage > Templates Tab                          │
├──────────────────────────────────────────────────────────────┤
│ Query: SELECT * FROM invoice_templates                       │
│        WHERE company_id = 1                                  │
│        ORDER BY is_default DESC, created_at DESC             │
│                                                              │
│ Shows: All templates, marks which is default                 │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ├─→ User creates/edits template
                     │   Data saved to invoice_templates
                     │
                     └─→ Sets template as DEFAULT
                         Updates is_default = true
                         Updates other templates to is_default = false

┌──────────────────────────────────────────────────────────────┐
│ Jobs > Invoicing > Download Invoice                          │
├──────────────────────────────────────────────────────────────┤
│ Query: SELECT * FROM invoice_templates                       │
│        WHERE company_id = 1 AND is_default = true            │
│        ORDER BY created_at DESC LIMIT 1                      │
│                                                              │
│ Uses: Template styling, content, visibility settings         │
│       Applies to PDF generation immediately                  │
└──────────────────────────────────────────────────────────────┘
```

---

## Summary

✅ **Same Table**: Both pages read from `invoice_templates`  
✅ **Same Data**: InvoiceSettingsPage shows all, PDF uses the one marked `is_default = true`  
✅ **Real-time Sync**: Changes in settings immediately appear in PDF downloads  
✅ **Backend vs Direct**: Use `$1` syntax in Node.js code, use actual values in PostgreSQL  
✅ **Company-specific**: All templates are filtered by `company_id`
