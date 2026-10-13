"use client";

import React, { useState, useMemo, useEffect } from "react";
import { RiskPoint } from "@/lib/types";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from "recharts";
import {
  Flame,
  AlertTriangle,
  ShieldCheck,
  Code2,
  ArrowRight,
  Zap,
  Search,
  Bot,
  Sparkles,
  Layers,
  CheckCircle2,
  TrendingUp
} from "lucide-react";

interface RiskAnalysisViewProps {
  riskPoints: RiskPoint[];
  onSelectFile?: (filePath: string) => void;
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

export const RiskAnalysisView: React.FC<RiskAnalysisViewProps> = ({
  riskPoints,
  onSelectFile,
  onNavigateToImpact,
  onAskAI
}) => {
  const [selectedPoint, setSelectedPoint] = useState<RiskPoint | null>(riskPoints[0] || null);
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const highRiskCount = useMemo(() => riskPoints.filter(p => p.riskLevel === "CRITICAL" || p.riskLevel === "HIGH").length, [riskPoints]);
  const mediumRiskCount = useMemo(() => riskPoints.filter(p => p.riskLevel === "MEDIUM").length, [riskPoints]);
  const lowRiskCount = useMemo(() => riskPoints.filter(p => p.riskLevel === "LOW").length, [riskPoints]);

  const filteredPoints = useMemo(() => {
    return riskPoints.filter(point => {
      const matchLevel =
        selectedRiskFilter === "ALL" ||
        (selectedRiskFilter === "HIGH" && (point.riskLevel === "CRITICAL" || point.riskLevel === "HIGH")) ||
        (selectedRiskFilter === "MEDIUM" && point.riskLevel === "MEDIUM") ||
        (selectedRiskFilter === "LOW" && point.riskLevel === "LOW");

      const matchSearch =
        !searchQuery ||
        point.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        point.path.toLowerCase().includes(searchQuery.toLowerCase());

      return matchLevel && matchSearch;
    });
  }, [riskPoints, selectedRiskFilter, searchQuery]);

  const rankedHotspots = useMemo(() => {
    return [...riskPoints].sort((a, b) => (b.complexity * b.changeFrequency) - (a.complexity * a.changeFrequency));
  }, [riskPoints]);

  const getPointColor = (point: RiskPoint) => {
    if (point.riskLevel === "CRITICAL" || point.riskLevel === "HIGH") return "#E11D48";
    if (point.riskLevel === "MEDIUM") return "#F59E0B";
    return "#10B981";
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-7">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="failade-pill mb-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>Empirical Code Churn vs. Cyclomatic Complexity Quadrant</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <Flame className="w-6 h-6 text-[#E8532E]" />
            <span>Regression Hotspot &amp; Risk Matrix</span>
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1 max-w-2xl">
            Modules situated in the high-churn, high-complexity quadrant pose the highest statistical likelihood of production defects.
          </p>
        </div>

        {/* Quick Legend Pills */}
        <div className="flex items-center gap-2 bg-black/[0.03] p-1.5 rounded-xl border border-black/[0.04] text-xs font-mono">
          <button
            onClick={() => setSelectedRiskFilter("ALL")}
            className={`px-3 py-1 rounded-lg transition-all ${
              selectedRiskFilter === "ALL" ? "bg-white text-gray-900 shadow-2xs font-bold" : "text-gray-500"
            }`}
          >
            All ({riskPoints.length})
          </button>
          <button
            onClick={() => setSelectedRiskFilter("HIGH")}
            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
              selectedRiskFilter === "HIGH" ? "bg-rose-50 text-rose-700 shadow-2xs font-bold border border-rose-200/50" : "text-gray-500"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Critical ({highRiskCount})</span>
          </button>
          <button
            onClick={() => setSelectedRiskFilter("MEDIUM")}
            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
              selectedRiskFilter === "MEDIUM" ? "bg-amber-50 text-amber-700 shadow-2xs font-bold border border-amber-200/50" : "text-gray-500"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Medium ({mediumRiskCount})</span>
          </button>
          <button
            onClick={() => setSelectedRiskFilter("LOW")}
            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
              selectedRiskFilter === "LOW" ? "bg-emerald-50 text-emerald-700 shadow-2xs font-bold border border-emerald-200/50" : "text-gray-500"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Low ({lowRiskCount})</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Scatter Plot + Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Scatter Plot Liquid Card */}
        <div className="lg:col-span-2 liquid-card p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-gray-900 text-sm">Quadrant Distribution</span>
              <div className="text-[11px] text-gray-400 mt-0.5">Click any node to inspect telemetry</div>
            </div>

            {/* Quick Search inside plot */}
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find module..."
                className="w-full pl-8 pr-3 py-1.5 bg-black/[0.02] border border-black/[0.06] rounded-lg text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#E8532E] font-mono"
              />
            </div>
          </div>

          <div className="h-88 w-full relative">
            {/* Visual Quadrant Labels */}
            <div className="absolute top-2 right-4 text-[10px] font-mono font-bold text-rose-500/70 bg-rose-50/60 px-2 py-0.5 rounded border border-rose-200/40 pointer-events-none">
              DANGER ZONE (High Churn &amp; Complexity)
            </div>
            <div className="absolute bottom-6 left-12 text-[10px] font-mono font-bold text-emerald-600/70 bg-emerald-50/60 px-2 py-0.5 rounded border border-emerald-200/40 pointer-events-none">
              STABLE CORE
            </div>

            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 25, right: 25, bottom: 25, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" strokeOpacity={0.6} />
                <XAxis
                  type="number"
                  dataKey="changeFrequency"
                  name="Change Frequency"
                  unit=" changes"
                  stroke="#9CA3AF"
                  tick={{ fontSize: 10, fill: "#6B7280", fontFamily: "var(--font-geist-mono)" }}
                  label={{ value: "Git Churn (Commits / Changes) →", position: "insideBottomRight", offset: -12, fill: "#6B7280", fontSize: 10, fontFamily: "var(--font-geist-mono)" }}
                />
                <YAxis
                  type="number"
                  dataKey="complexity"
                  name="Complexity"
                  stroke="#9CA3AF"
                  tick={{ fontSize: 10, fill: "#6B7280", fontFamily: "var(--font-geist-mono)" }}
                  label={{ value: "Cyclomatic Complexity ↑", angle: -90, position: "insideLeft", fill: "#6B7280", fontSize: 10, fontFamily: "var(--font-geist-mono)" }}
                />
                <ReferenceLine y={12} stroke="#F43F5E" strokeDasharray="4 4" strokeOpacity={0.4} />
                <ReferenceLine x={40} stroke="#F43F5E" strokeDasharray="4 4" strokeOpacity={0.4} />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3", stroke: "#E8532E" }}
                  content={({ payload }) => {
                    if (payload && payload.length) {
                      const data = payload[0].payload as RiskPoint;
                      return (
                        <div className="p-3.5 bg-white/95 backdrop-blur-xl border border-black/[0.08] rounded-xl shadow-xl text-xs text-gray-900 font-sans space-y-1.5 min-w-[200px]">
                          <div className="font-bold text-[#E8532E] text-sm">{data.name}</div>
                          <div className="text-gray-400 text-[10px] font-mono truncate max-w-[220px]">{data.path}</div>
                          <div className="border-t border-black/[0.06] pt-2 space-y-1 font-mono text-[11px]">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Complexity:</span>
                              <strong className="text-gray-900">{data.complexity}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Git Churn:</span>
                              <strong className="text-gray-900">{data.changeFrequency} changes</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Risk Tier:</span>
                              <span className={`font-bold ${data.riskLevel === "CRITICAL" || data.riskLevel === "HIGH" ? "text-rose-600" : "text-emerald-600"}`}>
                                {data.riskLevel}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter
                  data={filteredPoints}
                  onClick={(entry: any) => {
                    const point = (entry?.payload || entry) as RiskPoint;
                    if (point && point.name) setSelectedPoint(point);
                  }}
                  cursor="pointer"
                >
                  {filteredPoints.map((entry, index) => {
                    const isSelected = selectedPoint?.id === entry.id;
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={getPointColor(entry)}
                        stroke={isSelected ? "#000000" : "rgba(255,255,255,0.9)"}
                        strokeWidth={isSelected ? 3 : 1.5}
                        r={isSelected ? 9 : 6.5}
                      />
                    );
                  })}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Selected Module Liquid Inspector */}
        <div className="liquid-card p-5 space-y-4 flex flex-col justify-between text-xs">
          {selectedPoint ? (
            <div className="space-y-4.5">
              <div className="border-b border-black/[0.06] pb-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#E8532E] font-bold uppercase tracking-wider font-mono">
                    Module Telemetry
                  </span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded-full text-[10px] border ${
                      selectedPoint.riskLevel === "CRITICAL" || selectedPoint.riskLevel === "HIGH"
                        ? "text-rose-700 bg-rose-50 border-rose-200/80 shadow-[0_0_8px_rgba(244,63,94,0.2)]"
                        : selectedPoint.riskLevel === "MEDIUM"
                        ? "text-amber-700 bg-amber-50 border-amber-200/80"
                        : "text-emerald-700 bg-emerald-50 border-emerald-200/80"
                    }`}
                  >
                    {selectedPoint.riskLevel} RISK
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mt-1">{selectedPoint.name}</h3>
                <div className="text-xs text-gray-400 font-mono mt-0.5 truncate">{selectedPoint.path}</div>
              </div>

              {/* Progress Gauge Cards */}
              <div className="space-y-3 font-mono">
                <div className="p-3 bg-black/[0.02] rounded-xl border border-black/[0.04] space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-500">Cyclomatic Complexity</span>
                    <strong className="text-gray-900">{selectedPoint.complexity} / 30</strong>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        selectedPoint.complexity > 15 ? "bg-rose-500" : selectedPoint.complexity > 8 ? "bg-amber-400" : "bg-emerald-400"
                      }`}
                      style={{ width: `${Math.min(100, (selectedPoint.complexity / 30) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="p-3 bg-black/[0.02] rounded-xl border border-black/[0.04] space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-500">Change Frequency</span>
                    <strong className="text-gray-900">{selectedPoint.changeFrequency} commits</strong>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#E8532E]"
                      style={{ width: `${Math.min(100, (selectedPoint.changeFrequency / 100) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between py-2 px-3 bg-black/[0.02] rounded-xl border border-black/[0.04]">
                  <span className="text-gray-500">Dependent Callers</span>
                  <strong className="text-gray-900 font-bold">{selectedPoint.dependents} modules</strong>
                </div>
              </div>

              {/* Hotspot warning callout if high */}
              {(selectedPoint.riskLevel === "CRITICAL" || selectedPoint.riskLevel === "HIGH") && (
                <div className="p-3 bg-rose-50/70 border border-rose-200/80 rounded-xl text-xs text-rose-700 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-rose-600" />
                    <span>Regression Hotspot Detected</span>
                  </div>
                  <div className="text-rose-600/90 text-[11px] leading-relaxed">
                    This module changes frequently and possesses high branching logic. Any modifications should be preceded by characterization tests.
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              Click any point in the scatter plot to inspect its telemetry.
            </div>
          )}

          {/* Action Dock */}
          {selectedPoint && (
            <div className="space-y-2 pt-3 border-t border-black/[0.06]">
              {onNavigateToImpact && (
                <button
                  onClick={() => onNavigateToImpact(selectedPoint.name, selectedPoint.path)}
                  className="failade-btn-primary w-full !py-2.5 font-mono text-xs flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  <span>Simulate Blast Radius</span>
                </button>
              )}

              {onSelectFile && (
                <button
                  onClick={() => onSelectFile(selectedPoint.path)}
                  className="failade-btn-secondary w-full !py-2 font-mono text-xs flex items-center justify-center gap-2"
                >
                  <Code2 className="w-3.5 h-3.5 text-[#E8532E]" />
                  <span>Inspect Code</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}

              {onAskAI && (
                <button
                  onClick={() =>
                    onAskAI(
                      `Analyze the regression risk of module "${selectedPoint.name}" located at "${selectedPoint.path}". It has a cyclomatic complexity of ${selectedPoint.complexity}, churn of ${selectedPoint.changeFrequency} changes, and ${selectedPoint.dependents} dependent callers. How can we decouple and test it safely?`
                    )
                  }
                  className="text-gray-500 hover:text-gray-800 text-[11px] font-mono text-center w-full py-1 flex items-center justify-center gap-1 transition-colors"
                >
                  <Bot className="w-3 h-3 text-[#E8532E]" />
                  <span>Ask AI Risk Audit</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Top 5 Hotspots Ranked List */}
      <div className="liquid-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#E8532E]" />
            <h2 className="text-sm font-bold text-gray-900">Highest Risk Hotspots (Ranked by Risk Factor)</h2>
          </div>
          <span className="text-xs text-gray-400 font-mono">Complexity × Churn</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {rankedHotspots.slice(0, 4).map((item, idx) => {
            const isSelected = selectedPoint?.id === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setSelectedPoint(item)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-orange-50/40 border-[#E8532E] ring-2 ring-orange-500/10 shadow-xs"
                    : "bg-white/80 border-black/[0.06] hover:border-black/[0.12] hover:bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-gray-400">#{idx + 1}</span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      item.riskLevel === "CRITICAL" || item.riskLevel === "HIGH"
                        ? "bg-rose-50 text-rose-600 border border-rose-200/60"
                        : "bg-amber-50 text-amber-600 border border-amber-200/60"
                    }`}
                  >
                    {item.riskLevel}
                  </span>
                </div>
                <div className="font-bold text-gray-900 text-xs mt-1.5 truncate">{item.name}</div>
                <div className="text-[10px] text-gray-400 font-mono truncate">{item.path}</div>
                <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-black/[0.04] text-[10px] font-mono text-gray-500">
                  <span>Risk Score:</span>
                  <strong className="text-rose-600 font-bold">{item.complexity * item.changeFrequency}</strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
