"use client";

import React, { useState, useEffect } from "react";
import { fetchReports, generateDocumentation } from "@/lib/api";
import { Download, Printer, FileText, Check, Copy, Sparkles, BookOpen, Layers } from "lucide-react";

export const ReportsView: React.FC = () => {
  const [reportMarkdown, setReportMarkdown] = useState<string>("# Loading report...");
  const [activeTab, setActiveTab] = useState<"assessment" | "docs">("assessment");
  const [docModule, setDocModule] = useState<string>("PaymentService");
  const [docMarkdown, setDocMarkdown] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    fetchReports()
      .then((res) => setReportMarkdown(res.markdown))
      .catch((err) => setReportMarkdown(`# Error generating report: ${err.message}`));
  }, []);

  const handleGenerateDoc = async (mod: string) => {
    setDocModule(mod);
    try {
      const res = await generateDocumentation(mod);
      setDocMarkdown(res.markdown);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeTab === "docs" && !docMarkdown) {
      handleGenerateDoc("PaymentService");
    }
  }, [activeTab]);

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-7">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="failade-pill mb-2">
            <span className="w-2 h-2 rounded-full bg-[#E8532E] animate-pulse" />
            <span>Automated Dossier &amp; Architecture Documentation</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-[#E8532E]" />
            <span>Engineering Assessment Dossier</span>
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1 max-w-2xl">
            Export comprehensive legacy audit reports, architecture specifications, and automated module documentation.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-black/[0.03] p-1.5 rounded-xl border border-black/[0.04] text-xs font-mono">
          <button
            onClick={() => setActiveTab("assessment")}
            className={`px-3.5 py-1.5 rounded-lg transition-all font-medium flex items-center gap-1.5 ${
              activeTab === "assessment"
                ? "bg-white text-[#E8532E] font-bold shadow-2xs border border-black/[0.04]"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Assessment Dossier</span>
          </button>
          <button
            onClick={() => setActiveTab("docs")}
            className={`px-3.5 py-1.5 rounded-lg transition-all font-medium flex items-center gap-1.5 ${
              activeTab === "docs"
                ? "bg-white text-[#E8532E] font-bold shadow-2xs border border-black/[0.04]"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Module Docs</span>
          </button>
        </div>
      </div>

      {activeTab === "assessment" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-gray-500 font-sans">Formal Markdown &amp; Printable Artifact</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(reportMarkdown)}
                className="failade-btn-secondary text-xs !py-1.5 !px-3 flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#E8532E]" />}
                <span>{copied ? "Copied" : "Copy Markdown"}</span>
              </button>
              <button
                onClick={handlePrint}
                className="failade-btn-primary text-xs !py-1.5 !px-3 flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>

          <div className="liquid-card p-8 text-xs whitespace-pre-line leading-relaxed text-gray-800 overflow-x-auto font-mono bg-white/80">
            {reportMarkdown}
          </div>
        </div>
      ) : (
        <div className="space-y-4 text-xs font-mono">
          <div className="liquid-card !p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 font-sans">Module:</span>
              {["PaymentService", "AuthController", "DatabaseConnector"].map((mod) => (
                <button
                  key={mod}
                  onClick={() => handleGenerateDoc(mod)}
                  className={`px-3 py-1.5 rounded-lg transition-all font-mono text-xs ${
                    docModule === mod
                      ? "bg-orange-50 text-[#E8532E] border border-orange-200/80 font-bold shadow-2xs"
                      : "text-gray-600 hover:text-gray-900 bg-black/[0.02] border border-black/[0.04]"
                  }`}
                >
                  {mod}
                </button>
              ))}
            </div>

            <button
              onClick={() => handleCopy(docMarkdown)}
              className="failade-btn-secondary text-xs !py-1.5 !px-3 flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#E8532E]" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>

          <div className="liquid-card p-8 text-xs whitespace-pre-line leading-relaxed text-gray-800 overflow-x-auto font-mono bg-white/80">
            {docMarkdown || "Generating module documentation..."}
          </div>
        </div>
      )}
    </div>
  );
};
