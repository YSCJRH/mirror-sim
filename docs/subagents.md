# Mirror Subagents

本文件定义 Mirror 项目的 subagent operating model。  
短规则看根目录 `AGENTS.md`；长期蓝图与协作背景看 `mirror.md` 第 13 节。

## Why Mirror Uses Subagents

Mirror 使用子代理，不是为了把所有任务自动并发化，而是为了：

- 降低主线程上下文污染，让搜证、核验、回归、审查类噪声离开主对话
- 在可边界化任务上提高摸底速度
- 让主代理保留架构判断、契约收口与最终拍板权
- 在不放大风险的前提下复用稳定协作模式

默认目标不是“更多 agent”，而是“更少上下文噪声 + 更清晰证据面”。

## What Subagents Are Not For

本项目不把子代理当成默认万能提效模式，也不把它们用于：

- `mirror.md` 级蓝图、系统定位、核心架构拍板
- 核心 schema、graph / scenario DSL、simulation contract、claim label 体系的并行改写
- 多个 writer 同时改同一核心文件、同一核心 contract、同一公共模块
- 大范围重构中的最终方案选择
- 递归 delegation 链式扩散

这些任务默认由主代理单线程推进，必要时先出计划，再决定是否派一个单写手执行。

## Recommended Operating Model

Mirror 默认采用“总工 + 侦察兵 + 单写手”模式：

1. 主代理定义任务边界、决定是否值得 spawn。
2. 如需子代理，优先派 1-2 个只读 agent 做搜证、核验、复现、审查。
3. 主代理汇总结果并拍板。
4. 只有在方案已收口时，才派 `implementer` 作为唯一 writer 落地最小改动。

推荐 spawn 的前提：任务至少满足以下 3 条中的 2 条。

- 可拆成 2 个以上相对独立的子问题
- 子问题之间主要是信息汇总关系，不是持续共同写作关系
- 可为每个子问题定义清晰输出格式

若不满足，默认不要 spawn。

## Role Catalog

| Role | 默认权限 | 适合做什么 | 不应做什么 |
|---|---|---|---|
| `repo_explorer` | 只读 | 代码路径、目录、入口点、依赖关系、artifact 面梳理 | 不改文件，不提大范围重构 |
| `docs_researcher` | 只读 | 读取 `mirror.md`、`AGENTS.md`、`docs/`、ADR、schema 注释并核验约束 | 不替代架构拍板，不做代码改写 |
| `evaluator` | 只跑验证 | 运行 `smoke` / `test` / `eval-demo`，看 artifacts、失败样例、回归表现 | 不直接修功能，不改 tracked files |
| `safety_reviewer` | 只读 | 审查红线、证据链、措辞越界、禁用场景 | 不把违规需求“聪明改写”为近似违规需求 |
| `implementer` | 可写 | 在主代理完成汇总后做最小修复或实现 | 不递归 delegation，不改核心 contract，不与别的 writer 并行改同一片代码 |

## When To Spawn

Mirror 中最适合 spawn 的任务：

- 仓库摸底与入口点梳理
- 文档、规范、ADR、注释核验
- 测试缺口扫描
- `eval-demo` 或回归失败归因
- UI / bug 复现取证
- 安全红线审查

推荐模式：

- 主代理 + `repo_explorer`
- 主代理 + `docs_researcher`
- 主代理 + `evaluator`
- 主代理 + `safety_reviewer`
- 主代理 + 1-2 个只读 agent，最后再交给 `implementer`

不推荐模式：

- 两个 `implementer` 同时改同一个子系统
- 子代理尚未汇总就直接让 writer 开改
- 因为“看起来可以并行”就默认 fan-out

## When Spawn Is Forbidden Or Discouraged

以下场景默认禁止或强烈不建议 spawn 多 writer：

- 修改 `mirror.md`
- 收口或重命名核心 contract
- 修改 core schema
- 修改 graph / scenario DSL
- 修改 simulation / orchestration contract
- 修改 claim labels、evidence 规则、report contract
- 多个候选方案都可能牵动同一核心文件

这些任务应先由主代理完成单线程判断。若后续需要执行修改，也应交给单个 `implementer`。

## Required Child Output

每个子代理返回必须尽量结构化，至少包含：

```md
## summary
- 这次子任务得到的主要结论

## evidence
- 文件路径 / 符号 / 命令 / artifacts / 文档位置

## risks
- 主要风险、盲区、误判点

## recommended_action
- 建议主代理下一步怎么做

## needs_decision
- 哪些事项必须由主代理拍板
```

约束：

