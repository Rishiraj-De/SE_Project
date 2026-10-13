"use client";

import React from "react";
import {
  Layers,
  GitBranch,
  Network,
  Code2,
  History,
  AlertTriangle,
  Flame,
  Zap,
  Bot,
  FileText,
  Settings,
  FolderGit2,
  Star,
  Plus,
  PanelLeftClose
} from "lucide-react";

export type NavTab =
  | "overview"
  | "architecture"
  | "dependencies"
  | "codebase"
  | "history"
  | "tech-debt"
  | "risk"
  | "impact"
  | "assistant"
  | "reports"
  | "settings";

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  repoName?: string;
  branch?: string;
  onOpenImport: () => void;
  onGoLanding?: () => void;
  isOpen?: boolean;
  onToggleOpen?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  repoName = "legacy-payment-system",
  branch = "main",
  onOpenImport,
  onGoLanding,
  isOpen = true,
  onToggleOpen
}) => {
  const mainNavItems: Array<{ id: NavTab; label: string; icon: React.ReactNode }> = [
    { id: "overview", label: "Overview", icon: <Layers className="w-4 h-4" /> },
    { id: "architecture", label: "Architecture", icon: <Network className="w-4 h-4" /> },
    { id: "codebase", label: "Codebase", icon: <Code2 className="w-4 h-4" /> },
    { id: "dependencies", label: "Dependencies", icon: <GitBranch className="w-4 h-4" /> },
    { id: "history", label: "Git History", icon: <History className="w-4 h-4" /> }
  ];

  const intelligenceNavItems: Array<{ id: NavTab; label: string; icon: React.ReactNode; badge?: string }> = [
    { id: "tech-debt", label: "Technical Debt", icon: <AlertTriangle className="w-4 h-4" /> },
    { id: "risk", label: "Risk Analysis", icon: <Flame className="w-4 h-4" /> },
    { id: "impact", label: "Impact Analysis", icon: <Zap className="w-4 h-4" /> },
    { id: "assistant", label: "AI Investigator", icon: <Bot className="w-4 h-4" /> }
  ];

  const outputNavItems: Array<{ id: NavTab; label: string; icon: React.ReactNode }> = [
    { id: "reports", label: "Reports", icon: <FileText className="w-4 h-4" /> }
  ];

  const renderNavItem = (item: { id: NavTab; label: string; icon: React.ReactNode; badge?: string }) => {
    const isActive = activeTab === item.id;
    return (
      <button
        key={item.id}
        onClick={() => onSelectTab(item.id)}
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] transition-all text-left group relative ${
          isActive
            ? "text-[#E8532E] bg-orange-50/90 font-medium shadow-2xs border border-orange-200/50"
            : "text-gray-600 hover:text-gray-900 hover:bg-black/[0.03]"
        }`}
      >
        {/* Active indicator dot */}
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 rounded-r-full bg-[#E8532E]" />
        )}
        <span className={`transition-colors ${isActive ? "text-[#E8532E]" : "text-gray-400 group-hover:text-gray-600"}`}>
          {item.icon}
        </span>
        <span>{item.label}</span>
        {item.badge && (
          <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-orange-100/60 text-[#E8532E] border border-orange-200/60 font-semibold">
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside
      className={`border-r border-black/[0.06] bg-white/80 backdrop-blur-xl flex flex-col h-screen select-none shrink-0 transition-all duration-300 ease-in-out z-20 shadow-[1px_0_8px_rgba(0,0,0,0.02)] ${
        isOpen ? "w-56 opacity-100" : "w-0 opacity-0 border-r-0 pointer-events-none"
      }`}
    >
      <div className="w-56 flex flex-col h-full overflow-hidden">
        {/* Brand Header */}
        <div className="h-14 px-3 border-b border-black/[0.05] flex items-center justify-between shrink-0">
          <button
            onClick={onGoLanding}
            title="Return to Landing Page"
            className="flex items-center gap-2.5 text-left hover:opacity-90 transition-opacity group cursor-pointer flex-1 min-w-0"
          >
            <div className="w-8 h-8 rounded-lg bg-[#E8532E] flex items-center justify-center shadow-sm shrink-0 group-hover:scale-105 transition-transform">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-sm text-gray-900 tracking-tight leading-tight truncate">
                Digital Archaeologist
              </span>
              <span className="text-[10px] text-gray-400">
                ← Home / Landing
              </span>
            </div>
          </button>

          {onToggleOpen && (
            <button
              onClick={onToggleOpen}
              title="Close sidebar"
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0 cursor-pointer ml-1"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2.5 space-y-5 overflow-y-auto">
          {/* Explore Section */}
          <div className="space-y-0.5">
            {mainNavItems.map(renderNavItem)}
          </div>

          {/* Intelligence Section */}
          <div className="space-y-0.5">
            <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Intelligence
            </div>
            {intelligenceNavItems.map(renderNavItem)}
          </div>

          {/* Output Section */}
          <div className="space-y-0.5">
            <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Output
            </div>
            {outputNavItems.map(renderNavItem)}
          </div>
        </nav>

        {/* Bottom: Repo Context + Import */}
        <div className="p-3 border-t border-gray-100">
          <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700 truncate max-w-[120px]">
                <FolderGit2 className="w-3.5 h-3.5 text-[#E8532E] shrink-0" />
                <span className="truncate">{repoName}</span>
              </div>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-[10px] font-medium text-green-600">Active</span>
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono">
              <span>git:{branch}</span>
            </div>
          </div>
          <button
            onClick={onOpenImport}
            className="w-full mt-2 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 hover:border-[#E8532E] text-gray-500 hover:text-[#E8532E] hover:bg-[#FEF2ED] text-xs font-medium transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Import Repository</span>
          </button>
        </div>

        {/* Rating / Settings */}
        <div className="px-4 py-3 border-t border-gray-100">
          <button
            onClick={() => onSelectTab("settings")}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[13px] transition-all ${
              activeTab === "settings"
                ? "text-[#E8532E] bg-[#FEF2ED] font-medium"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Star className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
