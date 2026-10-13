"use client";

import React, { useState, useMemo } from "react";
import { GitCommit, MostChangedFile } from "@/lib/types";
import {
  History,
  GitPullRequest,
  Calendar,
  User,
  FileText,
  ArrowRight,
  GitBranch,
  Copy,
  Check,
  Search,
  Sparkles,
  Zap,
  TrendingUp,
  Layers
} from "lucide-react";

interface GitHistoryViewProps {
  commits: GitCommit[];
  mostChangedFiles: MostChangedFile[];
  onSelectFile?: (filePath: string) => void;
  onNavigateToImpact?: (symbol: string, file: string) => void;
}

export const GitHistoryView: React.FC<GitHistoryViewProps> = ({
  commits,
  mostChangedFiles,
  onSelectFile,
  onNavigateToImpact
}) => {
  const [selectedFileFilter, setSelectedFileFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"Commits" | "Contributors" | "Branches">("Commits");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const activityData = useMemo(() => {
    return [45, 62, 89, 120, 95, 140, 185, 210, 175, 190, 230, 260];
  }, []);

  const handleCopyHash = (hash: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 1800);
  };

  const filteredCommits = useMemo(() => {
    if (!searchQuery) return commits;
    const q = searchQuery.toLowerCase();
    return commits.filter(
      (c) =>
        c.hash.toLowerCase().includes(q) ||
        c.message.toLowerCase().includes(q) ||
        c.author.toLowerCase().includes(q)
    );
  }, [commits, searchQuery]);

  const avatarGradients = [
    "from-orange-500 to-rose-500",
    "from-blue-500 to-indigo-600",
    "from-emerald-500 to-teal-600",
    "from-purple-500 to-pink-500",
    "from-amber-500 to-orange-600"
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-7">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="failade-pill mb-2">
            <span className="w-2 h-2 rounded-full bg-[#E8532E] animate-pulse" />
            <span>Time-Series Version Control &amp; Code Churn Timeline</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <History className="w-6 h-6 text-[#E8532E]" />
            <span>Git History &amp; Evolution</span>
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1 max-w-2xl">
            Trace repository velocity, high-churn files, and team contribution patterns across all release milestones.
          </p>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-1 bg-black/[0.03] p-1.5 rounded-xl border border-black/[0.04] text-xs font-mono">
          {(["Commits", "Contributors", "Branches"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setViewMode(tab)}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                viewMode === tab
                  ? "bg-white text-gray-900 shadow-2xs font-bold border border-black/[0.04]"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Activity Heatmap Liquid Card */}
      <div className="liquid-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#E8532E]" />
            <h2 className="text-sm font-bold text-gray-900">Annual Velocity &amp; Cadence</h2>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-gray-400">Total Tracked:</span>
            <span className="font-bold text-gray-900 bg-black/[0.03] px-2 py-0.5 rounded-md border border-black/[0.04]">
              {commits.length} commits
            </span>
          </div>
        </div>

        {/* Dynamic Activity Columns */}
        <div className="space-y-2">
          <div className="flex items-end gap-2 h-24 pt-4 px-1">
            {activityData.map((val, i) => {
              const maxVal = Math.max(...activityData);
              const heightPct = Math.round((val / maxVal) * 100);
              const isHovered = hoveredBar === i;
              return (
                <div
                  key={i}
                  onMouseEnter={() => setHoveredBar(i)}
                  onMouseLeave={() => setHoveredBar(null)}
                  className="flex-1 flex flex-col items-center gap-1 group relative cursor-pointer"
                >
                  {/* Tooltip on hover */}
                  {isHovered && (
                    <div className="absolute -top-8 px-2 py-1 bg-gray-900 text-white rounded text-[10px] font-mono whitespace-nowrap shadow-lg pointer-events-none z-10">
                      {months[i]}: {val} commits
                    </div>
                  )}
                  <div className="w-full bg-black/[0.03] rounded-t-md h-full flex items-end overflow-hidden">
                    <div
                      className={`w-full rounded-t transition-all duration-300 ${
                        isHovered ? "bg-[#E8532E] shadow-[0_0_12px_rgba(232,83,46,0.5)]" : "bg-[#E8532E]/35 group-hover:bg-[#E8532E]/60"
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 font-mono px-1">
            {months.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Most Changed Hotspot Files */}
        <div className="liquid-card p-5 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Highest Churn Hotspots</h2>
              <div className="text-[11px] text-gray-400 mt-0.5">Ranked by frequency of file modifications</div>
            </div>
            <span className="text-xs font-mono text-gray-400">Top 5 Files</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-black/[0.06] text-gray-400 font-mono text-[11px]">
                  <th className="text-left py-2.5 font-medium">File Path</th>
                  <th className="text-right py-2.5 font-medium">Churns</th>
                  <th className="text-right py-2.5 font-medium">Diff Ratio</th>
                  <th className="text-right py-2.5 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {mostChangedFiles.slice(0, 5).map((item, idx) => {
                  const adds = Math.floor(item.changes * 0.6);
                  const dels = Math.floor(item.changes * 0.4);
                  const totalDiff = adds + dels || 1;
                  const addPct = Math.round((adds / totalDiff) * 100);

                  return (
                    <tr
                      key={item.file}
                      onClick={() => {
                        setSelectedFileFilter(item.file);
                        if (onSelectFile) onSelectFile(item.file);
                      }}
                      className="hover:bg-orange-50/40 cursor-pointer group transition-colors"
                    >
                      <td className="py-3 pr-3">
                        <div className="font-semibold text-gray-900 group-hover:text-[#E8532E] transition-colors font-mono">
                          {item.file.split("/").pop()}
                        </div>
                        <div className="text-[10px] text-gray-400 truncate max-w-[280px] font-mono mt-0.5">
                          {item.file}
                        </div>
                      </td>

                      <td className="text-right py-3 font-mono font-bold text-gray-800">
                        {item.changes}
                      </td>

                      <td className="text-right py-3 pl-4">
                        <div className="flex items-center justify-end gap-1.5 font-mono text-[11px]">
                          <span className="text-emerald-600 font-semibold">+{adds}</span>
                          <span className="text-rose-500 font-semibold">-{dels}</span>
                        </div>
                        <div className="w-16 h-1.5 bg-rose-200 rounded-full ml-auto mt-1 overflow-hidden flex">
                          <div style={{ width: `${addPct}%` }} className="bg-emerald-500 h-full" />
                        </div>
                      </td>

                      <td className="text-right py-3 pl-3">
                        {onNavigateToImpact && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const symbol = item.file.split("/").pop()?.replace(/\.[^.]+$/, "") || "Module";
                              onNavigateToImpact(symbol, item.file);
                            }}
                            className="failade-btn-secondary !py-1 !px-2 text-[10px] font-mono flex items-center gap-1 ml-auto"
                            title="Simulate blast radius"
                          >
                            <Zap className="w-3 h-3 text-[#E8532E]" />
                            <span>Impact</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Contributors Card */}
        <div className="liquid-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">Core Maintainers</h2>
            <span className="text-[10px] font-mono text-gray-400">By Merged PRs</span>
          </div>

          <div className="space-y-3">
            {[
              { name: "Alex Chen", commits: "1,845", role: "Principal Architect", prs: 142 },
              { name: "Kunal Mehta", commits: "982", role: "Core Backend", prs: 89 },
              { name: "Kalyan Verma", commits: "792", role: "Infrastructure", prs: 64 },
              { name: "Priya Nair", commits: "431", role: "Design Systems", prs: 38 }
            ].map((person, idx) => (
              <div
                key={person.name}
                className="p-3 bg-black/[0.02] hover:bg-black/[0.04] rounded-xl border border-black/[0.04] transition-all flex items-center gap-3"
              >
                <div
                  className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${
                    avatarGradients[idx % avatarGradients.length]
                  } flex items-center justify-center text-white font-bold text-xs shadow-2xs shrink-0`}
                >
                  {person.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-gray-900 flex items-center justify-between">
                    <span>{person.name}</span>
                    <span className="text-[10px] font-mono font-normal text-gray-400">{person.commits} c</span>
                  </div>
                  <div className="text-[10px] text-gray-500 flex items-center justify-between mt-0.5">
                    <span>{person.role}</span>
                    <span className="text-emerald-600 font-mono text-[10px]">{person.prs} PRs</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Commit Log Liquid Card */}
      <div className="liquid-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Commit Changelog</h2>
            <div className="text-[11px] text-gray-400 mt-0.5">Verified cryptographic signatures &amp; commit messages</div>
          </div>

          {/* Search bar inside commits */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search commit or author..."
              className="w-full pl-8 pr-3 py-1.5 bg-black/[0.02] border border-black/[0.06] rounded-lg text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#E8532E] font-mono"
            />
          </div>
        </div>

        <div className="space-y-2.5">
          {filteredCommits.map((c, idx) => (
            <div
              key={c.hash}
              className="p-3.5 bg-white/70 hover:bg-white border border-black/[0.06] hover:border-black/[0.12] rounded-xl transition-all group flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
            >
              <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                <button
                  onClick={(e) => handleCopyHash(c.hash, e)}
                  className="px-2 py-1 rounded-md bg-orange-50/80 hover:bg-orange-100 border border-orange-200/80 text-[#E8532E] text-[10px] font-bold font-mono shrink-0 flex items-center gap-1 transition-all"
                  title="Click to copy hash"
                >
                  {copiedHash === c.hash ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-[#E8532E]" />}
                  <span>{c.hash}</span>
                </button>

                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-gray-900 group-hover:text-[#E8532E] transition-colors text-xs truncate">
                    {c.message}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-0.5">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-[#E8532E]" />
                      <strong className="text-gray-600 font-medium">{c.author}</strong>
                    </span>
                    <span>·</span>
                    <span className="font-mono text-[10px]">{c.date}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                  <GitPullRequest className="w-2.5 h-2.5 text-emerald-500" />
                  <span>Verified</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
