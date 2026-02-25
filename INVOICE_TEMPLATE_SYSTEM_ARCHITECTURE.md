# Invoice Template System - Data Flow & Architecture

## 🔄 Complete Data Flow

### Creating/Editing a Template - Data Journey

```
USER INTERACTION
│
├─→ Browser: User clicks "+ New Template" or "Edit"
│   └─→ Modal opens: InvoiceTemplateEditorModal
│
├─→ Component: InvoiceTemplateEditorModal
│   ├─ Receives: templateId (if editing), onClose callback
│   ├─ Passes to: InvoiceTemplateEditor
│   │   ├─ isModal=true (stays in modal)
│   │   ├─ templateId (from props or URL)
│   │   └─ onSaveCallback (trigger parent refresh)
│   │
│   └─→ Component: InvoiceTemplateEditor
│       ├─ Gets companyId from: CompanyContext
│       ├─ If loading:
│       │   └─→ useEffect([companyId, templateId])
│       │       ├─ GET /api/invoice-templates/:companyId (list)
│       │       ├─ GET /api/invoice-templates/template/:id (details, if editing)
│       │       └─ GET /api/general-settings/:companyId (company logo)
│       │
│       └─ User fills form
│           ├─ Template name: "Professional Invoice"
│           ├─ Colors: #fbbf24, #ffffff, etc.
│           ├─ Toggles: show_line_items=true, etc.
│           └─ Content: document_title, default_footer, etc.
│
├─→ User clicks SAVE button
│   └─→ handleSave() triggered
│       ├─ Check: Is companyId available?
│       │  └─ If NO: Show error, return early
│       │  └─ If YES: Continue
│       │
│       ├─ Build payload:
│       │  {
│       │    company_id: 1,
│       │    name: "Professional Invoice",
│       │    main_color: "#fbbf24",
│       │    ... (all styling fields)
│       │    ... (all visibility toggles)
│       │    sections: []  // Line items template
│       │  }
│       │
│       ├─ Log payload to console (for debugging)
│       │
│       ├─ Determine action:
│       │  ├─ If currentTemplateId exists:
│       │  │   └─→ PUT /api/invoice-templates/:id
│       │  └─ If new template:
│       │      └─→ POST /api/invoice-templates
│       │
│       └─→ NETWORK REQUEST
│           │
│           ├─ Frontend adds headers:
│           │  ├─ Content-Type: application/json
│           │  ├─ Authorization: Bearer {token}
│           │  └─ (X-Company-Id: if impersonating)
│           │
│           └─→ BACKEND PROCESSING
│               │
│               ├─ Route: POST/PUT /api/invoice-templates/:id?
│               ├─ Middleware 1: requireAuth (validates JWT token)
│               ├─ Middleware 2: withDbContext (sets up database)
│               │
│               └─→ Controller: createTemplate or updateTemplate
│                   ├─ Extract fields from req.body
│                   ├─ Validate required fields
│                   ├─ If is_default=true:
│                   │   └─ UPDATE invoice_templates SET is_default=false WHERE company_id=$1
│                   │
│                   └─→ SQL INSERT/UPDATE
│                       INSERT INTO invoice_templates (
│                         company_id, name, main_color, ..., sections
│                       ) VALUES (...)
│                       RETURNING *;
│
│           ├─→ DATABASE: invoice_templates table
│           │   ├─ Stores all fields
│           │   ├─ Serializes sections as JSON string
│           │   └─ Returns inserted/updated row
│           │
│           ├─→ Response to Frontend:
│           │   ├─ Status: 201 (created) or 200 (updated)
│           │   └─ Body: Full template object with ID
│           │
│
├─→ Frontend receives response
│   ├─ Status 201 or 200: SUCCESS
│   │   ├─ Log "=== SAVE RESULT ==="
│   │   ├─ Update templateData state with response
│   │   ├─ Show success message (green notification)
│   │   ├─ Auto-dismiss after 3 seconds
│   │   ├─ In modal mode: Keep modal open for editing
│   │   ├─ In page mode: Navigate back to settings
│   │   └─ Call onSaveCallback if provided
│   │
│   └─ Status 4xx or 5xx: ERROR
│       ├─ Log error details
│       ├─ Show error message (red notification)
│       └─ Keep user in editor to retry
│
└─ RESULT
   ├─ Template saved in database
   ├─ Can be loaded by other components
   └─ PDF generation can use it
```

