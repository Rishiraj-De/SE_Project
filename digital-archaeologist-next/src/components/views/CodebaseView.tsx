"use client";

import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  Folder,
  FileCode,
  ChevronRight,
  ChevronDown,
  ShieldAlert,
  GitCommit,
  Bot,
  Zap,
  Loader2,
  Sparkles,
  Layers,
  ArrowRight,
  Search,
  Copy,
  Check
} from "lucide-react";
import { fetchFiles, fetchFileContent } from "@/lib/api";

// Dynamically import Monaco Editor to prevent SSR issues in Next.js
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface CodebaseViewProps {
  initialFile?: string;
  onTriggerImpactAnalysis?: (symbol: string, file: string) => void;
  onAskAI?: (prompt: string) => void;
}

interface FileEntry {
  path: string;
  name: string;
  loc: number;
  complexity: number;
  language: string;
  symbolsCount: number;
}

interface TreeNode {
  name: string;
  isFolder: boolean;
  path?: string;
  loc?: number;
  complexity?: number;
  risk?: string;
  language?: string;
  symbolsCount?: number;
  children?: TreeNode[];
}

function buildFileTree(files: FileEntry[]): TreeNode[] {
  const root: TreeNode = { name: "root", isFolder: true, children: [] };

  for (const file of files) {
    const parts = file.path.split("/");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;

      if (isLast) {
        const risk = file.complexity > 15 ? "HIGH" : file.complexity > 8 ? "MEDIUM" : "LOW";
        current.children = current.children || [];
        current.children.push({
          name: part,
          isFolder: false,
          path: file.path,
          loc: file.loc,
          complexity: file.complexity,
          risk,
          language: file.language,
          symbolsCount: file.symbolsCount
        });
      } else {
        current.children = current.children || [];
        let folder = current.children.find(c => c.isFolder && c.name === part);
        if (!folder) {
          folder = { name: part, isFolder: true, children: [] };
          current.children.push(folder);
        }
        current = folder;
      }
    }
  }

  const sortTree = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return a.name.localeCompare(b.name);
    });
    for (const n of nodes) {
      if (n.children) sortTree(n.children);
    }
  };
  if (root.children) sortTree(root.children);

  return root.children || [];
}

