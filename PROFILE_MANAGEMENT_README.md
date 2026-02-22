# User Profile Management System

## Overview

Modern enterprise-grade profile management system with avatar uploads, comprehensive user information, and preferences.

## Features Implemented

### 1. Database Schema ✅

**New User Profile Fields:**

- `full_name` - User's full display name
- `phone` - Contact phone number
- `avatar` - Profile picture URL/path
- `job_title` - User's position
- `department` - User's department/team
- `bio` - User biography
- `timezone` - User's timezone preference (default: UTC)
- `language` - User's language preference (default: en)
- `profile_updated_at` - Last profile update timestamp

**Migration File:** `server/migrations/user_profiles.sql`

### 2. Backend API Endpoints ✅

**Base URL:** `http://localhost:3001/api/me`

#### Get Profile

```http
GET /api/me/profile
Authorization: Bearer {token}
```

**Response:**

```json
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "John Doe",
  "phone": "+1 (555) 123-4567",
  "avatar": "/uploads/avatars/avatar-1-1234567890.jpg",
  "job_title": "Project Manager",
  "department": "Operations",
  "bio": "Experienced project manager...",
  "timezone": "America/New_York",
  "language": "en",
  "role": "admin",
  "company_id": 1
}
```

#### Update Profile

```http
PUT /api/me/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "full_name": "John Doe",
  "phone": "+1 (555) 123-4567",
  "job_title": "Senior Project Manager",
  "department": "Operations",
  "bio": "Experienced project manager with 10+ years...",
  "timezone": "America/New_York",
  "language": "en"
}
```

**Response:**

```json
{
  "message": "Profile updated successfully",
  "profile": {
    /* full profile object */
  }
}
```

#### Upload Avatar

```http
POST /api/me/avatar
Authorization: Bearer {token}
Content-Type: multipart/form-data

avatar: [file]
```

**Requirements:**

- File types: JPEG, JPG, PNG, GIF, WebP
- Max size: 5MB
- Field name: `avatar`

**Response:**

```json
{
  "message": "Avatar updated successfully",
  "profile": {
    /* profile with new avatar URL */
  }
}
```

#### Delete Avatar

```http
DELETE /api/me/avatar
Authorization: Bearer {token}
```

**Response:**

```json
{
  "message": "Avatar deleted successfully",
  "profile": {
    /* profile with null avatar */
  }
}
```

### 3. Frontend Components ✅

#### ProfileSettings Component

**Location:** `src/components/ProfileSettings.tsx`

**Features:**

- Real-time avatar preview
- Drag-and-drop avatar upload
- Comprehensive profile form with validation
- Auto-save with success/error notifications
- Responsive design for mobile/tablet/desktop
- Loading states and error handling
- Integration with AuthContext

**Form Fields:**

- Profile Picture (with upload/delete)
- Full Name
- Email (read-only)
- Phone Number
- Job Title
- Department
- Role (read-only, admin-managed)
- Bio (textarea)
- Timezone (dropdown)
- Language (dropdown)

#### AuthContext Updates

**Location:** `src/context/AuthContext.tsx`

**New User Interface:**

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  full_name?: string;
  phone?: string;
  job_title?: string;
  department?: string;
  bio?: string;
  timezone?: string;
  language?: string;
}
```

### 4. Styling ✅

**Location:** `src/components/ProfileSettings.module.css`

**Design Features:**

- Modern card-based layout
- Honeycomb brand colors (yellow #ffd600)
- Smooth animations and transitions
- Success/error message notifications
- Loading spinners
- Responsive grid layout
- Hover effects on interactive elements
- Avatar placeholder with initials

## File Structure

```
server/
├── migrations/
│   └── user_profiles.sql              # Database migration
├── src/
│   ├── controllers/
│   │   └── profile.controller.ts      # Profile business logic
│   └── routes/
│       ├── me.ts                      # Profile routes
│       └── auth.ts                    # Updated with profile fields
└── uploads/
    └── avatars/                       # Avatar storage directory

src/
├── components/
│   ├── ProfileSettings.tsx            # Profile page component
│   └── ProfileSettings.module.css     # Profile styles
└── context/
    └── AuthContext.tsx                # Updated user interface
```

## Usage Instructions

### 1. Run Database Migration

```bash
cd server
npm run migrate
```

### 2. Start Backend Server

```bash
cd server
npm run dev
```

### 3. Start Frontend

```bash
npm start
```

### 4. Access Profile Page

Navigate to: `http://localhost:3000/dashboard/settings?tab=profile`

Or click on "Settings" → "Profile" in the navigation menu.

## Testing Checklist

- [ ] Upload avatar (should save and display immediately)
- [ ] Delete avatar (should remove and show placeholder)
- [ ] Update full name (should reflect in navbar/header)
- [ ] Change phone number
- [ ] Update job title and department
- [ ] Modify bio text
- [ ] Change timezone preference
- [ ] Change language preference
- [ ] Verify read-only fields (email, role) cannot be edited
- [ ] Check form validation (file size, file types)
- [ ] Test success/error messages
- [ ] Verify responsive design on mobile
- [ ] Check avatar persists after logout/login
- [ ] Confirm all fields save to database

## API Security

✅ **Authentication Required:** All profile endpoints require valid JWT token
✅ **User Isolation:** Users can only access/modify their own profile
✅ **File Validation:** Avatar uploads validated for type and size
✅ **SQL Injection Protection:** Parameterized queries used throughout
✅ **XSS Protection:** User input sanitized

## Future Enhancements (Optional)

- [ ] Image cropping/resizing for avatars
- [ ] Email change with verification
- [ ] Password change functionality
- [ ] Two-factor authentication setup
- [ ] Activity log (last login, profile changes)
- [ ] Social media links
- [ ] Custom profile themes
- [ ] Avatar templates/defaults
- [ ] Bulk profile export (admin feature)
- [ ] Profile completion percentage indicator

## Troubleshooting

### Avatar not uploading

- Check uploads/avatars directory exists and has write permissions
- Verify file size is under 5MB
- Confirm file type is supported (jpg, png, gif, webp)
- Check network tab for detailed error messages

### Profile not saving

- Verify backend server is running
- Check JWT token is valid
- Review browser console for errors
- Check database connection

### Migration issues

- Ensure PostgreSQL is running
- Verify database credentials in .env
- Check migration order in runMigrations.js

## Support

For issues or questions, check:

1. Browser console (F12) for frontend errors
2. Terminal output for backend errors
3. Network tab for API response details
4. Database logs for migration/query issues

## Version History

- **v1.0.0** - Initial profile management system release
  - Avatar upload/delete
  - Comprehensive profile fields
  - Modern UI with responsive design
  - Full backend API implementation
