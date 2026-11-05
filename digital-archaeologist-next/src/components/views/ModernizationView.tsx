"use client";

import React, { useState, useMemo } from "react";
import {
  Wrench,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Clock,
  Zap,
  GitPullRequest,
  Copy,
  Check,
  FileCode2,
  Filter,
  Search,
  Bot,
  ExternalLink,
  Flame,
  Layers,
  Sliders,
  Download,
  GitBranch
} from "lucide-react";
import { AnalysisResult, RefactoringRecipe } from "@/lib/types";
import { generateModernizationPlan } from "@/lib/engine/modernizationService";

interface ModernizationViewProps {
  analysis: AnalysisResult | null;
  onInspectFile?: (filePath: string) => void;
  onAskAI?: (prompt: string) => void;
  onStartAnalysis?: (repoUrl: string, repoName?: string) => Promise<void> | void;
  isAnalyzing?: boolean;
}

export const ModernizationView: React.FC<ModernizationViewProps> = ({
  analysis,
  onInspectFile,
  onAskAI,
  onStartAnalysis,
  isAnalyzing = false
}) => {
  const recipes = useMemo(() => generateModernizationPlan(analysis), [analysis]);

  // Selected recipes in active simulation (by default, all high-impact ones are selected)
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<Set<string>>(
    () => new Set(recipes.map((r) => r.id))
  );

  // Active inspected recipe
  const [activeRecipeId, setActiveRecipeId] = useState<string>(recipes[0]?.id || "");
  const [activeTab, setActiveTab] = useState<"side-by-side" | "diff" | "rationale">("side-by-side");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedQuadrant, setSelectedQuadrant] = useState<string>("ALL");
  const [copiedState, setCopiedState] = useState<string | null>(null);
  const [repoInputUrl, setRepoInputUrl] = useState("");

  const currentRepoUrl = analysis?.repoUrl || "https://github.com/Rishiraj-De/SE_Project";
  const currentRepoName = analysis?.repoName || "SE_Project";

  const activeRecipe = recipes.find((r) => r.id === activeRecipeId) || recipes[0];

  const handleExcavateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = repoInputUrl.trim();
    if (!trimmed || !onStartAnalysis) return;
    const parts = trimmed.split("/").filter(Boolean);
    const derived = parts[parts.length - 1]?.replace(".git", "") || "repo";
    await onStartAnalysis(trimmed, derived);
    setRepoInputUrl("");
  };

  // Toggle selection for simulation
  const toggleRecipeSelection = (id: string) => {
    setSelectedRecipeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Filtered recipes
  const filteredRecipes = useMemo(() => {
    return recipes.filter((r) => {
      const matchesSearch =
        searchQuery === "" ||
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.component.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.pattern.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.filePath.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "ALL" || r.category === selectedCategory;

      const matchesQuadrant =
        selectedQuadrant === "ALL" || r.quadrant === selectedQuadrant;

      return matchesSearch && matchesCategory && matchesQuadrant;
    });
  }, [recipes, searchQuery, selectedCategory, selectedQuadrant]);

  // Interactive ROI Simulation Metrics
  const baseHealth = analysis?.summary?.healthScore || 68;
  const simulationMetrics = useMemo(() => {
    const selectedList = recipes.filter((r) => selectedRecipeIds.has(r.id));
    const addedHealth = selectedList.reduce((acc, r) => acc + r.healthImpact, 0);
    const totalHours = selectedList.reduce((acc, r) => acc + r.effortHours, 0);
    const maxReduction = selectedList.reduce((acc, r) => acc + r.blastRadiusReduction, 0);
    const projectedHealth = Math.min(98, baseHealth + addedHealth);
    const effectiveBlastReduction = Math.min(85, Math.round(maxReduction * 0.75));

    return {
      selectedCount: selectedList.length,
      projectedHealth,
      healthDelta: projectedHealth - baseHealth,
      totalHours: Number(totalHours.toFixed(1)),
      estimatedSprints: Math.max(1, Math.ceil(totalHours / 20)),
      blastReduction: effectiveBlastReduction
    };
  }, [recipes, selectedRecipeIds, baseHealth]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedState(label);
    setTimeout(() => setCopiedState(null), 2000);
  };

  const handleDownloadPatch = () => {
    const patchContent = recipes
      .map(
        (r) =>
          `From 0000000000000000000000000000000000000000 Mon Sep 17 00:00:00 2001\n` +
          `Subject: [PATCH] refactor(${r.component}): ${r.title}\n\n` +
          `Pattern: ${r.pattern}\nRationale: ${r.architecturalRationale}\n\n` +
          `---\n--- a/${r.filePath}\n+++ b/${r.filePath}\n` +
          r.unifiedDiff +
          `\n--\n`
      )
      .join("\n\n");

    const blob = new Blob([patchContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `modernization_plan_${Date.now()}.patch`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* ─── HEADER & BANNER ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-orange-100 text-[#E8532E]">
              <Wrench className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Refactor & Modernization Studio
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Interactive Codemods
            </span>
          </div>
          <p className="text-sm text-gray-600 max-w-2xl">
            Simulate architectural refactoring roadmaps, preview side-by-side unified diffs,
            break circular dependencies, and project code health improvements directly on the analyzed repository.
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPatch}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-2xs transition-all cursor-pointer"
            title="Download unified git patch file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Git Patch</span>
          </button>
          <button
            onClick={() =>
              onAskAI?.(
                `Explain the top architectural refactoring priorities for repository "${currentRepoName}" (${currentRepoUrl}) and how to execute the modernization plan safely without regressions.`
              )
            }
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#E8532E] hover:bg-[#d04522] text-white shadow-sm transition-all cursor-pointer"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Ask AI Investigator</span>
          </button>
        </div>
      </div>

      {/* ─── ACTIVE GITHUB REPOSITORY BAR & SWITCHER ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-gray-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-50 text-[#E8532E] border border-orange-200/70 shrink-0">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Active Repository Under Modernization
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Live GitHub AST
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="font-mono text-sm font-bold text-gray-900">
                {currentRepoName}
              </span>
              <span className="text-gray-300 text-xs">•</span>
              <a
                href={currentRepoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-[#E8532E] hover:underline flex items-center gap-1 font-medium"
              >
                <span>{currentRepoUrl}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Input to switch/refactor another repo */}
        {onStartAnalysis && (
          <form onSubmit={handleExcavateSubmit} className="flex items-center gap-2 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-96">
              <input
                type="text"
                placeholder="Paste any GitHub URL (e.g. https://github.com/org/repo)..."
                value={repoInputUrl}
                onChange={(e) => setRepoInputUrl(e.target.value)}
                className="w-full pl-3 pr-3 py-2 text-xs rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#E8532E] focus:outline-none transition-all font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={!repoInputUrl.trim() || isAnalyzing}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#E8532E] hover:bg-[#d04522] disabled:opacity-50 text-white shrink-0 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {isAnalyzing ? (
                <span>Excavating...</span>
              ) : (
                <>
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Refactor Repo</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* ─── REAL-TIME ROI & HEALTH SIMULATOR ─── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-gradient-to-br from-white via-orange-50/20 to-orange-100/30 border border-orange-200/80 shadow-xs">
        {/* Health Score Simulation */}
        <div className="md:col-span-2 flex flex-col justify-between p-4 rounded-xl bg-white/90 border border-gray-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#E8532E]" />
              Projected Architecture Health
            </span>
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              +{simulationMetrics.healthDelta} pts gain
            </span>
          </div>

          <div className="flex items-baseline gap-3 my-1">
            <div className="text-3xl font-extrabold text-gray-900">
              {simulationMetrics.projectedHealth}%
            </div>
            <div className="text-xs text-gray-400">
              current baseline: <span className="font-semibold text-gray-700">{baseHealth}%</span>
            </div>
          </div>

          {/* Dual Progress Bar */}
          <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden relative mt-2">
            <div
              className="h-full bg-gray-300 absolute left-0 top-0 transition-all duration-500"
              style={{ width: `${baseHealth}%` }}
            />
            <div
              className="h-full bg-gradient-to-r from-[#E8532E] to-emerald-500 absolute left-0 top-0 transition-all duration-500 opacity-90"
              style={{ width: `${simulationMetrics.projectedHealth}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-gray-400 mt-1.5">
            <span>0%</span>
            <span>Target: 90%+ (Clean Architecture)</span>
            <span>100%</span>
          </div>
        </div>

        {/* Blast Radius Reduction */}
        <div className="p-4 rounded-xl bg-white/90 border border-gray-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold uppercase tracking-wider">
            <span>Risk Reduction</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="my-2">
            <div className="text-3xl font-extrabold text-emerald-700">
              -{simulationMetrics.blastReduction}%
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Blast radius impact across downstream consumers
            </p>
          </div>
          <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>Eliminates critical cycles</span>
          </div>
        </div>

        {/* Estimated Migration Effort */}
        <div className="p-4 rounded-xl bg-white/90 border border-gray-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold uppercase tracking-wider">
            <span>Total Migration Effort</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="my-2">
            <div className="text-3xl font-extrabold text-blue-900">
              {simulationMetrics.totalHours} <span className="text-sm font-normal text-gray-500">hours</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Estimated across ~{simulationMetrics.estimatedSprints} sprint cycles
            </p>
          </div>
          <div className="text-[11px] text-blue-700 font-medium flex items-center gap-1">
            <Layers className="w-3 h-3" />
            <span>{simulationMetrics.selectedCount} recipes selected</span>
          </div>
        </div>
      </div>

      {/* ─── FILTERS & SEARCH ─── */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search refactoring recipes, files, patterns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-[#E8532E] text-xs"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-gray-500 font-medium">Category:</span>
            {["ALL", "Decoupling", "Security", "Refactoring", "Async & Performance"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Quadrant Filter */}
          <div className="flex items-center gap-1.5 shrink-0 pl-2 border-l border-gray-200">
            <span className="text-gray-500 font-medium">Quadrant:</span>
            {[
              { id: "ALL", label: "All" },
              { id: "quick-win", label: "Quick Wins" },
              { id: "architectural", label: "Architecture" },
              { id: "security", label: "Security" },
              { id: "maintenance", label: "Hygiene" }
            ].map((q) => (
              <button
                key={q.id}
                onClick={() => setSelectedQuadrant(q.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                  selectedQuadrant === q.id
                    ? "bg-[#E8532E] text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── MAIN 2-COLUMN STUDIO WORKSPACE ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Recipe Catalog & ROI Toggle Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-500 px-1">
            <span>Refactoring Recipes ({filteredRecipes.length})</span>
            <span>Check to include in ROI simulation</span>
          </div>

          <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
            {filteredRecipes.map((recipe) => {
              const isSelected = selectedRecipeIds.has(recipe.id);
              const isActive = recipe.id === activeRecipeId;

              return (
                <div
                  key={recipe.id}
                  onClick={() => setActiveRecipeId(recipe.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                    isActive
                      ? "bg-white border-[#E8532E] shadow-sm ring-1 ring-[#E8532E]/30"
                      : "bg-white/80 hover:bg-white border-gray-200/90 shadow-2xs hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Checkbox for Simulation */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRecipeSelection(recipe.id);
                      }}
                      className={`mt-0.5 p-1 rounded-md border transition-colors cursor-pointer shrink-0 ${
                        isSelected
                          ? "bg-[#E8532E] border-[#E8532E] text-white"
                          : "bg-white border-gray-300 text-transparent hover:border-gray-400"
                      }`}
                      title={isSelected ? "Remove from ROI simulation" : "Add to ROI simulation"}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>

                    {/* Recipe Header & Metadata */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                            recipe.severity === "CRITICAL"
                              ? "bg-rose-100 text-rose-800"
                              : recipe.severity === "HIGH"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {recipe.severity}
                        </span>

                        <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                          {recipe.category}
                        </span>

                        <span className="text-[10px] font-medium text-gray-400 font-mono">
                          {recipe.effortHours}h effort
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-gray-900 truncate">
                        {recipe.title}
                      </h3>

                      <p className="text-xs text-gray-500 font-mono mt-0.5 truncate">
                        {recipe.filePath}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-gray-600 mt-2">
                        <span className="flex items-center gap-1 text-emerald-700 font-medium">
                          <TrendingUp className="w-3 h-3" />
                          +{recipe.healthImpact} Health
                        </span>
                        <span className="flex items-center gap-1 text-blue-700 font-medium">
                          <ShieldCheck className="w-3 h-3" />
                          -{recipe.blastRadiusReduction}% Blast
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredRecipes.length === 0 && (
              <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-500 text-xs">
                No refactoring recipes matched the filter criteria.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Code Comparison & Unified Diff Inspector (7 cols) */}
        <div className="lg:col-span-7">
          {activeRecipe ? (
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden flex flex-col">
              {/* Recipe Inspector Header */}
              <div className="p-4 bg-gray-50/70 border-b border-gray-200 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-[#E8532E]/10 text-[#E8532E]">
                        {activeRecipe.pattern}
                      </span>
                      <span className="text-xs text-gray-500 font-mono">
                        {activeRecipe.component}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {activeRecipe.title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleCopy(activeRecipe.unifiedDiff, "diff-header")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                      title="Copy unified diff"
                    >
                      {copiedState === "diff-header" ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Diff</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed">
                  {activeRecipe.description}
                </p>

                {/* File path pill with GitHub link */}
                <div className="flex items-center gap-2 pt-1 flex-wrap text-xs">
                  <span className="text-gray-400 font-mono text-[11px]">Target:</span>
                  <span className="font-mono text-gray-700 bg-gray-100 px-2 py-0.5 rounded text-[11px] border border-gray-200/80">
                    {activeRecipe.filePath}
                  </span>
                  <a
                    href={`${currentRepoUrl.replace(/\.git$/, "")}/blob/main/${activeRecipe.filePath}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#E8532E] hover:underline font-mono text-[11px]"
                  >
                    <span>View file on GitHub</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 bg-gray-200/70 p-1 rounded-xl text-xs w-fit mt-2">
                  <button
                    onClick={() => setActiveTab("side-by-side")}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      activeTab === "side-by-side"
                        ? "bg-white text-gray-900 shadow-2xs font-semibold"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Side-by-Side
                  </button>
                  <button
                    onClick={() => setActiveTab("diff")}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      activeTab === "diff"
                        ? "bg-white text-gray-900 shadow-2xs font-semibold"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Unified Diff
                  </button>
                  <button
                    onClick={() => setActiveTab("rationale")}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      activeTab === "rationale"
                        ? "bg-white text-gray-900 shadow-2xs font-semibold"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Rationale
                  </button>
                </div>
              </div>

              {/* Content Area */}
              <div className="p-4 flex-1 overflow-x-auto min-h-[420px]">
                {activeTab === "side-by-side" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left: Legacy Code */}
                    <div className="rounded-xl border border-rose-200 bg-rose-50/30 overflow-hidden flex flex-col">
                      <div className="px-3 py-2 bg-rose-100/70 border-b border-rose-200 flex items-center justify-between text-xs font-semibold text-rose-900">
                        <span>Legacy Code (Before)</span>
                        <span className="text-[10px] bg-rose-200/80 px-1.5 py-0.5 rounded text-rose-800">
                          Coupled
                        </span>
                      </div>
                      <pre className="p-3 text-[11px] font-mono leading-relaxed text-gray-800 overflow-x-auto whitespace-pre flex-1">
                        {activeRecipe.legacyCode}
                      </pre>
                    </div>

                    {/* Right: Modernized Code */}
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 overflow-hidden flex flex-col">
                      <div className="px-3 py-2 bg-emerald-100/70 border-b border-emerald-200 flex items-center justify-between text-xs font-semibold text-emerald-900">
                        <span>Clean Architecture (After)</span>
                        <span className="text-[10px] bg-emerald-200/80 px-1.5 py-0.5 rounded text-emerald-800">
                          Refactored
                        </span>
                      </div>
                      <pre className="p-3 text-[11px] font-mono leading-relaxed text-gray-800 overflow-x-auto whitespace-pre flex-1">
                        {activeRecipe.modernCode}
                      </pre>
                    </div>
                  </div>
                )}

                {activeTab === "diff" && (
                  <div className="rounded-xl border border-gray-300 bg-[#1e1e1e] text-gray-100 overflow-hidden shadow-inner">
                    <div className="px-4 py-2 bg-[#2d2d2d] border-b border-gray-700 flex items-center justify-between text-xs font-mono text-gray-300">
                      <span>unified.patch ({activeRecipe.filePath})</span>
                      <button
                        onClick={() => handleCopy(activeRecipe.unifiedDiff, "diff")}
                        className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                      >
                        {copiedState === "diff" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedState === "diff" ? "Copied" : "Copy Diff"}</span>
                      </button>
                    </div>
                    <pre className="p-4 text-xs font-mono leading-relaxed overflow-x-auto whitespace-pre">
                      {activeRecipe.unifiedDiff}
                    </pre>
                  </div>
                )}

                {activeTab === "rationale" && (
                  <div className="space-y-4 text-xs text-gray-700">
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-2">
                      <h4 className="font-bold text-blue-900 text-sm">Architectural Rationale</h4>
                      <p className="leading-relaxed text-blue-800">
                        {activeRecipe.architecturalRationale}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider">
                        Automated Verification & Test Safety Plan
                      </h4>
                      <ul className="space-y-2">
                        {activeRecipe.verificationPlan.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-2 bg-gray-50 p-2.5 rounded-lg border border-gray-200/80">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span className="leading-relaxed">{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Actions Bar */}
              <div className="p-3.5 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => onInspectFile?.(activeRecipe.filePath)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <FileCode2 className="w-3.5 h-3.5 text-gray-500" />
                    <span>Inspect in Codebase</span>
                  </button>
                  <a
                    href={`${currentRepoUrl.replace(/\.git$/, "")}/blob/main/${activeRecipe.filePath}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                    <span>View on GitHub</span>
                  </a>
                  <button
                    onClick={() =>
                      onAskAI?.(
                        `Deep dive into the refactoring for ${activeRecipe.component} in ${activeRecipe.filePath} of repository ${currentRepoUrl}. Pattern: ${activeRecipe.pattern}. How can we safely roll out this migration without downtime?`
                      )
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <Bot className="w-3.5 h-3.5 text-purple-600" />
                    <span>Ask AI to Explain</span>
                  </button>
                </div>

                <button
                  onClick={() => handleCopy(activeRecipe.modernCode, "code")}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#E8532E] hover:bg-[#d04522] text-white font-medium transition-colors cursor-pointer shadow-2xs"
                >
                  {copiedState === "code" ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied Modern Code</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Modern Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-gray-50 rounded-2xl border border-gray-200 text-gray-500 text-xs">
              Select a refactoring recipe from the catalog to view side-by-side diffs.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
