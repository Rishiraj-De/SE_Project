"use client";

import React, { useState, useEffect } from "react";
import { AIResponse, AICitation } from "@/lib/types";
import { queryAI } from "@/lib/api";
import { Bot, Send, FileCode, User, Sparkles } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  citations?: AICitation[];
}

interface AIAssistantViewProps {
  initialPrompt?: string;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({ initialPrompt }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Digital Archaeologist Contextual Engine ready. Ask questions regarding module coupling, why dependencies were introduced, or what could break before changing code."
    }
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeCitations, setActiveCitations] = useState<AICitation[]>([]);

  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleSend(initialPrompt);
    }
  }, [initialPrompt]);

  const suggestedQuestions = [
    "Why does PaymentService depend on TransactionService?",
    "What could break if I change processPayment()?",
    "Which files are most risky?",
    "Explain this architecture",
    "Why was this dependency introduced?"
  ];

  const handleSend = async (queryText?: string) => {
    const q = queryText || inputQuery;
    if (!q.trim() || isLoading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: q }];
    setMessages(newMessages);
    setInputQuery("");
    setIsLoading(true);

    try {
      const response: AIResponse = await queryAI(q);
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: response.answer,
          citations: response.citations
        }
      ]);
      if (response.citations && response.citations.length > 0) {
        setActiveCitations(response.citations);
      }
    } catch (err: any) {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: `Analysis query failed: ${err.message}`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-56px)] w-full overflow-hidden">
      {/* Left: Suggested Questions */}
      <aside className="w-72 border-r border-black/[0.06] bg-white/75 backdrop-blur-xl p-5 flex flex-col shrink-0 space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-3 tracking-tight">Suggested Questions</h2>
          <div className="space-y-2">
            {suggestedQuestions.map((q) => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                className="w-full text-left p-3 rounded-xl bg-white/60 hover:bg-orange-50/80 border border-black/[0.05] hover:border-orange-200/80 text-xs text-gray-700 hover:text-[#E8532E] transition-all leading-relaxed shadow-2xs cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-orange-50/80 backdrop-blur-md border border-orange-100/80 space-y-2 mt-auto shadow-2xs">
          <div className="flex items-center gap-2 text-[#E8532E] font-semibold text-xs">
            <Sparkles className="w-4 h-4" />
            <span>Evidence-Backed Answers</span>
          </div>
          <p className="text-gray-600 text-xs leading-relaxed">
            Every inference is validated against static AST call graphs and historical Git churn.
          </p>
        </div>
      </aside>

      {/* Center: Chat */}
      <main className="flex-1 flex flex-col bg-transparent overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`p-4.5 rounded-2xl text-xs leading-relaxed transition-all ${
                m.role === "user"
                  ? "bg-gradient-to-br from-[#F0562D] to-[#E8451D] text-white shadow-sm ml-16 border border-orange-400/30"
                  : "bg-white/80 backdrop-blur-md rounded-2xl border border-white/90 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] mr-8 text-gray-800"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {m.role === "user" ? (
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span>You</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-800 font-semibold">
                    <div className="w-6 h-6 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center">
                      <Bot className="w-3.5 h-3.5 text-[#E8532E]" />
                    </div>
                    <span>AI Investigator</span>
                  </div>
                )}
              </div>

              <div className={`whitespace-pre-line text-xs leading-relaxed ${m.role === "user" ? "text-white/95" : "text-gray-700"}`}>
                {m.content}
              </div>

              {m.citations && m.citations.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-gray-100 flex flex-wrap items-center gap-2">
                  <span className="text-[10px] text-gray-400">Evidence:</span>
                  {m.citations.map((c, cIdx) => (
                    <button
                      key={cIdx}
                      onClick={() => setActiveCitations(m.citations || [])}
                      className="px-2.5 py-1 rounded-lg bg-orange-50/80 border border-orange-200/80 hover:border-[#E8532E] text-[10px] font-mono text-[#E8532E] transition-all flex items-center gap-1 shadow-2xs"
                    >
                      <FileCode className="w-3 h-3" />
                      <span>{c.file} {c.line ? `(L${c.line})` : ""}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="p-4 bg-white/80 backdrop-blur-md rounded-2xl border border-white/90 shadow-xs text-xs text-[#E8532E] flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#E8532E] animate-ping" />
              <span>Analyzing AST call graph, dependencies, and commit churn...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-black/[0.06] bg-white/80 backdrop-blur-xl space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Ask contextual questions about this codebase..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="flex-1 bg-white/70 backdrop-blur-md border border-black/[0.08] rounded-xl px-4 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#E8532E] focus:bg-white shadow-2xs transition-all"
            />
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !inputQuery.trim()}
              className="failade-btn-primary !py-2.5 !px-4"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