---

## 🗄️ Database Schema

### invoice_templates Table

```sql
TABLE invoice_templates (
  id                              SERIAL PRIMARY KEY,
  company_id                      INT NOT NULL,

  -- Identity
  name                            VARCHAR(255) NOT NULL,
  status                          VARCHAR(50) DEFAULT 'active',
  is_default                      BOOLEAN DEFAULT false,

  -- Styling: Colors
  main_color                      VARCHAR(7),        -- #RRGGBB
  accent_color                    VARCHAR(7),
  text_color                      VARCHAR(7),
  header_background_color         VARCHAR(7),
  border_color                    VARCHAR(7),
  table_header_background_color   VARCHAR(7),
  table_header_gradient_color     VARCHAR(7),
  table_header_text_color         VARCHAR(7),
  description_background_color    VARCHAR(7),
  description_border_color        VARCHAR(7),
  description_text_color          VARCHAR(7),

  -- Styling: Layout
  font_size                       VARCHAR(50),       -- small, medium, large
  orientation                     VARCHAR(50),       -- portrait, landscape
  border_width                    VARCHAR(50),       -- 1px, 2px, 3px
  table_header_style              VARCHAR(50),       -- solid, gradient
  indent_customer_address         BOOLEAN DEFAULT false,
  show_company_logo              BOOLEAN DEFAULT true,

  -- Content
  document_title                  VARCHAR(255),      -- "INVOICE", "QUOTE", etc.
  default_description             TEXT,              -- Template footer/notes
  default_footer                  TEXT,              -- Payment terms, etc.

  -- Visibility: Line Items
  show_line_items                 BOOLEAN DEFAULT true,
  show_line_quantities            BOOLEAN DEFAULT true,
  show_line_prices                BOOLEAN DEFAULT true,
  show_line_totals                BOOLEAN DEFAULT true,
  show_section_totals             BOOLEAN DEFAULT true,

  -- Visibility: Labour
  show_labour_items               BOOLEAN DEFAULT true,
  show_labour_quantities          BOOLEAN DEFAULT true,
  show_labour_prices              BOOLEAN DEFAULT true,
  show_labour_totals              BOOLEAN DEFAULT true,
  show_labour_section_totals      BOOLEAN DEFAULT true,

  -- Visibility: Materials
  show_material_items             BOOLEAN DEFAULT true,
  show_material_quantities        BOOLEAN DEFAULT true,
  show_material_prices            BOOLEAN DEFAULT true,
  show_material_totals            BOOLEAN DEFAULT true,
  show_material_section_totals    BOOLEAN DEFAULT true,

  -- Line Items Template (JSON)
  sections                        TEXT,              -- JSON array: [{id, name, items}]

  -- Metadata
  created_at                      TIMESTAMP DEFAULT NOW(),
  updated_at                      TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (company_id) REFERENCES companies(id),
  INDEX idx_company (company_id),
  INDEX idx_default (company_id, is_default)
);
```

---

## 🔐 Authentication Flow

### Token-Based Authentication (JWT)

```
Login Process:
1. User enters email & password → POST /api/auth/login
2. Backend validates credentials
3. Backend generates JWT token
4. Token stored in localStorage: localStorage.setItem('token', token)
5. Token sent with every API request in Authorization header

Authorization Header Format:
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
                        └─ "Bearer " prefix required
                        └─ Token must be stored in localStorage

API Client (services/api.ts):
- Gets token from localStorage
- Adds Authorization header automatically
- If token missing: Requests sent without auth (will fail with 401)
- If token expired: Backend returns 401 Unauthorized
  → User should be logged out and redirected to login page
```

