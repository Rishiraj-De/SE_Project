"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  Node,
  Edge,
  Handle,
  Position,
  MarkerType,
  MiniMap
} from "@xyflow/react";
import {
  Search,
  Filter,
  AlertTriangle,
  Database,
  Server,
  Cpu,
  Box,
  X,
  ExternalLink,
  Loader2,
  Sparkles,
  Zap,
  Layers,
  Code2,
  FileText,
  GitBranch,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Flame,
  LayoutGrid,
  ListFilter,
  Maximize2,
  Focus,
  CheckCircle2
} from "lucide-react";
import { fetchArchitecture } from "@/lib/api";

interface ArchitectureViewProps {
  onNavigateToCodebase?: (filePath: string) => void;
  onNavigateToImpact?: (symbol: string, filePath: string) => void;
}

// Custom Enhanced Architecture Node with Import/Export Badges
const ArchitectureNode = ({ data, selected }: { data: any; selected: boolean }) => {
  const getIcon = () => {
    switch (data.layer) {
      case "pages":
        return <Layers className="w-3.5 h-3.5 text-purple-600" />;
      case "components":
        return <Cpu className="w-3.5 h-3.5 text-blue-600" />;
      case "services":
        return <Server className="w-3.5 h-3.5 text-[#E8532E]" />;
      case "utils":
        return <Zap className="w-3.5 h-3.5 text-amber-600" />;
      case "config":
        return <Box className="w-3.5 h-3.5 text-gray-600" />;
      default:
        return <Server className="w-3.5 h-3.5 text-gray-600" />;
    }
  };

  const getRiskBadge = () => {
    switch (data.risk) {
      case "CRITICAL":
      case "HIGH":
        return "text-red-700 bg-red-50 border-red-200";
      case "MEDIUM":
        return "text-amber-700 bg-amber-50 border-amber-200";
      default:
        return "text-green-700 bg-green-50 border-green-200";
    }
  };

  const isHighlighted = data.isHighlighted;
  const isDimmed = data.isDimmed;
  const isDirectDependency = data.isDirectDependency;
  const isDirectDependent = data.isDirectDependent;

  return (
    <div
      className={`px-3.5 py-2.5 rounded-xl bg-white border transition-all duration-200 min-w-[195px] max-w-[230px] relative select-none shadow-xs group ${
        selected
          ? "border-[#E8532E] ring-2 ring-[#E8532E]/30 shadow-lg scale-102 z-30"
          : isDirectDependency
          ? "border-amber-400 ring-2 ring-amber-400/20 shadow-md bg-amber-50/20 z-20"
          : isDirectDependent
          ? "border-cyan-400 ring-2 ring-cyan-400/20 shadow-md bg-cyan-50/20 z-20"
          : isDimmed
          ? "opacity-25 grayscale-[40%] border-gray-200"
          : "border-gray-200 hover:border-orange-300 hover:shadow-md"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-[#E8532E] !w-2.5 !h-2.5 !border-2 !border-white shadow-xs"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-[#E8532E] !w-2.5 !h-2.5 !border-2 !border-white shadow-xs"
      />

      {/* Top Tag bar */}
      <div className="flex items-center justify-between gap-1.5 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-5 h-5 rounded-md bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
            {getIcon()}
          </div>
          <span className="text-[12px] font-bold text-gray-900 tracking-tight truncate">
            {data.label}
          </span>
        </div>

        <span className={`text-[8.5px] font-mono px-1.5 py-0.2 rounded-full border font-bold shrink-0 ${getRiskBadge()}`}>
          {data.risk}
        </span>
      </div>

      {/* Connection counts badge */}
      <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono py-1 border-t border-gray-100">
        <span className="flex items-center gap-1" title={`${data.imports?.length || 0} outgoing imports`}>
          <span className="text-gray-400">↑</span>
          <strong className="text-gray-700">{data.imports?.length || 0}</strong> imports
        </span>
        <span className="flex items-center gap-1" title={`${data.importedBy?.length || 0} incoming dependents`}>
          <span className="text-gray-400">↓</span>
          <strong className="text-gray-700">{data.importedBy?.length || 0}</strong> used by
        </span>
      </div>

      {/* LOC & Complexity */}
      <div className="text-[9.5px] font-mono text-gray-400 flex items-center justify-between pt-1 border-t border-gray-50">
        <span>LOC: <strong className="text-gray-600">{data.loc}</strong></span>
        <span>CC: <strong className="text-gray-600">{data.complexity}</strong></span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-[#E8532E] !w-2.5 !h-2.5 !border-2 !border-white shadow-xs"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-[#E8532E] !w-2.5 !h-2.5 !border-2 !border-white shadow-xs"
      />
    </div>
  );
};

const nodeTypes = {
  archNode: ArchitectureNode
};

type ArchTab = "graph" | "modules" | "subsystems" | "circular";

export const ArchitectureView: React.FC<ArchitectureViewProps> = ({
  onNavigateToCodebase,
  onNavigateToImpact
}) => {
  const [activeTab, setActiveTab] = useState<ArchTab>("graph");
  const [searchQuery, setSearchQuery] = useState("");
  const [layerFilter, setLayerFilter] = useState<string>("all");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [hideUnconnected, setHideUnconnected] = useState<boolean>(true);
  const [focusMode, setFocusMode] = useState<boolean>(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const [rawNodes, setRawNodes] = useState<any[]>([]);
  const [rawEdges, setRawEdges] = useState<any[]>([]);
  const [circularDependencies, setCircularDependencies] = useState<any[]>([]);
  const [subsystems, setSubsystems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch architecture data from the API
  useEffect(() => {
    setIsLoading(true);
    fetchArchitecture()
      .then((data) => {
        setRawNodes(data.nodes || []);
        setRawEdges(data.edges || []);
        setCircularDependencies(data.circularDependencies || []);
        setSubsystems(data.subsystems || []);
        setIsLoading(false);

        // Select the first high risk or connected node by default
        if (data.nodes && data.nodes.length > 0) {
          const defaultNode = data.nodes.find((n: any) => n.risk === "HIGH" && n.isConnected) || data.nodes[0];
          setSelectedNodeId(defaultNode.id);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch architecture:", err);
        setIsLoading(false);
      });
  }, []);

  // Compute selected node full details
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return rawNodes.find((n) => n.id === selectedNodeId) || null;
  }, [rawNodes, selectedNodeId]);

  // Compute direct dependencies (outgoing) and dependents (incoming) for selected node
  const activeNeighborhood = useMemo(() => {
    if (!selectedNodeId) return { dependencies: new Set<string>(), dependents: new Set<string>() };

    const dependencies = new Set<string>();
    const dependents = new Set<string>();

    for (const edge of rawEdges) {
      if (edge.source === selectedNodeId) {
        dependencies.add(edge.target);
      }
      if (edge.target === selectedNodeId) {
        dependents.add(edge.source);
      }
    }

    return { dependencies, dependents };
  }, [selectedNodeId, rawEdges]);

  // Filtered nodes for the Graph canvas
  const graphNodes: Node[] = useMemo(() => {
    return rawNodes
      .filter((n) => {
        // Layer filter
        if (layerFilter !== "all" && n.layer !== layerFilter) return false;
        // Risk filter
        if (riskFilter !== "all" && n.risk !== riskFilter) return false;
        // Hide unconnected filter
        if (hideUnconnected && !n.isConnected && n.id !== selectedNodeId) return false;
        return true;
      })
      .map((n) => {
        const isSelected = n.id === selectedNodeId;
        const isDirectDependency = activeNeighborhood.dependencies.has(n.id);
        const isDirectDependent = activeNeighborhood.dependents.has(n.id);
        const isConnectedToSelected = isSelected || isDirectDependency || isDirectDependent;

        const isDimmed =
          focusMode && selectedNodeId
            ? !isConnectedToSelected
            : searchQuery.trim()
            ? !n.label.toLowerCase().includes(searchQuery.toLowerCase())
            : false;

        return {
          id: n.id,
          type: "archNode",
          position: { x: n.x, y: n.y },
          data: {
            ...n,
            selected: isSelected,
            isDimmed,
            isDirectDependency,
            isDirectDependent
          }
        };
      });
  }, [rawNodes, layerFilter, riskFilter, hideUnconnected, selectedNodeId, activeNeighborhood, focusMode, searchQuery]);

  // Filtered edges for the Graph canvas (Declutters spaghetti edges!)
  const graphEdges: Edge[] = useMemo(() => {
    const visibleNodeIds = new Set(graphNodes.map((n) => n.id));

    return rawEdges
      .filter((e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target))
      .filter((e) => {
        // If in Focus Mode and a node is selected, ONLY show edges connected to selected node!
        if (focusMode && selectedNodeId) {
          return e.source === selectedNodeId || e.target === selectedNodeId;
        }
        return true;
      })
      .map((e) => {
        const isConnectedToSelected = e.source === selectedNodeId || e.target === selectedNodeId;
        const isOutgoing = e.source === selectedNodeId;

        return {
          id: e.id,
          source: e.source,
          target: e.target,
          animated: e.circular || isConnectedToSelected,
          style: {
            stroke: e.circular
              ? "#DC2626"
              : isConnectedToSelected
              ? isOutgoing
                ? "#E8532E"
                : "#0284C7"
              : "#CBD5E1",
            strokeWidth: isConnectedToSelected ? 2.5 : 1.25,
            opacity: isConnectedToSelected ? 1 : 0.4
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: e.circular
              ? "#DC2626"
              : isConnectedToSelected
              ? isOutgoing
                ? "#E8532E"
                : "#0284C7"
              : "#94A3B8"
          }
        };
      });
  }, [rawEdges, graphNodes, focusMode, selectedNodeId]);

  // Filtered list of modules for the "Modules Explorer" tab
  const explorerModules = useMemo(() => {
    return rawNodes.filter((m) => {
      const matchSearch =
        m.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.symbols && m.symbols.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase())));

      const matchLayer = layerFilter === "all" || m.layer === layerFilter;
      const matchRisk = riskFilter === "all" || m.risk === riskFilter;

      return matchSearch && matchLayer && matchRisk;
    });
  }, [rawNodes, searchQuery, layerFilter, riskFilter]);

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  if (isLoading) {
    return (
      <div className="w-full h-[calc(100vh-64px)] bg-[#FAF9F7] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#E8532E] text-sm font-mono failade-card p-6">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Reconstructing Architecture Graph...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[calc(100vh-64px)] bg-[#FAF9F7] flex flex-col overflow-hidden">
      {/* ─── Top Control Toolbar ─── */}
      <div className="min-h-14 border-b border-black/[0.06] bg-white/80 backdrop-blur-xl px-5 py-2 flex flex-wrap items-center justify-between shrink-0 gap-3">
        {/* Left: View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-black/[0.04] p-1 rounded-xl shrink-0">
          <button
            onClick={() => setActiveTab("graph")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === "graph"
                ? "bg-white text-gray-900 shadow-2xs font-bold"
                : "text-gray-500 hover:text-gray-900 hover:bg-white/50"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-[#E8532E]" />
            <span>Graph</span>
          </button>

          <button
            onClick={() => setActiveTab("modules")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === "modules"
                ? "bg-white text-gray-900 shadow-2xs font-bold"
                : "text-gray-500 hover:text-gray-900 hover:bg-white/50"
            }`}
          >
            <ListFilter className="w-3.5 h-3.5 text-[#E8532E]" />
            <span>Modules</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/[0.05] text-gray-600">
              {rawNodes.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("subsystems")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === "subsystems"
                ? "bg-white text-gray-900 shadow-2xs font-bold"
                : "text-gray-500 hover:text-gray-900 hover:bg-white/50"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#E8532E]" />
            <span>Subsystems</span>
          </button>

          <button
            onClick={() => setActiveTab("circular")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === "circular"
                ? "bg-white text-gray-900 shadow-2xs font-bold"
                : "text-gray-500 hover:text-gray-900 hover:bg-white/50"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>Coupling</span>
            {circularDependencies.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-rose-50 text-rose-600 border border-rose-200/80 font-bold">
                {circularDependencies.length}
              </span>
            )}
          </button>
        </div>

        {/* Right: Search & Filters */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Search box */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-black/[0.08] text-xs w-48 sm:w-56 focus-within:border-[#E8532E] focus-within:ring-2 focus-within:ring-orange-500/10 shadow-2xs transition-all shrink-0">
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Search module or function..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-gray-900 focus:outline-none placeholder:text-gray-400 w-full text-xs font-sans"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-gray-400 hover:text-gray-600 shrink-0">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Layer Filter */}
          <select
            value={layerFilter}
            onChange={(e) => setLayerFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-white border border-black/[0.08] text-xs text-gray-700 font-medium focus:outline-none focus:border-[#E8532E] cursor-pointer shadow-2xs shrink-0 whitespace-nowrap"
          >
            <option value="all">All Layers</option>
            <option value="pages">Pages & Views</option>
            <option value="components">UI Components</option>
            <option value="services">Services & Logic</option>
            <option value="utils">Utilities</option>
            <option value="config">Config & Build</option>
          </select>

          {/* Risk Filter */}
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-white border border-black/[0.08] text-xs text-gray-700 font-medium focus:outline-none focus:border-[#E8532E] cursor-pointer shadow-2xs shrink-0 whitespace-nowrap"
          >
            <option value="all">All Risks</option>
            <option value="HIGH">High Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="LOW">Low Risk</option>
          </select>

          {/* Graph Specific Controls */}
          {activeTab === "graph" && (
            <div className="flex items-center gap-1.5 border-l border-black/[0.08] pl-2.5 shrink-0">
              <button
                onClick={() => setFocusMode((prev) => !prev)}
                title="Focus Mode: When active, only displays edges connected to selected node"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${
                  focusMode
                    ? "bg-orange-50 border-orange-200/80 text-[#E8532E] shadow-2xs"
                    : "bg-white border-black/[0.08] text-gray-600 hover:text-gray-900 shadow-2xs"
                }`}
              >
                <Focus className="w-3.5 h-3.5" />
                <span>Focus Mode</span>
              </button>

              <button
                onClick={() => setHideUnconnected((prev) => !prev)}
                title="Hide isolated files without import dependencies"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${
                  hideUnconnected
                    ? "bg-gray-900 border-gray-900 text-white shadow-2xs"
                    : "bg-white border-black/[0.08] text-gray-600 hover:text-gray-900 shadow-2xs"
                }`}
              >
                {hideUnconnected ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>Hide Isolated</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── Main Content Tabs ─── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* ─── TAB 1: INTERACTIVE GRAPH ─── */}
        {activeTab === "graph" && (
          <div className="flex-1 h-full relative">
            {/* Top Overlay Stats */}
            <div className="absolute top-4 left-6 z-10 flex items-center gap-3">
              <div className="px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-xs border border-gray-200 text-xs font-mono text-gray-600 shadow-xs flex items-center gap-2">
                <span className="text-[#E8532E] font-bold">{graphNodes.length}</span>
                <span>showing</span>
                <span className="text-gray-400">/</span>
                <span>{rawNodes.length} total</span>
              </div>

              {circularDependencies.length > 0 && (
                <div
                  onClick={() => setActiveTab("circular")}
                  className="px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-xs font-mono text-red-700 shadow-xs flex items-center gap-1.5 cursor-pointer hover:bg-red-100 transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span>{circularDependencies.length} Circular Loops</span>
                </div>
              )}

              {selectedNode && (
                <div className="px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-200 text-xs text-[#E8532E] flex items-center gap-2">
                  <span>Selected: <strong>{selectedNode.label}</strong></span>
                  <button onClick={() => setSelectedNodeId(null)} className="hover:text-red-600">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Legend */}
            <div className="absolute bottom-4 left-6 z-10 px-3.5 py-2 rounded-xl bg-white/95 backdrop-blur-xs border border-gray-200 text-xs font-mono text-gray-600 flex items-center gap-4 shadow-sm">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 rounded-full bg-[#E8532E]" />
                <span className="text-gray-700">Imports (Outgoing)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 rounded-full bg-[#0284C7]" />
                <span className="text-gray-700">Used by (Incoming)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 rounded-full bg-red-500" />
                <span className="text-red-600 font-semibold">Circular Loop</span>
              </div>
            </div>

            <ReactFlow
              nodes={graphNodes}
              edges={graphEdges}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.2 }}
            >
              <Background color="#E5E4E1" gap={28} size={1} />
              <Controls position="bottom-right" />
              <MiniMap
                nodeColor={(node: any) => {
                  if (node.id === selectedNodeId) return "#E8532E";
                  if (node.data?.risk === "HIGH") return "#DC2626";
                  return "#CBD5E1";
                }}
                className="!bg-white/80 !border-gray-200 !rounded-xl"
              />
            </ReactFlow>
          </div>
        )}

        {/* ─── TAB 2: MODULES EXPLORER (CLEAN TABLE & LIST FOR LARGE WEBSITES) ─── */}
        {activeTab === "modules" && (
          <div className="flex-1 h-full overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900 tracking-tight">
                  Modules Explorer
                </h3>
                <p className="text-xs text-gray-500">
                  Search, inspect functions, and explore dependencies without visual clutter.
                </p>
              </div>

              <div className="text-xs font-mono text-gray-500">
                Showing <strong>{explorerModules.length}</strong> of {rawNodes.length} modules
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 uppercase text-[10px] font-mono">
                    <tr>
                      <th className="py-3 px-4">Module Name</th>
                      <th className="py-3 px-3">Layer</th>
                      <th className="py-3 px-3">Functions / Symbols</th>
                      <th className="py-3 px-3 text-center">Dependencies (Imports)</th>
                      <th className="py-3 px-3 text-center">Dependents (Used By)</th>
                      <th className="py-3 px-3">LOC</th>
                      <th className="py-3 px-3">Risk</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {explorerModules.map((m) => (
                      <tr
                        key={m.id}
                        className={`hover:bg-orange-50/40 transition-colors ${
                          selectedNodeId === m.id ? "bg-orange-50/60" : ""
                        }`}
                      >
                        <td className="py-3 px-4 font-medium text-gray-900">
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm text-gray-900">{m.label}</span>
                            <span className="text-[10px] font-mono text-gray-400 truncate max-w-[200px]">
                              {m.path}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-gray-100 text-gray-700 capitalize">
                            {m.layer}
                          </span>
                        </td>

                        <td className="py-3 px-3 max-w-[240px]">
                          {m.symbols && m.symbols.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {m.symbols.slice(0, 3).map((sym: string, sIdx: number) => (
                                <span
                                  key={`${m.id}-${sym}-${sIdx}`}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-orange-50 text-[#E8532E] border border-orange-200"
                                >
                                  {sym}()
                                </span>
                              ))}
                              {m.symbols.length > 3 && (
                                <span className="text-[10px] text-gray-400 font-mono self-center">
                                  +{m.symbols.length - 3} more
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic text-[11px]">No exported functions</span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-gray-100 text-gray-700">
                            {m.imports?.length || 0}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            {m.importedBy?.length || 0}
                          </span>
                        </td>

                        <td className="py-3 px-3 font-mono font-semibold text-gray-700">
                          {m.loc}
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                              m.risk === "HIGH" || m.risk === "CRITICAL"
                                ? "text-red-700 bg-red-50 border-red-200"
                                : m.risk === "MEDIUM"
                                ? "text-amber-700 bg-amber-50 border-amber-200"
                                : "text-green-700 bg-green-50 border-green-200"
                            }`}
                          >
                            {m.risk}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedNodeId(m.id);
                                setActiveTab("graph");
                              }}
                              className="px-2 py-1 rounded-md bg-white hover:bg-orange-50 text-[#E8532E] border border-orange-200 text-[11px] font-medium transition-colors"
                            >
                              Focus in Graph
                            </button>
                            {onNavigateToCodebase && (
                              <button
                                onClick={() => onNavigateToCodebase(m.path)}
                                className="px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] transition-colors"
                                title="Inspect Code"
                              >
                                Code
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 3: SUBSYSTEMS MACRO ARCHITECTURE ─── */}
        {activeTab === "subsystems" && (
          <div className="flex-1 h-full overflow-y-auto p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-gray-900 tracking-tight">
                Subsystems & Architectural Tiers
              </h3>
              <p className="text-xs text-gray-500">
                High-level architecture view grouping 59 modules into cohesive architectural tiers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {subsystems.map((sub) => {
                const subModules = rawNodes.filter((n) => n.layer === sub.id);
                const totalLoc = subModules.reduce((acc, curr) => acc + (curr.loc || 0), 0);
                const avgComplexity =
                  subModules.length > 0
                    ? Math.round(subModules.reduce((acc, curr) => acc + (curr.complexity || 0), 0) / subModules.length)
                    : 0;

                return (
                  <div
                    key={sub.id}
                    className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs hover:border-orange-300 transition-all space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-[#E8532E]">
                          <Layers className="w-4 h-4" />
                        </div>
                        <h4 className="font-bold text-gray-900 text-sm">{sub.name}</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-orange-100 text-[#E8532E]">
                        {sub.count} files
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 leading-relaxed">
                      {sub.description}
                    </p>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 text-xs">
                      <div className="p-2 rounded-lg bg-gray-50">
                        <div className="text-[10px] text-gray-400 font-mono">Total LOC</div>
                        <div className="font-bold text-gray-800 font-mono mt-0.5">{totalLoc}</div>
                      </div>
                      <div className="p-2 rounded-lg bg-gray-50">
                        <div className="text-[10px] text-gray-400 font-mono">Avg Complexity</div>
                        <div className="font-bold text-gray-800 font-mono mt-0.5">{avgComplexity}</div>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="text-[11px] font-semibold text-gray-700">Top Modules:</div>
                      <div className="flex flex-wrap gap-1">
                        {subModules.slice(0, 5).map((m) => (
                          <button
                            key={m.id}
                            onClick={() => {
                              setSelectedNodeId(m.id);
                              setActiveTab("graph");
                            }}
                            className="px-2 py-0.5 rounded text-[10.5px] font-mono bg-gray-100 hover:bg-orange-100 text-gray-700 hover:text-[#E8532E] transition-colors"
                          >
                            {m.label}
                          </button>
                        ))}
                        {subModules.length > 5 && (
                          <span className="text-[10.5px] text-gray-400 font-mono self-center">
                            +{subModules.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── TAB 4: CIRCULAR COUPLING INSPECTOR ─── */}
        {activeTab === "circular" && (
          <div className="flex-1 h-full overflow-y-auto p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>Coupling & Circular Loops</span>
              </h3>
              <p className="text-xs text-gray-500">
                Circular dependencies create tight coupling, make testing difficult, and increase refactoring risk.
              </p>
            </div>

            {circularDependencies.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto" />
                <h4 className="font-semibold text-sm text-gray-900">Zero Circular Dependencies Detected</h4>
                <p className="text-xs text-gray-500">This codebase has clean hierarchical import structures.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {circularDependencies.map((cd: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-white rounded-xl border border-red-200 p-5 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-red-100 text-red-700">
                          Loop #{idx + 1}
                        </span>
                        <span className="text-xs text-gray-500 font-mono">
                          {cd.modules?.length || 2} components involved
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-red-50 text-red-600 border border-red-200">
                        {cd.severity || "HIGH"}
                      </span>
                    </div>

                    {/* Step chain */}
                    <div className="p-3 bg-red-50/50 rounded-lg border border-red-100 flex flex-wrap items-center gap-2">
                      {(cd.modules || []).map((mod: string, mIdx: number) => (
                        <React.Fragment key={mIdx}>
                          <button
                            onClick={() => {
                              setSelectedNodeId(mod);
                              setActiveTab("graph");
                            }}
                            className="px-2.5 py-1 rounded-md bg-white border border-red-200 text-xs font-mono font-semibold text-gray-900 hover:text-[#E8532E] hover:border-[#E8532E] transition-colors"
                          >
                            {mod}
                          </button>
                          {mIdx < cd.modules.length - 1 && (
                            <ArrowRight className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>

                    <p className="text-xs text-gray-600">
                      <strong>Refactoring advice:</strong> Extract shared interfaces or events to a separate utility module to break this cycle.
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── RIGHT-SIDE NODE INSPECTOR DRAWER (Panel 5 reference design) ─── */}
        {selectedNode && (
          <aside className="w-88 border-l border-gray-200 bg-white p-5 flex flex-col justify-between shrink-0 overflow-y-auto text-xs relative z-20 shadow-xl">
            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-gray-100 pb-3">
                <div className="min-w-0 pr-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#E8532E] font-semibold">
                    {selectedNode.category}
                  </span>
                  <h3 className="text-base font-bold text-gray-900 tracking-tight truncate mt-0.5">
                    {selectedNode.label}
                  </h3>
                  <div className="text-[11px] font-mono text-gray-400 truncate mt-0.5">
                    {selectedNode.path}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNodeId(null)}
                  className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="text-[10px] text-gray-400 font-mono">Lines of Code</div>
                  <div className="text-base font-bold font-mono text-gray-900 mt-0.5">{selectedNode.loc}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="text-[10px] text-gray-400 font-mono">Complexity (CC)</div>
                  <div className="text-base font-bold font-mono text-gray-900 mt-0.5">{selectedNode.complexity}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="text-[10px] text-gray-400 font-mono">Outgoing Imports</div>
                  <div className="text-base font-bold font-mono text-[#E8532E] mt-0.5">{selectedNode.imports?.length || 0}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="text-[10px] text-gray-400 font-mono">Incoming Dependents</div>
                  <div className="text-base font-bold font-mono text-blue-600 mt-0.5">{selectedNode.importedBy?.length || 0}</div>
                </div>
              </div>

              {/* Functions in this module */}
              {selectedNode.symbols && selectedNode.symbols.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-gray-800 flex items-center justify-between">
                    <span>Exported Functions & Symbols</span>
                    <span className="text-[10px] font-mono text-gray-400">{selectedNode.symbols.length}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-gray-50 border border-gray-100 max-h-28 overflow-y-auto space-y-1">
                    {selectedNode.symbols.map((sym: string) => (
                      <div key={sym} className="flex items-center gap-1.5 text-[11px] font-mono text-gray-700">
                        <Code2 className="w-3 h-3 text-[#E8532E] shrink-0" />
                        <span className="truncate">{sym}()</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Dependencies (What this module imports) */}
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-gray-800 flex items-center justify-between">
                  <span>Dependencies (What this imports)</span>
                  <span className="text-[10px] font-mono text-[#E8532E] font-bold">
                    {selectedNode.imports?.length || 0}
                  </span>
                </div>
                {selectedNode.imports && selectedNode.imports.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
                    {selectedNode.imports.map((imp: string) => (
                      <button
                        key={imp}
                        onClick={() => setSelectedNodeId(imp)}
                        className="px-2 py-1 rounded-md text-[11px] font-mono bg-orange-50 hover:bg-orange-100 text-[#E8532E] border border-orange-200 transition-colors cursor-pointer flex items-center gap-1"
                        title="Click to focus"
                      >
                        <ArrowRight className="w-2.5 h-2.5 text-[#E8532E]" />
                        <span>{imp}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-gray-400 italic">No external module imports.</div>
                )}
              </div>

              {/* Dependents (What imports this module) */}
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-gray-800 flex items-center justify-between">
                  <span>Dependents (Imported by)</span>
                  <span className="text-[10px] font-mono text-blue-600 font-bold">
                    {selectedNode.importedBy?.length || 0}
                  </span>
                </div>
                {selectedNode.importedBy && selectedNode.importedBy.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
                    {selectedNode.importedBy.map((dep: string) => (
                      <button
                        key={dep}
                        onClick={() => setSelectedNodeId(dep)}
                        className="px-2 py-1 rounded-md text-[11px] font-mono bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors cursor-pointer flex items-center gap-1"
                        title="Click to focus"
                      >
                        <ArrowLeft className="w-2.5 h-2.5 text-blue-500" />
                        <span>{dep}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-gray-400 italic">No modules import this directly.</div>
                )}
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="pt-4 border-t border-gray-100 space-y-2">
              <div className="flex items-center gap-2">
                {onNavigateToCodebase && (
                  <button
                    onClick={() => onNavigateToCodebase(selectedNode.path)}
                    className="flex-1 py-2 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Inspect Code</span>
                  </button>
                )}
                {onNavigateToImpact && (
                  <button
                    onClick={() => onNavigateToImpact(selectedNode.label, selectedNode.path)}
                    className="flex-1 py-2 px-3 rounded-lg bg-[#E8532E] hover:bg-[#D4441F] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Impact Analysis</span>
                  </button>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
