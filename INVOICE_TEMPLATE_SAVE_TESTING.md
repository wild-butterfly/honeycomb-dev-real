# Invoice Template Save - Complete Testing & Debugging Guide

## ✅ Setup Verification

### Backend Routes Confirmed

✅ Route registered: `/api/invoice-templates` (with authentication)
✅ POST endpoint: Create new template → `createTemplate` controller
✅ PUT endpoint: Update template → `updateTemplate` controller
✅ Controllers exist and have logging

### Frontend API Client Confirmed

✅ API base URL: `http://localhost:3001/api`
✅ Token sent with Authorization header
✅ InvoiceTemplateEditor uses: `api.post()` and `api.put()`

---

## 🔍 Step-by-Step Testing

### STEP 1: Start the Backend Server

```bash
cd server
npm run dev
```

**Expected output:**

```
🚀 Honeycomb API running on http://localhost:3001
```

**If you see an error:**

- Check if port 3001 is already in use
- Try: `lsof -i :3001` (Mac/Linux) or search Windows Task Manager
- Kill the process or use a different port

---

### STEP 2: Start the Frontend

```bash
npm start
```

**Expected output:**

- React app opens at `http://localhost:3000`
- No console errors about API connectivity

---

### STEP 3: Open Browser DevTools

1. Press **F12** in your browser
2. Go to **Console** tab
3. Verify no errors on page load
4. You should see the console logging from your app

---

### STEP 4: Navigate to Invoice Settings

1. Click on **Settings** (gear icon or menu)
2. Click on **Invoice Settings** or similar
3. Click on **Invoice Templates** tab
4. Verify existing templates load

**What you should see:**

- A list of templates (or "No templates" message)
- "+ New Template" or "Create Template" button

**If templates don't load:**

- Open **Network** tab (F12)
- Look for request to `http://localhost:3001/api/invoice-templates/1`
- Check if it returns 200 OK or an error

---

### STEP 5: Create a New Template

1. Click **"+ New Template"** button
2. You should see the template editor form
3. Check browser console for logs

**What to look for in console:**

```
⚠️ Waiting for companyId to load...
```

If you see this many times (>5), that's a problem. If you see it once then disappear, that's normal.

---

### STEP 6: Fill in Template Details

1. **Template Name**: `Test Template 123`
2. Change a **color**: Click on any color selector and choose a new color
3. Change a **toggle**: Click on "Show Company Logo" or similar

**Check console:**
Should NOT see errors about missing companyId.

---

### STEP 7: Click SAVE Button

1. Click the **"SAVE"** button
2. **Immediately** go to browser Network tab (F12 → Network)
3. Look for a POST or PUT request to `/api/invoice-templates`

**What you should see:**

#### ✅ If SUCCESSFUL (Status 201 for new, 200 for update):

Request shows:

- Method: POST (new) or PUT (edit)
- URL: `/api/invoice-templates` or `/api/invoice-templates/123`
- Status: **201** (Created) or **200** (OK)
- Response body: Full template object with ID

Frontend shows:

- "Template created successfully!" message (green)
- Message auto-closes after 3 seconds
- Modal closes OR page navigates back

Console shows:

```
=== SAVE START ===
Template name: Test Template 123
Sections count: 0
Creating new template
=== SAVE RESULT ===
Result: {id: 45, name: "Test Template 123", ...}
Save complete
```

#### ❌ If FAILED:

**Error: Status 401 (Unauthorized)**

- Check: Is your authentication token still valid?
- Solution: Refresh page and log in again

**Error: Status 404 (Not Found)**

- The endpoint doesn't exist
- This shouldn't happen based on our review
- Solution: Restart backend server

**Error: Status 500 (Internal Server Error)**

- Backend crashed or database error
- Check backend terminal for error logs
- Common causes:
  - Missing required fields
  - Database connection issue
  - Invalid data format

**Error: Network request fails / No response**

- Backend server not running
- CORS blocked (check console for CORS error)
- Port mismatch (check if backend running on 3001)

---

## 🐛 Common Issues & Fixes

### Issue 1: "companyId is not available" Error

**Symptoms:**

