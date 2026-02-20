// server/src/config/storage.ts
// File storage configuration - supports local and Cloudflare R2
// Easy migration: change STORAGE_TYPE env var from 'local' to 'r2'

import path from "path";
import fs from "fs/promises";

export type StorageType = "local" | "r2";

export interface StorageConfig {
  type: StorageType;
  local?: {
    uploadDir: string;
    baseUrl: string;
  };
  r2?: {
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
    publicUrl: string;
  };
}

// Get storage config from environment
export const storageConfig: StorageConfig = {
  type: (process.env.STORAGE_TYPE as StorageType) || "local",
  
  local: {
    uploadDir: process.env.UPLOAD_DIR || path.join(__dirname, "../../uploads"),
    baseUrl: process.env.BASE_URL || "http://localhost:3001",
  },
  
  r2: {
    accountId: process.env.R2_ACCOUNT_ID || "",
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    bucketName: process.env.R2_BUCKET_NAME || "honeycomb-files",
    publicUrl: process.env.R2_PUBLIC_URL || "",
  },
};

// Ensure upload directory exists for local storage
export async function ensureUploadDir() {
  if (storageConfig.type === "local" && storageConfig.local) {
    try {
      await fs.mkdir(storageConfig.local.uploadDir, { recursive: true });
      
      // Also create temp directory for multer
      const tempDir = path.join(storageConfig.local.uploadDir, "temp");
      await fs.mkdir(tempDir, { recursive: true });
      
      console.log(`✅ Upload directory ready: ${storageConfig.local.uploadDir}`);
    } catch (err) {
      console.error("❌ Failed to create upload directory:", err);
      throw err;
    }
  }
}

// Generate file URL based on storage type
export function getFileUrl(filePath: string): string {
  if (storageConfig.type === "r2" && storageConfig.r2) {
    // R2: Return public URL
    return filePath.startsWith("http") ? filePath : `${storageConfig.r2.publicUrl}/${filePath}`;
  } else if (storageConfig.local) {
    // Local: Return server URL
    return `${storageConfig.local.baseUrl}/uploads/${filePath}`;
  }
  return filePath;
}

// Generate storage path for new file
export function getStoragePath(jobId: number, folder: string, filename: string): string {
  return path.join("jobs", String(jobId), folder, filename);
}

// Delete file from storage
export async function deleteFile(filePath: string): Promise<void> {
  if (storageConfig.type === "local" && storageConfig.local) {
    try {
      const fullPath = path.join(storageConfig.local.uploadDir, filePath);
      await fs.unlink(fullPath);
      console.log(`🗑️ Deleted file: ${filePath}`);
    } catch (err) {
      console.error(`❌ Failed to delete file: ${filePath}`, err);
      throw err;
    }
  } else if (storageConfig.type === "r2") {
    // TODO: Implement R2 deletion with AWS SDK
    console.log("🚧 R2 deletion not yet implemented");
    throw new Error("R2 deletion not implemented yet");
  }
}

// Log current storage configuration
export function logStorageConfig() {
  console.log(`\n📦 Storage Configuration:`);
  console.log(`   Type: ${storageConfig.type}`);
  
  if (storageConfig.type === "local" && storageConfig.local) {
    console.log(`   Local directory: ${storageConfig.local.uploadDir}`);
    console.log(`   Base URL: ${storageConfig.local.baseUrl}`);
  } else if (storageConfig.type === "r2" && storageConfig.r2) {
    console.log(`   R2 Bucket: ${storageConfig.r2.bucketName}`);
    console.log(`   R2 Account: ${storageConfig.r2.accountId}`);
    console.log(`   Public URL: ${storageConfig.r2.publicUrl}`);
  }
  console.log("");
}
