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
  Download
} from "lucide-react";
import { AnalysisResult, RefactoringRecipe } from "@/lib/types";
import { generateModernizationPlan } from "@/lib/engine/modernizationService";

interface ModernizationViewProps {
  analysis: AnalysisResult | null;
  onInspectFile?: (filePath: string) => void;
  onAskAI?: (prompt: string) => void;
}

export const ModernizationView: React.FC<ModernizationViewProps> = ({
  analysis,
  onInspectFile,
  onAskAI
}) => {
  const recipes = useMemo(() => generateModernizationPlan(analysis), [analysis]);

  // Selected recipes in active simulation (by default, top high-impact ones are selected)
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

  const activeRecipe = recipes.find((r) => r.id === activeRecipeId) || recipes[0];

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
            break circular dependencies, and project code health improvements in real time.
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
                `Explain the top architectural refactoring priorities for this codebase and how to execute the modernization plan safely without regressions.`
              )
            }
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#E8532E] hover:bg-[#d04522] text-white shadow-sm transition-all cursor-pointer"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Ask AI Investigator</span>
          </button>
        </div>
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
            <div className="text-3xl font-extrabold text-gray-900">
              {simulationMetrics.totalHours} <span className="text-sm font-normal text-gray-500">hrs</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              ~{simulationMetrics.estimatedSprints} sprint(s) for 1 senior engineer
            </p>
          </div>
          <div className="text-[11px] text-gray-500">
            {simulationMetrics.selectedCount} of {recipes.length} refactoring recipes active
          </div>
        </div>
      </div>

      {/* ─── PRIORITY QUADRANT FILTER ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            id: "quick-win",
            label: "Quick Wins",
            desc: "Low Effort, High Architecture Impact",
            color: "border-emerald-300 bg-emerald-50/60 text-emerald-900"
          },
          {
            id: "architectural",
            label: "Architectural Shifts",
            desc: "High Effort, Deep System Decoupling",
            color: "border-purple-300 bg-purple-50/60 text-purple-900"
          },
          {
            id: "security",
            label: "Security Hardening",
            desc: "Algorithm & Vulnerability Patches",
            color: "border-rose-300 bg-rose-50/60 text-rose-900"
          },
          {
            id: "maintenance",
            label: "Hygiene & Guardrails",
            desc: "Runtime Schemas & Boundaries",
            color: "border-blue-300 bg-blue-50/60 text-blue-900"
          }
        ].map((quad) => {
          const count = recipes.filter((r) => r.quadrant === quad.id).length;
          const isSelected = selectedQuadrant === quad.id;
          return (
            <button
              key={quad.id}
              onClick={() => setSelectedQuadrant(isSelected ? "ALL" : quad.id)}
              className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer relative ${
                isSelected
                  ? "ring-2 ring-[#E8532E] shadow-sm bg-white"
                  : "bg-white hover:bg-gray-50/80 border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-gray-900">{quad.label}</span>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                  {count}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 line-clamp-1">{quad.desc}</p>
            </button>
          );
        })}
      </div>

      {/* ─── MAIN WORKSPACE: RECIPE LIST & DIFF VIEWER ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Recipe Selector (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {/* Search & Category Pills */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by component, pattern, or file..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:border-[#E8532E] focus:outline-none"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {["ALL", "Decoupling", "Security", "Refactoring", "Async & Performance"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-[#E8532E] text-white font-medium"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Recipes List */}
          <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
            {filteredRecipes.map((recipe) => {
              const isActive = recipe.id === activeRecipeId;
              const isSimulated = selectedRecipeIds.has(recipe.id);

              return (
                <div
                  key={recipe.id}
                  onClick={() => setActiveRecipeId(recipe.id)}
                  className={`p-3.5 rounded-xl border transition-all text-left cursor-pointer group ${
                    isActive
                      ? "border-[#E8532E] bg-orange-50/50 shadow-xs"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-2xs"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      {/* Checkbox for ROI simulator */}
                      <input
                        type="checkbox"
                        checked={isSimulated}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleRecipeSelection(recipe.id);
                        }}
                        className="rounded text-[#E8532E] focus:ring-[#E8532E] cursor-pointer"
                        title="Include in ROI simulation"
                      />
                      <span className="text-xs font-bold text-gray-900 group-hover:text-[#E8532E] transition-colors">
                        {recipe.title}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md shrink-0 ${
                        recipe.severity === "CRITICAL"
                          ? "bg-rose-100 text-rose-800"
                          : recipe.severity === "HIGH"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {recipe.severity}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 line-clamp-2 mb-2 pl-5">
                    {recipe.description}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-gray-400 pl-5 border-t border-gray-100 pt-2">
                    <span className="font-mono text-gray-500 truncate max-w-[180px]">
                      {recipe.filePath}
                    </span>
                    <div className="flex items-center gap-2 font-medium">
                      <span className="text-emerald-700">+{recipe.healthImpact} pts</span>
                      <span>•</span>
                      <span>{recipe.effortHours}h</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredRecipes.length === 0 && (
              <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-500 text-xs">
                No refactoring recipes found matching the active filters.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Code Comparison & Diff Studio (7 cols) */}
        {activeRecipe ? (
          <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            {/* Diff Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50/70 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                    {activeRecipe.pattern}
                  </span>
                  <span className="text-xs font-mono text-gray-500">{activeRecipe.filePath}</span>
                </div>
                <h3 className="text-base font-bold text-gray-900 mt-1">{activeRecipe.title}</h3>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-200/80 text-xs font-medium">
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
                        High Coupling
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
                    <span>unified.patch</span>
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onInspectFile?.(activeRecipe.filePath)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <FileCode2 className="w-3.5 h-3.5 text-gray-500" />
                  <span>Inspect in Codebase</span>
                </button>
                <button
                  onClick={() =>
                    onAskAI?.(
                      `Deep dive into the refactoring for ${activeRecipe.component} in ${activeRecipe.filePath}. Pattern: ${activeRecipe.pattern}. How can we safely roll out this migration without downtime?`
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
                    <span>Copied Code</span>
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
        ) : null}
      </div>
    </div>
  );
};

