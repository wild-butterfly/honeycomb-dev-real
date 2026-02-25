# Template "Set as Default" Debugging Guide

## Current Status

- **Database**: Template ID 5 is now marked as `is_default=TRUE` ✅
- **PDF Generation**: Query will return template ID 5 with custom colors ✅
- **Issue**: UI button "Set as Default" fails with "null value in column 'name'" error

## Root Cause Analysis

The error occurs because:

1. Frontend loads template, but `templateData.name` might be undefined/null
2. Frontend prepares payload with `...templateData` which may not include name
3. Backend receives update with `name = null` or `name = undefined`
4. PostgreSQL constraint violation: NOT NULL check fails

## Fixes Applied

### Frontend Fixes (InvoiceTemplateEditor.tsx)

1. **Line 225**: Fixed buggy name assignment
   - **Before**: `template.name = template.name || "Invoice Template 1"` (no-op)
   - **After**: `template.name = "Invoice Template 1"` (actual assignment)

2. **Line 330**: Added safeguard in templateWithDefaults
   - Explicitly ensures name is non-empty string: `name: template.name && template.name.trim() ? template.name : "Invoice Template 1"`

3. **Lines 787-792**: Enhanced logging in handleSetAsDefault
   - Logs `templateData.name` type and value
   - Logs complete payload being sent

### Backend Fixes (invoiceTemplate.controller.ts)

1. **Lines 315-319**: Enhanced validation
   - Checks if name is a string: `typeof name !== 'string'`
   - Better error message explaining the type issue

## Testing Steps

### Step 1: Verify Frontend Loads Template Correctly

```
1. Open browser DevTools (F12)
2. Go to Settings > Invoice Templates
3. Click Edit on "Invoice Template 1"
4. Check console for logs starting with "=== LOADING TEMPLATE: 5 ==="
5. Verify console shows:
   - "Loaded name: Invoice Template 1"
   - "Template with defaults:" includes name property
```

### Step 2: Verify Payload is Built Correctly

```
1. User still in editor
2. Scroll down and click "Set as default invoice" button
3. Check console for "=== SETTING AS DEFAULT ===" logs
4. Verify logs show:
   - "Current templateData.name: Invoice Template 1"
   - "Full payload:" includes `name: "Invoice Template 1"`
```

### Step 3: Check Backend Response

```
1. Check Network tab (F12 > Network)
2. Look for PUT request to `/api/invoice-templates/5`
3. Check Request payload includes name
4. Check Response status:
   - SUCCESS (200): Should show template with is_default=true
   - ERROR (400): Should show detailed error about what failed
   - ERROR (DB): Would show query error
```

### Step 4: Verify Database Changed

```
From browser console:
- Open Settings > Invoice Templates
- Any template list should show Template 5 marked as default

From terminal:
cd server
node -r ts-node/register -e "
const { pool } = require('./src/db');
(async () => {
  const result = await pool.query(
    'SELECT id, name, is_default FROM invoice_templates WHERE company_id = 1'
  );
  result.rows.forEach(r => console.log('ID:', r.id, '| Name:', r.name, '| Default:', r.is_default));
  process.exit(0);
})();
"
```

## Expected Outcomes After Fix

### Successful Scenario

1. User clicks "Set as Default"
2. Console shows payload includes complete template data with name
3. Network shows PUT 200 OK response
4. Database shows template ID 5 with is_default = true
5. Next invoice PDF will use template ID 5 colors

### If Still Failing

1. Check console for actual name value received
2. Check backend logs for "About to update template" - shows what was received
3. May indicate data serialization issue in payload

## Current Template Data

- **Template ID 5**:
  - Name: "Invoice Template 1"
  - Main Color: #fbbf24 (custom amber color)
  - Header Background: #fffef7 (custom off-white)
  - Text Color: #000000 (black)
  - Document Title: "Tax Invoice"

This should appear in the next PDF invoice generated.
