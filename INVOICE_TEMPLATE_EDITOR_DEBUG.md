# Invoice Template Editor - Debug & Fix Guide

## Problem

When you try to create or edit an invoice template in Settings > Invoice Settings > Invoice Templates, the data is not being saved to the backend.

## What I Fixed

1. ✅ Added better error handling when `companyId` is missing
2. ✅ Added error message display instead of silent failure
3. ✅ Added logging for debugging

## How to Debug - Follow These Steps

### Step 1: Open Browser Developer Console

1. In your browser, press **F12** or **Right-click > Inspect**
2. Go to the **Console** tab
3. Clear any old messages

### Step 2: Try to Create/Edit a Template

1. Go to Settings > Invoice Settings > Templates
2. Click "+ New Template" or edit an existing one
3. Change something (e.g., change the template name)
4. Click **"SAVE"** button

### Step 3: Check the Console Logs

**Look for these key messages:**

#### ✅ If save is working, you should see:

```
=== SAVE START ===
Template name: Your Template Name
Sections count: 0
show_company_logo: true
show_line_items: true
...
Saving template payload: { ...all your data... }
Creating new template
=== SAVE RESULT ===
Result: {id: 45, name: "Your Template", ...}
Save complete
Updating templateData with result
```

**Then you should see success message in the UI**: "Template created successfully!"

---

#### ❌ If save is NOT working, look for error messages:

### **Error 1: Missing companyId**

```
❌ Cannot save: companyId is not available
```

**What it means**: The app lost context about which company you're editing for

**Solution**:

- Refresh the page (Ctrl+R or Cmd+R)
- Try again

### **Error 2: Network / API Error**

```
Error saving template: Failed to fetch
OR
Error saving template: 404 Not Found
OR
Error saving template: 500 Internal Server Error
```

**Solution**:

- Click the **Network** tab in DevTools
- Try to save again
- Look for the request to `/invoice-templates` (POST for new, PUT for edit)
- Check if it shows a green checkmark (200) or red with an error code

### **Error 3: Missing Authentication**

```
Error saving template: 401 Unauthorized
```

**Solution**:

- You need to be logged in
- Refresh the page and log in again

---

## Advanced Debugging

### Check if API endpoint is reachable

Open console and run:

```javascript
fetch("http://localhost:3001/api/invoice-templates", {
  method: "GET",
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  },
})
  .then((r) => r.json())
  .then(console.log)
  .catch(console.error);
```

If it returns data, the API is working.

### Check if companyId is available

Run in console:

```javascript
console.log("Company ID:", localStorage.getItem("companyId"));
```

Should show a number like `1` or `2`.

### Check authentication token

Run in console:

```javascript
console.log("Token:", localStorage.getItem("token")?.substring(0, 20) + "...");
```

Should show something like: `eyJhbGciOiJIUzI1NiIs...`

---

## Expected Flow

### Creating New Template:

```
1. User clicks "+ New Template"
   ↓
2. InvoiceTemplateEditorModal opens
   ↓
3. User fills in template details
   ↓
4. User clicks "SAVE"
   ↓
5. Frontend logs: "Creating new template"
   ↓
6. Frontend sends POST to /api/invoice-templates
   ↓
7. Backend creates template in database
   ↓
8. Backend returns created template with ID
   ↓
9. Frontend shows: "Template created successfully!"
   ↓
10. Modal closes (for modal mode) OR redirects back (for full page)
   ↓
11. New template appears in templates list
```

### Editing Existing Template:

```
1. User clicks "Edit" on a template
   ↓
2. InvoiceTemplateEditorModal opens with template data
   ↓
3. User modifies template settings
   ↓
4. User clicks "SAVE"
   ↓
5. Frontend logs: "Updating existing template: 45"
   ↓
6. Frontend sends PUT to /api/invoice-templates/45
   ↓
7. Backend updates template in database
   ↓
8. Backend returns updated template
   ↓
9. Frontend shows: "Changes saved successfully!"
   ↓
10. Modal stays open for continued editing
```

---

## Common Issues & Solutions

### Issue: "companyId is not available"

**Cause**: CompanyContext not properly initialized when modal opens
**Fix**:

```
1. Close the modal
2. Refresh entire page (Ctrl+R)
3. Navigate to Settings > Invoice Settings again
4. Try to create/edit template
```

### Issue: Data not persisting in database

**Check**:

1. Open PostgreSQL and run:
   ```sql
   SELECT * FROM invoice_templates WHERE company_id = 1 ORDER BY created_at DESC LIMIT 5;
   ```
2. Should show your newly created templates

### Issue: API returning 404

**Check**: Backend server is running

```bash
# In server/src terminal
npm run dev
```

---

## Verify Backend is Accepting Requests

### Test creating a template via curl

```bash
curl -X POST http://localhost:3001/api/invoice-templates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "company_id": 1,
    "name": "Test Template",
    "is_default": false,
    "status": "active",
    "document_title": "INVOICE",
    "table_header_background_color": "#fbbf24",
    "table_header_text_color": "#ffffff",
    "text_color": "#000000",
    "show_line_items": true,
    "show_line_quantities": true,
    "show_line_prices": true,
    "show_line_totals": true
  }'
```

If successful, you'll get back the created template with an `id`.

---

## Next Steps

1. ✅ I've added better error messages - try to save again
2. ✅ Check browser console (F12) for any error messages
3. ✅ Let me know what error messages you see
4. ✅ I can then help fix the specific issue

Share any error messages you see and I'll help fix them!
