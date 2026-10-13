"use client";

import React, { useState } from "react";
import { GitBranch, X, Check, Loader2, ArrowRight, Play, Sparkles } from "lucide-react";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartAnalysis: (url: string, name?: string) => Promise<void>;
  isAnalyzing: boolean;
  completedSteps?: string[];
  currentStep?: string;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onStartAnalysis,
  isAnalyzing,
  completedSteps = [],
  currentStep = ""
}) => {
  const [repoUrl, setRepoUrl] = useState("https://github.com/example/legacy-payment-system");
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const pipelineSteps = [
    "Cloning repository",
    "Detecting languages",
    "Indexing source files",
    "Generating AST",
    "Extracting dependencies",
    "Analyzing Git history",
    "Building architecture graph",
    "Detecting technical debt",
    "Generating documentation"
  ];

  const stepMapping: Record<string, string> = {
    "Repository cloned": "Cloning repository",
    "Languages detected": "Detecting languages",
    "Source tree indexed": "Indexing source files",
    "AST generated": "Generating AST",
    "Dependencies extracted": "Extracting dependencies",
    "Git history analysis": "Analyzing Git history",
    "Architecture reconstruction": "Building architecture graph",
    "Risk analysis": "Detecting technical debt",
    "Documentation generation": "Generating documentation"
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) {
      setErrorMsg("Please provide a valid GitHub repository URL");
      return;
    }
    setErrorMsg("");
    await onStartAnalysis(repoUrl.trim());
  };

  const handleUseDemo = async (name: string) => {
    setRepoUrl("https://github.com/example/legacy-payment-system");
    setErrorMsg("");
    await onStartAnalysis("https://github.com/example/legacy-payment-system", name);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md p-4">
      <div className="w-full max-w-lg bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/85 overflow-hidden relative">
        {/* Close button */}
        {!isAnalyzing && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="p-8 space-y-6">
          {!isAnalyzing ? (
            <>
              {/* Title */}
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                  Start your excavation.
                </h2>
                <p className="text-sm text-gray-500">
                  Enter a GitHub repository URL to analyze its architecture, history, dependencies and more.
                </p>
              </div>

              {/* URL Input */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <GitBranch className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      placeholder="https://github.com/username/repository"
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:border-[#E8532E] focus:ring-1 focus:ring-[#E8532E]/20 focus:outline-none text-gray-900 transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    className="failade-btn-primary !py-2.5 !px-4 text-sm flex items-center gap-2 whitespace-nowrap"
                  >
                    <span>Analyze Repository</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}
              </form>

              {/* Demo repos */}
              <div className="text-center space-y-3">
                <span className="text-xs text-gray-400">or try a demo repository</span>
                <div className="flex items-center justify-center gap-3">
                  {["Sample Java Project", "Sample Python Project", "Legacy Web App"].map((name) => (
                    <button
                      key={name}
                      onClick={() => handleUseDemo(name)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-[#E8532E] hover:border-orange-200 hover:bg-orange-50 transition-all"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Analysis Progress */
            <div className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                  Analyzing repository...
                </h2>
                <p className="text-sm text-gray-500">
                  This may take a few minutes. We&apos;re excavating the codebase.
                </p>
              </div>

              <div className="space-y-2 py-2 text-sm">
                {pipelineSteps.map((step) => {
                  const mappedCompleted = completedSteps.map(s => stepMapping[s] || s);
                  const mappedCurrent = stepMapping[currentStep] || currentStep;
                  const isDone = mappedCompleted.includes(step);
                  const isCurrent = mappedCurrent === step;

                  return (
                    <div key={step} className="flex items-center gap-3">
                      {isDone ? (
                        <div className="w-5 h-5 rounded-full flex items-center justify-center bg-green-100 text-green-600 border border-green-200">
                          <Check className="w-3 h-3" />
                        </div>
                      ) : isCurrent ? (
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[#E8532E]">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full flex items-center justify-center">
                          <span className="w-2 h-2 rounded-full bg-gray-200" />
                        </div>
                      )}
                      <span className={isDone ? "text-gray-700" : isCurrent ? "text-[#E8532E] font-medium" : "text-gray-400"}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-gray-400">
                This may take 2-4 minutes for larger repositories.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
