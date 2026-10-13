"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { AnalysisResult, BlastRadiusResult } from "@/lib/types";
import { fetchImpactAnalysis } from "@/lib/api";
import {
  Zap,
  GitBranch,
  Database,
  Globe,
  ShieldAlert,
  ArrowRight,
  CornerDownRight,
  CheckCircle2,
  Copy,
  Check,
  Search,
  Bot,
  ExternalLink,
  Code2,
  AlertTriangle,
  Layers,
  ChevronDown,
  RefreshCw,
  FileCode,
  FolderTree,
  Sparkles
} from "lucide-react";

interface ImpactAnalysisViewProps {
  analysis?: AnalysisResult | null;
  initialSymbol?: string;
  initialFile?: string;
  onOpenCodebase?: (filePath: string) => void;
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
    const duration = 450;
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

export const ImpactAnalysisView: React.FC<ImpactAnalysisViewProps> = ({
  analysis,
  initialSymbol,
  initialFile,
  onOpenCodebase,
  onAskAI
}) => {
  const defaultSymbol = useMemo(() => {
    if (initialSymbol) return initialSymbol;
    if (analysis?.riskPoints && analysis.riskPoints.length > 0) {
      return analysis.riskPoints[0].name;
    }
    if (analysis?.files && analysis.files.length > 0) {
      return analysis.files[0].name.replace(/\.[^.]+$/, "");
    }
    return "PaymentService.processPayment()";
  }, [initialSymbol, analysis]);

  const defaultFile = useMemo(() => {
    if (initialFile) return initialFile;
    if (analysis?.riskPoints && analysis.riskPoints.length > 0) {
      return analysis.riskPoints[0].path;
    }
    if (analysis?.files && analysis.files.length > 0) {
      return analysis.files[0].path;
    }
    return "src/payment/PaymentService.ts";
  }, [initialFile, analysis]);

  const [targetSymbol, setTargetSymbol] = useState<string>(defaultSymbol);
  const [targetFile, setTargetFile] = useState<string>(defaultFile);
  const [impactData, setImpactData] = useState<BlastRadiusResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSelectorOpen, setIsSelectorOpen] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"tree" | "functions" | "reasons">("tree");

