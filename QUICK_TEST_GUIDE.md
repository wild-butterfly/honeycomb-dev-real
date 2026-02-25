# Invoice Template Save - QUICK TEST GUIDE

## 🚀 30-Second Setup

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
npm start
```

Wait for both to finish starting. Should see:

- Backend: `🚀 Honeycomb API running on http://localhost:3001`
- Frontend: Browser opens http://localhost:3000 automatically

---

## 🧪 60-Second Test

### Step 1: Open DevTools

- Press **F12**
- Click **Console** tab
- Clear any messages

### Step 2: Navigate to Templates

1. Settings → Invoice Settings → Invoice Templates tab
2. Verify templates load and list appears

### Step 3: Create Test Template

1. Click **"+ New Template"** (or similar button)
2. Enter name: **TEST_TEMPLATE_001**
3. Click any color and pick a different color
4. In browser console, verify you do NOT see:
   ```
   ❌ Cannot save: companyId is not available
   ```

### Step 4: Click SAVE and Monitor

**STEP 4A: Watch Browser Console**

```
Look for: "=== SAVE START ===" with proper logs
```

**STEP 4B: Watch Network Tab**

1. Click **Network** tab (F12 → Network)
2. Scroll to see the request
3. Look for POST to `/api/invoice-templates` or `/invoice-templates`

**Expected Response Status:**

- ✅ 201 Created (new template)
- ✅ 200 OK (if updating)
- ❌ 401 Unauthorized (token issue)
- ❌ 404 Not Found (endpoint missing)
- ❌ 500 Internal Server Error (backend issue)

### Step 5: Check Result

- ✅ Success: Green "Template created successfully!" message appears
- ❌ Error: Red error message appears with details

---

## 🔍 What to Look For

### ✅ SUCCESS Path

```
Browser Console:
  ==> "Creating new template"
  ==> "=== SAVE RESULT ==="
  ==> "Result: {id: 45, name: "TEST_TEMPLATE_001", ...}"

Network Tab:
  ==> POST /api/invoice-templates
  ==> Status: 201 Created
  ==> Response: Full template object

UI:
  ==> Green notification: "Template created successfully!"
  ==> Modal closes after 3 seconds
  ==> New template in list

Database:
  SELECT * FROM invoice_templates
  WHERE name = 'TEST_TEMPLATE_001';
  ==> Returns 1 row
```

### ❌ FAILURE Scenarios

#### 1. Missing companyId

```
Console Error:
  ❌ Cannot save: companyId is not available

Fix:
  1. Close modal
  2. Refresh page (Ctrl+R)
  3. Try again
```

#### 2. API Unreachable

```
Network Tab:
  POST /api/invoice-templates → Status: (failed/error)

Console Error:
  Failed to fetch / Network error

Fix:
  1. Check if backend running: `npm run dev` in server/
  2. Verify port 3001 not in use
  3. Restart backend and try again
```

#### 3. Authentication Failed

```
Network Tab:
  POST /api/invoice-templates → Status: 401 Unauthorized

Fix:
  1. Log out (Settings → Logout)
  2. Log in again
  3. Try again
```

#### 4. Validation Error

```
Network Tab:
  POST /api/invoice-templates → Status: 400 Bad Request

Response Body:
  {"error": "Validation failed: ..."}

Fix:
  1. Check required fields filled:
     - Template name
     - Company ID
     - Colors (may have defaults)
  2. Try again with simple data
```

#### 5. Database Error

```
Network Tab:
  POST /api/invoice-templates → Status: 500 Internal Server Error

Backend Terminal:
  Error: database connection / query error

Fix:
  1. Check if PostgreSQL running
  2. Restart backend
  3. Clear browser cache and retry
```

---

## 📸 Screenshot Guide

Take these screenshots and share for debugging:

### 1. Browser Console (F12 → Console)

- Copy anything in red
- Copy the last 10 log lines
- Look for "=== SAVE START ===" section

### 2. Network Tab (F12 → Network)

- Find the POST/PUT request to `/invoice-templates`
- Right-click request → Copy as cURL
- Share the full request details

### 3. Response Body (Network tab)

- Click on request
- Go to **Response** tab
- Copy the JSON response

### 4. Backend Terminal Output

- Any errors printed when SAVE clicked?
- Copy the error message

---

## 🎯 Success Indicators

### ✅ Template Saved Successfully:

1. Network shows 201/200 status
2. Console shows "SAVE RESULT" with template ID
3. Template appears in list
4. Refresh page → Template still there
5. Database query returns the template

### ❌ Template NOT Saved:

1. Network shows 4xx/5xx status
2. Console shows red "Error" message
3. ERROR red notification appears in UI
4. Refresh page → Template gone
5. Database query returns empty

---

## 🔧 Quick Diagnostics

### Check Backend Running

```bash
# Should return "Honeycomb API running 🚀"
curl http://localhost:3001/
```

### Check Database Connected

```bash
# Should list invoices
curl -X GET http://localhost:3001/api/invoices \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Check Token Valid

```javascript
// In browser console (F12)
localStorage.getItem("token"); // Should show token starting with "eyJ..."
localStorage.getItem("companyId"); // Should show "1" or similar
```

---

## 📋 Troubleshooting Checklist

Before debugging further:

- [ ] Backend running: `npm run dev` (see rocket emoji ✓)
- [ ] Frontend running: `npm start` (browser opens ✓)
- [ ] Logged in to app (see user name/dashboard ✓)
- [ ] Can see existing templates (list loads ✓)
- [ ] Browser console open (F12 visible ✓)
- [ ] Network tab ready (showing requests ✓)

Then:

- [ ] Click "+ New Template"
- [ ] Enter template name
- [ ] Change 1 color to verify field works
- [ ] Click SAVE button
- [ ] Check Network tab for POST status
- [ ] Check Console for errors
- [ ] Note any error messages exactly

---

## 📞 When Sharing Issue

Include these details:

1. **What you did** (exact steps)
2. **What happened** (what you saw)
3. **What you expected** (what should happen)
4. **Network status code** (201, 400, 401, 500, etc.)
5. **Error message from console** (copy red text)
6. **Backend terminal output** (any error logs)
7. **Screenshots** of:
   - Browser console with errors
   - Network tab with request/response
   - UI error message if any

---

## 🚨 Critical Error Messages & Fixes

| Error                                        | Root Cause            | Solution                           |
| -------------------------------------------- | --------------------- | ---------------------------------- |
| `❌ Cannot save: companyId is not available` | Context loading delay | Refresh page, try again            |
| `Status: 401`                                | Token expired         | Log out and log in again           |
| `Status: 404`                                | Endpoint not found    | Restart backend server             |
| `Status: 500`                                | Backend crash         | Check backend terminal, restart    |
| `Failed to fetch`                            | Backend not running   | Run `npm run dev` in server/       |
| `CORS error`                                 | Origin not allowed    | Check backend index.ts CORS config |
| `Template not in list after save`            | Client cache          | Hard refresh: Shift+Ctrl+R         |

---

## ✅ Final Test

Run this complete test:

```
1. Create template: "FINAL_TEST_001"
2. Set main color to: #FF0000 (red)
3. Toggle one visibility setting OFF
4. Click SAVE
5. Check Network tab → See 201 status?
6. Check Console → See "SAVE RESULT" logs?
7. Check UI → See green success message?
8. Close modal → Template in list?
9. Refresh page → Template still there?
10. Query database → Template in table?

If ALL 10 pass: ✅ System working correctly!
If any fail: Share which step failed + screenshots
```

Done! Now follow the steps above and let me know what you find! 🚀
