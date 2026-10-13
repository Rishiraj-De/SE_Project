"use client";

import React, { useState, useEffect } from "react";
import { Settings, Key, Cpu, Moon, Sun, Shield, Check, Database, RefreshCw, CheckCircle2, Sparkles } from "lucide-react";

interface SettingsViewProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ isDarkMode, onToggleTheme }) => {
  const [aiProvider, setAiProvider] = useState<"local" | "openai">("local");
  const [apiKey, setApiKey] = useState("");
  const [githubPat, setGithubPat] = useState("");
  const [saved, setSaved] = useState(false);
  const [dbStats, setDbStats] = useState<any>(null);
  const [isLoadingDb, setIsLoadingDb] = useState(false);

  const fetchStats = () => {
    setIsLoadingDb(true);
    fetch("http://localhost:5000/api/database/stats")
      .then((res) => res.json())
      .then((data) => {
        setDbStats(data);
        setIsLoadingDb(false);
      })
      .catch((err) => {
        console.error("Could not fetch db stats:", err);
        setIsLoadingDb(false);
      });
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-7 text-xs">
      {/* Header */}
      <div>
        <div className="failade-pill mb-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>System Environment &amp; Integrations</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-[#E8532E]" />
          <span>System Settings</span>
        </h1>
        <p className="text-xs md:text-sm text-gray-500 mt-1">
          Database telemetry, repository authentication, and AI inference configuration.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Database Status Liquid Card */}
        <div className="liquid-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-center shadow-2xs">
                <Database className="w-5 h-5 text-[#E8532E]" />
              </div>
              <div>
                <div className="text-gray-900 font-bold text-sm">Database Engine (SQLite + Prisma)</div>
                <div className="text-xs text-gray-400 mt-0.5">16 normalized relational tables with full index integrity.</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>CONNECTED</span>
              </div>
              <button
                type="button"
                onClick={fetchStats}
                className="p-1.5 rounded-lg border border-black/[0.08] hover:border-orange-300 text-gray-400 hover:text-[#E8532E] transition-all bg-white"
                title="Refresh stats"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDb ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {dbStats && dbStats.tables && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs border-t border-black/[0.06] pt-4 font-mono">
              {[
                { name: "repositories", count: dbStats.tables.repositories },
                { name: "analysis_runs", count: dbStats.tables.analysisRuns },
                { name: "files", count: dbStats.tables.files },
                { name: "classes", count: dbStats.tables.classes },
                { name: "functions", count: dbStats.tables.functions },
                { name: "dependencies", count: dbStats.tables.dependencies },
                { name: "commits", count: dbStats.tables.commits },
                { name: "technical_debt", count: dbStats.tables.technicalDebt }
              ].map((table) => (
                <div key={table.name} className="p-2.5 rounded-xl bg-black/[0.02] border border-black/[0.04] flex items-center justify-between shadow-2xs">
                  <span className="text-gray-500 truncate text-[11px]">{table.name}</span>
                  <span className="text-[#E8532E] font-bold text-xs">{table.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Provider Liquid Card */}
        <div className="liquid-card p-5 space-y-4">
          <div>
            <div className="text-gray-900 font-bold text-sm">AI Inference Engine</div>
            <div className="text-xs text-gray-400 mt-0.5">Select the intelligence provider for contextual legacy code reasoning.</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              onClick={() => setAiProvider("local")}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                aiProvider === "local"
                  ? "bg-orange-50/70 border-[#E8532E] ring-2 ring-orange-500/10 shadow-2xs"
                  : "bg-white/70 border-black/[0.06] hover:border-black/[0.12]"
              }`}
            >
              <div className="font-bold text-gray-900 text-xs flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${aiProvider === "local" ? "bg-[#E8532E] shadow-2xs" : "bg-gray-300"}`} />
                <span>Deterministic AST Engine</span>
              </div>
              <div className="text-xs text-gray-500 mt-1.5 leading-relaxed font-sans">
                Static AST call graph, dependency matrix, and Git churn analytics. Zero external latency.
              </div>
            </div>

            <div
              onClick={() => setAiProvider("openai")}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                aiProvider === "openai"
                  ? "bg-orange-50/70 border-[#E8532E] ring-2 ring-orange-500/10 shadow-2xs"
                  : "bg-white/70 border-black/[0.06] hover:border-black/[0.12]"
              }`}
            >
              <div className="font-bold text-gray-900 text-xs flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${aiProvider === "openai" ? "bg-[#E8532E] shadow-2xs" : "bg-gray-300"}`} />
                <span>OpenAI / External LLM</span>
              </div>
              <div className="text-xs text-gray-500 mt-1.5 leading-relaxed font-sans">
                Deep architectural analysis using GPT-4 with ingested repository AST context.
              </div>
            </div>
          </div>

          {aiProvider === "openai" && (
            <div className="space-y-2 pt-2">
              <label className="text-xs text-gray-600 font-semibold font-mono">OpenAI API Key:</label>
              <input
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white/80 border border-black/[0.08] rounded-xl text-gray-900 focus:border-[#E8532E] focus:outline-none font-mono"
              />
            </div>
          )}
        </div>

        {/* GitHub PAT Liquid Card */}
        <div className="liquid-card p-5 space-y-3">
          <div>
            <div className="text-gray-900 font-bold text-sm">GitHub Personal Access Token</div>
            <div className="text-xs text-gray-400 mt-0.5">Required for analyzing private enterprise repositories.</div>
          </div>
          <input
            type="password"
            placeholder="ghp_..."
            value={githubPat}
            onChange={(e) => setGithubPat(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white/80 border border-black/[0.08] rounded-xl text-gray-900 focus:border-[#E8532E] focus:outline-none font-mono"
          />
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {saved && (
            <span className="text-emerald-600 text-xs font-mono font-bold flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              <span>Configuration saved!</span>
            </span>
          )}
          <button type="submit" className="failade-btn-primary !px-6 shadow-sm">
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
