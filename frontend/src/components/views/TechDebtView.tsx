"use client";

import React, { useState, useMemo, useEffect } from "react";
import { TechnicalDebtItem } from "@/lib/types";
import {
  AlertTriangle,
  Filter,
  ArrowRight,
  Search,
  Sparkles,
  Zap,
  Code2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Flame,
  Bot
} from "lucide-react";

interface TechDebtViewProps {
  technicalDebt: TechnicalDebtItem[];
  onInspectFile?: (filePath: string) => void;
  onNavigateToImpact?: (symbol: string, file: string) => void;
  onAskAI?: (prompt: string) => void;
}

function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (value === 0) {
      setDisplayValue(0);
      return;
    }
    let current = 0;
    const duration = 500;
    const stepTime = 16;
    const totalSteps = duration / stepTime;
    const increment = value / totalSteps;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{displayValue.toLocaleString()}</span>;
}

export const TechDebtView: React.FC<TechDebtViewProps> = ({
  technicalDebt,
  onInspectFile,
  onNavigateToImpact,
  onAskAI
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const categories = useMemo(() => {
    return Array.from(new Set(technicalDebt.map((t) => t.category)));
  }, [technicalDebt]);

  const highCount = useMemo(() => technicalDebt.filter(t => t.severity === "HIGH" || t.severity === "CRITICAL").length, [technicalDebt]);
  const mediumCount = useMemo(() => technicalDebt.filter(t => t.severity === "MEDIUM").length, [technicalDebt]);
  const lowCount = useMemo(() => technicalDebt.filter(t => t.severity === "LOW").length, [technicalDebt]);

  const filtered = useMemo(() => {
    return technicalDebt.filter((item) => {
      const matchSev = selectedSeverity === "ALL" || item.severity === selectedSeverity;
      const matchCat = selectedCategory === "ALL" || item.category === selectedCategory;
      const matchSearch =
        !searchQuery ||
        item.component.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.file.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.issue.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSev && matchCat && matchSearch;
    });
  }, [technicalDebt, selectedSeverity, selectedCategory, searchQuery]);

  const getSeverityStyle = (sev: string) => {
    if (sev === "HIGH" || sev === "CRITICAL") {
      return "bg-rose-50 text-rose-700 border-rose-200/80 shadow-[0_0_8px_rgba(244,63,94,0.15)]";
    }
    if (sev === "MEDIUM") {
      return "bg-amber-50 text-amber-700 border-amber-200/80 shadow-[0_0_8px_rgba(245,158,11,0.15)]";
    }
    return "bg-emerald-50 text-emerald-700 border-emerald-200/80";
  };

  const total = technicalDebt.length || 1;
  const highRatio = Math.round((highCount / total) * 100);
  const medRatio = Math.round((mediumCount / total) * 100);
  const lowRatio = Math.max(0, 100 - highRatio - medRatio);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-7">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="failade-pill mb-2">
            <span className="w-2 h-2 rounded-full bg-[#E8532E] animate-pulse" />
            <span>Automated Technical Debt &amp; Anti-Pattern Detector</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <AlertTriangle className="w-6 h-6 text-[#E8532E]" />
            <span>Technical Debt Dossier</span>
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1 max-w-2xl">
            Identified architectural anti-patterns, circular references, god classes, and refactoring hotspots.
          </p>
        </div>

        {/* Global Debt Ratio Pill */}
        <div className="liquid-card !p-3 flex items-center gap-4 text-xs">
          <div>
            <div className="text-[10px] text-gray-400 uppercase font-mono tracking-wider">Debt Profile</div>
            <div className="text-xs font-bold text-gray-800 mt-0.5 font-mono">
              <span className="text-rose-600 font-bold">{highCount} Critical</span> · <span className="text-amber-600">{mediumCount} Med</span>
            </div>
          </div>
          <div className="w-24 h-2 rounded-full bg-gray-100 flex overflow-hidden p-0.5">
            <div style={{ width: `${highRatio}%` }} className="bg-rose-500 rounded-l-full h-full" />
            <div style={{ width: `${medRatio}%` }} className="bg-amber-400 h-full" />
            <div style={{ width: `${lowRatio}%` }} className="bg-emerald-400 rounded-r-full h-full" />
          </div>
        </div>
      </div>

      {/* Interactive Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <button
          onClick={() => setSelectedSeverity(selectedSeverity === "HIGH" ? "ALL" : "HIGH")}
          className={`liquid-card text-left transition-all p-4.5 cursor-pointer relative overflow-hidden group ${
            selectedSeverity === "HIGH" ? "!border-rose-300 ring-2 ring-rose-400/20 bg-rose-50/20" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-rose-500" />
              High &amp; Critical
            </span>
            <span className="text-[10px] font-mono text-rose-500 bg-rose-50 border border-rose-200/60 px-1.5 py-0.5 rounded-full">
              P0 / P1
            </span>
          </div>
          <div className="text-3xl font-extrabold font-mono text-rose-700 mt-2 tracking-tight">
            <AnimatedNumber value={highCount} />
          </div>
          <div className="text-xs text-gray-500 mt-1 flex items-center justify-between">
            <span>Requires refactoring</span>
            <span className="text-[10px] text-gray-400 font-mono group-hover:text-rose-600 transition-colors">
              Filter →
            </span>
          </div>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-rose-400/10 rounded-full blur-xl pointer-events-none" />
        </button>

        <button
          onClick={() => setSelectedSeverity(selectedSeverity === "MEDIUM" ? "ALL" : "MEDIUM")}
          className={`liquid-card text-left transition-all p-4.5 cursor-pointer relative overflow-hidden group ${
            selectedSeverity === "MEDIUM" ? "!border-amber-300 ring-2 ring-amber-400/20 bg-amber-50/20" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              Medium Drag
            </span>
            <span className="text-[10px] font-mono text-amber-600 bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 rounded-full">
              P2
            </span>
          </div>
          <div className="text-3xl font-extrabold font-mono text-amber-700 mt-2 tracking-tight">
            <AnimatedNumber value={mediumCount} />
          </div>
          <div className="text-xs text-gray-500 mt-1 flex items-center justify-between">
            <span>Maintenance friction</span>
            <span className="text-[10px] text-gray-400 font-mono group-hover:text-amber-600 transition-colors">
              Filter →
            </span>
          </div>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-amber-400/10 rounded-full blur-xl pointer-events-none" />
        </button>

        <button
          onClick={() => setSelectedSeverity(selectedSeverity === "LOW" ? "ALL" : "LOW")}
          className={`liquid-card text-left transition-all p-4.5 cursor-pointer relative overflow-hidden group ${
            selectedSeverity === "LOW" ? "!border-emerald-300 ring-2 ring-emerald-400/20 bg-emerald-50/20" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Low Priority
            </span>
            <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded-full">
              P3
            </span>
          </div>
          <div className="text-3xl font-extrabold font-mono text-emerald-700 mt-2 tracking-tight">
            <AnimatedNumber value={lowCount} />
          </div>
          <div className="text-xs text-gray-500 mt-1 flex items-center justify-between">
            <span>Quick wins</span>
            <span className="text-[10px] text-gray-400 font-mono group-hover:text-emerald-600 transition-colors">
              Filter →
            </span>
          </div>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-emerald-400/10 rounded-full blur-xl pointer-events-none" />
        </button>

        <button
          onClick={() => setSelectedSeverity("ALL")}
          className={`liquid-card text-left transition-all p-4.5 cursor-pointer relative overflow-hidden group ${
            selectedSeverity === "ALL" ? "!border-orange-300 ring-2 ring-orange-400/20 bg-orange-50/10" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#E8532E]" />
              Total Findings
            </span>
            <span className="text-[10px] font-mono text-gray-500 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded-full">
              All
            </span>
          </div>
          <div className="text-3xl font-extrabold font-mono text-gray-900 mt-2 tracking-tight">
            <AnimatedNumber value={technicalDebt.length} />
          </div>
          <div className="text-xs text-gray-500 mt-1 flex items-center justify-between">
            <span>Across full repository</span>
            <span className="text-[10px] text-gray-400 font-mono group-hover:text-[#E8532E] transition-colors">
              Reset →
            </span>
          </div>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-orange-400/10 rounded-full blur-xl pointer-events-none" />
        </button>
      </div>

      {/* Interactive Controls Bar: Search & Multi-Filters */}
      <div className="liquid-card !p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search component, file path, anti-pattern, or category..."
            className="w-full pl-9 pr-4 py-2 bg-white/70 border border-black/[0.08] rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#E8532E] focus:ring-2 focus:ring-orange-500/10 transition-all font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-gray-400 hover:text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded"
            >
              Clear
            </button>
          )}
        </div>

        {/* Severity Toggle Pills */}
        <div className="flex items-center gap-1.5 bg-black/[0.03] p-1 rounded-xl border border-black/[0.04]">
          {["ALL", "HIGH", "MEDIUM", "LOW"].map((sev) => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedSeverity === sev
                  ? "bg-white text-[#E8532E] font-semibold shadow-xs border border-black/[0.04]"
                  : "text-gray-500 hover:text-gray-800 hover:bg-white/40"
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        {/* Category Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white/90 border border-black/[0.08] text-gray-700 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-[#E8532E] font-mono shadow-2xs"
          >
            <option value="ALL">All Categories ({categories.length})</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Count Banner */}
      <div className="flex items-center justify-between px-1 text-xs text-gray-500 font-mono">
        <span>
          Showing <strong className="text-gray-900">{filtered.length}</strong> findings
          {selectedSeverity !== "ALL" && ` · Severity: ${selectedSeverity}`}
          {selectedCategory !== "ALL" && ` · Category: ${selectedCategory}`}
          {searchQuery && ` · matching "${searchQuery}"`}
        </span>
        <span className="text-[11px] text-gray-400">Click any card to expand actionable remediation</span>
      </div>

      {/* Tactile Findings List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="liquid-card py-16 text-center text-gray-400 text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            <div className="font-semibold text-gray-700 text-sm">No Technical Debt Found</div>
            <div className="text-gray-400 mt-1">No items match the selected severity or search filters.</div>
          </div>
        ) : (
          filtered.map((item, index) => {
            const isExpanded = expandedIndex === index;
            return (
              <div
                key={index}
                className={`liquid-card !p-0 transition-all overflow-hidden ${
                  isExpanded ? "!border-orange-300 ring-2 ring-orange-500/10 shadow-md" : "hover:border-black/[0.12]"
                }`}
              >
                {/* Main Row */}
                <div
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                  className="p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-start md:items-center gap-3.5 min-w-0 flex-1">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0 ${getSeverityStyle(item.severity)}`}>
                      {item.severity}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 hover:text-[#E8532E] transition-colors text-sm">
                          {item.component}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-gray-100/80 border border-gray-200/60 text-gray-500 text-[10px] font-mono">
                          {item.category}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1 line-clamp-1">{item.issue}</div>
                      <div className="text-[11px] text-gray-400 font-mono mt-0.5 truncate">{item.file}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onInspectFile) onInspectFile(item.file);
                      }}
                      className="failade-btn-secondary !py-1 !px-2.5 text-xs font-mono flex items-center gap-1.5 opacity-90 hover:opacity-100"
                      title="Inspect source file"
                    >
                      <Code2 className="w-3.5 h-3.5 text-[#E8532E]" />
                      <span>Code</span>
                    </button>

                    <div className="w-7 h-7 rounded-lg bg-gray-100/70 border border-gray-200/50 flex items-center justify-center text-gray-400">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Actionable Drawer */}
                {isExpanded && (
                  <div className="px-5 py-4 bg-orange-50/20 border-t border-black/[0.06] space-y-3.5 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-2 space-y-2">
                        <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider font-mono">
                          Issue Description &amp; Architectural Context
                        </div>
                        <div className="p-3 bg-white/90 rounded-xl border border-black/[0.06] text-gray-700 leading-relaxed font-sans text-xs">
                          {item.issue}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider font-mono">
                          Module Location
                        </div>
                        <div className="p-3 bg-white/90 rounded-xl border border-black/[0.06] text-gray-600 font-mono text-[11px] break-all">
                          {item.file}
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-black/[0.04]">
                      <div className="flex items-center gap-2">
                        {onNavigateToImpact && (
                          <button
                            onClick={() => onNavigateToImpact(item.component, item.file)}
                            className="failade-btn-primary !py-1.5 !px-3 font-mono text-xs flex items-center gap-1.5"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>Simulate Blast Radius</span>
                          </button>
                        )}

                        {onAskAI && (
                          <button
                            onClick={() =>
                              onAskAI(
                                `How can I refactor "${item.component}" in "${item.file}" to resolve the ${item.severity} debt issue: "${item.issue}"? Provide code examples.`
                              )
                            }
                            className="failade-btn-secondary !py-1.5 !px-3 font-mono text-xs flex items-center gap-1.5"
                          >
                            <Bot className="w-3.5 h-3.5 text-[#E8532E]" />
                            <span>AI Refactor Strategy</span>
                          </button>
                        )}
                      </div>

                      {onInspectFile && (
                        <button
                          onClick={() => onInspectFile(item.file)}
                          className="text-[#E8532E] hover:underline font-mono text-xs flex items-center gap-1"
                        >
                          <span>Open file in editor</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
