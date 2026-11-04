"use client";

import React, { useState } from "react";
import {
  Network,
  GitBranch,
  History,
  AlertTriangle,
  ArrowRight,
  Upload,
  Layers,
  Sparkles,
  Code2,
  Shield,
  Zap,
  CheckCircle2,
  ChevronRight,
  Database,
  User,
  LogOut,
  Mail,
  Lock
} from "lucide-react";
import { AuthenticatedUser } from "@/lib/types";

interface LandingPageProps {
  onOpenImport: () => void;
  onStartAnalysis: (repoUrl: string, repoName?: string) => void;
  onGoToDashboard?: () => void;
  hasAnalysis?: boolean;
  currentUser?: AuthenticatedUser | null;
  onOpenAuth: (mode?: "signin" | "signup", provider?: "google" | "apple" | "email") => void;
  onLogout: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenImport,
  onStartAnalysis,
  onGoToDashboard,
  hasAnalysis = false,
  currentUser,
  onOpenAuth,
  onLogout
}) => {
  const [repoInputUrl, setRepoInputUrl] = useState("");
  const [validationError, setValidationError] = useState("");

  const handleExcavationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = repoInputUrl.trim();

    if (!trimmed) {
      setValidationError("Please enter your original Git repository URL.");
      return;
    }

    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://") && !trimmed.startsWith("git@")) {
      setValidationError("Please enter a valid Git URL (e.g. https://github.com/organization/repository).");
      return;
    }

    setValidationError("");

    // If not authenticated, require authentication first
    if (!currentUser) {
      onOpenAuth("signup");
      return;
    }

    const parts = trimmed.split("/").filter(Boolean);
    const derivedName = parts[parts.length - 1]?.replace(".git", "") || "original-repo";
    onStartAnalysis(trimmed, derivedName);
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
    },
    {
      id: "modernization",
      icon: (
        <svg className="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      ),
      title: "Refactor Studio",
      description: "Interactive codemods, unified diffs & ROI simulation."
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
            <a href="#authenticator" className="hover:text-[#E8532E] transition-colors font-medium">Authenticator</a>
            <a href="#excavation" className="hover:text-[#E8532E] transition-colors font-medium">Original Repos</a>
            <a href="#how-it-works" className="hover:text-[#E8532E] transition-colors font-medium">How it works</a>
          </div>
        </div>

        {/* Right Section: Auth & Actions */}
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

          {currentUser ? (
            /* Authenticated User Badge */
            <div className="flex items-center gap-2 sm:gap-3 bg-white border border-[#DDD9D0] rounded-xl px-3 py-1.5 shadow-2xs">
              <div className="w-6 h-6 rounded-full bg-[#E8532E] text-white flex items-center justify-center text-xs font-bold shrink-0">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-gray-900 leading-tight truncate max-w-[120px]">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-green-600 flex items-center gap-1 font-mono leading-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                  <span>DB Synced</span>
                </div>
              </div>
              <button
                onClick={onLogout}
                title="Sign out"
                className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-gray-100 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            /* Unauthenticated Buttons */
            <>
              <button
                onClick={() => onOpenAuth("signin")}
                className="text-[13px] text-gray-700 hover:text-[#1A1A1A] font-medium transition-colors hidden sm:block px-2.5 py-1"
              >
                Sign In
              </button>

              <button
                onClick={() => onOpenAuth("signup")}
                className="bg-[#E8532E] hover:bg-[#D4441F] text-white text-[13px] font-medium px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all"
              >
                Sign Up
              </button>
            </>
          )}

          <button
            onClick={onOpenImport}
            className="border border-[#DDD9D0] hover:border-gray-400 bg-white text-gray-800 text-[13px] font-medium px-3.5 py-2 rounded-lg shadow-2xs hover:shadow transition-all hidden md:flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-[#E8532E]" />
            <span>Import</span>
          </button>
        </div>
      </nav>

      {/* ─── Hero Section with Authenticator Option Card ─── */}
      <section className="pt-10 pb-16 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Heading, Subtitle & Action buttons */}
          <div className="lg:col-span-6 space-y-6">
            {/* Small Pill Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3EFE9] border border-[#E5E0D8] text-xs font-medium text-[#4A4744]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E8532E]" />
              <span>Original Codebase Deconstruction Platform</span>
            </div>

            {/* Main Editorial Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[3.6rem] font-serif font-normal text-[#1A1A1A] leading-[1.1] tracking-tight">
              <span className="text-[#E8532E] font-medium">Understand</span><br />
              the code you<br />
              inherited.
            </h1>

            {/* Subtitle */}
            <p className="text-[16px] text-gray-600 leading-relaxed max-w-md">
              Analyze architecture, dependencies, history and technical debt from your original repository before you touch the code.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <button
                onClick={onOpenImport}
                className="bg-[#E8532E] hover:bg-[#D4441F] text-white font-medium px-6 py-2.5 rounded-lg text-[14px] shadow-sm hover:shadow-md transition-all flex items-center gap-2 group cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Import Original Repository</span>
              </button>

              {!currentUser ? (
                <button
                  onClick={() => onOpenAuth("signup")}
                  className="bg-white hover:bg-orange-50 text-[#E8532E] font-medium px-5 py-2.5 rounded-lg text-[14px] border border-[#E8532E]/40 hover:border-[#E8532E] transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <User className="w-4 h-4" />
                  <span>Authenticate to Start</span>
                </button>
              ) : (
                <a
                  href="#excavation"
                  className="bg-white hover:bg-gray-50 text-gray-800 font-medium px-5 py-2.5 rounded-lg text-[14px] border border-gray-300 transition-all flex items-center gap-2 shadow-2xs"
                >
                  <GitBranch className="w-4 h-4 text-[#E8532E]" />
                  <span>Enter Repository Link</span>
                </a>
              )}
            </div>

            {/* Authenticator Quick Bar */}
            <div id="authenticator" className="p-4 rounded-2xl bg-white border border-[#E5E3DC] shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-900">
                  <Database className="w-3.5 h-3.5 text-[#E8532E]" />
                  <span>Authenticator & Database Storage</span>
                </div>
                {currentUser && (
                  <span className="text-[11px] font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-md border border-green-200">
                    Active Session
                  </span>
                )}
              </div>

              {currentUser ? (
                <div className="text-xs text-gray-600 space-y-1">
                  <p>
                    Logged in as <strong>{currentUser.name}</strong> ({currentUser.email})
                  </p>
                  <p className="text-[11px] text-gray-500 font-mono">
                    Provider: {currentUser.provider} • Stored in SQLite database via Prisma
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-gray-500">
                    Authenticate to store your name and email in the SQLite database before running analysis:
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenAuth("signup", "google")}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 hover:border-gray-300 bg-gray-50/70 hover:bg-gray-100/70 text-xs font-medium text-gray-800 transition-all cursor-pointer"
                    >
                      <GoogleIconSmall />
                      <span>Google</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenAuth("signup", "apple")}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-black hover:bg-gray-900 text-white text-xs font-medium transition-all cursor-pointer"
                    >
                      <AppleIconSmall />
                      <span>Apple</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenAuth("signup", "email")}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 hover:border-gray-300 bg-gray-50/70 hover:bg-gray-100/70 text-xs font-medium text-gray-800 transition-all cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5 text-[#E8532E]" />
                      <span>Email</span>
                    </button>
                  </div>
                </>
              )}
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

        {/* ─── Four Feature Boxes ─── */}
        <div id="features" className="mt-14 pt-8 border-t border-[#EAE8E3]">
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

      {/* ─── "Start your excavation" Section (Strictly Original Repository Link) ─── */}
      <section id="excavation" className="py-16 px-6 sm:px-10 lg:px-16 bg-[#F5F3EE] border-y border-[#EAE7DF]">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100/60 text-[#E8532E] text-xs font-medium border border-orange-200">
              <GitBranch className="w-3.5 h-3.5" />
              <span>Original Repository Excavation</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif text-[#1A1A1A] tracking-tight">
              Start your excavation.
            </h2>
            <p className="text-sm sm:text-[15px] text-gray-600 max-w-lg mx-auto">
              Enter the link to your original Git repository. The engine clones the source, generates AST syntax trees, and maps dependencies.
            </p>
          </div>

          {/* GitHub Input Card */}
          <form onSubmit={handleExcavationSubmit} className="max-w-2xl mx-auto space-y-2">
            <div className="flex flex-col sm:flex-row items-stretch gap-2 bg-white p-2 rounded-xl border border-[#DDD9D0] shadow-sm focus-within:border-[#E8532E] focus-within:ring-2 focus-within:ring-[#E8532E]/20 transition-all">
              <div className="flex items-center gap-3 px-3 py-2 flex-1">
                <GitBranch className="w-5 h-5 text-gray-400 shrink-0" />
                <input
                  type="text"
                  value={repoInputUrl}
                  onChange={(e) => {
                    setRepoInputUrl(e.target.value);
                    if (validationError) setValidationError("");
                  }}
                  placeholder="https://github.com/organization/your-repository"
                  className="w-full text-sm text-[#1A1A1A] placeholder-gray-400 bg-transparent focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="bg-[#E8532E] hover:bg-[#D4441F] text-white text-sm font-medium px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 shrink-0 transition-colors shadow-sm cursor-pointer"
              >
                <span>Analyze Original Repository</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {validationError && (
              <p className="text-xs text-red-500 bg-red-50 py-1.5 px-3 rounded-lg border border-red-200 text-left">
                {validationError}
              </p>
            )}
          </form>

          {/* Trust and Original Repository Guidance */}
          <div className="pt-2">
            <div className="inline-flex flex-wrap items-center justify-center gap-3 text-xs text-gray-500 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                <span>Original Git Links Only</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-gray-500" />
                <span>Supports GitHub, GitLab & Bitbucket</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-orange-600" />
                <span>SQLite Prisma Stored Users</span>
              </span>
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
              Connect your original repository link. The engine clones the source code, generates AST syntax trees, and indexes symbols.
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
              Simulate modifications before writing code. Predict downstream breakage and inspect refactoring strategies.
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
            Provide your original Git repository link to excavate AST syntax trees, dependency matrices, and technical debt.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenImport}
              className="bg-white text-[#E8532E] font-medium px-6 py-2.5 rounded-lg text-sm shadow hover:bg-orange-50 transition-colors cursor-pointer"
            >
              Import Original Repository
            </button>
            {!currentUser && (
              <button
                onClick={() => onOpenAuth("signup")}
                className="bg-transparent hover:bg-white/10 text-white font-medium px-6 py-2.5 rounded-lg text-sm border border-white/60 transition-colors cursor-pointer"
              >
                Authenticate with Google / Apple / Email
              </button>
            )}
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
            <a href="#authenticator" className="hover:text-gray-900 transition-colors">Authenticator</a>
            <a href="#excavation" className="hover:text-gray-900 transition-colors">Original Repos</a>
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

function GoogleIconSmall() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function AppleIconSmall() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0 fill-current" viewBox="0 0 170 170">
      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.58-7.71-11.64-14-5.99-9.13-10.74-19.64-14.26-31.54-3.52-11.9-5.28-23.08-5.28-33.54 0-14.89 3.83-27.46 11.5-37.71 7.66-10.25 17.3-15.48 28.91-15.69 4.35 0 9.28 1.15 14.79 3.46 5.51 2.31 9.49 3.51 11.94 3.6 2.12-.1 6.1-1.32 11.94-3.67 5.84-2.35 10.55-3.41 14.13-3.18 10.88.54 19.86 4.67 26.93 12.38-9.58 5.76-14.26 13.91-14.04 24.45.22 8.26 3.42 15.22 9.61 20.87 6.19 5.65 13.48 9.02 21.87 10.11-2.07 6.19-4.57 12.4-7.51 18.63zm-32.33-108.8c0-5.87 2.17-11.41 6.52-16.63 4.35-5.22 9.68-8.8 16-10.74 1.2 5.54.54 11.19-1.98 16.95-2.52 5.76-6.19 10.32-11.01 13.68-3.04 2.18-6.19 3.59-9.45 4.24-.22-2.5-.08-4.99.4-7.46.22-1.09.33-2.18.33-3.26z" />
    </svg>
  );
}
