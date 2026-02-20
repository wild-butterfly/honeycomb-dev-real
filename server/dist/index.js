"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./db");
const storage_1 = require("./config/storage");
const authMiddleware_1 = require("./middleware/authMiddleware");
const dbContext_1 = require("./middleware/dbContext");
/* ROUTES */
const me_1 = __importDefault(require("./routes/me"));
const employees_1 = __importDefault(require("./routes/employees"));
const companies_1 = __importDefault(require("./routes/companies"));
const jobs_1 = __importDefault(require("./routes/jobs"));
const assignments_1 = __importDefault(require("./routes/assignments"));
const tasks_1 = __importDefault(require("./routes/tasks"));
const auth_1 = __importDefault(require("./routes/auth"));
const employeeNotes_1 = __importDefault(require("./routes/employeeNotes"));
const files_1 = __importDefault(require("./routes/files"));
dotenv_1.default.config();
const app = (0, express_1.default)();
/* GLOBAL */
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
}));
app.use(express_1.default.json());
/* STATIC FILES - Serve uploaded files */
if (storage_1.storageConfig.type === "local" && storage_1.storageConfig.local) {
    app.use("/uploads", express_1.default.static(storage_1.storageConfig.local.uploadDir));
}
/* HEALTH */
app.get("/", (_req, res) => {
    res.send("Honeycomb API running 🚀");
});
/* PUBLIC */
app.use("/api/auth", auth_1.default);
/* PROTECTED ROUTES */
app.use("/api/me", authMiddleware_1.requireAuth, dbContext_1.withDbContext, me_1.default);
app.use("/api/employees", authMiddleware_1.requireAuth, dbContext_1.withDbContext, employees_1.default);
app.use("/api/companies", authMiddleware_1.requireAuth, dbContext_1.withDbContext, companies_1.default);
app.use("/api/jobs", authMiddleware_1.requireAuth, dbContext_1.withDbContext, jobs_1.default);
app.use("/api/assignments", authMiddleware_1.requireAuth, dbContext_1.withDbContext, assignments_1.default);
app.use("/api/tasks", authMiddleware_1.requireAuth, dbContext_1.withDbContext, tasks_1.default);
app.use("/api", employeeNotes_1.default);
app.use("/api", files_1.default);
/* 404 */
app.use((_req, res) => {
    res.status(404).json({ error: "Route not found" });
});
/* ERROR */
app.use((err, _req, res, _next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
});
/* START */
const PORT = Number(process.env.PORT || 3001);
// Initialize storage before starting server
(async () => {
    try {
        (0, storage_1.logStorageConfig)();
        await (0, storage_1.ensureUploadDir)();
        const server = app.listen(PORT, () => {
            console.log(`🚀 Honeycomb API running on http://localhost:${PORT}`);
        });
        /* SHUTDOWN */
        process.on("SIGTERM", async () => {
            console.log("Shutting down gracefully...");
            await db_1.pool.end();
            server.close(() => {
                process.exit(0);
            });
        });
    }
    catch (err) {
        console.error("Failed to start server:", err);
        process.exit(1);
    }
})();
