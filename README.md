# Mirror Engine

Mirror Engine 是一个面向虚构或明确授权知识环境的、带证据约束的条件化推演沙盘。它用于回答 “如果某个扰动发生，关键角色、信息流和结局会怎样变化”，而不是声称能预测真实未来。

## Phase 0 Status

当前仓库已搭起 Phase 0 地基：

- 项目治理文档与 Codex 执行规则
- demo 世界 “雾港东闸危机”
- 核心 domain models 与 schema 假设
- 最小 CLI pipeline：ingest、graph、personas、scenario、simulate、report、eval
- smoke / test / eval-demo 命令入口

## Quick Start

PowerShell:

```powershell
./make.ps1 smoke
./make.ps1 test
./make.ps1 eval-demo
```

Unix-like shells with `make` installed:

```bash
make smoke
make test
make eval-demo
```

Direct CLI examples:

```bash
python -m backend.app.cli ingest data/demo/corpus/manifest.yaml --out artifacts/demo/ingest
python -m backend.app.cli build-graph artifacts/demo/ingest/chunks.jsonl --out artifacts/demo/graph
python -m backend.app.cli personas artifacts/demo/graph/graph.json --out artifacts/demo/personas
python -m backend.app.cli validate-scenario data/demo/scenarios/reporter_detained.yaml --out artifacts/demo/scenario/reporter_detained.json
python -m backend.app.cli simulate data/demo/scenarios/reporter_detained.yaml --graph artifacts/demo/graph/graph.json --personas artifacts/demo/personas/personas.json --out artifacts/demo/run/reporter_detained
python -m backend.app.cli report artifacts/demo/run/reporter_detained --baseline artifacts/demo/run/baseline --out artifacts/demo/report
```

## Repo Map

- [mirror.md](/D:/mirror/mirror.md): 顶层蓝图 / harness
- [AGENTS.md](/D:/mirror/AGENTS.md): Codex 执行规则
- [docs/plans/phase-0-foundation.md](/D:/mirror/docs/plans/phase-0-foundation.md): 当前 Phase 0 实施说明
- [docs/architecture/contracts.md](/D:/mirror/docs/architecture/contracts.md): 核心契约与假设
- [data/demo](/D:/mirror/data/demo): demo world、scenarios、expectations
- [backend](/D:/mirror/backend): FastAPI app、CLI、domain models、pipeline
- [evals/assertions](/D:/mirror/evals/assertions): 自动化断言
- [frontend](/D:/mirror/frontend): 延后实现的 workbench shell 占位

## Architecture Shape

Phase 0 只实现最短闭环：

```text
Corpus
  -> Ingest / Chunk
  -> Graph Build
  -> Persona Cards
  -> Scenario Validation
  -> Baseline Run
  -> Injected Run
  -> Diff Report + Claims
  -> Eval Summary
```

设计原则：

- 主干确定性，LLM 在边缘
- 先单机文件流，再考虑复杂 infra
- report 必须带 claim labels 和 `evidence_ids`
- safety 与 eval 不是附录，而是主流程

## Known Assumptions

- `RunTrace` 被实现为 run 级摘要模型；`TurnAction` 是 `run_trace.jsonl` 中的逐行动记录。
- `reporter_detained` 是场景 ID，不是 injection kind；其注入类型实现为 `delay_document`。
- 保留 `Makefile` 作为规范接口，同时提供 `make.ps1` / `make.cmd` 兼容当前 Windows 环境。

## Non-goals For This Repo

- 开放世界 ingest
- 真实人物或真实社会建模
- 自由 agent swarm
- 重型图数据库
- fancy UI 先行
- 外部 LLM 深绑定

## License

This repository is licensed under `MIT`.  
The public remote currently needs to be brought into alignment on the next push.
