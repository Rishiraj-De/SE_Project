import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { RepositoryController } from "./controllers/repository.controller";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "*" }));
app.use(express.json());

// Request logger for serious dev debugging
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Health check & Database Status
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});
app.get("/api/database/stats", RepositoryController.getDatabaseStats);

// Repository Analysis & Lifecycle
app.post("/api/analyze", RepositoryController.analyze);
app.get("/api/analysis/status", RepositoryController.getStatus);
app.get("/api/repos/:id/overview", RepositoryController.getOverview);

// Architecture & Dependencies
app.get("/api/repos/:id/architecture", RepositoryController.getArchitecture);
app.get("/api/repos/:id/dependencies", RepositoryController.getDependencies);

// Codebase & File Contents
app.get("/api/repos/:id/files", RepositoryController.getFiles);
app.get("/api/repos/:id/file-content", RepositoryController.getFileContent);

// Git History & Churn
app.get("/api/repos/:id/git-history", RepositoryController.getGitHistory);

// Technical Debt & Risk Analysis
app.get("/api/repos/:id/tech-debt", RepositoryController.getTechDebt);
app.get("/api/repos/:id/risk-analysis", RepositoryController.getRiskAnalysis);

// Impact Analysis
app.post("/api/repos/:id/impact-analysis", RepositoryController.analyzeImpact);

// Contextual AI Assistant
app.post("/api/repos/:id/ai/query", RepositoryController.queryAI);

// Documentation & Reports
app.post("/api/repos/:id/docs/generate", RepositoryController.generateDocs);
app.get("/api/repos/:id/reports", RepositoryController.getReports);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled API Error:", err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` Digital Archaeologist Backend running on port ${PORT}`);
  console.log(` API endpoints available under http://localhost:${PORT}/api`);
  console.log(`=======================================================`);
});
