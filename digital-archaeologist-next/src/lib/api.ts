import { AnalysisResult, BlastRadiusResult, AIResponse } from "./types";

// Relative URLs invoke the built-in Next.js App Router API endpoints directly on both localhost and Vercel!
const API_BASE = "/api";

export async function fetchAnalysisStatus(): Promise<{ isAnalyzing: boolean; analysis: AnalysisResult | null }> {
  const res = await fetch(`${API_BASE}/analysis/status`, { cache: "no-store" });
  if (!res.ok) throw new Error("Status API returned non-OK");
  return await res.json();
}

export async function triggerAnalysis(repoUrl: string, repoName?: string): Promise<AnalysisResult> {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repoUrl, repoName })
  });
  if (!res.ok) throw new Error("Analysis failed");
  return await res.json();
}

export async function fetchOverview(repoId: string = "current") {
  const res = await fetch(`${API_BASE}/repos/${repoId}/overview`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch overview");
  return await res.json();
}

export async function fetchArchitecture(repoId: string = "current") {
  const res = await fetch(`${API_BASE}/repos/${repoId}/architecture`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch architecture");
  return await res.json();
}

export async function fetchDependencies(repoId: string = "current") {
  const res = await fetch(`${API_BASE}/repos/${repoId}/dependencies`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch dependencies");
  return await res.json();
}

export async function fetchFiles(repoId: string = "current") {
  const res = await fetch(`${API_BASE}/repos/${repoId}/files`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch files");
  return await res.json();
}

export async function fetchFileContent(filePath: string, repoId: string = "current"): Promise<{ content: string; language: string; loc: number }> {
  const res = await fetch(`${API_BASE}/repos/${repoId}/file-content?path=${encodeURIComponent(filePath)}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch file content");
  return await res.json();
}

export async function fetchGitHistory(repoId: string = "current") {
  const res = await fetch(`${API_BASE}/repos/${repoId}/git-history`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch git history");
  return await res.json();
}

export async function fetchTechDebt(repoId: string = "current") {
  const res = await fetch(`${API_BASE}/repos/${repoId}/tech-debt`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch technical debt");
  return await res.json();
}

export async function fetchRiskAnalysis(repoId: string = "current") {
  const res = await fetch(`${API_BASE}/repos/${repoId}/risk-analysis`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch risk analysis");
  return await res.json();
}

export async function fetchImpactAnalysis(targetSymbol: string, targetFile?: string, repoId: string = "current"): Promise<BlastRadiusResult> {
  const res = await fetch(`${API_BASE}/repos/${repoId}/impact-analysis`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetSymbol, targetFile })
  });
  if (!res.ok) throw new Error("Failed to calculate blast radius");
  return await res.json();
}

export async function queryAI(question: string, repoId: string = "legacy-payment-system"): Promise<AIResponse> {
  const res = await fetch(`${API_BASE}/repos/${repoId}/ai/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, repo: repoId })
  });
  if (!res.ok) throw new Error("Failed to query contextual AI assistant");
  return await res.json();
}

export async function generateDocumentation(moduleName: string, repoId: string = "current"): Promise<{ markdown: string }> {
  const res = await fetch(`${API_BASE}/repos/${repoId}/docs/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ moduleName })
  });
  if (!res.ok) throw new Error("Failed to generate documentation");
  return await res.json();
}

export async function fetchReports(repoId: string = "current"): Promise<{ markdown: string }> {
  const res = await fetch(`${API_BASE}/repos/${repoId}/reports`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch reports");
  return await res.json();
}