export const CodebaseView: React.FC<CodebaseViewProps> = ({
  initialFile,
  onTriggerImpactAnalysis,
  onAskAI
}) => {
  const [selectedFile, setSelectedFile] = useState<string>(initialFile || "");
  const [codeContent, setCodeContent] = useState<string>("// Select a file to view its contents");
  const [language, setLanguage] = useState<string>("typescript");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTreeLoading, setIsTreeLoading] = useState<boolean>(true);
  const [fileTree, setFileTree] = useState<TreeNode[]>([]);
  const [filesList, setFilesList] = useState<FileEntry[]>([]);
  const [treeSearch, setTreeSearch] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  useEffect(() => {
    if (initialFile) {
      setSelectedFile(initialFile);
    }
  }, [initialFile]);

  useEffect(() => {
    setIsTreeLoading(true);
    fetchFiles()
      .then((data) => {
        const files: FileEntry[] = data.files || [];
        setFilesList(files);
        const tree = buildFileTree(files);
        setFileTree(tree);
        setIsTreeLoading(false);

        if (files.length > 0 && !selectedFile && !initialFile) {
          setSelectedFile(files[0].path);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch files:", err);
        setIsTreeLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedFile) return;
    let isMounted = true;
    setIsLoading(true);

    fetchFileContent(selectedFile)
      .then((data) => {
        if (isMounted) {
          setCodeContent(data.content);
          setLanguage(data.language);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setCodeContent(`// Error loading file: ${err.message}`);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedFile]);

  const activeContext = useMemo(() => {
    const fileData = filesList.find(f => f.path === selectedFile);
    if (!fileData) {
      const fileName = selectedFile.split("/").pop()?.replace(/\.[^.]+$/, "") || "Module";
      return {
        moduleName: fileName,
        complexity: 0,
        loc: 0,
        language: language,
        symbolsCount: 0,
        risk: "LOW" as string,
      };
    }
    return {
      moduleName: fileData.name.replace(/\.[^.]+$/, ""),
      complexity: fileData.complexity,
      loc: fileData.loc,
      language: fileData.language,
      symbolsCount: fileData.symbolsCount,
      risk: fileData.complexity > 15 ? "HIGH" : fileData.complexity > 8 ? "MEDIUM" : "LOW",
    };
  }, [selectedFile, filesList, language]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeContent);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden text-gray-900 font-mono text-xs">
      {/* Left Pane: Frosted File Tree */}
      <aside className="w-68 border-r border-black/[0.06] bg-white/80 backdrop-blur-xl flex flex-col shrink-0">
        <div className="px-4 py-3 border-b border-black/[0.06] text-[10px] uppercase tracking-wider text-gray-500 font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#E8532E] animate-pulse" />
            <span>Filesystem</span>
          </div>
          <span className="text-[10px] normal-case font-mono text-[#E8532E] bg-orange-50/80 px-2 py-0.5 rounded-full border border-orange-200/60 font-bold">
            {filesList.length} files
          </span>
        </div>

        {/* Tree Search Bar */}
        <div className="p-2 border-b border-black/[0.04]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={treeSearch}
              onChange={(e) => setTreeSearch(e.target.value)}
              placeholder="Filter tree files..."
              className="w-full pl-7 pr-3 py-1 bg-black/[0.02] border border-black/[0.06] rounded-lg text-[11px] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#E8532E] font-mono"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {isTreeLoading ? (
            <div className="flex items-center gap-2.5 p-4 text-[#E8532E] font-mono">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Indexing AST files...</span>
            </div>
          ) : fileTree.length === 0 ? (
            <div className="p-4 text-gray-500 text-center">
              No source files found
            </div>
          ) : (
            fileTree.map((node) => renderTree(node, selectedFile, setSelectedFile, 0, treeSearch))
          )}
        </div>
      </aside>

      {/* Center Pane: Monaco Editor */}
      <main className="flex-1 flex flex-col bg-[#FAF9F7] overflow-hidden">
        {/* Editor Frosted Tab Bar */}
        <div className="h-10 bg-white/80 backdrop-blur-md border-b border-black/[0.06] px-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs font-mono text-gray-900 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-orange-50 border border-orange-200/80 flex items-center justify-center shrink-0 shadow-2xs">
              <FileCode className="w-3.5 h-3.5 text-[#E8532E]" />
            </div>
            <span className="font-bold text-gray-800 truncate">{selectedFile || "No file selected"}</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-gray-500 font-mono shrink-0">
            <button
              onClick={handleCopyCode}
              className="p-1 px-2 rounded-md hover:bg-black/[0.04] text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1"
              title="Copy code"
            >
              {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copiedCode ? "Copied" : "Copy"}</span>
            </button>
            <span className="px-2 py-0.5 rounded bg-orange-50 border border-orange-200/80 text-[#E8532E] font-bold text-[10px]">
              {language.toUpperCase()}
            </span>
            <span className="text-[10px] text-gray-400">UTF-8</span>
          </div>
        </div>

        {/* Editor View */}
        <div className="flex-1 relative">
          <Editor
            height="100%"
            path={selectedFile || "untitled"}
            language={language}
            value={codeContent}
            theme="vs-dark"
            options={{
              readOnly: true,
              minimap: { enabled: true },
              fontSize: 12,
              fontFamily: "'JetBrains Mono', 'Geist Mono', monospace",
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              renderLineHighlight: "all",
              cursorBlinking: "smooth"
            }}
          />
        </div>
      </main>

      {/* Right Pane: Frosted Context Inspector Panel */}
      <aside className="w-80 border-l border-black/[0.06] bg-white/80 backdrop-blur-xl p-5 flex flex-col justify-between shrink-0 overflow-y-auto space-y-5">
        <div className="space-y-5">
          <div className="border-b border-black/[0.06] pb-4">
            <span className="text-[10px] text-[#E8532E] uppercase tracking-wider font-bold font-mono">File Telemetry</span>
            <div className="flex items-center justify-between mt-1">
              <h3 className="text-base font-bold text-gray-900 tracking-tight truncate mr-2">{activeContext.moduleName}</h3>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                  activeContext.risk === "HIGH"
                    ? "bg-rose-50 text-rose-600 border-rose-200/80 shadow-[0_0_8px_rgba(244,63,94,0.15)]"
                    : activeContext.risk === "MEDIUM"
                    ? "bg-amber-50 text-amber-600 border-amber-200/80"
                    : "bg-emerald-50 text-emerald-600 border-emerald-200/80"
                }`}
              >
                {activeContext.risk} RISK
              </span>
            </div>
            <div className="text-[10px] text-gray-400 font-mono mt-1 truncate">{selectedFile}</div>
          </div>

          {/* Metric Grid with Liquid Card Surfaces */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-3 rounded-xl bg-black/[0.02] border border-black/[0.05] shadow-2xs">
              <div className="text-[10px] text-gray-400 uppercase">Complexity</div>
              <div className="text-base font-bold text-gray-900 mt-0.5">{activeContext.complexity}</div>
            </div>
            <div className="p-3 rounded-xl bg-black/[0.02] border border-black/[0.05] shadow-2xs">
              <div className="text-[10px] text-gray-400 uppercase">Lines of Code</div>
              <div className="text-base font-bold text-[#E8532E] mt-0.5">{activeContext.loc}</div>
            </div>
            <div className="p-3 rounded-xl bg-black/[0.02] border border-black/[0.05] shadow-2xs">
              <div className="text-[10px] text-gray-400 uppercase">Language</div>
              <div className="text-base font-bold text-indigo-600 mt-0.5">{activeContext.language}</div>
            </div>
            <div className="p-3 rounded-xl bg-black/[0.02] border border-black/[0.05] shadow-2xs">
              <div className="text-[10px] text-gray-400 uppercase">Symbols / AST</div>
              <div className="text-base font-bold text-emerald-600 mt-0.5">{activeContext.symbolsCount}</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 border-t border-black/[0.06] pt-4">
            <button
              onClick={() =>
                onTriggerImpactAnalysis &&
                onTriggerImpactAnalysis(`${activeContext.moduleName}`, selectedFile)
              }
              className="failade-btn-primary w-full !py-2.5 font-mono text-xs flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              <span>Simulate Blast Radius</span>
            </button>

            <button
              onClick={() =>
                onAskAI &&
                onAskAI(`Explain the architecture, risk factors, and dependencies of ${activeContext.moduleName} located in ${selectedFile}`)
              }
              className="failade-btn-secondary w-full !py-2.5 font-mono text-xs flex items-center justify-center gap-2"
            >
              <Bot className="w-3.5 h-3.5 text-[#E8532E]" />
              <span>Ask AI Copilot About File</span>
            </button>
          </div>
        </div>

        <div className="text-[10px] text-gray-400 border-t border-black/[0.06] pt-3 text-center font-mono">
          Monaco Editor • AST-indexed inspection
        </div>
      </aside>
    </div>
  );
};

function renderTree(
  node: TreeNode,
  selectedFile: string,
  onSelect: (path: string) => void,
  depth: number = 0,
  filterText: string = ""
) {
  if (node.isFolder) {
    return (
      <FolderNode
        key={node.name + depth}
        node={node}
        selectedFile={selectedFile}
        onSelect={onSelect}
        depth={depth}
        filterText={filterText}
      />
    );
  }

  if (filterText && !node.name.toLowerCase().includes(filterText.toLowerCase())) {
    return null;
  }

  const isSelected = selectedFile === node.path;
  return (
    <button
      key={node.path}
      onClick={() => node.path && onSelect(node.path)}
      className={`w-full flex items-center justify-between py-1 px-2 rounded-lg text-left transition-all ${
        isSelected
          ? "bg-orange-50 text-gray-900 font-bold border border-orange-200/80 shadow-2xs"
          : "text-gray-600 hover:text-gray-900 hover:bg-black/[0.03]"
      }`}
      style={{ paddingLeft: `${depth * 12 + 16}px` }}
    >
      <div className="flex items-center gap-1.5 truncate">
        <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-[#E8532E]" : "text-gray-400"}`} />
        <span className="truncate text-[11px]">{node.name}</span>
      </div>
      {node.risk === "HIGH" && (
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)] shrink-0" title="High Risk" />
      )}
    </button>
  );
}

function FolderNode({
  node,
  selectedFile,
  onSelect,
  depth,
  filterText
}: {
  node: TreeNode;
  selectedFile: string;
  onSelect: (path: string) => void;
  depth: number;
  filterText: string;
}) {
  const [isOpen, setIsOpen] = useState(depth < 2 || !!filterText);

  useEffect(() => {
    if (filterText) {
      setIsOpen(true);
    }
  }, [filterText]);

  return (
    <div key={node.name} className="space-y-0.5">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center gap-1.5 py-1 px-1.5 text-xs text-gray-600 font-semibold hover:text-gray-900 transition-colors"
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
      >
        {isOpen ? <ChevronDown className="w-3 h-3 text-[#E8532E]" /> : <ChevronRight className="w-3 h-3 text-gray-400" />}
        <Folder className="w-3.5 h-3.5 text-amber-500/90" />
        <span className="text-[11px]">{node.name}</span>
        {node.children && (
          <span className="text-[10px] text-gray-400 ml-auto font-mono">
            {node.children.filter((c) => !c.isFolder).length}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="space-y-0.5">
          {node.children?.map((child) => renderTree(child, selectedFile, onSelect, depth + 1, filterText))}
        </div>
      )}
    </div>
  );
}