  const selectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialSymbol) {
      setTargetSymbol(initialSymbol);
      if (initialFile) setTargetFile(initialFile);
      handleRunAnalysis(initialSymbol, initialFile);
    } else if (defaultSymbol) {
      setTargetSymbol(defaultSymbol);
      setTargetFile(defaultFile);
      handleRunAnalysis(defaultSymbol, defaultFile);
    }
  }, [initialSymbol, initialFile, analysis?.id]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(e.target as Node)) {
        setIsSelectorOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const presets = useMemo(() => {
    if (!analysis) {
      return [
        { label: "PaymentService.processPayment()", file: "src/payment/PaymentService.ts" },
        { label: "AuthController.login()", file: "src/auth/AuthController.ts" },
        { label: "LegacyCryptoUtils.legacy_v1_encrypt()", file: "src/utils/LegacyCryptoUtils.ts" },
        { label: "DatabaseConnector.query()", file: "src/database/DatabaseConnector.ts" }
      ];
    }

    const items: Array<{ label: string; file: string; tag?: string }> = [];

    for (const rp of (analysis.riskPoints || []).slice(0, 3)) {
      items.push({
        label: rp.name,
        file: rp.path,
        tag: `${rp.riskLevel} Risk`
      });
    }

    for (const cd of (analysis.circularDependencies || []).slice(0, 2)) {
      for (const m of cd.modules) {
        if (!items.some(i => i.label === m)) {
          const matchingF = analysis.files.find(f => f.name.replace(/\.[^.]+$/, "") === m);
          items.push({
            label: m,
            file: matchingF?.path || m,
            tag: "Circular Cycle"
          });
        }
      }
    }

    const sortedDeps = [...(analysis.dependencies || [])].sort((a, b) => (b.dependsOn + b.dependents) - (a.dependsOn + a.dependents));
    for (const d of sortedDeps.slice(0, 3)) {
      if (!items.some(i => i.label === d.module)) {
        items.push({
          label: d.module,
          file: d.path,
          tag: `${d.dependents} Callers`
        });
      }
    }

    if (items.length < 4 && analysis.files) {
      for (const f of analysis.files) {
        const modName = f.name.replace(/\.[^.]+$/, "");
        if (!items.some(i => i.label === modName)) {
          items.push({
            label: modName,
            file: f.path
          });
          if (items.length >= 4) break;
        }
      }
    }

    return items.slice(0, 5);
  }, [analysis]);

  const selectableFiles = useMemo(() => {
    if (!analysis?.files) return [];
    return analysis.files
      .filter(f => {
        if (!searchFilter.trim()) return true;
        const q = searchFilter.toLowerCase();
        return f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q);
      })
      .slice(0, 30);
  }, [analysis, searchFilter]);

  const handleRunAnalysis = async (symbolToRun?: string, fileToRun?: string) => {
    const symbol = symbolToRun || targetSymbol;
    const file = fileToRun !== undefined ? fileToRun : targetFile;
    if (!symbol) return;

    setIsLoading(true);
    try {
      const data = await fetchImpactAnalysis(symbol, file);
      setImpactData(data);
    } catch (err) {
      console.error("Failed to run impact analysis:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTarget = (symbol: string, file: string) => {
    setTargetSymbol(symbol);
    setTargetFile(file);
    setIsSelectorOpen(false);
    handleRunAnalysis(symbol, file);
  };

  const handleCopyReport = () => {
    if (!impactData) return;
    const md = [
      `# Impact & Blast Radius Report: ${impactData.targetSymbol}`,
      `**Target File:** \`${impactData.targetFile}\``,
      `**Risk Rating:** ${impactData.riskRating} (${impactData.confidence})`,
      `**Affected Modules (${impactData.affectedModules.length}):** ${impactData.affectedModules.join(", ") || "None"}`,
      `**Database Operations:** ${impactData.databaseOperations}`,
      `**External Gateways / APIs:** ${impactData.externalApis}`,
      ``,
      `## Architectural Impact Factors:`,
      ...impactData.reasoning.map(r => `- ${r}`),
      ``,
      `## Affected Functions / Callers:`,
      ...impactData.affectedFunctions.map(f => `- \`${f}\``)
    ].join("\n");

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAskAIAboutImpact = () => {
    if (!onAskAI || !impactData) return;
    const prompt = `Perform a comprehensive risk review for modifying "${impactData.targetSymbol}" in "${impactData.targetFile}". It has a ${impactData.riskRating} blast radius affecting ${impactData.affectedModules.length} module(s) (${impactData.affectedModules.join(", ")}). What breaking changes could occur, and what characterization tests should be written before modifying this code?`;
    onAskAI(prompt);
  };

  const getRiskBadge = (rating?: string) => {
    switch (rating) {
      case "CRITICAL":
        return {
          bg: "bg-rose-50 border-rose-200/80 text-rose-600 shadow-[0_0_12px_rgba(244,63,94,0.2)]",
          label: "CRITICAL BLAST RADIUS",
          barBg: "bg-rose-500"
        };
      case "HIGH":
        return {
          bg: "bg-amber-50 border-amber-300 text-amber-700 shadow-[0_0_12px_rgba(245,158,11,0.2)]",
          label: "HIGH BLAST RADIUS",
          barBg: "bg-amber-500"
        };
      case "MEDIUM":
        return {
          bg: "bg-orange-50 border-orange-300 text-[#E8532E] shadow-2xs",
          label: "MODERATE IMPACT",
          barBg: "bg-orange-500"
        };
      default:
        return {
          bg: "bg-emerald-50 border-emerald-200/80 text-emerald-600 shadow-[0_0_12px_rgba(16,185,129,0.2)]",
          label: "LOW BLAST RADIUS",
          barBg: "bg-emerald-500"
        };
    }
  };

  const riskBadge = getRiskBadge(impactData?.riskRating);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-7 text-gray-900">
      {/* Light Header */}
      <div className="space-y-3">
        <div className="failade-pill">
          <span className="w-2 h-2 rounded-full bg-[#E8532E] animate-pulse" />
          <span>Static AST Call Graph &amp; Transitive Blast Radius Simulator</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2.5">
              <Zap className="w-6 h-6 text-[#E8532E]" />
              <span>Blast Radius &amp; Change Impact Simulator</span>
            </h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1 max-w-2xl">
              Predict ripple effects across upstream callers, transitive dependencies, database writes, and external third-party APIs before modifying code.
            </p>
          </div>

          {impactData && (
            <div className="flex items-center gap-2.5 self-start md:self-auto font-mono text-xs">
              <button
                onClick={handleCopyReport}
                className="failade-btn-secondary text-xs !py-1.5 !px-3 font-mono flex items-center gap-1.5"
                title="Copy markdown report"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#E8532E]" />}
                <span>{copied ? "Copied" : "Copy Report"}</span>
              </button>

              {onAskAI && (
                <button
                  onClick={handleAskAIAboutImpact}
                  className="failade-btn-primary text-xs !py-1.5 !px-3 font-mono flex items-center gap-1.5"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>AI Risk Review</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Target Selection & Trigger Bar */}
      <div className="liquid-card p-5 space-y-4 font-mono text-xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-end gap-3.5">
          {/* Target Input with Dropdown */}
          <div className="flex-1 space-y-1.5 relative" ref={selectorRef}>
            <div className="flex items-center justify-between text-xs font-sans">
              <label className="text-gray-600 font-semibold flex items-center gap-1.5">
                <span>Target Function, Symbol, or Module:</span>
              </label>
              {targetFile && (
                <span className="text-[10px] text-gray-400 truncate max-w-xs font-mono" title={targetFile}>
                  File: {targetFile}
                </span>
              )}
            </div>

            <div className="relative flex items-center">
              <input
                type="text"
                value={targetSymbol}
                onChange={(e) => setTargetSymbol(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRunAnalysis()}
                placeholder="e.g. PaymentService.processPayment() or src/payment/PaymentService.ts"
                className="w-full pl-4 pr-28 py-2.5 bg-white/80 border border-black/[0.08] rounded-xl text-gray-900 focus:border-[#E8532E] focus:outline-none placeholder-gray-400 font-mono text-xs transition-all shadow-2xs"
              />

              <button
                type="button"
                onClick={() => setIsSelectorOpen(!isSelectorOpen)}
                className="absolute right-2 px-2.5 py-1 bg-black/[0.03] hover:bg-black/[0.06] text-gray-600 hover:text-gray-900 border border-black/[0.06] rounded-lg text-[11px] flex items-center gap-1.5 transition-all font-sans"
              >
                <FolderTree className="w-3 h-3 text-[#E8532E]" />
                <span>Browse</span>
                <ChevronDown className="w-3 h-3 text-gray-500" />
              </button>
            </div>

            {/* Dropdown File Picker */}
            {isSelectorOpen && (
              <div className="absolute z-30 left-0 right-0 top-full mt-2 bg-white/95 backdrop-blur-xl border border-black/[0.08] rounded-xl shadow-2xl max-h-72 flex flex-col overflow-hidden">
                <div className="p-3 border-b border-black/[0.06] bg-black/[0.02] flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-[#E8532E]" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search files or symbols..."
                    className="w-full bg-transparent text-xs text-gray-900 focus:outline-none placeholder:text-gray-400"
                    autoFocus
                  />
                </div>

                <div className="overflow-y-auto flex-1 p-1.5 divide-y divide-black/[0.04]">
                  {selectableFiles.length > 0 ? (
                    selectableFiles.map((file) => {
                      const modName = file.name.replace(/\.[^.]+$/, "");
                      return (
                        <button
                          key={file.path}
                          onClick={() => handleSelectTarget(modName, file.path)}
                          className="w-full text-left px-3 py-2 hover:bg-orange-50/70 rounded-lg flex items-center justify-between group transition-all"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <FileCode className="w-3.5 h-3.5 text-[#E8532E] shrink-0" />
                            <span className="font-semibold text-gray-900 group-hover:text-[#E8532E]">
                              {file.name}
                            </span>
                            <span className="text-[10px] text-gray-400 truncate font-mono">({file.path})</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 text-[10px] font-mono">
                            <span className="text-gray-500">{file.language}</span>
                            {file.complexity > 10 && (
                              <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-200 rounded">
                                CC:{file.complexity}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-xs text-gray-500">
                      No matching files found.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => handleRunAnalysis()}
            disabled={isLoading}
            className="failade-btn-primary !py-2.5 !px-5 font-mono text-xs flex items-center justify-center gap-2 shrink-0 shadow-sm"
          >
            <Zap className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>{isLoading ? "Tracing Call Graph..." : "Simulate Blast Radius"}</span>
          </button>
        </div>

        {/* Dynamic Quick Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono">
          <span className="text-gray-400 font-sans">Quick Presets:</span>
          {presets.map((p) => {
            const isSelected = targetSymbol === p.label || targetFile === p.file;
            return (
              <button
                key={p.label}
                onClick={() => {
                  setTargetSymbol(p.label);
                  setTargetFile(p.file);
                  handleRunAnalysis(p.label, p.file);
                }}
                className={`px-3 py-1 rounded-lg border transition-all flex items-center gap-2 ${
                  isSelected
                    ? "bg-orange-50 border-[#E8532E] text-[#E8532E] font-semibold shadow-2xs"
                    : "bg-white/70 border-black/[0.06] hover:border-black/[0.12] text-gray-600 hover:text-gray-900"
                }`}
              >
                <span>{p.label}</span>
                {p.tag && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-black/[0.04] text-gray-600">
                    {p.tag}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading state or results */}
      {isLoading ? (
        <div className="p-16 text-center liquid-card space-y-4">
          <RefreshCw className="w-10 h-10 text-[#E8532E] animate-spin mx-auto" />
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-gray-900 tracking-tight">
              Computing Static Call Graph &amp; Blast Radius...
            </h3>
            <p className="text-xs text-gray-500 font-mono">
              Traversing imports, upstream callers, database queries, and external APIs for {targetSymbol}
            </p>
          </div>
        </div>
      ) : impactData ? (
        <div className="space-y-6">
          {/* Summary counters with risk rating */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Risk Rating Card */}
            <div className="liquid-card p-4.5 font-mono text-xs flex flex-col justify-between">
              <div className="text-gray-500 flex items-center justify-between font-sans">
                <span className="font-semibold text-gray-700">Blast Severity</span>
                <ShieldAlert className="w-4 h-4 text-[#E8532E]" />
              </div>
              <div className="mt-3">
                <span className={`inline-block px-2.5 py-1 rounded-full border text-[11px] font-bold ${riskBadge.bg}`}>
                  {riskBadge.label}
                </span>
                <div className="text-[10px] text-gray-400 mt-1 font-mono">{impactData.confidence}</div>
              </div>
            </div>

            {/* Affected Modules */}
            <div className="liquid-card p-4.5 font-mono text-xs flex flex-col justify-between">
              <div className="text-gray-500 flex items-center justify-between font-sans">
                <span className="font-semibold text-gray-700">Affected Modules</span>
                <Layers className="w-4 h-4 text-blue-600" />
              </div>
              <div className="mt-3">
                <div className="text-3xl font-extrabold font-mono text-gray-900 tracking-tight">
                  <AnimatedNumber value={impactData.affectedModules.length} />
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">Direct &amp; transitive modules</div>
              </div>
            </div>

            {/* Transitive Functions */}
            <div className="liquid-card p-4.5 font-mono text-xs flex flex-col justify-between">
              <div className="text-gray-500 flex items-center justify-between font-sans">
                <span className="font-semibold text-gray-700">Impacted Functions</span>
                <Code2 className="w-4 h-4 text-[#E8532E]" />
              </div>
              <div className="mt-3">
                <div className="text-3xl font-extrabold font-mono text-[#E8532E] tracking-tight">
                  <AnimatedNumber value={impactData.affectedFunctions.length} />
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">Methods in call path</div>
              </div>
            </div>

            {/* Database Operations */}
            <div className="liquid-card p-4.5 font-mono text-xs flex flex-col justify-between">
              <div className="text-gray-500 flex items-center justify-between font-sans">
                <span className="font-semibold text-gray-700">Database Writes</span>
                <Database className="w-4 h-4 text-amber-600" />
              </div>
              <div className="mt-3">
                <div className="text-3xl font-extrabold font-mono text-amber-600 tracking-tight">
                  <AnimatedNumber value={impactData.databaseOperations} />
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">SQL / Data access points</div>
              </div>
            </div>

            {/* External APIs */}
            <div className="liquid-card p-4.5 font-mono text-xs flex flex-col justify-between">
              <div className="text-gray-500 flex items-center justify-between font-sans">
                <span className="font-semibold text-gray-700">External Gateways</span>
                <Globe className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-3">
                <div className="text-3xl font-extrabold font-mono text-emerald-600 tracking-tight">
                  <AnimatedNumber value={impactData.externalApis} />
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">Network endpoints / clients</div>
              </div>
            </div>
          </div>

          {/* Tab Navigation for Detailed Views */}
          <div className="flex items-center gap-2 border-b border-black/[0.06] pb-3 font-mono text-xs">
            <button
              onClick={() => setActiveTab("tree")}
              className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-2 ${
                activeTab === "tree"
                  ? "bg-white text-[#E8532E] border border-orange-200/80 shadow-2xs font-bold"
                  : "text-gray-500 hover:text-gray-900 bg-black/[0.02]"
              }`}
            >
              <FolderTree className="w-3.5 h-3.5 text-[#E8532E]" />
              <span>Transitive Call Graph Tree</span>
            </button>

            <button
              onClick={() => setActiveTab("functions")}
              className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-2 ${
                activeTab === "functions"
                  ? "bg-white text-[#E8532E] border border-orange-200/80 shadow-2xs font-bold"
                  : "text-gray-500 hover:text-gray-900 bg-black/[0.02]"
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Affected Functions ({impactData.affectedFunctions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("reasons")}
              className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-2 ${
                activeTab === "reasons"
                  ? "bg-white text-[#E8532E] border border-orange-200/80 shadow-2xs font-bold"
                  : "text-gray-500 hover:text-gray-900 bg-black/[0.02]"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              <span>Impact Reasoning &amp; Verification</span>
            </button>
          </div>

          {/* TAB 1: Transitive Call Graph Tree */}
          {activeTab === "tree" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Call Graph Visual Tree (2 cols) */}
              <div className="lg:col-span-2 liquid-card p-6 space-y-4">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="uppercase tracking-wider text-[#E8532E] font-bold flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-[#E8532E]" />
                    Transitive Call Graph Blast Radius
                  </span>
                  <span className="text-gray-400">{impactData.confidence}</span>
                </div>

                <div className="p-5 bg-white/70 border border-black/[0.06] rounded-xl font-mono text-xs space-y-4 shadow-2xs">
                  {/* Root target node */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-orange-50/80 border border-orange-200/80 shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2 py-0.5 rounded-md bg-[#E8532E] text-white font-bold text-[10px]">
                        TARGET
                      </span>
                      <span className="font-bold text-gray-900 text-xs">{impactData.targetSymbol}</span>
                    </div>

                    {impactData.targetFile && onOpenCodebase && (
                      <button
                        onClick={() => onOpenCodebase(impactData.targetFile)}
                        className="flex items-center gap-1.5 text-xs text-[#E8532E] hover:underline transition-colors font-sans"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Inspect Code</span>
                      </button>
                    )}
                  </div>

                  {/* Children: Upstream Callers & Downstream Imports */}
                  {impactData.callHierarchy.children && impactData.callHierarchy.children.length > 0 ? (
                    <div className="pl-4 border-l-2 border-orange-200 space-y-4 ml-2">
                      {impactData.callHierarchy.children.map((child: any, idx: number) => {
                        const isCaller = child.type === "caller" || child.name.includes("(caller)");
                        return (
                          <div key={idx} className="space-y-2">
                            <div className="flex items-center justify-between group p-2 rounded-lg hover:bg-black/[0.02] transition-colors">
                              <div className="flex items-center gap-2 text-gray-900">
                                <CornerDownRight className="w-3.5 h-3.5 text-[#E8532E] shrink-0" />
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                                    isCaller
                                      ? "bg-rose-50 text-rose-600 border border-rose-200/80"
                                      : "bg-orange-50 text-[#E8532E] border border-orange-200/80"
                                  }`}
                                >
                                  {isCaller ? "UPSTREAM CALLER" : "DOWNSTREAM IMPORT"}
                                </span>
                                <span className="font-semibold text-xs">{child.name}</span>
                                {child.file && (
                                  <span className="text-[10px] text-gray-400 font-mono">({child.file})</span>
                                )}
                              </div>

                              {child.file && onOpenCodebase && (
                                <button
                                  onClick={() => onOpenCodebase(child.file)}
                                  className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[11px] text-[#E8532E] hover:underline transition-opacity font-sans"
                                >
                                  <span>View File</span>
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                              )}
                            </div>

                            {/* Sub children */}
                            {child.children && child.children.length > 0 && (
                              <div className="pl-6 border-l border-black/[0.06] space-y-1.5 ml-4">
                                {child.children.map((sub: any, sIdx: number) => (
                                  <div
                                    key={sIdx}
                                    className="flex items-center justify-between p-1.5 rounded hover:bg-black/[0.02] text-gray-600 text-[11px] group"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#E8532E] shadow-2xs" />
                                      <span className="text-gray-900 font-medium">{sub.name}</span>
                                      {sub.file && (
                                        <span className="text-[10px] text-gray-400">({sub.file})</span>
                                      )}
                                    </div>

                                    {sub.file && onOpenCodebase && (
                                      <button
                                        onClick={() => onOpenCodebase(sub.file)}
                                        className="opacity-0 group-hover:opacity-100 text-[10px] text-[#E8532E] hover:underline font-sans"
                                      >
                                        Inspect
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-400 font-mono text-xs">
                      No direct callers or dependencies detected for this symbol.
                    </div>
                  )}
                </div>
              </div>

              {/* Affected Modules Panel (1 col) */}
              <div className="liquid-card p-6 space-y-4">
                <div className="text-xs font-mono uppercase tracking-wider text-gray-600 font-bold flex items-center justify-between">
                  <span>Coupled Modules</span>
                  <span className="text-[#E8532E] font-bold">{impactData.affectedModules.length}</span>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {impactData.affectedModules.length > 0 ? (
                    impactData.affectedModules.map((modName, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white/70 border border-black/[0.06] rounded-xl flex items-center justify-between text-xs font-mono hover:border-orange-200 transition-all shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <Layers className="w-3.5 h-3.5 text-[#E8532E]" />
                          <span className="text-gray-900 font-semibold">{modName}</span>
                        </div>

                        <button
                          onClick={() => {
                            setTargetSymbol(modName);
                            handleRunAnalysis(modName);
                          }}
                          className="text-[11px] text-[#E8532E] hover:underline flex items-center gap-1 font-sans"
                          title="Simulate this module"
                        >
                          <span>Simulate</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-400 p-4 text-center">
                      No external coupled modules detected.
                    </div>
                  )}
                </div>

                {/* Safe Refactoring Checklist Advice */}
                <div className="p-4 rounded-xl bg-orange-50/70 border border-orange-200/80 space-y-1.5 font-sans">
                  <div className="font-semibold text-gray-900 flex items-center gap-1.5 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Regression Verification Required</span>
                  </div>
                  <p className="text-gray-600 text-xs leading-relaxed">
                    Changes to this component require regression verification on all {impactData.affectedModules.length} coupled modules before shipping.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Affected Functions */}
          {activeTab === "functions" && (
            <div className="liquid-card p-6 space-y-4">
              <div className="text-xs font-mono uppercase tracking-wider text-gray-600 font-bold">
                Functions &amp; Methods within Blast Radius ({impactData.affectedFunctions.length})
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {impactData.affectedFunctions.map((fn, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-white/70 border border-black/[0.06] rounded-xl flex items-center justify-between text-xs font-mono hover:border-orange-200 transition-all shadow-2xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Code2 className="w-3.5 h-3.5 text-[#E8532E] shrink-0" />
                      <span className="text-gray-900 font-semibold truncate" title={fn}>
                        {fn}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setTargetSymbol(fn);
                        handleRunAnalysis(fn);
                      }}
                      className="text-[11px] text-[#E8532E] hover:underline shrink-0 ml-2 font-sans"
                    >
                      Inspect
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Reasoning & Verification */}
          {activeTab === "reasons" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Why These Components Are Affected */}
              <div className="liquid-card p-6 space-y-4">
                <div className="text-xs font-mono uppercase tracking-wider text-gray-600 font-bold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Detected Architectural Impact Factors</span>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  {impactData.reasoning.map((reason, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-white/70 border border-black/[0.06] rounded-xl space-y-1.5 shadow-2xs"
                    >
                      <div className="text-gray-400 text-[11px] flex items-center gap-2">
                        <span className="text-[#E8532E] font-bold font-mono">Factor #{idx + 1}</span>
                      </div>
                      <p className="text-gray-700 font-sans text-xs leading-relaxed">{reason}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Engineering Verification Advice */}
              <div className="liquid-card p-6 space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="text-xs font-mono uppercase tracking-wider text-gray-600 font-bold">
                    Engineering Verification Checklist
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="p-4 rounded-xl bg-white/70 border border-black/[0.06] space-y-1.5 shadow-2xs">
                      <div className="font-sans text-gray-900 font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>1. Write Characterization Tests</span>
                      </div>
                      <p className="text-gray-500 leading-relaxed font-sans">
                        Static analysis indicates {impactData.affectedModules.length} dependent module(s). Write golden tests around existing response payloads before refactoring.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-white/70 border border-black/[0.06] space-y-1.5 shadow-2xs">
                      <div className="font-sans text-gray-900 font-bold flex items-center gap-2">
                        <Database className="w-4 h-4 text-amber-600" />
                        <span>2. Database &amp; State Integrity</span>
                      </div>
                      <p className="text-gray-500 leading-relaxed font-sans">
                        {impactData.databaseOperations > 0
                          ? `Identified ${impactData.databaseOperations} data access write/query path(s). Verify schema compatibility and migration rollback safety.`
                          : "No direct database write operations detected along the inspected call graph."}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-white/70 border border-black/[0.06] space-y-1.5 shadow-2xs">
                      <div className="font-sans text-gray-900 font-bold flex items-center gap-2">
                        <Globe className="w-4 h-4 text-[#E8532E]" />
                        <span>3. API Contract Guarantees</span>
                      </div>
                      <p className="text-gray-500 leading-relaxed font-sans">
                        {impactData.externalApis > 0
                          ? `${impactData.externalApis} remote gateway client(s) or endpoints depend on this behavior. Ensure semver backward compatibility.`
                          : "No external third-party API dependencies affected."}
                      </p>
                    </div>
                  </div>
                </div>

                {onAskAI && (
                  <button
                    onClick={handleAskAIAboutImpact}
                    className="failade-btn-primary w-full !py-2.5 font-mono text-xs flex items-center justify-center gap-2 mt-4"
                  >
                    <Bot className="w-4 h-4" />
                    <span>Generate AI Refactoring Plan for this Impact</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 liquid-card text-gray-400 font-mono text-xs space-y-3">
          <Zap className="w-8 h-8 text-[#E8532E]/60 mx-auto" />
          <div className="text-gray-900 font-bold">No Blast Radius Computed Yet</div>
          <div>Select or input a function or module above and click &ldquo;Simulate Blast Radius&rdquo;.</div>
        </div>
      )}
    </div>
  );
};
