"use client";

import React, { useState } from "react";
import { GitBranch, X, Check, Loader2, ArrowRight, ShieldCheck, Lock } from "lucide-react";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartAnalysis: (url: string, name?: string) => Promise<void>;
  isAnalyzing: boolean;
  completedSteps?: string[];
  currentStep?: string;
  userEmail?: string;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onStartAnalysis,
  isAnalyzing,
  completedSteps = [],
  currentStep = "",
  userEmail
}) => {
  const [repoUrl, setRepoUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const pipelineSteps = [
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

  const stepMapping: Record<string, string> = {
    "Repository cloned": "Cloning original repository",
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
    const trimmed = repoUrl.trim();
    if (!trimmed) {
      setErrorMsg("Please provide your original Git repository URL.");
      return;
    }
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://") && !trimmed.startsWith("git@")) {
      setErrorMsg("Please provide a valid repository URL (e.g. https://github.com/owner/repository).");
      return;
    }
    setErrorMsg("");
    await onStartAnalysis(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/80 overflow-hidden relative">
        {/* Header accent strip */}
        <div className="h-1.5 bg-gradient-to-r from-[#E8532E] to-orange-400" />

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
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-[#E8532E] text-xs font-medium border border-orange-200/60">
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>Original Repository Link</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                  Excavate Original Repository
                </h2>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  Provide the link to your Git repository (GitHub, GitLab, or Bitbucket) to deconstruct its AST and architecture.
                </p>
                {userEmail && (
                  <p className="text-xs text-green-700 font-medium">
                    Analysis will be associated with: <strong>{userEmail}</strong>
                  </p>
                )}
              </div>

              {/* URL Input */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <GitBranch className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={repoUrl}
                      onChange={(e) => {
                        setRepoUrl(e.target.value);
                        if (errorMsg) setErrorMsg("");
                      }}
                      placeholder="https://github.com/organization/repository"
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:border-[#E8532E] focus:ring-2 focus:ring-[#E8532E]/20 focus:outline-none text-gray-900 transition-all shadow-2xs"
                    />
                  </div>
                  <button
                    type="submit"
                    className="failade-btn-primary !py-2.5 !px-5 text-sm flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer shadow-sm"
                  >
                    <span>Start Excavation</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                {errorMsg && (
                  <p className="text-xs text-red-500 bg-red-50 border border-red-200 p-2 rounded-lg">
                    {errorMsg}
                  </p>
                )}
              </form>

              {/* Security & Verification Banner */}
              <div className="p-3.5 rounded-xl bg-[#FAF9F7] border border-[#EAE7E0] space-y-1.5 text-xs text-gray-600">
                <div className="flex items-center gap-1.5 font-medium text-gray-800">
                  <ShieldCheck className="w-4 h-4 text-[#E8532E]" />
                  <span>Original Repository Security & Privacy</span>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Only the original repository link provided above will be cloned and analyzed. Supports public Git repositories across GitHub, GitLab, and Bitbucket.
                </p>
              </div>
            </>
          ) : (
            /* Analysis Progress */
            <div className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                  Excavating original codebase...
                </h2>
                <p className="text-sm text-gray-500">
                  Cloning and generating AST syntax trees and dependency graphs.
                </p>
              </div>

              <div className="space-y-2 py-2 text-sm">
                {pipelineSteps.map((step) => {
                  const mappedCompleted = completedSteps.map((s) => stepMapping[s] || s);
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
                      <span
                        className={
                          isDone
                            ? "text-gray-700"
                            : isCurrent
                            ? "text-[#E8532E] font-medium"
                            : "text-gray-400"
                        }
                      >
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-gray-400">
                This may take a moment depending on the size of the repository.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
