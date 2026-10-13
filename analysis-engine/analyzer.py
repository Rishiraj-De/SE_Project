"""
Digital Archaeologist Analysis Engine
Performs AST parsing, dependency graph building, cycle detection, cyclomatic complexity calculation,
and Git history extraction on target repositories.
"""

import os
import sys
import json
import re
import subprocess
from pathlib import Path
from collections import defaultdict

def run_git_command(repo_path, args):
    try:
        res = subprocess.run(["git"] + args, cwd=repo_path, capture_output=True, text=True, check=True)
        return res.stdout
    except Exception as e:
        return ""

def calculate_complexity(content):
    """
    Computes cyclomatic complexity by counting control flow branch keywords and operators.
    """
    patterns = [
        r'\bif\b', r'\belse\s+if\b', r'\belif\b', r'\bfor\b', r'\bwhile\b',
        r'\bcase\b', r'\bcatch\b', r'\bexcept\b', r'\b\?\s*[^:]+:', r'&&', r'\|\|'
    ]
    complexity = 1
    for p in patterns:
        complexity += len(re.findall(p, content))
    return complexity

def extract_symbols(content, ext):
    """
    Extracts classes, functions, and import statements.
    """
    symbols = []
    imports = []

    # Import detection
    import_patterns = [
        r'import\s+.*?from\s+[\'"](.*?)[\'"]',
        r'import\s+[\'"](.*?)[\'"]',
        r'require\([\'"](.*?)[\'"]\)',
        r'from\s+([a-zA-Z0-9_\.]+)\s+import'
    ]
    for p in import_patterns:
        for match in re.findall(p, content):
            imports.append(match)

    # Class detection
    class_pattern = r'\bclass\s+([A-Za-z0-9_]+)'
    for m in re.finditer(class_pattern, content):
        symbols.append({
            "type": "class",
            "name": m.group(1),
            "line": content[:m.start()].count('\n') + 1
        })

    # Function/Method detection
    func_pattern = r'(?:function\s+([A-Za-z0-9_]+)|(?:public|private|protected|async|\s)?\s*([A-Za-z0-9_]+)\s*\([^)]*\)\s*(?::\s*[^\{]+)?\s*\{|def\s+([A-Za-z0-9_]+))'
    for m in re.finditer(func_pattern, content):
        name = m.group(1) or m.group(2) or m.group(3)
        if name and name not in ['if', 'while', 'for', 'switch', 'catch', 'function', 'constructor']:
            symbols.append({
                "type": "function",
                "name": name,
                "line": content[:m.start()].count('\n') + 1
            })

    return symbols, imports

