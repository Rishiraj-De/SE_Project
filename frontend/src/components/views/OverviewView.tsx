"use client";

import React from "react";
import { AnalysisResult } from "@/lib/types";
import {
  AlertTriangle,
  GitCommit,
  FileCode,
  Sparkles,
  ArrowRight,
  Zap,
  Network,
  Users,
  Code2,
  Box,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";

interface OverviewViewProps {
  analysis: AnalysisResult | null;
  onNavigateTab: (tab: any) => void;
}

// Animated Counter Hook for addictive number tickers
function AnimatedNumber({ value }: { value: number | string }) {
  const numeric = typeof value === "number" ? value : parseInt(String(value).replace(/,/g, ""), 10);
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    if (isNaN(numeric) || numeric === 0) {
      setDisplayValue(0);
      return;
    }
    let current = 0;
    const duration = 600;
    const stepTime = 16;
    const totalSteps = duration / stepTime;
    const increment = numeric / totalSteps;

    const timer = setInterval(() => {
      current += increment;
      if (current >= numeric) {
        setDisplayValue(numeric);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [numeric]);

  if (isNaN(numeric)) return <span>{value}</span>;
  return <span>{displayValue.toLocaleString()}</span>;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ analysis, onNavigateTab }) => {
  if (!analysis) {
    return (
      <div className="p-12 text-center text-gray-500 text-sm max-w-lg mx-auto mt-20">
        <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-6 h-6 text-[#E8532E]" />
        </div>
        <div className="font-semibold text-gray-900 text-base mb-1">No Active Repository Analyzed</div>
        <p className="text-xs text-gray-400">Click &ldquo;Import Repository&rdquo; in the sidebar to launch automated code cartography.</p>
      </div>
    );
  }

  const { summary, languages, circularDependencies, technicalDebt } = analysis;
  const highRiskDebt = technicalDebt.filter((d) => d.severity === "HIGH" || d.severity === "CRITICAL");
  const isHealthy = summary.healthScore >= 75;

  const metricCards = [
    { label: "Files", value: summary.filesCount, icon: <FileCode className="w-4 h-4 text-blue-500" /> },
    { label: "Lines of Code", value: summary.totalLoc, icon: <Code2 className="w-4 h-4 text-[#E8532E]" /> },
    { label: "Functions", value: summary.functionsCount, icon: <Zap className="w-4 h-4 text-amber-500" /> },
    { label: "Classes", value: summary.classesCount, icon: <Box className="w-4 h-4 text-purple-500" /> },
    { label: "Contributors", value: summary.contributorsCount, icon: <Users className="w-4 h-4 text-emerald-500" /> },
    { label: "Commits", value: summary.commitsCount, icon: <GitCommit className="w-4 h-4 text-cyan-500" /> }
  ];

  const breakdownItems = [
    { label: "Architecture", score: summary.healthBreakdown.architecture },
    { label: "Maintainability", score: summary.healthBreakdown.maintainability },
    { label: "Test Coverage", score: summary.healthBreakdown.testCoverage },
    { label: "Documentation", score: summary.healthBreakdown.documentation },
    { label: "Dependency Health", score: summary.healthBreakdown.dependencyHealth }
  ];

  const getBarColor = (score: number) => {
    if (score >= 70) return "bg-green-500";
    if (score >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-600";
    if (score >= 50) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Page Title & Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {analysis.repoName}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-semibold text-emerald-700 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-active" />
              <span>Live Excavation</span>
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Repository overview, architectural health telemetry &amp; code risk analysis
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigateTab("impact")}
            className="failade-btn-primary text-xs"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Impact Analysis</span>
          </button>
          <button
            onClick={() => onNavigateTab("architecture")}
            className="failade-btn-secondary text-xs"
          >
            <Network className="w-3.5 h-3.5" />
            <span>View Architecture</span>
          </button>
        </div>
      </div>

      {/* Metric Cards with Spring Physics & Tickers */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {metricCards.map((m, i) => (
          <div
            key={i}
            className="liquid-card p-4 relative overflow-hidden group cursor-default"
          >
            {/* Top specular reflection glare line */}
            <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90 pointer-events-none" />

            <div className="flex items-center justify-between mb-3">
              <span className="w-8 h-8 rounded-xl bg-white/80 border border-black/[0.05] shadow-2xs flex items-center justify-center transition-transform group-hover:scale-110 duration-200">
                {m.icon}
              </span>
            </div>
            <div className="text-2xl font-extrabold text-gray-900 tracking-tight font-mono">
              <AnimatedNumber value={m.value} />
            </div>
            <div className="text-[11.5px] font-medium text-gray-500 mt-1">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Engineering Health + Top Findings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Engineering Health */}
        <div className="liquid-card p-6 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90 pointer-events-none" />

          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-gray-900 tracking-tight">Engineering Health</h2>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${isHealthy ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
              {isHealthy ? "STABLE ARCHITECTURE" : "TECHNICAL DEBT RISK"}
            </span>
          </div>

          <div className="flex items-center gap-7">
            {/* Score Circle with Glowing Halo */}
            <div className="flex-shrink-0">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-28 h-28 -rotate-90 drop-shadow-sm" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="40" fill="none"
                    stroke={summary.healthScore >= 70 ? "#16A34A" : summary.healthScore >= 50 ? "#EA580C" : "#DC2626"}
                    strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${(summary.healthScore / 100) * 251.2} 251.2`}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-gray-900 tracking-tight font-mono">
                    <AnimatedNumber value={summary.healthScore} />
                  </span>
                  <span className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase">/ 100</span>
                </div>
              </div>
            </div>

            {/* Breakdown Bars with Animated Values */}
            <div className="flex-1 space-y-2.5">
              {breakdownItems.map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600 font-medium">{item.label}</span>
                    <span className={`font-bold font-mono ${getScoreColor(item.score)}`}>
                      {item.score}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-black/[0.05] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${getBarColor(item.score)}`}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Findings */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/90 p-5.5 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)]">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 tracking-tight">Top Findings</h2>

          <div className="space-y-3">
            <FindingItem
              icon={<AlertCircle className="w-4 h-4 text-red-500" />}
              text={`${highRiskDebt.length} high-risk modules`}
              color="text-red-700"
              bgColor="bg-red-50/80 border border-red-100/60"
            />
            <FindingItem
              icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
              text={`${technicalDebt.length} potential dead code files`}
              color="text-amber-700"
              bgColor="bg-amber-50"
            />
            <FindingItem
              icon={<XCircle className="w-4 h-4 text-red-500" />}
              text={`${circularDependencies.length} circular dependencies`}
              color="text-red-700"
              bgColor="bg-red-50"
            />
            <FindingItem
              icon={<AlertCircle className="w-4 h-4 text-amber-500" />}
              text={`Low test coverage (${summary.healthBreakdown.testCoverage}%)`}
              color="text-amber-700"
              bgColor="bg-amber-50"
            />
            <FindingItem
              icon={<CheckCircle2 className="w-4 h-4 text-green-500" />}
              text={`${summary.commitsCount} commits tracked`}
              color="text-green-700"
              bgColor="bg-green-50"
            />
          </div>

          <button
            onClick={() => onNavigateTab("tech-debt")}
            className="mt-4 text-xs font-medium text-[#E8532E] hover:text-[#D4441F] flex items-center gap-1 transition-colors"
          >
            <span>View all findings</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Critical Alerts */}
      {(circularDependencies.length > 0 || highRiskDebt.length > 0) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>Immediate Attention ({circularDependencies.length + highRiskDebt.length})</span>
            </h2>
            <button
              onClick={() => onNavigateTab("tech-debt")}
              className="text-xs font-medium text-[#E8532E] hover:text-[#D4441F] flex items-center gap-1 transition-colors"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {circularDependencies.map((cd, idx) => (
              <div
                key={idx}
                className="bg-white/80 backdrop-blur-md rounded-2xl border border-red-200/80 p-4.5 hover:shadow-md transition-all shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)]"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 text-[10px] font-semibold uppercase tracking-wider">
                    Circular Dependency
                  </span>
                  <button
                    onClick={() => onNavigateTab("architecture")}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-white/80 border border-gray-200 hover:border-orange-300 text-gray-600 hover:text-[#E8532E] transition-all flex items-center gap-1 shadow-2xs"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </button>
                </div>
                <div className="font-mono text-xs font-medium text-gray-800 bg-gray-50/80 px-3 py-1.5 rounded-xl border border-gray-100 truncate mb-2">
                  {cd.chain}
                </div>
                <p className="text-gray-500 text-xs leading-relaxed">
                  Tight mutual import prevents modular isolation.
                </p>
              </div>
            ))}

            {highRiskDebt.slice(0, 2).map((item, idx) => (
              <div
                key={idx}
                className="bg-white/80 backdrop-blur-md rounded-2xl border border-amber-200/80 p-4.5 hover:shadow-md transition-all shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)]"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 text-[10px] font-semibold uppercase">
                      {item.category}
                    </span>
                    <span className="text-xs font-semibold text-gray-700 truncate max-w-[150px]">
                      {item.component}
                    </span>
                  </div>
                  <button
                    onClick={() => onNavigateTab("tech-debt")}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-white/80 border border-gray-200 hover:border-orange-300 text-gray-600 hover:text-[#E8532E] transition-all flex items-center gap-1 shadow-2xs"
                  >
                    <span>Fix</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </button>
                </div>
                <div className="text-xs text-gray-500 font-mono mb-1">
                  File: <span className="text-[#E8532E]">{item.file}</span>
                </div>
                <p className="text-gray-500 text-xs leading-relaxed">{item.issue}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Language Composition */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/90 p-5.5 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-900 tracking-tight">Language Composition</span>
          <span className="text-xs text-gray-400 font-mono">{summary.totalLoc.toLocaleString()} total lines</span>
        </div>

        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden flex">
          <div
            className="bg-blue-500 h-full rounded-l-full"
            style={{ width: "88.8%" }}
            title="TypeScript 88.8%"
          />
          <div
            className="bg-amber-400 h-full rounded-r-full"
            style={{ width: "11.2%" }}
            title="JSON / Config 11.2%"
          />
        </div>

        <div className="flex items-center gap-6 mt-3 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-gray-700 font-medium">TypeScript</span>
            <span className="font-mono text-gray-400">(88.8%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-gray-700 font-medium">JSON / Config</span>
            <span className="font-mono text-gray-400">(11.2%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* Sub-component for findings list */
const FindingItem: React.FC<{ icon: React.ReactNode; text: string; color: string; bgColor: string }> = ({
  icon, text, color, bgColor
}) => (
  <div className="flex items-center gap-3">
    <div className={`w-7 h-7 rounded-lg ${bgColor} flex items-center justify-center shrink-0`}>
      {icon}
    </div>
    <span className={`text-xs font-medium ${color}`}>{text}</span>
  </div>
);
