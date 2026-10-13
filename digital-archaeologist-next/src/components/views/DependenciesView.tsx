"use client";

import React, { useState } from "react";
import { DependencyItem, CircularDependency } from "@/lib/types";
import { GitBranch, AlertTriangle, ArrowUpDown, ArrowRight } from "lucide-react";

interface DependenciesViewProps {
  dependencies: DependencyItem[];
  circularDependencies: CircularDependency[];
  onSelectModule?: (moduleName: string) => void;
}

export const DependenciesView: React.FC<DependenciesViewProps> = ({
  dependencies,
  circularDependencies,
  onSelectModule
}) => {
  const [filterRisk, setFilterRisk] = useState<string>("ALL");
  const [sortField, setSortField] = useState<"dependsOn" | "dependents">("dependents");
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const filtered = dependencies
    .filter((d) => (filterRisk === "ALL" ? true : d.risk === filterRisk))
    .sort((a, b) => {
      const diff = a[sortField] - b[sortField];
      return sortAsc ? diff : -diff;
    });

  const toggleSort = (field: "dependsOn" | "dependents") => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const highRiskCount = dependencies.filter(d => d.risk === "HIGH" || d.risk === "CRITICAL").length;

  const getRiskStyle = (risk: string) => {
    if (risk === "HIGH" || risk === "CRITICAL") return "bg-red-50 text-red-700 border-red-200";
    if (risk === "MEDIUM") return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-green-50 text-green-700 border-green-200";
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Dependencies</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Module coupling analysis — fan-in, fan-out, and circular dependency detection
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/90 p-4.5 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] hover:shadow-md transition-all">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Modules</div>
          <div className="text-2xl font-bold font-mono text-gray-900 mt-1">{dependencies.length}</div>
          <div className="text-xs text-gray-400 mt-0.5">Analyzed components</div>
        </div>
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-red-200/80 p-4.5 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">Circular Dependencies</span>
            {circularDependencies.length > 0 && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
          </div>
          <div className="text-2xl font-bold font-mono text-red-700 mt-1">{circularDependencies.length}</div>
          <div className="text-xs text-gray-400 mt-0.5">Import cycle loops</div>
        </div>
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-amber-200/80 p-4.5 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] hover:shadow-md transition-all">
          <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider">High Coupling</div>
          <div className="text-2xl font-bold font-mono text-amber-700 mt-1">{highRiskCount}</div>
          <div className="text-xs text-gray-400 mt-0.5">High fan-in volatility</div>
        </div>
      </div>

      {/* Circular Dependency Warning */}
      {circularDependencies.length > 0 && (
        <div className="bg-red-50/70 backdrop-blur-md border border-red-200/80 rounded-2xl p-5 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-100/80 border border-red-200 flex items-center justify-center">
                <AlertTriangle className="w-4.5 h-4.5 text-red-600" />
              </div>
              <div>
                <div className="text-xs font-bold text-red-700 tracking-wider">
                  {circularDependencies.length} CIRCULAR IMPORT CYCLE DETECTED
                </div>
                <p className="text-xs text-red-500/90">Mutual imports introduce initialization race conditions.</p>
              </div>
            </div>
            <button
              onClick={() => onSelectModule && onSelectModule("PaymentService")}
              className="text-xs px-3.5 py-1.5 rounded-xl bg-white/90 hover:bg-white border border-red-200 text-red-700 transition-all flex items-center gap-1.5 shadow-2xs font-medium"
            >
              <span>Inspect</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 font-mono text-xs">
            {circularDependencies.map((cd, i) => (
              <div key={i} className="p-3 rounded-xl bg-white/80 border border-red-100 flex items-center justify-between shadow-2xs">
                <span className="text-gray-500 text-[10px]">Cycle #{i + 1}</span>
                <span className="text-red-700 font-semibold truncate max-w-[280px]">{cd.chain}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 font-medium">Risk Filter:</span>
          {["ALL", "HIGH", "MEDIUM", "LOW"].map((risk) => (
            <button
              key={risk}
              onClick={() => setFilterRisk(risk)}
              className={`px-3 py-1 rounded-xl transition-all text-xs font-medium ${
                filterRisk === risk
                  ? "bg-orange-50 border border-orange-200 text-[#E8532E] shadow-2xs"
                  : "text-gray-500 hover:text-gray-800 bg-white/60 border border-black/[0.06] hover:bg-white"
              }`}
            >
              {risk}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400 font-mono">
          {filtered.length} of {dependencies.length} modules
        </span>
      </div>

      {/* Table */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/90 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-gray-500">
              <th className="py-3 px-4 font-semibold">Module</th>
              <th className="py-3 px-4 font-semibold">File</th>
              <th onClick={() => toggleSort("dependsOn")} className="py-3 px-4 font-semibold cursor-pointer hover:text-gray-700 transition-colors">
                <div className="flex items-center gap-1.5">Fan-Out <ArrowUpDown className="w-3 h-3 text-[#E8532E]" /></div>
              </th>
              <th onClick={() => toggleSort("dependents")} className="py-3 px-4 font-semibold cursor-pointer hover:text-gray-700 transition-colors">
                <div className="flex items-center gap-1.5">Fan-In <ArrowUpDown className="w-3 h-3 text-[#E8532E]" /></div>
              </th>
              <th className="py-3 px-4 font-semibold">Risk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((item) => {
              const isCircular = circularDependencies.some((cd) => cd.modules.includes(item.module));
              return (
                <tr
                  key={item.module}
                  onClick={() => onSelectModule && onSelectModule(item.module)}
                  className="hover:bg-orange-50/50 transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-4 font-medium text-gray-900 flex items-center gap-2">
                    <span className="group-hover:text-[#E8532E] transition-colors">{item.module}</span>
                    {isCircular && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 font-bold">
                        CIRCULAR
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-xs truncate max-w-xs font-mono">{item.path}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-700 font-mono">{item.dependsOn}</span>
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#E8532E] rounded-full" style={{ width: `${Math.min(100, item.dependsOn * 20)}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-700 font-mono">{item.dependents}</span>
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, item.dependents * 20)}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getRiskStyle(item.risk)}`}>
                      {item.risk}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
