"use client";

import React, { useState } from "react";
import {
  Network,
  GitBranch,
  History,
  AlertTriangle,
  ArrowRight,
  Play,
  Upload,
  Layers,
  Sparkles,
  Code2,
  Shield,
  Zap,
  CheckCircle2,
  Star,
  Search,
  ExternalLink,
  ChevronRight,
  Database
} from "lucide-react";

interface LandingPageProps {
  onOpenImport: () => void;
  onUseDemo: (repoUrl?: string, repoName?: string) => void;
  onGoToDashboard?: () => void;
  hasAnalysis?: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenImport,
  onUseDemo,
  onGoToDashboard,
  hasAnalysis = false
}) => {
  const [repoInputUrl, setRepoInputUrl] = useState("");

  const handleExcavationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (repoInputUrl.trim()) {
      const trimmed = repoInputUrl.trim();
      const parts = trimmed.split("/");
      const derivedName = parts[parts.length - 1] || "analyzed-repo";
      onUseDemo(trimmed, derivedName);
    } else {
      onOpenImport();
    }
  };

  const heroFeatureCards = [
    {
      id: "architecture",
      icon: (
        <svg className="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <path d="M10 6.5h4M10 17.5h4M6.5 10v4M17.5 10v4" />
        </svg>
      ),
      title: "Architecture",
      description: "Visualize the structure of unfamiliar code."
    },
    {
      id: "dependencies",
      icon: (
        <svg className="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="5" r="3" />
          <circle cx="6" cy="19" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="M12 8v4M6 16l6-4 6 4" />
        </svg>
      ),
      title: "Dependencies",
      description: "Understand how components connect."
    },
    {
      id: "history",
      icon: (
        <svg className="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <polyline points="12 7 12 12 15 15" />
          <path d="M3.5 12h2" />
        </svg>
      ),
      title: "Git History",
      description: "See how the system evolved over time."
    },
    {
      id: "tech-debt",
      icon: (
        <svg className="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="9" y1="15" x2="15" y2="15" />
          <line x1="9" y1="11" x2="13" y2="11" />
        </svg>
      ),
      title: "Technical Debt",
      description: "Find risks and maintainability issues."
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F7] text-[#1A1A1A] flex flex-col font-sans selection:bg-[#E8532E]/20 selection:text-[#E8532E]">
      {/* ─── Top Navigation Bar ─── */}
      <nav className="h-16 border-b border-[#EAE8E3] bg-[#FAF9F7]/90 backdrop-blur-md sticky top-0 z-50 px-6 sm:px-10 lg:px-16 flex items-center justify-between">
        <div className="flex items-center gap-10">
          {/* Logo mark */}
          <div className="flex items-center gap-2.5 cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-[#E8532E] flex items-center justify-center shadow-sm">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-[15px] text-[#1A1A1A] tracking-tight">
              Digital Archaeologist
            </span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-7 text-[13px] text-gray-600">
            <a href="#features" className="hover:text-[#E8532E] transition-colors font-medium">Features</a>
            <a href="#excavation" className="hover:text-[#E8532E] transition-colors font-medium">Use Cases</a>
            <a href="#how-it-works" className="hover:text-[#E8532E] transition-colors font-medium">How it works</a>
            <a href="#faq" className="hover:text-[#E8532E] transition-colors font-medium">Docs</a>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {hasAnalysis && onGoToDashboard && (
            <button
              onClick={onGoToDashboard}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-orange-100/60 text-[#E8532E] hover:bg-orange-100 transition-colors flex items-center gap-1"
            >
              <span>Active Analysis</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => onUseDemo()}
            className="text-[13px] text-gray-700 hover:text-[#1A1A1A] font-medium transition-colors hidden sm:block px-2 py-1"
          >
            Sign in
          </button>

          <button
            onClick={onOpenImport}
            className="bg-[#E8532E] hover:bg-[#D4441F] text-white text-[13px] font-medium px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* ─── Hero Section (Matching top-left panel of reference) ─── */}
      <section className="pt-10 pb-16 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Heading, Subtitle & Action buttons */}
          <div className="lg:col-span-6 space-y-6">
            {/* Small Pill Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3EFE9] border border-[#E5E0D8] text-xs font-medium text-[#4A4744]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E8532E]" />
              <span>Built for developers</span>
            </div>

            {/* Main Editorial Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[3.6rem] font-serif font-normal text-[#1A1A1A] leading-[1.1] tracking-tight">
              <span className="text-[#E8532E] font-medium">Understand</span><br />
              the code you<br />
              inherited.
            </h1>

            {/* Subtitle */}
            <p className="text-[16px] text-gray-600 leading-relaxed max-w-md">
              Analyze architecture, dependencies, history and technical debt before you touch the code.
            </p>

            {/* Two Primary Option Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                onClick={onOpenImport}
                className="bg-[#E8532E] hover:bg-[#D4441F] text-white font-medium px-6 py-2.5 rounded-lg text-[14px] shadow-sm hover:shadow-md transition-all flex items-center gap-2 group cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Import Repository</span>
              </button>

              <button
                onClick={() => onUseDemo()}
                className="bg-white hover:bg-orange-50 text-[#E8532E] font-medium px-6 py-2.5 rounded-lg text-[14px] border border-[#E8532E]/40 hover:border-[#E8532E] transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Use Demo Repository</span>
              </button>
            </div>
          </div>

          {/* Right Column: Retro Illustration */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-lg">
              <div className="rounded-2xl overflow-hidden shadow-xl border border-[#EAE7E0] bg-white">
                <img
                  src="/hero-illustration.jpg"
                  alt="Digital Archaeologist code analysis console"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ─── Four Feature Boxes (Directly below hero, matching reference) ─── */}
        <div className="mt-14 pt-8 border-t border-[#EAE8E3]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {heroFeatureCards.map((card) => (
              <div
                key={card.id}
                className="bg-white rounded-xl border border-[#E5E3DC] p-4.5 hover:border-[#E8532E]/40 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="p-1.5 rounded-md bg-[#FAF9F7] text-gray-700">
                    {card.icon}
                  </div>
                  <h3 className="text-[13.5px] font-semibold text-[#1A1A1A]">
                    {card.title}
                  </h3>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── "Start your excavation" Section (Matching top-middle panel of reference) ─── */}
      <section id="excavation" className="py-16 px-6 sm:px-10 lg:px-16 bg-[#F5F3EE] border-y border-[#EAE7DF]">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl sm:text-4xl font-serif text-[#1A1A1A] tracking-tight">
              Start your excavation.
            </h2>
            <p className="text-sm sm:text-[15px] text-gray-600 max-w-lg mx-auto">
              Enter a GitHub repository URL to analyze its architecture, history, dependencies and more.
            </p>
          </div>

          {/* GitHub Input Card */}
          <form onSubmit={handleExcavationSubmit} className="max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row items-stretch gap-2 bg-white p-2 rounded-xl border border-[#DDD9D0] shadow-sm focus-within:border-[#E8532E] focus-within:ring-2 focus-within:ring-[#E8532E]/20 transition-all">
              <div className="flex items-center gap-3 px-3 py-2 flex-1">
                <svg className="w-5 h-5 text-gray-400 shrink-0 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <input
                  type="text"
                  value={repoInputUrl}
                  onChange={(e) => setRepoInputUrl(e.target.value)}
                  placeholder="https://github.com/username/repository"
                  className="w-full text-sm text-[#1A1A1A] placeholder-gray-400 bg-transparent focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="bg-[#E8532E] hover:bg-[#D4441F] text-white text-sm font-medium px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 shrink-0 transition-colors shadow-sm"
              >
                <span>Analyze Repository</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Demo Project Quick Links */}
          <div className="space-y-3 pt-2">
            <div className="text-xs text-gray-500 font-medium">
              or try a demo repository
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => onUseDemo("https://github.com/example/legacy-payment-system", "legacy-payment-system")}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-orange-50 text-gray-700 hover:text-[#E8532E] border border-gray-300 hover:border-[#E8532E]/50 transition-all shadow-2xs"
              >
                Sample Java Project
              </button>
              <button
                type="button"
                onClick={() => onUseDemo("https://github.com/example/python-data-pipeline", "python-data-pipeline")}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-orange-50 text-gray-700 hover:text-[#E8532E] border border-gray-300 hover:border-[#E8532E]/50 transition-all shadow-2xs"
              >
                Sample Python Project
              </button>
              <button
                type="button"
                onClick={() => onUseDemo("https://github.com/example/monolith-e-commerce", "monolith-e-commerce")}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-orange-50 text-gray-700 hover:text-[#E8532E] border border-gray-300 hover:border-[#E8532E]/50 transition-all shadow-2xs"
              >
                Legacy Web App
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How It Works Section ─── */}
      <section id="how-it-works" className="py-20 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto w-full">
        <div className="text-center mb-14 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-[#E8532E] text-xs font-medium border border-orange-200">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Workflow</span>
          </div>
          <h2 className="text-3xl font-serif text-[#1A1A1A] tracking-tight">
            How Digital Archaeologist works
          </h2>
          <p className="text-sm text-gray-600 max-w-md mx-auto">
            From raw Git commits to comprehensive risk profiles and architectural models in under two minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-[#E5E3DC] shadow-sm relative">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-[#E8532E] font-mono text-sm font-bold flex items-center justify-center mb-4">
              01
            </div>
            <h3 className="text-base font-semibold text-[#1A1A1A] mb-2">
              Import & AST Parsing
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Connect your repository or choose our demo. The engine parses languages, generates ASTs, and indexes symbols locally.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E5E3DC] shadow-sm relative">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-[#E8532E] font-mono text-sm font-bold flex items-center justify-center mb-4">
              02
            </div>
            <h3 className="text-base font-semibold text-[#1A1A1A] mb-2">
              Graph Reconstruction
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Maps multi-module dependencies, circular dependencies, change churn, and detects high-risk single-point-of-failure files.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E5E3DC] shadow-sm relative">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-[#E8532E] font-mono text-sm font-bold flex items-center justify-center mb-4">
              03
            </div>
            <h3 className="text-base font-semibold text-[#1A1A1A] mb-2">
              Impact & Blast Radius
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Simulate modifications before writing code. Predict downstream breakage and ask our AI assistant for refactoring strategies.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Bottom CTA Strip ─── */}
      <section className="py-14 px-6 bg-[#E8532E] text-white">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-serif tracking-tight">
            Stop guessing what the code does. Start excavating.
          </h2>
          <p className="text-sm text-orange-100 max-w-lg mx-auto">
            Choose to import any GitHub repository or explore with our pre-loaded legacy payment processing demo.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenImport}
              className="bg-white text-[#E8532E] font-medium px-6 py-2.5 rounded-lg text-sm shadow hover:bg-orange-50 transition-colors"
            >
              Import Repository
            </button>
            <button
              onClick={() => onUseDemo()}
              className="bg-transparent hover:bg-white/10 text-white font-medium px-6 py-2.5 rounded-lg text-sm border border-white/60 transition-colors"
            >
              Use Demo Repository
            </button>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-[#EAE8E3] bg-[#FAF9F7] py-8 px-6 sm:px-10 lg:px-16 text-xs text-gray-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#E8532E] flex items-center justify-center">
              <Layers className="w-3 h-3 text-white" />
            </div>
            <span className="font-semibold text-gray-800">Digital Archaeologist</span>
            <span className="text-gray-400">© 2026</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#excavation" className="hover:text-gray-900 transition-colors">Excavation</a>
            <a href="#how-it-works" className="hover:text-gray-900 transition-colors">Architecture</a>
          </div>

          <div className="flex items-center gap-1.5 text-gray-400">
            <span>Built for complex legacy systems</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
