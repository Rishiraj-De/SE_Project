"use client";

import React, { useState, useEffect } from "react";
import { Sidebar, NavTab } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ImportModal } from "@/components/views/ImportModal";
import { LandingPage } from "@/components/views/LandingPage";
import { AuthModal } from "@/components/auth/AuthModal";
import { GoogleOneTap } from "@/components/auth/GoogleOneTap";
import { OverviewView } from "@/components/views/OverviewView";
import { ArchitectureView } from "@/components/views/ArchitectureView";
import { DependenciesView } from "@/components/views/DependenciesView";
import { CodebaseView } from "@/components/views/CodebaseView";
import { GitHistoryView } from "@/components/views/GitHistoryView";
import { TechDebtView } from "@/components/views/TechDebtView";
import { RiskAnalysisView } from "@/components/views/RiskAnalysisView";
import { ImpactAnalysisView } from "@/components/views/ImpactAnalysisView";
import { ModernizationView } from "@/components/views/ModernizationView";
import { AIAssistantView } from "@/components/views/AIAssistantView";
import { ReportsView } from "@/components/views/ReportsView";
import { SettingsView } from "@/components/views/SettingsView";
import { AnalysisResult, AuthenticatedUser, AuthProvider } from "@/lib/types";
import { fetchAnalysisStatus, triggerAnalysis, authenticateUser } from "@/lib/api";