---

## 🔗 API Endpoints

### Authorization Required: ✅ YES

#### List Templates

```
GET /api/invoice-templates/:companyId
Headers: Authorization: Bearer <token>
Response: [{ id, name, is_default, ... }, ...]
Status: 200
```

#### Get Single Template

```
GET /api/invoice-templates/template/:id
Headers: Authorization: Bearer <token>
Response: { id, name, main_color, ..., sections: [...] }
Status: 200
```

#### Create New Template

```
POST /api/invoice-templates
Headers:
  - Authorization: Bearer <token>
  - Content-Type: application/json

Body: {
  company_id: 1,
  name: "Professional",
  main_color: "#fbbf24",
  ... all other fields
  sections: []
}

Response: { id: 45, name: "Professional", ..., created_at: "2024..." }
Status: 201 Created
```

#### Update Existing Template

```
PUT /api/invoice-templates/:id
Headers:
  - Authorization: Bearer <token>
  - Content-Type: application/json

Body: {
  name: "Updated Name",
  main_color: "#ffffff",
  ... fields to update
}

Response: { id: 45, name: "Updated Name", ..., updated_at: "2024..." }
Status: 200 OK
```

#### Delete Template

```
DELETE /api/invoice-templates/:id
Headers: Authorization: Bearer <token>
Response: { message: "Template deleted" }
Status: 200 OK
```

---

## 🔍 Debugging Checklist

### ✅ Before Testing:

- [ ] Backend running: `npm run dev` in server/ folder
- [ ] Frontend running: `npm start` in root folder
- [ ] Both running without errors in terminal
- [ ] Can access http://localhost:3000 (frontend)
- [ ] Can access http://localhost:3001 (backend health check)

### ✅ During Testing:

- [ ] Browser DevTools open (F12)
- [ ] Console tab visible for logs
- [ ] Network tab ready to capture requests
- [ ] Logged in to the application
- [ ] Navigated to Settings > Invoice Templates

### ✅ After Clicking SAVE:

- [ ] Network tab shows POST or PUT request
- [ ] Status code is 201 (new) or 200 (update)
- [ ] Console shows no error messages
- [ ] Success notification appears and disappears
- [ ] New template appears in list after 2 seconds
- [ ] Modal closes and returns to settings view

### ✅ Verify Data Persisted:

- [ ] Refresh the page (Ctrl+R)
- [ ] Navigate back to Invoice Settings > Templates
- [ ] Template still appears in list
- [ ] Template details are preserved (colors, name, etc.)

### ✅ Database Verification:

```sql
-- Run in PostgreSQL client
SELECT id, company_id, name, is_default, main_color
FROM invoice_templates
WHERE company_id = 1
ORDER BY created_at DESC
LIMIT 5;
```

Expected: Your newly created template appears

---

## 🛠️ Component Dependencies

```
App.tsx
├─ Route: /dashboard/settings
│  └─ InvoiceSettingsPage
│     ├─ Tabs: General | Invoice Templates | Security | etc.
│     └─ Tabs.InvoiceTemplates:
│        ├─ InvoiceTemplatesList (loads via useEffect)
│        ├─ Button: "+ New Template"
│        │  └─ Opens: InvoiceTemplateEditorModal
│        └─ Template Items:
│           ├─ Button: "Edit"
│           │  └─ Opens: InvoiceTemplateEditorModal with templateId
│           └─ Button: "Delete"

InvoiceTemplateEditorModal (Wrapper)
├─ Props: isOpen, onClose, templateId?, onSave
├─ Shows: Modal overlay
├─ Includes: InvoiceTemplateEditor
└─ Handles: Modal closed event

InvoiceTemplateEditor (Full Editor Component)
├─ Props: isModal, onClose, templateId, onSave
├─ State:
│  ├─ currentTemplateId
│  ├─ templateData (all form fields)
│  ├─ companyData (logo, business name)
│  ├─ activeTab (styling/content/lineitems)
│  ├─ message (success/error notification)
│  └─ saving (button state)
├─ Effects:
│  ├─ Load templates list
│  ├─ Load template details (if editing)
│  ├─ Load company data (for logo)
│  └─ Reload logo when needed
└─ Handlers:
   ├─ handleSave: POST or PUT to backend
   ├─ handleSetAsDefault: Mark this as default
   ├─ handleInputChange: Update form state
   ├─ handleAddSection: Add new line items section
   └─ handleBack: Navigate back to settings
```