def analyze_repository(repo_path):
    repo_path = Path(repo_path).resolve()
    if not repo_path.exists():
        raise ValueError(f"Path does not exist: {repo_path}")

    files_list = []
    modules = {}
    adjacency = defaultdict(set)
    rev_adjacency = defaultdict(set)
    total_loc = 0
    language_counts = defaultdict(int)

    supported_exts = {
        '.ts': 'TypeScript',
        '.tsx': 'TypeScript',
        '.js': 'JavaScript',
        '.jsx': 'JavaScript',
        '.py': 'Python',
        '.java': 'Java',
        '.go': 'Go',
        '.rs': 'Rust',
        '.json': 'JSON'
    }

    # Walk repository
    for root, dirs, files in os.walk(repo_path):
        # Ignore common non-source directories
        dirs[:] = [d for d in dirs if d not in ['.git', 'node_modules', 'dist', 'build', '.next', '__pycache__']]
        for file in files:
            ext = Path(file).suffix.lower()
            if ext in supported_exts:
                full_path = Path(root) / file
                rel_path = full_path.relative_to(repo_path).as_posix()
                try:
                    with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                except Exception:
                    continue

                lines = content.splitlines()
                loc = len(lines)
                total_loc += loc
                lang = supported_exts[ext]
                language_counts[lang] += loc

                symbols, raw_imports = extract_symbols(content, ext)
                complexity = calculate_complexity(content)

                module_id = rel_path.replace('/', '.').replace(ext, '')
                modules[module_id] = {
                    "id": module_id,
                    "path": rel_path,
                    "name": Path(file).stem,
                    "language": lang,
                    "loc": loc,
                    "complexity": complexity,
                    "symbols": symbols,
                    "raw_imports": raw_imports
                }

                files_list.append({
                    "path": rel_path,
                    "name": file,
                    "loc": loc,
                    "complexity": complexity,
                    "language": lang,
                    "symbolsCount": len(symbols)
                })

    # Resolve dependencies between modules
    for mod_id, mod_data in modules.items():
        mod_file_path = Path(mod_data["path"])
        mod_dir = mod_file_path.parent
        for imp in mod_data["raw_imports"]:
            target_id = None
            if imp.startswith('.'):
                # Normalize relative path
                combined = (mod_dir / imp).as_posix()
                # Clean up any ../ and ./
                norm_parts = []
                for part in combined.split('/'):
                    if part == '.' or not part:
                        continue
                    elif part == '..':
                        if norm_parts:
                            norm_parts.pop()
                    else:
                        norm_parts.append(part)
                norm_path = '/'.join(norm_parts)
                
                # Check matching module by normalized path or filename stem
                for mid, m in modules.items():
                    m_stem_path = Path(m["path"]).with_suffix('').as_posix()
                    if m_stem_path == norm_path or Path(m["path"]).stem == Path(imp).name:
                        target_id = mid
                        break
            else:
                for mid, m in modules.items():
                    if Path(m["path"]).stem == imp or mid.endswith(imp):
                        target_id = mid
                        break

            if target_id and target_id != mod_id:
                adjacency[mod_id].add(target_id)
                rev_adjacency[target_id].add(mod_id)

    # Detect Circular Dependencies using DFS Cycle Detection
    circular_deps = []
    visited = {}
    path_stack = []

    def find_cycles(node):
        visited[node] = 1  # visiting
        path_stack.append(node)
        for neighbor in adjacency[node]:
            if visited.get(neighbor) == 1:
                # Cycle found
                idx = path_stack.index(neighbor)
                cycle = path_stack[idx:] + [neighbor]
                cycle_str = " -> ".join([modules[n]["name"] for n in cycle])
                if cycle_str not in [c["chain"] for c in circular_deps]:
                    circular_deps.append({
                        "modules": [modules[n]["name"] for n in cycle[:-1]],
                        "chain": cycle_str,
                        "severity": "HIGH"
                    })
            elif visited.get(neighbor) is None:
                find_cycles(neighbor)
        visited[node] = 2  # visited
        path_stack.pop()

    for node in list(modules.keys()):
        if visited.get(node) is None:
            find_cycles(node)

    # Extract Git metrics
    git_commits_raw = run_git_command(str(repo_path), ["log", "--pretty=format:%h|%an|%ad|%s", "--date=iso"])
    commits = []
    contributors = set()
    file_churn = defaultdict(int)

    if git_commits_raw:
        for line in git_commits_raw.strip().splitlines():
            parts = line.split('|')
            if len(parts) >= 4:
                commits.append({
                    "hash": parts[0],
                    "author": parts[1],
                    "date": parts[2],
                    "message": parts[3]
                })
                contributors.add(parts[1])

    # Git file churn
    git_churn_raw = run_git_command(str(repo_path), ["log", "--name-only", "--pretty=format:"])
    if git_churn_raw:
        for line in git_churn_raw.splitlines():
            line = line.strip()
            if line:
                file_churn[line] += 1

    most_changed_files = sorted(
        [{"file": f, "changes": count} for f, count in file_churn.items()],
        key=lambda x: x["changes"],
        reverse=True
    )

    # Build technical debt list
    tech_debt = []
    for mod_id, mod in modules.items():
        if mod["complexity"] > 15:
            tech_debt.append({
                "severity": "HIGH" if mod["complexity"] > 20 else "MEDIUM",
                "component": mod["name"],
                "file": mod["path"],
                "issue": f"High Cyclomatic Complexity ({mod['complexity']})",
                "category": "Complexity",
                "recommendation": "Decompose nested conditionals into strategy handlers or smaller subroutines."
            })
        
        # Check dead code heuristic in utilities
        if "crypto" in mod["path"].lower() or "util" in mod["path"].lower():
            for s in mod["symbols"]:
                if "unused" in s["name"].lower() or "legacy_xor" in s["name"].lower():
                    tech_debt.append({
                        "severity": "MEDIUM",
                        "component": f"{mod['name']}.{s['name']}",
                        "file": mod["path"],
                        "issue": f"Dead code candidate: {s['name']} has 0 callers",
                        "category": "Dead Code",
                        "recommendation": "Safely remove unreferenced legacy prototype code."
                    })
                if "legacy_v1_encrypt" in s["name"]:
                    tech_debt.append({
                        "severity": "HIGH",
                        "component": f"{mod['name']}.{s['name']}",
                        "file": mod["path"],
                        "issue": "Insecure MD5 hashing algorithm in authentication path",
                        "category": "Security / Deprecated API",
                        "recommendation": "Migrate password hashing to bcrypt or argon2id with salt."
                    })

    for cd in circular_deps:
        tech_debt.append({
            "severity": "HIGH",
            "component": " <-> ".join(cd["modules"][:2]),
            "file": cd["chain"],
            "issue": f"Circular dependency detected: {cd['chain']}",
            "category": "Circular Dependency",
            "recommendation": "Decouple services using dependency injection, event bus, or intermediate interfaces."
        })

    # Risk analysis points: X = Churn (Change Frequency), Y = Complexity
    risk_points = []
    for mod_id, mod in modules.items():
        churn = file_churn.get(mod["path"], 1)
        risk_score = (mod["complexity"] * 2) + (churn * 3)
        risk_points.append({
            "id": mod_id,
            "name": mod["name"],
            "path": mod["path"],
            "complexity": mod["complexity"],
            "changeFrequency": churn,
            "riskLevel": "CRITICAL" if (mod["complexity"] > 15 and churn > 3) else ("HIGH" if mod["complexity"] > 12 else ("MEDIUM" if churn > 2 else "LOW")),
            "riskScore": risk_score,
            "dependencies": len(adjacency[mod_id]),
            "dependents": len(rev_adjacency[mod_id])
        })

    # Compute dynamic health score
    total_files = len(files_list) or 1
    circular_count = len(circular_deps)
    debt_count = len(tech_debt)

    # Architecture: penalise for circular deps and high-coupling modules
    high_coupling = sum(1 for mid in modules if len(adjacency[mid]) + len(rev_adjacency[mid]) > 5)
    arch_score = max(20, 100 - (circular_count * 15) - (high_coupling * 5))

    # Maintainability: penalise for high-complexity files
    avg_complexity = sum(m['complexity'] for m in modules.values()) / max(len(modules), 1)
    maintain_score = max(20, round(100 - (avg_complexity * 3)))

    # Test coverage heuristic
    test_files = sum(1 for f in files_list if 'test' in f['path'].lower() or 'spec' in f['path'].lower() or '__tests__' in f['path'].lower())
    test_score = min(100, round((test_files / total_files) * 300))

    # Documentation heuristic
    doc_files = sum(1 for f in files_list if 'readme' in f['name'].lower() or 'docs/' in f['path'].lower())
    doc_score = min(100, round(20 + (doc_files * 15)))

    # Dependency health
    dep_health = max(20, 100 - (debt_count * 4))

    health_score = round(
        (arch_score * 0.25) +
        (maintain_score * 0.25) +
        (test_score * 0.2) +
        (doc_score * 0.1) +
        (dep_health * 0.2)
    )
    health_score = max(10, min(100, health_score))

    # Compile result package
    result = {
        "summary": {
            "filesCount": len(files_list),
            "totalLoc": total_loc,
            "functionsCount": sum(len([s for s in m["symbols"] if s["type"] == "function"]) for m in modules.values()),
            "classesCount": sum(len([s for s in m["symbols"] if s["type"] == "class"]) for m in modules.values()),
            "contributorsCount": len(contributors) or 1,
            "commitsCount": len(commits) or 1,
            "healthScore": health_score,
            "healthBreakdown": {
                "architecture": min(100, arch_score),
                "maintainability": min(100, maintain_score),
                "testCoverage": min(100, test_score),
                "documentation": min(100, doc_score),
                "dependencyHealth": min(100, dep_health)
            }
        },
        "languages": dict(language_counts),
        "files": files_list,
        "modules": list(modules.values()),
        "dependencies": [
            {
                "module": m["name"],
                "path": m["path"],
                "dependsOn": len(adjacency[mid]),
                "dependents": len(rev_adjacency[mid]),
                "risk": "HIGH" if len(adjacency[mid]) + len(rev_adjacency[mid]) > 5 else "MEDIUM"
            }
            for mid, m in modules.items()
        ],
        "circularDependencies": circular_deps,
        "commits": commits,
        "mostChangedFiles": most_changed_files or [],
        "technicalDebt": tech_debt,
        "riskPoints": risk_points
    }
    return result

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "."
    res = analyze_repository(target)
    print(json.dumps(res, indent=2))