- Save button clicked
- Error message: "Error: Company information not loaded. Please refresh the page."

**Solution:**

```
1. Close the modal/editor
2. Refresh entire page (Ctrl+R)
3. Navigate to Settings > Invoice Templates again
4. Try create/edit template
```

### Issue 2: Network Request Shows 400 (Bad Request)

**Symptoms:**

- Status: 400 in Network tab
- Response shows validation errors

**In Browser Console, Log the Payload:**

```javascript
// This will be logged automatically but also check for:
// "Saving template payload: { ... }"
```

**Common causes:**

- Missing required field (name, company_id, etc.)
- Fields have wrong data type (string instead of boolean)
- JSON serialization failed

### Issue 3: Save Button Shows "SAVING..." and Never Completes

**Symptoms:**

- Click SAVE
- Button text changes to "SAVING..."
- Button never returns to "SAVE"
- No error message

**Debugging:**

1. Open Network tab
2. Look for hanging request (not completed)
3. Check backend terminal - is it processing?
4. If backend frozen, restart it

### Issue 4: Success Message But Template Doesn't Appear in List

**Symptoms:**

- "Template created successfully!" appears
- But navigating back shows no new template

**Debugging:**

1. Check Network tab - did POST succeed (201)?
2. Check database directly:
   ```sql
   SELECT * FROM invoice_templates WHERE company_id = 1 ORDER BY created_at DESC LIMIT 1;
   ```
3. If template in DB but not in UI list, hard refresh: Ctrl+Shift+R

### Issue 5: Can Edit But Cannot Save Changes

**Symptoms:**

- Load existing template in editor
- Make changes
- Click SAVE
- Changes don't persist

**Debugging:**

1. Check Network tab - is it a PUT request?
2. Check backend logs for error
3. Verify fields have same data types as original template

---

## 🔧 Advanced Debugging

### Check Token Validity

```javascript
// Run in browser console
const token = localStorage.getItem("token");
console.log("Token exists:", !!token);
console.log("Token length:", token?.length);
console.log("First 50 chars:", token?.substring(0, 50));
```

Should show a token starting with `eyJ...` (JWT format).

### Check Company ID

```javascript
// Run in browser console
const companyId = localStorage.getItem("companyId");
console.log("Company ID:", companyId);
```

Should show a number like `1` or `2`.

### Manually Test API Endpoint

```javascript
// Run in browser console
const token = localStorage.getItem("token");
fetch("http://localhost:3001/api/invoice-templates/1", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
})
  .then((r) => r.json())
  .then(console.log)
  .catch(console.error);
```

Should return array of templates for company 1.

### Test Backend Directly (with curl)

```bash
TOKEN="your_actual_jwt_token"
curl -X GET http://localhost:3001/api/invoice-templates/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

---

## 📋 What to Share With Me

When you encounter an issue, please share:

1. **Screenshot of browser console (F12 → Console tab)**
   - Look for error messages
   - Copy any red errors

2. **Network tab details**
   - Which request failed?
   - What's the status code?
   - What's the response body?

3. **Backend terminal logs**
   - Any errors printed when you clicked SAVE?

4. **Steps to reproduce**
   - Exactly what you clicked
   - What happened vs. what you expected

---

## ✅ Success Checklist

After testing, verify:

- ✅ Backend server running on port 3001
- ✅ Frontend running on port 3000
- ✅ Can navigate to Invoice Settings > Templates
- ✅ Can see existing templates in list
- ✅ Can click "+ New Template" and see editor
- ✅ Can enter template name and change colors
- ✅ Network tab shows POST to `/api/invoice-templates` on SAVE
- ✅ Response status is 201 (new) or 200 (update)
- ✅ Success message appears
- ✅ New template appears in templates list
- ✅ Templates persist after page refresh
- ✅ Can download invoice and verify it uses template styling

---

## 🎯 Next Actions

1. **Follow STEP 1-7 above**
2. **Run the test**
3. **Take a screenshot of:**
   - Console tab (F12)
   - Network tab showing the POST/PUT request
   - Any error messages
4. **Tell me what happened and share the screenshots**

I can then help debug the specific issue!
