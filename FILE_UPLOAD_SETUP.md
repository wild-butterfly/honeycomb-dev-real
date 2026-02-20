# File Upload Setup Guide

## Local Storage (Development)

### 1. Run Database Migration

```sql
psql -U your_user -d honeycomb < server/migrations/job_files.sql
```

### 2. Environment Variables (Optional)

Create `server/.env` and add (or keep defaults):

```env
STORAGE_TYPE=local
UPLOAD_DIR=./uploads
BASE_URL=http://localhost:3001
```

### 3. Start Server

```bash
cd server
npm run build
npm start
```

The server will:

- Create `uploads/temp/` and `uploads/jobs/` directories automatically
- Serve files at `http://localhost:3001/uploads/`

## Cloudflare R2 (Production)

### 1. Create R2 Bucket

1. Go to Cloudflare Dashboard → R2
2. Create bucket: `honeycomb-files`
3. Generate R2 API tokens

### 2. Update Environment Variables

```env
STORAGE_TYPE=r2
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=honeycomb-files
R2_PUBLIC_URL=https://pub-xxx.r2.dev
```

### 3. Install AWS SDK (when ready for R2)

```bash
cd server
npm install @aws-sdk/client-s3
```

### 4. Enable R2 in storage.ts

Uncomment R2 upload/delete code in `server/src/config/storage.ts`

## API Endpoints

- **GET** `/api/jobs/:jobId/files?folder=documents` - List files
- **POST** `/api/jobs/:jobId/files` - Upload files (multipart/form-data)
- **DELETE** `/api/files/:id` - Delete single file
- **DELETE** `/api/jobs/:jobId/files/batch` - Delete multiple files

## File Structure

```
server/
├── uploads/
│   ├── temp/              # Temporary upload location
│   └── jobs/
│       └── {jobId}/
│           ├── documents/
│           ├── photos/
│           ├── reports/
│           └── invoices/
```

## Supported File Types

- Images: jpg, png, gif, webp
- Documents: pdf, doc, docx, xls, xlsx, csv
- Videos: mp4, mov
- Max size: 20MB per file
- Max files: 10 per upload

## Migration Path: Local → R2

**No code changes needed!** Just:

1. Change `STORAGE_TYPE=r2` in .env
2. Set R2 credentials
3. Restart server

Existing code works with both storage types.
