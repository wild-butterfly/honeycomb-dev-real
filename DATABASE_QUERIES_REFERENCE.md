# Database Queries Reference - Invoice Templates

## Overview

Both **InvoiceSettingsPage** and **PDF Download** use the same database table: `invoice_templates`

---

## Database Queries Used

### 1. **LIST ALL TEMPLATES FOR A COMPANY** (InvoiceSettingsPage)

**File**: `server/src/controllers/invoiceTemplate.controller.ts` - `getCompanyTemplates()`  
**Route**: `GET /invoice-templates/:companyId`  
**Used by**: Invoice Settings Page - Templates Tab

```sql
SELECT * FROM invoice_templates
WHERE company_id = $1
ORDER BY is_default DESC, created_at DESC
```

**Parameters**:

- `$1` = company_id

**What it returns**:

- All templates for the company
- Default template appears first
- Order by most recently created

---

### 2. **GET DEFAULT TEMPLATE FOR PDF GENERATION** (PDF Download)

**File**: `server/src/controllers/pdf.controller.ts` - `generateInvoicePdf()`  
**Route**: `GET /api/invoices/:id/pdf`  
**Used by**: Invoice Download Button

```sql
SELECT * FROM public.invoice_templates
WHERE company_id = $1 AND is_default = true
ORDER BY created_at DESC LIMIT 1
```

**Parameters**:

- `$1` = invoice.company_id

**What it returns**:

- Only the DEFAULT template for the company
- Used to style the PDF with custom colors and content

---

### 3. **GET A SINGLE TEMPLATE** (Template Editor)

**File**: `server/src/controllers/invoiceTemplate.controller.ts` - `getTemplate()`  
**Route**: `GET /invoice-templates/template/:id`  
**Used by**: InvoiceTemplateEditor when editing a template

```sql
SELECT * FROM invoice_templates
WHERE id = $1
```

**Parameters**:

- `$1` = template id

**What it returns**:

- Complete template data including all styling and content settings

---

### 4. **CREATE NEW TEMPLATE**

**File**: `server/src/controllers/invoiceTemplate.controller.ts` - `createTemplate()`  
**Route**: `POST /invoice-templates`

```sql
-- First: If setting as default, unset other defaults
UPDATE invoice_templates
SET is_default = false
WHERE company_id = $1

-- Then: Insert new template
INSERT INTO invoice_templates (
  company_id, name, is_default, status,
  main_color, accent_color, text_color, font_size,
  indent_customer_address, orientation,
  header_background_color, border_color, border_width,
  table_header_background_color, table_header_gradient_color,
  table_header_text_color, table_header_style,
  description_background_color, description_border_color, description_text_color,
  show_company_logo,
  document_title,
  show_line_quantities, show_line_prices, show_line_totals,
  show_section_totals, show_line_items,
  show_labour_quantities, show_labour_prices, show_labour_totals,
  show_labour_section_totals, show_labour_items,
  show_material_quantities, show_material_prices, show_material_totals,
  show_material_section_totals, show_material_items,
  default_description, default_footer, sections
) VALUES (...)
RETURNING *
```

---

### 5. **UPDATE TEMPLATE**

**File**: `server/src/controllers/invoiceTemplate.controller.ts` - `updateTemplate()`  
**Route**: `PUT /invoice-templates/:id`

```sql
-- If setting as default, unset other defaults for company
UPDATE invoice_templates
SET is_default = false
WHERE company_id = $1 AND id != $2

-- Then update the template
UPDATE invoice_templates
SET name = $1, is_default = $2, status = $3, ... (all columns)
WHERE id = $N
RETURNING *
```

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

---

## How They Work Together

```
┌──────────────────────────────────────────────────────────────┐
│ User navigates to Invoice Settings > Invoice Templates       │
├──────────────────────────────────────────────────────────────┤
│ Query #1: LIST ALL TEMPLATES (getCompanyTemplates)          │
│ Shows all templates, marks which is default                  │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ├─→ User clicks "+ New Template" or "Edit"
                     │   Query #3: GET SINGLE TEMPLATE (getTemplate)
                     │   Loads template data into editor
                     │
                     └─→ User saves template
                         Query #4 or #5: CREATE or UPDATE
                         Saves to database
                         Sets as default if selected

┌──────────────────────────────────────────────────────────────┐
│ User downloads invoice from Jobs > Invoicing page            │
├──────────────────────────────────────────────────────────────┤
│ Query #2: GET DEFAULT TEMPLATE (generateInvoicePdf)         │
│ Fetches the DEFAULT template for company                     │
│ Uses styling, content, and visibility settings               │
│ Applies to PDF generation                                    │
└──────────────────────────────────────────────────────────────┘
```

---

## Quick Database Check Commands

### Check all templates for your company

```sql
SELECT id, name, is_default, status, created_at
FROM invoice_templates
WHERE company_id = YOUR_COMPANY_ID
ORDER BY is_default DESC, created_at DESC;
```

### Check which template is marked as default

```sql
SELECT id, name, company_id, is_default, table_header_background_color,
       text_color, document_title, default_description, default_footer
FROM invoice_templates
WHERE company_id = YOUR_COMPANY_ID AND is_default = true;
```

### Check all template details

```sql
SELECT *
FROM invoice_templates
WHERE company_id = YOUR_COMPANY_ID
ORDER BY created_at DESC;
```

### Count templates per company

```sql
SELECT company_id, COUNT(*) as total_templates,
       SUM(CASE WHEN is_default = true THEN 1 ELSE 0 END) as default_count
FROM invoice_templates
GROUP BY company_id;
```

### Check if template has all visibility columns populated

```sql
SELECT id, name,
       show_line_items, show_line_quantities, show_line_prices, show_line_totals,
       show_labour_items, show_labour_quantities, show_labour_prices, show_labour_totals,
       show_material_items, show_material_quantities, show_material_prices, show_material_totals
FROM invoice_templates
WHERE company_id = YOUR_COMPANY_ID;
```

---

## Summary

✅ **Both pages use the SAME table**: `invoice_templates`  
✅ **InvoiceSettingsPage**: Uses Query #1 to list all templates  
✅ **PDF Download**: Uses Query #2 to fetch the DEFAULT template  
✅ **Both queries read from same columns** - Colors, content, and visibility settings  
✅ **Data consistency**: Changes made in template editor immediately apply to PDF downloads
