"use client";

import React, { useState, useEffect } from "react";
import { Sidebar, NavTab } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ImportModal } from "@/components/views/ImportModal";
import { LandingPage } from "@/components/views/LandingPage";
import { OverviewView } from "@/components/views/OverviewView";
import { ArchitectureView } from "@/components/views/ArchitectureView";
import { DependenciesView } from "@/components/views/DependenciesView";
import { CodebaseView } from "@/components/views/CodebaseView";
import { GitHistoryView } from "@/components/views/GitHistoryView";
import { TechDebtView } from "@/components/views/TechDebtView";
import { RiskAnalysisView } from "@/components/views/RiskAnalysisView";
import { ImpactAnalysisView } from "@/components/views/ImpactAnalysisView";
import { AIAssistantView } from "@/components/views/AIAssistantView";
import { ReportsView } from "@/components/views/ReportsView";
import { SettingsView } from "@/components/views/SettingsView";
import { AnalysisResult } from "@/lib/types";
import { fetchAnalysisStatus, triggerAnalysis } from "@/lib/api";

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
  const [impactTargetSymbol, setImpactTargetSymbol] = useState<string>("PaymentService.processPayment()");
  const [impactTargetFile, setImpactTargetFile] = useState<string>("src/payment/PaymentService.ts");
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

  const handleStartAnalysis = async (url: string, name?: string) => {
    setIsAnalyzing(true);
    setCompletedSteps([]);
    setCurrentStep("Repository cloned");

    const steps = [
      "Repository cloned",
      "Languages detected",
      "Source tree indexed",
      "AST generated",
      "Dependencies extracted",
      "Git history analysis",
      "Architecture reconstruction",
      "Risk analysis",
      "Documentation generation"
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
      const result = await triggerAnalysis(url, name);
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
      console.error("Analysis failed:", err);
    }
  };

  const handleUseDemo = (url?: string, name?: string) => {
    const targetUrl = url || "https://github.com/example/legacy-payment-system";
    const targetName = name || "legacy-payment-system";
    setIsLandingView(false);
    if (!analysis || analysis.repoName !== targetName) {
      handleStartAnalysis(targetUrl, targetName);
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
          onOpenImport={() => setIsImportOpen(true)}
          onUseDemo={handleUseDemo}
          onGoToDashboard={() => setIsLandingView(false)}
          hasAnalysis={!!analysis}
        />

        {/* Import Modal */}
        <ImportModal
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          onStartAnalysis={async (url, name) => {
            setIsLandingView(false);
            await handleStartAnalysis(url, name);
          }}
          isAnalyzing={isAnalyzing}
          completedSteps={completedSteps}
          currentStep={currentStep}
        />
      </>
    );
  }

  // Dashboard View
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#FAF9F6] relative selection:bg-[#E8532E]/20 selection:text-[#E8532E]">
      {/* Ambient background glows for Apple-like glass depth */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-orange-100/30 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] bg-orange-50/40 rounded-full blur-3xl pointer-events-none -z-0" />

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        repoName={analysis?.repoName || "legacy-payment-system"}
        branch={analysis?.branch || "main"}
        onOpenImport={() => setIsImportOpen(true)}
        onGoLanding={() => setIsLandingView(true)}
        isOpen={isSidebarOpen}
        onToggleOpen={() => setIsSidebarOpen((prev) => !prev)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-transparent relative z-10">
        <Header
          repoName={analysis?.repoName || "legacy-payment-system"}
          branch={analysis?.branch || "main"}
          analyzedAt={analysis?.analyzedAt}
          healthScore={analysis?.summary.healthScore || 68}
          isAnalyzing={isAnalyzing}
          onTriggerAnalysis={() => setIsImportOpen(true)}
          onOpenReport={() => setActiveTab("reports")}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
          onGoLanding={() => setIsLandingView(true)}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
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

          {activeTab === "assistant" && (
            <AIAssistantView initialPrompt={assistantInitialPrompt} />
          )}

          {activeTab === "reports" && <ReportsView />}

          {activeTab === "settings" && (
            <SettingsView isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />
          )}
        </main>
      </div>

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onStartAnalysis={handleStartAnalysis}
        isAnalyzing={isAnalyzing}
        completedSteps={completedSteps}
        currentStep={currentStep}
      />
    </div>
  );
}