export default function Home() {
  const [isLandingView, setIsLandingView] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<NavTab>("overview");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<"signin" | "signup">("signup");
  const [authModalProvider, setAuthModalProvider] = useState<AuthProvider | null>(null);
  const [isOneTapDismissed, setIsOneTapDismissed] = useState<boolean>(false);
  const [isOneTapLoading, setIsOneTapLoading] = useState<boolean>(false);
  const [pendingRepoUrl, setPendingRepoUrl] = useState<string | null>(null);

  // Load existing authenticated user from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("digital_archaeologist_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.email) {
          setCurrentUser(parsed);
        }
      }
    } catch {}
  }, []);

  // Keyboard shortcut Ctrl+B / Cmd+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Cross-view navigation context
  const [impactTargetSymbol, setImpactTargetSymbol] = useState<string>("");
  const [impactTargetFile, setImpactTargetFile] = useState<string>("");
  const [codebaseTargetFile, setCodebaseTargetFile] = useState<string>("");
  const [assistantInitialPrompt, setAssistantInitialPrompt] = useState<string>("");

  // Check active analysis on mount
  useEffect(() => {
    fetchAnalysisStatus()
      .then((data) => {
        if (data.analysis) {
          setAnalysis(data.analysis);
          if (data.analysis.riskPoints && data.analysis.riskPoints.length > 0) {
            setImpactTargetSymbol(data.analysis.riskPoints[0].name);
            setImpactTargetFile(data.analysis.riskPoints[0].path);
          } else if (data.analysis.files && data.analysis.files.length > 0) {
            setImpactTargetSymbol(data.analysis.files[0].name.replace(/\.[^.]+$/, ""));
            setImpactTargetFile(data.analysis.files[0].path);
          }
        }
      })
      .catch(() => {
        // Quiet fallback
      });
  }, []);

  const handleOpenAuth = (
    mode: "signin" | "signup" = "signup",
    provider: AuthProvider | null = null
  ) => {
    setAuthModalMode(mode);
    setAuthModalProvider(provider);
    setIsAuthModalOpen(true);
  };

  const handleOneTapAccountSelect = async (account: { name: string; email: string }) => {
    setIsOneTapLoading(true);
    try {
      const response = await authenticateUser(account.email, account.name, "google");
      if (response && response.user) {
        handleAuthSuccess(response.user);
        setIsOneTapDismissed(true);
      }
    } catch (err) {
      console.error("One-tap Google authentication failed:", err);
    } finally {
      setIsOneTapLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsOneTapDismissed(false);
    try {
      localStorage.removeItem("digital_archaeologist_user");
    } catch {}
  };

  const handleAuthSuccess = (user: AuthenticatedUser) => {
    setCurrentUser(user);
    // If user was trying to analyze a repository prior to authenticating, proceed with analysis
    if (pendingRepoUrl) {
      const url = pendingRepoUrl;
      setPendingRepoUrl(null);
      handleStartAnalysis(url);
    }
  };

  const handleStartAnalysis = async (url: string, name?: string) => {
    if (!currentUser) {
      setPendingRepoUrl(url);
      handleOpenAuth("signup");
      return;
    }

    setIsAnalyzing(true);
    setCompletedSteps([]);
    setCurrentStep("Cloning original repository");

    const steps = [
      "Cloning original repository",
      "Detecting languages",
      "Indexing source files",
      "Generating AST",
      "Extracting dependencies",
      "Analyzing Git history",
      "Building architecture graph",
      "Detecting technical debt",
      "Generating documentation"
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < steps.length - 1) {
        setCompletedSteps((prev) => [...prev, steps[stepIndex]]);
        stepIndex++;
        setCurrentStep(steps[stepIndex]);
      }
    }, 240);

    try {
      const result = await triggerAnalysis(url, name, currentUser?.email);
      clearInterval(interval);
      setCompletedSteps(steps);
      setCurrentStep("Done");
      setAnalysis(result);
      if (result.riskPoints && result.riskPoints.length > 0) {
        setImpactTargetSymbol(result.riskPoints[0].name);
        setImpactTargetFile(result.riskPoints[0].path);
      } else if (result.files && result.files.length > 0) {
        setImpactTargetSymbol(result.files[0].name.replace(/\.[^.]+$/, ""));
        setImpactTargetFile(result.files[0].path);
      }
      setIsAnalyzing(false);
      setIsImportOpen(false);
      setIsLandingView(false);
    } catch (err) {
      clearInterval(interval);
      setIsAnalyzing(false);
      console.error("Analysis failed on original repository:", err);
      alert(`Could not analyze repository: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleNavigateToImpact = (symbol: string, file: string) => {
    setImpactTargetSymbol(symbol);
    setImpactTargetFile(file);
    setActiveTab("impact");
  };

  const handleNavigateToCodebase = (filePath: string) => {
    setCodebaseTargetFile(filePath);
    setActiveTab("codebase");
  };

  const handleNavigateToAssistant = (prompt: string) => {
    setAssistantInitialPrompt(prompt);
    setActiveTab("assistant");
  };

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.remove("light-theme");
      } else {
        document.documentElement.classList.add("light-theme");
      }
      return next;
    });
  };

  // If in Landing Page view
  if (isLandingView) {
    return (
      <>
        <LandingPage
          onOpenImport={() => {
            if (!currentUser) {
              handleOpenAuth("signup");
            } else {
              setIsImportOpen(true);
            }
          }}
          onStartAnalysis={handleStartAnalysis}
          onGoToDashboard={() => setIsLandingView(false)}
          hasAnalysis={!!analysis}
          currentUser={currentUser}
          onOpenAuth={handleOpenAuth}
          onLogout={handleLogout}
        />

        {/* Google One Tap Automatic Sign-in Prompt */}
        <GoogleOneTap
          isOpen={isLandingView && !currentUser && !isOneTapDismissed}
          onClose={() => setIsOneTapDismissed(true)}
          onSelectAccount={handleOneTapAccountSelect}
          isLoading={isOneTapLoading}
        />

        {/* Authenticator Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={handleAuthSuccess}
          initialMode={authModalMode}
          initialProvider={authModalProvider}
        />

        {/* Import Modal */}
        <ImportModal
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          onStartAnalysis={async (url, name) => {
            await handleStartAnalysis(url, name);
          }}
          isAnalyzing={isAnalyzing}
          completedSteps={completedSteps}
          currentStep={currentStep}
          userEmail={currentUser?.email}
        />
      </>
    );
  }

  // Dashboard View
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#FAF9F7] relative selection:bg-[#E8532E]/20 selection:text-[#E8532E]">
      {/* Ambient background glows for Apple-like glass depth */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-orange-100/30 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] bg-orange-50/40 rounded-full blur-3xl pointer-events-none -z-0" />

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        repoName={analysis?.repoName || "original-repository"}
        branch={analysis?.branch || "main"}
        onOpenImport={() => setIsImportOpen(true)}
        onGoLanding={() => setIsLandingView(true)}
        isOpen={isSidebarOpen}
        onToggleOpen={() => setIsSidebarOpen((prev) => !prev)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-transparent relative z-10">
        <Header
          repoName={analysis?.repoName || "original-repository"}
          branch={analysis?.branch || "main"}
          analyzedAt={analysis?.analyzedAt}
          healthScore={analysis?.summary?.healthScore || 68}
          isAnalyzing={isAnalyzing}
          onTriggerAnalysis={() => setIsImportOpen(true)}
          onOpenReport={() => setActiveTab("reports")}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
          onGoLanding={() => setIsLandingView(true)}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto relative z-10">
          {activeTab === "overview" && (
            <OverviewView analysis={analysis} onNavigateTab={setActiveTab} />
          )}

          {activeTab === "architecture" && (
            <ArchitectureView
              key={analysis?.id || "default"}
              onNavigateToCodebase={handleNavigateToCodebase}
              onNavigateToImpact={handleNavigateToImpact}
            />
          )}

          {activeTab === "dependencies" && (
            <DependenciesView
              dependencies={analysis?.dependencies || []}
              circularDependencies={analysis?.circularDependencies || []}
              onSelectModule={() => setActiveTab("architecture")}
            />
          )}

          {activeTab === "codebase" && (
            <CodebaseView
              key={analysis?.id || "default"}
              initialFile={codebaseTargetFile}
              onTriggerImpactAnalysis={handleNavigateToImpact}
              onAskAI={(prompt) => handleNavigateToAssistant(prompt || "")}
            />
          )}

          {activeTab === "history" && (
            <GitHistoryView
              commits={analysis?.commits || []}
              mostChangedFiles={analysis?.mostChangedFiles || []}
              onSelectFile={handleNavigateToCodebase}
              onNavigateToImpact={handleNavigateToImpact}
            />
          )}

          {activeTab === "tech-debt" && (
            <TechDebtView
              technicalDebt={analysis?.technicalDebt || []}
              onInspectFile={handleNavigateToCodebase}
              onNavigateToImpact={handleNavigateToImpact}
              onAskAI={handleNavigateToAssistant}
              onNavigateToModernization={() => setActiveTab("modernization")}
            />
          )}

          {activeTab === "risk" && (
            <RiskAnalysisView
              riskPoints={analysis?.riskPoints || []}
              onSelectFile={handleNavigateToCodebase}
              onNavigateToImpact={handleNavigateToImpact}
              onAskAI={handleNavigateToAssistant}
            />
          )}

          {activeTab === "impact" && (
            <ImpactAnalysisView
              key={`${analysis?.id || "default"}-${impactTargetSymbol}-${impactTargetFile}`}
              analysis={analysis}
              initialSymbol={impactTargetSymbol}
              initialFile={impactTargetFile}
              onOpenCodebase={handleNavigateToCodebase}
              onAskAI={handleNavigateToAssistant}
            />
          )}

          {activeTab === "modernization" && (
            <ModernizationView
              analysis={analysis}
              onInspectFile={handleNavigateToCodebase}
              onAskAI={handleNavigateToAssistant}
            />
          )}

          {activeTab === "assistant" && (
            <AIAssistantView initialPrompt={assistantInitialPrompt} />
          )}

          {activeTab === "reports" && <ReportsView />}

          {activeTab === "settings" && (
            <SettingsView isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />
          )}
        </main>
      </div>

      {/* Authenticator Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        initialMode={authModalMode}
        initialProvider={authModalProvider}
      />

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onStartAnalysis={handleStartAnalysis}
        isAnalyzing={isAnalyzing}
        completedSteps={completedSteps}
        currentStep={currentStep}
        userEmail={currentUser?.email}
      />
    </div>
  );
}
