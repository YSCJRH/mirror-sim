# Mirror Engine

<p align="center">
  <img src="mirror.png" alt="Mirror concept illustration" width="100%" />
</p>

**A constrained multi-agent scenario simulation engine inspired by Liu Cixin's _The Mirror_.**

**基于刘慈欣《镜子》启发设计的受约束多智能体情景模拟引擎。**

---

## Introduction | 简介

Mirror Engine aims to build a controlled, evidence-backed virtual environment for multi-agent simulation and scenario exploration. It combines graph-based world modeling, scenario injection, deterministic runs, and a browser review workbench so researchers and developers can inspect how disturbances propagate through actors, information flows, and outcomes.

Mirror Engine 项目旨在构建一个可控、可追踪、可验证的多智能体情景推演环境。项目融合知识图谱、情景注入、确定性模拟、报告生成与浏览器审查工作台，用于帮助研究者和开发者观察扰动如何沿着角色、信息流和结果路径传播。

The repository is designed for fictional or explicitly authorized knowledge environments. It is not presented as an open-world prediction machine, but as a constrained sandbox for interpretable scenario analysis.

本仓库面向虚构或经明确授权的知识环境，不将自己包装成现实世界预测机器，而是一个用于可解释情景分析的受约束模拟沙盒。

---

## Features | 功能特性

- **Deterministic simulation backbone | 确定性模拟主干**: Build a repeatable flow from corpus ingestion to graph, personas, validated scenarios, simulation runs, reports, and evals.
- **Graph-based world modeling | 图谱化世界建模**: Organize entities, relationships, and constraints into a queryable world model for scenario execution.
- **Scenario injection and control | 情景注入与控制**: Define disturbances explicitly and compare baseline versus injected runs in a traceable way.
- **Review workbench | 审查工作台**: Inspect claims, evidence, traces, reviewer views, and release-closeout surfaces in the browser workbench.
- **Explainability and verifiability | 可解释与可验证**: Keep reports grounded in labeled claims and `evidence_ids` so outputs remain auditable.
- **GitHub-native governance | GitHub 原生治理**: Use phase audits, queue audits, lane classification, and protected `main` workflows to support long-running execution safely.

---

## Getting Started | 快速开始

### Prerequisites | 环境要求

- Python 3.11+
- Node.js 18+
- `make` for Unix-like shells, or PowerShell on Windows

### Installation | 安装

Clone the repository:

```bash
git clone https://github.com/YSCJRH/mirror-sim.git
cd mirror-sim
```

Install the backend package:

Unix-like shells:

```bash
make setup
```

PowerShell:

```powershell
./make.ps1 setup
```

### Running the Application | 启动应用

Start the backend API:

```bash
make dev-api
```

```powershell
./make.ps1 dev-api
```

Launch the frontend workbench:

```bash
make dev-web
```

```powershell
./make.ps1 dev-web
```

Validate the local baseline:

```bash
make smoke
make test
make eval-demo
```

```powershell
./make.ps1 smoke
./make.ps1 test
./make.ps1 eval-demo
```

---

## Project Structure | 项目结构

```text
mirror-sim
├── .github/         # GitHub workflows, templates, and automation governance
├── backend/         # FastAPI app, CLI, automation helpers, and pipeline code
├── frontend/        # Next.js review workbench
├── data/            # Demo corpus, scenarios, and world-model inputs
├── docs/            # Plans, decisions, architecture notes, and release docs
├── evals/           # Assertions and evaluation assets
└── scripts/         # Bootstrap and utility scripts
```

---

## Current Status | 当前状态

- **Formal release `v0.1.0` | 正式版本 `v0.1.0`**: The first formal GitHub Release remains published and anchors the current repository baseline.
- **Queue state | 当前队列状态**: Phase 46, `Workbench Focus and Modularity`, is formally closed. No approved Phase 47 milestone exists, so the GitHub queue is intentionally `paused` with no open milestone.
- **Recent closeout | 最近收口**: Phase 46 is formally closed after modularizing the review scorecard, centering the default path on compare/evidence/eval, and moving packet-heavy surfaces behind advanced navigation.
- **Planned next route | 已定后续主线**: No Phase 47 milestone is approved or open in this round; any successor beyond Phase 46 requires a fresh decision against the `mirror.md` trigger conditions.
- **Repo truth lives in docs | 仓库真相以文档为准**: See [mirror.md](mirror.md) for the project blueprint, [docs/plans/current-state-baseline.md](docs/plans/current-state-baseline.md) for the current stop-state baseline, and [docs/releases/v0.1.0.md](docs/releases/v0.1.0.md) for the canonical release notes.

---

## Contribution | 贡献方式

We welcome contributions and feedback. To participate:

1. Fork this repository.
2. Create a branch for your change.
3. Commit with a focused message.
4. Push the branch to your fork or remote.
5. Open a Pull Request against `main`.

提交前请先阅读 [AGENTS.md](AGENTS.md)，了解当前仓库的执行规则、文档约束和协作方式。

Pull requests will run the repository's existing checks and protection rules. This README refresh does not change the underlying governance flow.

---

## License | 许可证

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

本项目采用 MIT License，详情请见 [LICENSE](LICENSE)。