- `evidence` 优先写具体路径、命令、符号名、artifact 路径、文档章节
- 无法确认的信息用 `TODO[verify]: ...`
- 不要只给空泛意见，不要省略 `needs_decision`

## Main-Agent Responsibilities

以下事项必须由主代理负责：

- 是否值得 spawn
- 子任务边界与角色分配
- 架构权衡与 contract 收口
- 是否需要更新 `docs/architecture/contracts.md`
- 是否需要新增 `docs/decisions/` ADR
- 只读结果的最终汇总
- 是否授权 `implementer` 开始写

换句话说，子代理提供证据与局部判断，主代理负责决策。

## Relationship To Skills, Threads, Worktrees, And Evals

### Skills

重复性高、边界稳定的流程，优先沉淀为 skill，而不是反复临时 prompt。

- `evaluator` 对应 `.agents/skills/eval-harness`
- `safety_reviewer` 对应 `.agents/skills/safety-guardrails`
- `implementer` 应按任务面选择一个领域 skill：
  - `corpus-ingest`
  - `graph-build`
  - `persona-cards`
  - `scenario-dsl`
  - `sim-runner`
  - `report-provenance`

一个 writer 任务一次只应围绕一个主 skill 或一个主子系统，不要混成“大而全执行器”。

### Threads And Worktrees

对于更长生命周期、真正需要并行推进的工作，优先使用独立 thread / worktree，而不是增加 subagent 深度。

- docs 与代码并行，可拆不同 thread 或 worktree
- frontend 与 backend 并行，可拆不同 thread 或 worktree
- eval 修复与功能开发并行，可拆不同 thread 或 worktree

只有在子任务明显是“短搜证 / 短核验 / 短复现”时，才优先用 subagent。

### Eval System

如果子代理参与验证，应尽量复用现有命令：

- `./make.ps1 smoke`
- `./make.ps1 test`
- `./make.ps1 eval-demo`

`evaluator` 的职责是报告验证事实、失败样例与 artifact 位置，不是直接改实现。

## Conflict-Avoidance Rules

为了避免多 agent 同时改同一核心文件：

- spawn 前先定义文件面或证据面
- 同一核心文件、同一 contract、同一公共模块默认只允许一个 writer
- 多个只读 agent 可以看同一文件，但最终修改权只给一个 `implementer`
- 若侦察结果显示多个方案都要碰核心 contract，立即回到主代理单线程决策

## Recursive Delegation Guardrails

Mirror 的项目级配置默认保守：

- `max_depth = 1`
- `max_threads = 4`
- 较短的 worker runtime budget

含义：

- 允许主代理派直接子代理
- 不鼓励子代理继续派子代理
- 不把广泛 delegation 当成默认优化策略

如果未来需要更深 delegation，应先证明有明确收益，再调整配置并补文档。

## Common Failure Modes

常见失败模式：

- 多个 writer 并行改同一核心面，最后互相覆盖
- 只读 agent 输出太散，主代理难汇总
- 子代理开始替主代理做架构拍板
- `evaluator` 越界成修复 agent
- 安全审查只给结论，不给依据
- 为了并行而并行，实际增加 token、等待时间和冲突成本

规避方式：

- 先判断是否满足“2 / 3 spawn 条件”
- 子代理统一返回结构
- 主代理显式写清边界、输入、输出和 out-of-scope
- writer 总是后置，且尽量只有一个
- 反复出现的稳定流程改成 skill

## Parent Brief Template

主代理给子代理的 brief 建议至少包含：

```md
目标：
- 本次只解决什么

范围：
- 允许看的目录 / 文件 / artifacts
- 明确不做什么

输出格式：
- `summary`
- `evidence`
- `risks`
- `recommended_action`
- `needs_decision`

特别约束：
- 是否只读
- 是否允许跑命令
- 是否必须引用具体路径或命令
- 是否涉及核心 contract，若涉及则只报风险不拍板
```

## Quick Advice For Future Codex Threads

- 默认先单线程思考，不要一上来就 fan-out。
- 想 spawn 时，先问自己：这是不是搜证 / 核验 / 复现 / 审查类任务。
- 只要任务开始碰核心 contract，就把决定权收回主代理。
- 需要写代码时，尽量只让一个 `implementer` 出手。
- 能沉淀成 skill 的流程，优先沉淀成 skill。
- 如果并行需求是长期的，优先开 thread / worktree，不要堆深层 subagent 树。

## TODO[verify]

- `TODO[verify]:` 若未来 frontend 调试和浏览器取证成为高频需求，可新增专门的 `browser_debugger` 角色，而不是让 `implementer` 兼任。
