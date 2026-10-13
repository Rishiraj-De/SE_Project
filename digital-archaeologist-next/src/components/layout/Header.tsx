"use client";

import React from "react";
import { RefreshCw, Download, Sun, Moon, ChevronRight, ShieldCheck, ShieldAlert, PanelLeftClose, PanelLeftOpen } from "lucide-react";

interface HeaderProps {
  repoName?: string;
  branch?: string;
  analyzedAt?: string;
  healthScore?: number;
  isAnalyzing?: boolean;
  onTriggerAnalysis: () => void;
  onOpenReport: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onGoLanding?: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  repoName = "legacy-payment-system",
  branch = "main",
  analyzedAt,
  healthScore = 68,
  isAnalyzing = false,
  onTriggerAnalysis,
  onOpenReport,
  isDarkMode,
  onToggleTheme,
  onGoLanding,
  isSidebarOpen = true,
  onToggleSidebar
}) => {
  const isHealthy = healthScore >= 75;

  const timeSince = (dateStr?: string) => {
    if (!dateStr) return "recently";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} minute${mins > 1 ? "s" : ""} ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  };

  return (
    <header className="h-14 border-b border-black/[0.06] bg-white/80 backdrop-blur-xl px-5 flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            className="p-1.5 -ml-1 mr-1 rounded-xl text-gray-500 hover:text-[#E8532E] hover:bg-orange-50/80 transition-all cursor-pointer flex items-center justify-center border border-black/[0.06] hover:border-orange-200/80 shadow-2xs"
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeftOpen className="w-4 h-4 text-[#E8532E]" />
            )}
          </button>
        )}
        <span className="text-gray-400">Overview</span>
        <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
        <span className="font-semibold text-gray-900 tracking-tight">{repoName}</span>
        <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
        <span className="text-[#E8532E] font-medium">{branch}</span>

        <span className="ml-3 text-xs text-gray-400">
          Last analyzed {timeSince(analyzedAt)}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2.5">
        {onGoLanding && (
          <button
            onClick={onGoLanding}
            className="text-xs text-gray-600 hover:text-[#E8532E] hover:bg-orange-50/80 font-medium px-3 py-1.5 rounded-xl border border-black/[0.07] bg-white/70 backdrop-blur-md transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
            title="Home"
          >
            <span>Home</span>
          </button>
        )}

        {/* Health Score */}
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-md shadow-2xs ${isHealthy
          ? "bg-green-50/80 border-green-200/80 text-green-700"
          : "bg-amber-50/80 border-amber-200/80 text-amber-700"
          }`}>
          {isHealthy ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
          <span>Health: <strong>{healthScore}</strong>/100</span>
        </div>

        <button
          onClick={onTriggerAnalysis}
          disabled={isAnalyzing}
          className="failade-btn-primary text-xs !py-1.5 !px-3"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? "animate-spin" : ""}`} />
          <span>{isAnalyzing ? "Analyzing..." : "Re-analyze"}</span>
        </button>

        <button
          onClick={onOpenReport}
          className="failade-btn-secondary text-xs !py-1.5 !px-3"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};
