"use strict";
// server/src/config/storage.ts
// File storage configuration - supports local and Cloudflare R2
// Easy migration: change STORAGE_TYPE env var from 'local' to 'r2'
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageConfig = void 0;
exports.ensureUploadDir = ensureUploadDir;
exports.getFileUrl = getFileUrl;
exports.getStoragePath = getStoragePath;
exports.deleteFile = deleteFile;
exports.logStorageConfig = logStorageConfig;
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
// Get storage config from environment
exports.storageConfig = {
    type: process.env.STORAGE_TYPE || "local",
    local: {
        uploadDir: process.env.UPLOAD_DIR || path_1.default.join(__dirname, "../../uploads"),
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
async function ensureUploadDir() {
    if (exports.storageConfig.type === "local" && exports.storageConfig.local) {
        try {
            await promises_1.default.mkdir(exports.storageConfig.local.uploadDir, { recursive: true });
            // Also create temp directory for multer
            const tempDir = path_1.default.join(exports.storageConfig.local.uploadDir, "temp");
            await promises_1.default.mkdir(tempDir, { recursive: true });
            console.log(`✅ Upload directory ready: ${exports.storageConfig.local.uploadDir}`);
        }
        catch (err) {
            console.error("❌ Failed to create upload directory:", err);
            throw err;
        }
    }
}
// Generate file URL based on storage type
function getFileUrl(filePath) {
    if (exports.storageConfig.type === "r2" && exports.storageConfig.r2) {
        // R2: Return public URL
        return filePath.startsWith("http") ? filePath : `${exports.storageConfig.r2.publicUrl}/${filePath}`;
    }
    else if (exports.storageConfig.local) {
        // Local: Return server URL
        return `${exports.storageConfig.local.baseUrl}/uploads/${filePath}`;
    }
    return filePath;
}
// Generate storage path for new file
function getStoragePath(jobId, folder, filename) {
    return path_1.default.join("jobs", String(jobId), folder, filename);
}
// Delete file from storage
async function deleteFile(filePath) {
    if (exports.storageConfig.type === "local" && exports.storageConfig.local) {
        try {
            const fullPath = path_1.default.join(exports.storageConfig.local.uploadDir, filePath);
            await promises_1.default.unlink(fullPath);
            console.log(`🗑️ Deleted file: ${filePath}`);
        }
        catch (err) {
            console.error(`❌ Failed to delete file: ${filePath}`, err);
            throw err;
        }
    }
    else if (exports.storageConfig.type === "r2") {
        // TODO: Implement R2 deletion with AWS SDK
        console.log("🚧 R2 deletion not yet implemented");
        throw new Error("R2 deletion not implemented yet");
    }
}
// Log current storage configuration
function logStorageConfig() {
    console.log(`\n📦 Storage Configuration:`);
    console.log(`   Type: ${exports.storageConfig.type}`);
    if (exports.storageConfig.type === "local" && exports.storageConfig.local) {
        console.log(`   Local directory: ${exports.storageConfig.local.uploadDir}`);
        console.log(`   Base URL: ${exports.storageConfig.local.baseUrl}`);
    }
    else if (exports.storageConfig.type === "r2" && exports.storageConfig.r2) {
        console.log(`   R2 Bucket: ${exports.storageConfig.r2.bucketName}`);
        console.log(`   R2 Account: ${exports.storageConfig.r2.accountId}`);
        console.log(`   Public URL: ${exports.storageConfig.r2.publicUrl}`);
    }
    console.log("");
}