---

## 📊 State Management

### CompanyContext

Provides: `{ companyId, setCompanyId }`
Accessed by: InvoiceTemplateEditor
Purpose: Get company_id for backend requests

### AuthContext

Provides: `{ user, token, login, logout }`
Accessed by: API client (via localStorage)
Purpose: Obtain JWT token for authentication

### Component State (InvoiceTemplateEditor)

```tsx
const [currentTemplateId, setCurrentTemplateId] = useState(null);
const [templateData, setTemplateData] = useState<TemplateData>({...});
const [companyData, setCompanyData] = useState<CompanyData|null>(null);
const [activeTab, setActiveTab] = useState('styling');
const [message, setMessage] = useState<{type, text}|null>(null);
const [saving, setSaving] = useState(false);
const [loading, setLoading] = useState(true);
```

---

## 🎯 Success Criteria

Template save is working when:

✅ Click SAVE → Network shows 201/200 status
✅ Console shows "=== SAVE RESULT ===" logs
✅ Green success notification appears
✅ Template appears in list after modal closes
✅ Refresh page → Template still exists
✅ Edit template → Changes persist after save
✅ Set as default → Reflected in database query
✅ Download invoice → PDF uses template styling

---

## 🚨 Error States & Recovery

| Error                                   | Cause                 | Fix                          |
| --------------------------------------- | --------------------- | ---------------------------- |
| 401 Unauthorized                        | Token expired/invalid | Log out and log in           |
| 404 Not Found                           | Route doesn't exist   | Restart backend              |
| 500 Internal Error                      | Backend crash         | Check server terminal        |
| Network Error                           | Backend not running   | Start backend: `npm run dev` |
| Data persists but client doesn't reload | Cache issue           | Hard refresh: Shift+Ctrl+R   |

---

## 📝 Testing Scenarios

### Scenario 1: Create Simple Template

1. Click "+ New Template"
2. Enter name: "Simple"
3. Leave everything else default
4. Click SAVE
5. **Expected**: Template created, appears in list

### Scenario 2: Create Template with Custom Colors

1. Click "+ New Template"
2. Enter name: "Branded"
3. Change main color to red, accent to blue
4. Toggle "Show Line Items" OFF
5. Click SAVE
6. **Expected**: Template saved, colors appear in preview

### Scenario 3: Edit Existing Template

1. Click "Edit" on existing template
2. Change name to "Updated Name"
3. Change a color
4. Click SAVE
5. **Expected**: Changes reflect in list

### Scenario 4: Set as Default

1. Edit any template
2. Click "Set as default invoice"
3. Check database: `SELECT id, is_default FROM invoice_templates WHERE company_id = 1;`
4. **Expected**: Only one template has is_default = true

---

## 🔔 Important Notes

- **Backend must be running** on port 3001 for API calls to work
- **Token expires** - if you see 401 errors, refresh and log in again
- **Changes reload** - after successful save, related UI updates automatically
- **Sections as JSON** - line items template stored as JSON string in database
- **CORS enabled** - frontend can communicate with backend on different port
- **Database persistence** - all changes immediately persist in PostgreSQL
