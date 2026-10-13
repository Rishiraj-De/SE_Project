export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface SymbolDefinition {
  type: "class" | "function" | "interface" | "variable";
  name: string;
  line: number;
}

export interface ModuleInfo {
  id: string;
  name: string;
  path: string;
  language: string;
  loc: number;
  complexity: number;
  symbols: SymbolDefinition[];
  raw_imports: string[];
}

export interface CircularDependency {
  modules: string[];
  chain: string;
  severity: Severity;
}

export interface DependencyItem {
  module: string;
  path: string;
  dependsOn: number;
  dependents: number;
  risk: Severity;
}

export interface GitCommit {
  hash: string;
  author: string;
  date: string;
  message: string;
}

export interface MostChangedFile {
  file: string;
  changes: number;
}

export interface TechnicalDebtItem {
  severity: Severity;
  component: string;
  file: string;
  issue: string;
  category: "Complexity" | "Circular Dependency" | "Dead Code" | "High Coupling" | "Missing Tests" | "Security / Deprecated API";
  recommendation: string;
}

export interface RiskPoint {
  id: string;
  name: string;
  path: string;
  complexity: number;
  changeFrequency: number;
  riskLevel: Severity;
  riskScore: number;
  dependencies: number;
  dependents: number;
}

export interface AnalysisSummary {
  filesCount: number;
  totalLoc: number;
  functionsCount: number;
  classesCount: number;
  contributorsCount: number;
  commitsCount: number;
  healthScore: number;
  healthBreakdown: {
    architecture: number;
    maintainability: number;
    testCoverage: number;
    documentation: number;
    dependencyHealth: number;
  };
}

export interface AnalysisResult {
  id: string;
  repoUrl: string;
  repoName: string;
  repoDir: string;
  branch: string;
  status: "idle" | "running" | "completed" | "failed";
  analyzedAt: string;
  currentStep?: string;
  completedSteps: string[];
  summary: AnalysisSummary;
  languages: Record<string, number>;
  files: Array<{
    path: string;
    name: string;
    loc: number;
    complexity: number;
    language: string;
    symbolsCount: number;
  }>;
  modules: ModuleInfo[];
  dependencies: DependencyItem[];
  circularDependencies: CircularDependency[];
  commits: GitCommit[];
  mostChangedFiles: MostChangedFile[];
  technicalDebt: TechnicalDebtItem[];
  riskPoints: RiskPoint[];
}

export interface BlastRadiusResult {
  targetSymbol: string;
  targetFile: string;
  affectedModules: string[];
  affectedFunctions: string[];
  databaseOperations: number;
  externalApis: number;
  riskRating: Severity;
  confidence: "High (Static Call Graph)" | "Medium (Heuristic Traced)" | "Requires Verification";
  callHierarchy: {
    name: string;
    type: "root" | "caller" | "dependency" | "side_effect";
    file: string;
    line?: number;
    children?: any[];
  };
  reasoning: string[];
}

export interface AICitation {
  file: string;
  line?: number;
  snippet?: string;
  commitHash?: string;
  commitMessage?: string;
}

export interface AIResponse {
  answer: string;
  citations: AICitation[];
  suggestedFollowUps: string[];
}
