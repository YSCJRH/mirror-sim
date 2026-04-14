# mirror.md — Mirror 项目总蓝图 / Harness

> 状态：Active  
> 最后更新：2026-04-14  
> 适用对象：仓库维护者、Codex app 线程、评审者、未来协作者  
> 角色定位：**本文件是整个 Mirror 项目的顶层蓝图与长期参考**。它高于 README 的“对外介绍”、高于 AGENTS.md 的“短执行规则”、高于 skills 的“局部工作流”、也高于 backlog 的“阶段性任务清单”。

---

## 0. 本文件怎么用

### 0.1 文档分层

本项目文档必须长期维持下面这套层次，不要互相混写：

- **`mirror.md`**  
  项目总蓝图。定义：项目是什么、不是什么、为什么这样做、系统边界、阶段路线、核心契约、风险红线、协作方式、评估逻辑。  
  它是**全局参照系**，不负责写得很短，但必须稳定。

- **`README.md`**  
  面向初次进入仓库的人。说明项目简介、如何运行 demo、仓库结构、快速开始。  
  它要比 `mirror.md` 更短、更外向。

- **`AGENTS.md`**  
  面向 Codex 的**短执行规则**。必须简洁、可执行、少背景、多规则。  
  它应当显式指向 `mirror.md`，但不重复整份蓝图。

- **`.agents/skills/*/SKILL.md`**  
  面向 Codex 的局部可复用工作流。每个 skill 只负责一类任务，写清触发条件、输入、输出、边界、常见错误。

- **`docs/plans/` / `docs/decisions/`**  
  面向变更与决策。  
  - `plans/`：一次具体任务的实施计划  
  - `decisions/`：影响系统结构的 ADR / 决策记录

- **`backlog/` 或 sprint 文档**  
  面向当前阶段的任务列表。它是短期执行物，不是长期真理。

### 0.2 冲突时以谁为准

从项目治理角度，优先级按下面顺序理解：

1. 法律 / 安全 / 平台政策 / 数据授权约束
2. `mirror.md`
3. 根目录 `AGENTS.md`
4. 子目录 `AGENTS.md`
5. 对应 `SKILL.md`
6. 当前 backlog / sprint 文档
7. 单次线程里的临时计划

> 注意：Codex 实际自动读取的是 `AGENTS.md` 链，而不是 `mirror.md`。  
> 因此根目录 `AGENTS.md` 必须包含一句明确指引：  
> **“本项目的长期蓝图、边界与架构意图见仓库根目录 `mirror.md`；如无明确例外，执行时应与 `mirror.md` 保持一致。”**

### 0.3 本文件的职责

本文件负责回答这些问题：

- Mirror 项目到底是什么？
- 第一阶段为什么不是“预测现实社会”？
- 允许做什么，不允许做什么？
- 默认架构是什么，哪些地方先 mock，哪些必须先真实现？
- Codex 应该如何分线程、如何交接、如何测试、如何回归？
- 什么算“完成”，什么算“只是会跑”？
- 哪些是长期稳定契约，改动时必须留痕？

---

## 1. 一句话定义项目

**Mirror 是一个面向虚构或明确授权知识环境的、带证据约束的条件化推演沙盘：它用于做“如果……会怎样”的多分支模拟、解释和比较，而不是声称能确定未来的预测机器。**

---

## 2. 项目定位：它是什么 / 不是什么

### 2.1 它是什么

Mirror 的现实版定位必须是：

- 条件化推演（conditional simulation）
- 假设生成（hypothesis generation）
- 风险预演（risk rehearsal）
- 分支比较（branch comparison）
- 证据约束的世界建模（evidence-backed world modeling）
- 可回放、可审计、可解释的 scenario sandbox

### 2.2 它不是什么

Mirror **不是**：

- 真实世界“全知镜像”
- 能可靠预测真实社会未来的系统
- 真实个体画像引擎
- 政治影响 / 舆论操控工具
- 执法 / 招聘 / 信贷 / 风险打分系统
- 监控平台
- “只要 agent 足够多就会产生真相”的机器

### 2.3 成功标准（项目级）

这个项目的成功，不以“预测准了没有”作为第一标准，而以以下问题是否成立为准：

1. 它能否在**受限世界**里稳定构建状态、角色、关系和证据链？
2. 它能否把一个明确的场景注入（intervention）变成多个**可比较的推演分支**？
3. 它能否给出**带引用、带不确定性标记**的报告？
4. 它能否被 Codex 以小任务、低耦合、可评估方式持续迭代？
5. 它是否从一开始就把安全、许可、数据边界写进系统，而不是事后补救？

---

## 3. 北极星与第一性原则

### 3.1 北极星

> 用最小足够复杂的封闭世界，做最强可解释的 what-if 推演。

### 3.2 八条硬原则

1. **先做受限域，不做开放世界**  
   先做原创、虚构、授权明确的语料宇宙，不碰真实社会全域。

2. **先做可回放，再做更像人**  
   可重跑、可对比、可 trace，比“角色很会说话”更重要。

3. **先做确定性骨架，再把 LLM 放到边缘**  
   结构化流程优先；LLM 先用于抽取、总结、persona 文本化，不先承担“系统核心控制器”。

4. **先做证据，再做叙事**  
   报告如果没有 evidence_ids，就不算报告。

5. **不输出“确定未来”，只输出“在该条件下的可能演化”**  
   所有结果默认是场景条件下的模拟，不是现实宣判。

6. **从第一天就有 eval loop**  
   没有评估的多智能体，通常只是昂贵的角色扮演。

7. **安全与许可不是附录，是主流程**  
   数据授权、场景边界、AGPL 风险、真实人物限制，都属于主流程 gate。

8. **让 Codex 更容易做对，而不是更容易发散**  
   小任务、清晰契约、短反馈、强回归、短 AGENTS、明确 skills。

---

## 4. 风险红线与允许边界

### 4.1 明确禁止的方向

下面这些方向在本项目中默认禁止，除非未来另立仓库、另做治理、另有明确法律与伦理审查：

| 禁止方向 | 为什么禁止 | 低风险替代 |
|---|---|---|
| 真实个体画像 / 数字替身构建 | 隐私、诽谤、滥用风险极高 | 虚构角色、合成角色、授权角色 |
| 政治影响 / 选民说服 / 公共舆论操控 | 容易滑向操控与误导 | 小说阵营冲突推演、虚构议题演化 |
| 执法预测 / 嫌疑评分 / 社会信用 | 高风险、低可解释、强伤害 | 虚构组织中的流程风险推演 |
| 招聘 / 信贷 / 医疗 / 司法个体决策预测 | 高风险决策自动化 | 纯研究型、匿名化、离线方法对比 |
| 隐蔽监控数据摄取 | 不透明、易越线 | 明确授权的文档集 / 合成语料 |
| 把模拟结果包装成“真实预测结论” | 误导用户与观察者 | 报告统一表述为 “在该场景条件下” |

### 4.2 允许的数据源

Phase 1 / MVP 默认只允许以下数据：

- 原创虚构文本
- 公版文本
- 明确授权、范围清晰的内部文本
- 项目内手工编写的合成知识环境
- 可公开展示、不涉及隐私的 demo 数据

### 4.3 默认不允许的数据源

- 未授权的企业内部资料
- 真实人物的社交媒体抓取
- 含敏感个人信息的文档
- 有明显版权与再分发风险的整本现代作品全文
- 政策操控、执法评估、风险打分相关数据

---

## 5. 第一阶段选定的 MVP

## 5.1 最终选择

**MVP 选择：原创 / 虚构叙事世界的多分支结局推演沙盘**

### 5.2 为什么选它

这是当前最适合个人开发者 + Codex 协作 + 可公开演示的起点，因为它同时满足：

- **低风险**：不依赖真实人物与真实社会
- **强演示性**：一个 baseline + 一个 intervention，就能产生明显差异
- **数据可得**：今天就能写出 demo corpus
- **Codex 友好**：各模块都可以切成小任务
- **架构价值高**：世界建模、图谱、persona、scenario、simulation、report、eval 全都能练到

### 5.3 为什么不是另外两条路

#### A. 不是先做“真实企业知识环境决策沙盘”
因为它虽然很有产品化前景，但一上来就会遇到：
- 权限与保密
- 真实业务规则不清
- ground truth 难定义
- “是否有价值”必须依赖更多人工评审与上下文

#### B. 不是先做“公共议题 / 舆情演化推演”
因为它太容易滑向：
- 政治与公共舆论操控
- 对真实群体行为的过度宣称
- 缺乏稳定 ground truth
- 伦理风险远高于第一阶段的学习收益

### 5.4 第一阶段 demo 的标准题型

Mirror Phase 1 只需要回答一类问题：

> 在一个封闭、可证据化的虚构世界里，若某个事件 / 资源 / 信息流被注入扰动，关键角色的行为链和最终局面会怎样变化？

---

## 6. 默认 demo 世界（规范示例）

### 6.1 canonical demo：雾港东闸危机

这是仓库默认 demo，不要求永远不变，但它是第一条端到端链路的参考模板。

**核心角色**
- 林岚：档案管理员，掌握维修账本复印件
- 赵克：代理市长，不愿取消海灯节
- 苏禾：水务工程师，发现东闸裂缝
- 陈屿：拖船船长，观察到潮位异常

**关键冲突**
- 东闸裂缝需要紧急处理
- 维修资金被挪去节庆工程
- 风暴即将来袭
- 决策层不愿打断节庆
- 信息披露受到阻碍

### 6.2 baseline 问题

- 谁最先获得足够信息判断风险？
- 疏散是否被触发？
- 维修款问题是否在关键决策前被曝光？
- 哪条行动链最影响最终结局？

### 6.3 intervention 例子

- `reporter_detained`: 记者被短暂阻断，账本传播延迟
- `resource_failure`: 通讯节点故障
- `delay_document`: 检修报告晚到 3 回合
- `block_contact`: 某角色在关键时间内不能联络某人

### 6.4 第一阶段成功判定

如果系统能对 `baseline` + 1 个 intervention 场景稳定产出：
- graph
- persona cards
- scenario validation
- deterministic run trace
- report + claims
- eval summary

就算 MVP 跑通。

---

## 7. 《镜子》设想到现实工程的模块映射

本项目从科幻中借的是“能力清单”，不是“能力强度”。

| 科幻启发 | 工程模块 | Phase 1 要做什么 | 暂不做什么 |
|---|---|---|---|
| 世界如镜映射 | 世界 / 环境建模 | 从小语料构建有限世界状态 | 开放世界实时镜像 |
| 人与群体可被模拟 | 角色与群体建模 | 用证据支撑 persona card | 真实人物高保真复刻 |
| 一切关系可追踪 | 记忆与关系图谱 | entity-event-document graph | 无限扩张的通用知识图 |
| 改变条件即可重演未来 | 场景注入与事件扰动 | 显式 YAML patch | 隐式因果万能推理 |
| 多个主体共同演化 | 多智能体交互 | 3–8 个 agent 的回合制 | 自由无限 swarm |
| 结果可被查看与解释 | 报告与可视化 | 时间线、分支 diff、claim table | 全能自动解释器 |
| 系统知道自己不确定 | 不确定性表达 | evidence / inferred / speculative | 可靠现实概率校准 |
| 强系统有强约束 | 安全、权限、治理 | 红线测试、数据白名单、审计 | 先做功能，后补治理 |

---

## 8. 外部启发，不等于默认依赖

Mirror 的灵感来源和技术路线参考来自几个公开方向，但**参考的是方法，不是直接继承其主张**。

### 8.1 MiroFish：产品编排灵感

MiroFish 的公开工作流把事情拆成：
1. Graph Building
2. Environment Setup
3. Simulation
4. Report Generation
5. Deep Interaction

这个拆法对 Mirror 很有启发：  
**输入语料 -> 构世界/角色 -> 跑模拟 -> 出报告 -> 可继续追问**

但 Mirror 不接受它的强表述：  
- 不采用“预测万物”的产品叙事  
- 不默认把社交舆情 / 政策 / 金融预测作为 Phase 1 目标  
- 不默认接受其“God’s-eye view 精确推演未来”式表述

### 8.2 OASIS：大规模社会模拟灵感

OASIS 说明了：
- 大规模 social simulation 是一条真实研究路线
- 多 agent 平台动作空间、推荐系统、动态环境都可以被形式化

但 Mirror Phase 1 不追求：
- 百万 agent
- 社交平台级行为仿真
- 真实世界用户尺度的 fidelity

### 8.3 GraphRAG：世界记忆层灵感

GraphRAG 的启发是：
- 图谱对“全局问题”有价值
- 语料世界建模不是只靠向量召回
- 世界状态应该能被结构化和分层总结

但 Mirror Phase 1 的做法是：
- **先做 GraphRAG-lite**
- 先用 SQLite/FTS + graph schema + 小图查询
- 不在第一天上重量级 indexing pipeline

### 8.4 Generative Agents：角色记忆灵感

Generative Agents 证明：
- 记忆、反思、计划可以构成 believable agent loop
- 小世界 + 小 agent 数 + 强观察，是成立的

但 Mirror Phase 1 不追求：
- “像真人一样”
- 自由长对话
- 复杂自反性社会行为
- 真正意义上的社会科学拟合

### 8.5 Digital Twin：受限 twin 的思路

Digital Twin 给 Mirror 的正确启发是：
- 受限域里可以构建“状态-观测-干预-结果”的虚拟对应物
- 但安全、信任、标准和边界是长期正题
- “可模拟”不等于“可对现实做确定宣告”

---

## 9. 总体架构：最小可行路径

### 9.1 最小闭环

Mirror 的最小闭环必须是：

```text
Corpus
  -> Ingest / Chunk
  -> Graph Build
  -> Persona Cards
  -> Scenario Validation
  -> Baseline Run
  -> Injected Run(s)
  -> Diff Report + Claims
  -> Eval Summary
```

### 9.2 架构理念

- **主干确定性**：数据契约、scenario patch、trace、report schema 都尽量确定
- **LLM 在边缘**：抽取、摘要、润色可用 LLM；核心状态机与 trace 不依赖自由发挥
- **先单机后扩展**：SQLite / JSONL / 本地 artifacts 优先
- **先可调试后可炫技**：run trace 比实时酷 UI 更重要

### 9.3 最小可行技术栈

| 层 | 默认选型 | 理由 |
|---|---|---|
| 前端 | Next.js / React | 做工作台壳子最顺手 |
| 后端 | FastAPI + Pydantic | 契约清晰，Codex 好维护 |
| 数据层 | SQLite + JSONL + 本地文件系统 | 轻量、透明、可 diff |
| 图谱层 | NetworkX + SQLite FTS5 + 轻量 embedding adapter | 先小图，不上重型图数据库 |
| orchestration | 自定义 pipeline；必要时后续接 LangGraph | Phase 1 主要是确定性步骤 |
| simulation | 回合制调度器 + 有限动作集合 + seeded run | 可复现、可评估 |
| eval | pytest + YAML assertions + human rubric | 从第一天开始闭环 |
| observability | JSON logs + `run_trace.jsonl` + artifacts/ | 可追溯优先 |
| deploy | 本地开发 + Docker Compose | 够用即可 |

### 9.4 哪些先 mock，哪些必须真做

#### 必须先真做
- 核心 domain schema
- stable IDs
- scenario validator
- baseline / intervention run artifact
- claim labels 与 evidence_ids
- safety checks
- smoke / test / eval-demo 命令入口

#### 可以先 mock
- LLM extraction adapter
- embedding / reranker
- 高级图可视化布局
- fancy chat UI
- 复杂多智能体对话层

### 9.5 Phase 2+ 扩展方向

当以下条件成立时再升级：

| 触发条件 | 升级 |
|---|---|
| 文档量明显增大 | Postgres + pgvector |
| 图查询复杂度提升 | Neo4j 或更强图查询层 |
| 需要持久状态、暂停恢复、人工审批 | LangGraph / durable runtime |
| 分支模拟开始排队 | worker queue / simulation worker |
| 团队协作增长 | 更完整的 observability / review flows |

---

## 10. 仓库级核心契约（必须长期稳定）

Mirror 项目不是先写“功能”，而是先写“契约”。  
以下契约一旦落地，修改必须写 `docs/decisions/`。

### 10.1 ID 规则

所有关键对象必须有稳定 ID：

- `document_id`
- `chunk_id`
- `entity_id`
- `relation_id`
- `persona_id`
- `scenario_id`
- `run_id`
- `turn_id`
- `claim_id`

ID 必须：
- 可序列化
- 不依赖临时内存地址
- 可跨文件互相引用
- 能在 artifacts 中追踪

### 10.2 证据规则

任何下列对象都必须带 `evidence_ids` 或明确标记为空：

- entity
- relation
- persona 字段
- run 中的关键判断
- report claim

如果没有证据支撑，必须明确标为：
- `inferred`
- `speculative`

不得出现“无标签断言”。

### 10.3 claim 标签规则

报告中的每一条 claim 必须属于以下三类之一：

- `evidence_backed`  
  有直接证据片段支撑

- `inferred`  
  基于多个证据和规则推导，但不是源文本直接说出的

- `speculative`  
  属于可能性判断、解释性推测或分支猜想

### 10.4 scenario 规则

所有 intervention 必须通过 schema 校验。  
Phase 1 只允许显式 patch 型注入，不允许“写一句自然语言让系统自己理解”。

允许的最小注入类型：

- `delay_document`
- `block_contact`
- `resource_failure`

之后可增加，但必须写 schema 与测试。

### 10.5 simulation 规则

Phase 1 simulation 必须满足：

- 回合制
- 有上限（例如 8 回合）
- 有限动作集合
- 有 seed
- 支持 deterministic 模式
- 每回合落盘 trace 与 state snapshot

### 10.6 报告规则

报告默认包含：

1. 场景说明
2. 关键差异
3. 关键行动链
4. 结果摘要
5. 未确定点
6. claim table / machine-readable claims
7. 证据与推理标签

### 10.7 artifacts 规则

所有关键运行都应在 `artifacts/` 中产出可检查文件。  
至少包括：

```text
artifacts/<run_name>/
├─ ingest/
│  ├─ documents.jsonl
│  └─ chunks.jsonl
├─ graph/
│  └─ graph.json
├─ personas/
│  └─ personas.json
├─ scenario/
│  └─ normalized_scenario.json
├─ run/
│  ├─ run_trace.jsonl
│  ├─ snapshots/
│  └─ summary.json
├─ report/
│  ├─ report.md
│  └─ claims.json
└─ eval/
   └─ summary.json
```

---

## 11. 推荐仓库结构

> 这是默认结构，不要求第一天全部实现，但方向不要偏。

```text
mirror-engine/
├─ mirror.md
├─ README.md
├─ AGENTS.md
├─ Makefile
├─ .env.example
├─ .gitignore
├─ .agents/
│  └─ skills/
│     ├─ corpus-ingest/
│     │  └─ SKILL.md
│     ├─ graph-build/
│     │  └─ SKILL.md
│     ├─ persona-cards/
│     │  └─ SKILL.md
│     ├─ scenario-dsl/
│     │  └─ SKILL.md
│     ├─ sim-runner/
│     │  └─ SKILL.md
│     ├─ report-provenance/
│     │  └─ SKILL.md
│     ├─ safety-guardrails/
│     │  └─ SKILL.md
│     └─ eval-harness/
│        └─ SKILL.md
├─ docs/
│  ├─ product/
│  ├─ architecture/
│  ├─ plans/
│  ├─ decisions/
│  └─ rubrics/
├─ data/
│  └─ demo/
│     ├─ corpus/
│     ├─ scenarios/
│     └─ expectations/
├─ artifacts/                # 默认 gitignore
├─ backend/
│  ├─ pyproject.toml
│  ├─ app/
│  │  ├─ main.py
│  │  ├─ cli.py
│  │  ├─ config.py
│  │  ├─ domain/
│  │  ├─ ingest/
│  │  ├─ graph/
│  │  ├─ personas/
│  │  ├─ scenarios/
│  │  ├─ simulation/
│  │  ├─ reports/
│  │  ├─ evals/
│  │  └─ safety/
│  └─ tests/
├─ frontend/
│  ├─ package.json
│  └─ src/
│     ├─ app/
│     ├─ components/
│     └─ lib/
├─ evals/
│  ├─ datasets/
│  ├─ assertions/
│  └─ scripts/
└─ scripts/
   ├─ smoke.sh
   └─ demo.sh
```

---

## 12. 数据模型总纲（不是完整 schema，但要稳定）

### 12.1 `Document`

最少字段：

- `document_id`
- `title`
- `kind`
- `source_path`
- `created_at` / `source_time`（可选）
- `metadata`

### 12.2 `Chunk`

- `chunk_id`
- `document_id`
- `text`
- `char_start`
- `char_end`
- `source_id`

### 12.3 `Entity`

- `entity_id`
- `name`
- `type`
- `aliases`
- `evidence_ids`

### 12.4 `Relation`

- `relation_id`
- `source_entity_id`
- `relation_type`
- `target_entity_id`
- `evidence_ids`

### 12.5 `Persona`

- `persona_id`
- `entity_id`
- `public_role`
- `goals`
- `constraints`
- `known_facts`
- `private_info`
- `relationships`
- `evidence_ids`

### 12.6 `Scenario`

- `scenario_id`
- `title`
- `seed`
- `turn_budget`
- `branch_count`
- `injections`
- `evaluation_questions`

### 12.7 `TurnAction`

- `run_id`
- `turn_index`
- `actor_id`
- `action_type`
- `target_id`（可选）
- `rationale`
- `evidence_ids`
- `state_patch`

### 12.8 `Claim`

- `claim_id`
- `text`
- `label` (`evidence_backed | inferred | speculative`)
- `evidence_ids`
- `related_turn_ids`
- `confidence_note`（可选）

### 12.9 `EvalResult`

- `eval_name`
- `status`
- `metrics`
- `failures`
- `notes`

---

## 13. Codex 协作设计

Mirror 不是只为“开发”设计，也要为“Codex 能长期合作而不失控”设计。

### 13.1 项目切分原则

对于 monorepo，建议至少按下面方式组织 Codex 视角：

- **Project A：backend**
- **Project B：frontend**
- **Project C：docs + evals（可选）**

当仓库变大时，不要把所有任务都塞进同一个上下文窗口。  
Codex app 支持多项目、并行线程、内建 worktree；利用这些能力拆解任务，通常比让单线程吞整个仓库更稳定。

### 13.2 线程角色

建议默认有 4 类线程，不要混用：

| 线程类型 | 主要职责 | 产出 |
|---|---|---|
| Architect 线程 | 设计 schema、接口、计划、ADR | 文档、contracts、plans |
| Builder 线程 | 实现某个具体模块 | 代码、测试、CLI/API |
| Evaluator 线程 | 测试、回归、基准、红线检查 | eval 结果、失败样例 |
| UI 线程 | 工作台页面、可视化壳子 | 前端页面、静态加载逻辑 |

### 13.3 哪些任务适合并行

适合并行：
- 仓库脚手架
- demo 数据编写
- docs / AGENTS / skills
- 前端空壳
- eval harness 占位

不适合并行：
- domain schema 的最终定稿
- scenario DSL 的核心字段
- run_trace 结构
- claim 标签体系

> 原因：这些是项目契约，必须先收口，再扩散。

### 13.4 worktree 使用规则

对于需要并行推进的任务：

- 每个较大任务优先使用独立 worktree
- worktree 命名建议：`wt/<phase>-<topic>`
- 分支命名建议：
  - `feat/p0-scaffold`
  - `feat/p1-ingest`
  - `feat/p2-sim-runner`
  - `docs/mirror-sync`
  - `eval/redline-tests`

适合开 worktree 的任务：
- 前端与后端并行
- docs 与代码并行
- eval 修复与功能开发并行

不适合开 worktree 的任务：
- 正在大改 schema
- 正在重构公共模块且多个线程都会改它

### 13.5 Codex 任务粒度规则

一个健康的 Codex 任务应该：

- 有一个主要目标
- 修改不超过一个主模块
- 有明确输入
- 有明确输出
- 有明确 out-of-scope
- 有完成定义（DoD）
- 有最小测试命令

不接受这种任务描述：

- “实现整个系统”
- “把 Mirror 做出来”
- “完成多智能体架构”
- “做个完整前端”

### 13.6 Codex 交接模板（线程输出格式）

任何重要线程在交付时，都应尽量按以下格式汇报：

```md
## Summary
- 完成了什么
- 没完成什么

## Files changed
- path/to/file
- ...

## Contracts touched
- schema / API / CLI / scenario / claim labels

## Tests run
- 命令
- 结果

## Risks / TODO[verify]
- ...

## Suggested next task
- ...
```

### 13.7 计划模式默认要求

只要满足以下任一条件，线程应先给简短计划，再改代码：

- 触及超过 3 个文件
- 触及 schema / contract
- 触及 `mirror.md` / `AGENTS.md`
- 触及多个子系统边界
- 需要权衡 mock 与真实现方式

---

## 14. Phase 路线图

## 14.1 Phase 0 — 建立地基

**目标**  
把项目从“想法”变成“能被 Codex 稳定施工的仓库”。

**输入**  
- 本 `mirror.md`
- 初始技术选型
- demo 世界概念

**输出**  
- repo scaffold
- `mirror.md`
- `AGENTS.md`
- skills 骨架
- demo 数据
- 核心 schema 占位
- `make smoke` / `make test`

**验收标准**
- 空骨架可运行
- 目录清晰
- 命令可执行
- 数据与红线写进文档
- 项目不再依赖口头解释

**风险**
- 过度设计
- 文档太长却不可执行
- 先搭舞台不搭通路

**并行性**
- 高

---

## 14.2 Phase 1 — 世界建模与角色建模

**目标**  
从 demo corpus 产出结构化世界和 persona。

**输入**
- `data/demo/corpus/`
- domain schema

**输出**
- `documents.jsonl`
- `chunks.jsonl`
- `graph.json`
- `personas.json`

**验收标准**
- 能抽出核心实体、关系、事件
- persona 字段可追溯
- 至少一个查询接口可用

**风险**
- 抽取噪声
- 过度推断 persona
- schema 还没稳就往外扩

**并行性**
- 中（schema 先串行，之后可并行）

---

## 14.3 Phase 2 — 场景注入与仿真闭环

**目标**  
把 baseline 和 intervention 场景跑通。

**输入**
- graph
- personas
- scenario files

**输出**
- normalized scenario
- run trace
- state snapshots
- branch summaries
- diff report

**验收标准**
- 相同 seed 重跑一致
- 至少 1 个 baseline 与 1 个 intervention 完整跑通
- 报告有 claim labels

**风险**
- agent 漂移
- trace 不可读
- 报告比运行还像“拍脑袋”

**并行性**
- 中低（sim runner 和 report 要串起来）

---

## 14.4 Phase 3 — 评估、UI 与演示化

**目标**  
让系统不仅“能跑”，而且“值得看、值得改”。

**输入**
- 可运行 artifacts
- eval expectations
- front-end shell

**输出**
- browser workbench
- eval summary
- human review rubric
- demo script

**验收标准**
- 一条命令完成 demo
- 页面可看 corpus / graph / scenarios / report
- eval 可重复
- 人工评审能判断是否有价值

**风险**
- 过度包装
- UI 漂亮但证据链弱
- 为了好看破坏可追溯性

**并行性**
- 高（UI、eval、docs 可并行）

---

## 15. Skills 地图（项目级，不是具体 skill 文本）

Mirror 需要的 skills 不应太多，够用即可。默认保留 8 个。

| Skill | 负责什么 | 不负责什么 |
|---|---|---|
| `corpus-ingest` | 导入 manifest、标准化文档、chunking、source map | 不做语义抽取 |
| `graph-build` | 抽实体/关系/事件、构图、基础图查询 | 不生成 persona |
| `persona-cards` | 从 graph + 证据生成角色卡 | 不做真实人物画像 |
| `scenario-dsl` | 设计/校验/应用 scenario patch | 不做因果确定性宣称 |
| `sim-runner` | 回合制调度、动作应用、trace 落盘 | 不做无限自由对话 |
| `report-provenance` | 生成带标签报告与 claims | 不允许无证据叙事 |
| `safety-guardrails` | PII / 红线检测 / 场景拦截 | 不为违规任务做“聪明改写” |
| `eval-harness` | smoke / regression / redline / summary | 不实现功能本体 |

### 15.1 skill 编写规则

每个 skill 都必须写清：

- `name`
- `description`
- 触发条件
- 输入
- 输出
- 边界
- 常见错误
- 最小测试命令（若适用）

### 15.2 skill 使用原则

- skill 的职责必须窄
- 不要写一个“大而全” skill
- skill 说明里必须包含“不做什么”
- 如果一个 skill 经常被误触发，优先改 `description` 边界

---

## 16. Backlog 设计规则

backlog 不该只是“想做的东西列表”，而必须是 **Codex 可执行单元列表**。

### 16.1 backlog item 模板

每个 backlog item 至少包含：

- 标题
- 目标
- 输入
- 输出
- 影响目录
- out-of-scope
- DoD
- 最小测试命令
- 是否可并行
- 是否触及契约

### 16.2 backlog 的坏味道

如果一个任务同时满足以下两条以上，它通常太大了：

- 目标模糊
- 会同时改前后端
- 会同时改 schema 与 UI
- 没有明确产物
- 没有测试方法
- 没有输入示例

### 16.3 Sprint 1 推荐 backlog（摘要版）

1. 仓库脚手架 + Makefile
2. `mirror.md` / `AGENTS.md` / skills 骨架
3. demo 世界与 demo 场景
4. 核心 Pydantic models
5. ingest CLI
6. mock extraction adapter
7. graph builder
8. persona card builder
9. scenario DSL + validator
10. deterministic sim runner
11. report generator
12. eval harness
13. frontend workbench shell

---

## 17. 评估体系：不是只看会不会跑

Mirror 的评估必须同时覆盖“系统有没有工作”和“系统有没有价值”。

### 17.1 自动化评估维度

| 维度 | 最小方法 | 初始阈值 |
|---|---|---|
| 功能正确性 | schema / CLI / API 合约测试 | 100% 通过 |
| trace 完整性 | 每回合 action、state、actor 是否完整 | 无关键缺失 |
| 可复现性 | 相同 seed 重跑一致 | 100% 一致 |
| claim 标签完整性 | claim 是否都标注了 label | 100% |
| evidence 覆盖率 | report/claim 是否都有 evidence_ids 或非证据标签 | 100% |
| 安全拦截 | 红线场景是否被拒绝 | 100% |
| 延迟 | demo 端到端执行时间 | 初期只记录，不强卡死 |
| 成本 | token / 时间 / 文件体积 | 初期只记录，不强卡死 |

### 17.2 人工评审维度

至少保留这四项人工评审：

| 维度 | 问题 |
|---|---|
| 有用吗？ | 这次推演有没有带来新洞见，还是只是生成一堆文字？ |
| 可信吗？ | 报告是否过度自信？证据链是否清楚？ |
| 可控吗？ | 我能看懂系统为什么得出这个结果吗？ |
| 好改吗？ | 我知道下一步应该改哪里吗？ |

### 17.3 Eval loop 原则

每做出一个新能力，就要新增至少一项 expectation / assertion。  
不允许“功能先上，评估以后补”。

### 17.4 推荐命令入口

根目录至少应长期保留这些命令名：

```bash
make setup
make smoke
make test
make eval-demo
make dev-api
make dev-web
```

随着系统增长，可新增但不要轻易改名。

---

## 18. 安全、合规与许可治理

### 18.1 数据治理

默认政策：

- 只 ingest 明确允许的数据
- data/demo 一律可公开展示
- 不在 demo 中藏真实 PII
- 任何涉及真实人物、真实组织、真实社会预测的需求，默认退回并改为低风险替代场景

### 18.2 场景治理

Report 生成前必须过安全检查。  
以下情况必须 block 或强警告：

- 真实人物 persona
- 政治说服 / 选民定向
- 执法 / 嫌疑评分
- 招聘 / 信贷 / 医疗 / 司法个体化预测
- 无 evidence 的报告导出
- 把模拟输出包装成现实结论

### 18.3 许可治理

Mirror 可受 MiroFish / OASIS / GraphRAG 这些开源项目启发，但应遵循：

- **学 workflow，不直接搬代码**
- 默认保持代码来源干净
- 如果未来决定引入 AGPL 代码或直接依赖其核心实现，必须：
  - 在 `docs/decisions/` 写明
  - 在 LICENSE / NOTICE 中反映
  - 确认整个仓库许可策略是否相容

### 18.4 文案治理

系统文案和报告文案必须避免以下词法误导：

不要写：
- “预测了未来”
- “系统证明了……”
- “精确推断……”
- “真实世界将会……”

要写：
- “在该场景条件下”
- “在本次模拟分支中”
- “基于当前语料与规则”
- “以下结论包含推断 / 推测成分”

---

## 19. 变更控制与决策记录

### 19.1 什么改动必须写 ADR / 决策记录

以下改动必须写到 `docs/decisions/`：

- 改 domain schema
- 改 claim 标签体系
- 改 scenario DSL 结构
- 改仿真动作集合或 turn 模型
- 改项目许可策略
- 从“虚构域”迈向“授权真实域”
- 从轻量图谱切到重型图数据库
- 引入新的外部关键依赖（尤其是 AGPL / 网络服务）

### 19.2 什么改动只需 plan note

以下改动可只写 `docs/plans/` 简短计划：

- 单模块重构
- 新增一个 CLI 子命令
- 新增一个页面
- 新增一个 eval dataset
- 新增一个 skill

### 19.3 `TODO[verify]` 规则

如果信息不确定，不允许编造；请用：

```text
TODO[verify]: <一句话说明为什么待验证>
```

适用场景：
- 论文结论还没读原文
- 上游仓库行为近期可能变化
- 成本 / 性能 / 许可判断尚未确认
- 某接口设计只是暂定

---

## 20. 交付标准（Definition of Done，项目级）

一个任务、一个模块、一个阶段，只有同时满足下面几项，才算完成：

1. **有实现**
2. **有最小测试或 smoke**
3. **有运行产物或可观察输出**
4. **文档 / 契约已同步**
5. **没有破坏 evidence / claim 标签链**
6. **没有新增未记录的高风险边界**
7. **如果改了关键结构，有计划或 ADR 留痕**

### 20.1 不算完成的典型情况

以下都不算完成：

- 代码写了，但没有命令入口
- 页面能显示，但数据契约没定
- 报告能生成，但没有 claim 标签
- 仿真能跑，但不能复现
- 功能做了，但 demo 数据断了
- 改了 schema，却没更新文档
- 用了上游代码，却没处理许可问题

---

## 21. 今天就能开工的默认顺序

如果一个全新的仓库从 0 开始，按以下顺序推进：

### 第一步：立项目治理地基
- 放入 `mirror.md`
- 创建根目录 `AGENTS.md`
- 建 repo scaffold
- 建 Makefile 与 smoke/test 占位
- 建 demo 数据目录

### 第二步：建一个足够小但完整的世界
- 写 demo corpus
- 写 baseline / intervention scenario
- 写 expectations
- 保证语料自洽

### 第三步：打通最短闭环
- ingest
- graph
- persona
- scenario validator
- deterministic sim stub
- report stub
- eval-demo

> 先把“最短闭环”跑起来，再决定哪些地方值得做得更聪明。

---

## 22. 给未来 `AGENTS.md` 的最小要求

根目录 `AGENTS.md` 不应重复本文件全部内容，但至少必须包含：

1. 项目意图的一句话
2. 明确非目标
3. mirror.md 引用
4. repo map
5. 默认命令
6. 完成定义摘要
7. 安全与许可红线摘要
8. “改契约前先计划 / 记 ADR”的规则

### 22.1 推荐开头模板

```md
# AGENTS.md

本仓库的长期项目蓝图、边界、架构意图与阶段路线见根目录 `mirror.md`。
本文件只保留 Codex 执行时需要优先遵守的短规则和命令入口。
如无明确例外，所有实现应与 `mirror.md` 保持一致。
```

---

## 23. 默认第一批 Codex 任务模板

下面三个任务是新仓库最推荐的起跑动作。

### 23.1 任务 1：仓库脚手架

```text
你负责 Mirror Engine 的 Phase 0 scaffolding。

目标：
- 创建 monorepo 目录：backend, frontend, data/demo, docs, evals, .agents/skills, scripts
- 创建 Makefile、README.md、.env.example、.gitignore
- 提供 make smoke / make test 的占位实现，命令必须可执行并返回 0
- 先不要接任何外部 LLM API，不实现完整功能，只做清晰骨架

约束：
- 不引入复杂基础设施
- 所有脚本和路径命名要为后续 CLI 留接口
- 输出 repo tree 和关键命令说明
```

### 23.2 任务 2：demo 世界与样例数据

```text
你负责创建原创 demo 世界“雾港东闸危机”。

目标：
- 在 data/demo/corpus/docs 下创建 5-6 篇短文档
- 在 data/demo/scenarios 下创建 baseline 和 reporter_detained 两个场景
- 在 data/demo/expectations 下创建最小断言文件
- 文档需覆盖：风暴预警、东闸裂缝、预算挪用、节庆压力、船长日志、档案线索

约束：
- 数据必须原创、虚构、非敏感
- 不使用真实人物、真实机构或真实地点
```

### 23.3 任务 3：最小后端闭环

```text
你负责最小后端闭环。

请实现：
1. Pydantic 核心模型：Document, Chunk, Entity, Relation, Persona, Scenario, RunTrace, Claim
2. ingest CLI：读取 manifest，输出 documents.jsonl 和 chunks.jsonl
3. mock extraction adapter：从 demo 语料抽 Entity / Relation 候选，带 evidence_ids
4. graph builder：输出 graph.json
5. scenario validator：校验 baseline 和 reporter_detained
6. deterministic sim stub：能跑 4 个角色、最多 8 回合、固定 seed
7. report stub：输出带 claim 标签的 markdown 报告

约束：
- 先不用数据库
- 先不用外部模型
- 每个阶段都要能落盘到 artifacts/
- 至少补 5 个 pytest
- 最后给出 make smoke 和一条端到端演示命令
```

---

## 24. 项目级坏味道清单

任何时候出现以下情况，都应当立刻停下来收口，而不是继续堆功能：

- 任务越来越像“写个超级 agent 自己搞定”
- 输出越来越多，但 evidence_ids 越来越少
- 所有东西都要用 LLM，自定义规则越来越少
- report 比 trace 更复杂，但 trace 无法解释 report
- 线程改动频繁冲突，因为契约还没定
- 前端越来越花哨，但没有稳定 demo artifacts
- backlog 项目越来越大，DoD 越来越空
- 模拟开始被当成现实预测宣传
- 引入上游代码，却没想清楚许可边界

---

## 25. 项目级好味道清单

以下迹象说明项目在朝正确方向走：

- demo 世界很小，但端到端链路很完整
- 同一场景可多次复跑且可比较
- 每个 claim 都能指回 evidence_ids
- 线程的交接越来越短，因为契约越来越稳
- backlog 越来越细，而不是越来越宏大
- 新增功能时，总能顺手补一个 eval
- 人工评审能说出“这一步有用 / 没用”的理由
- AGENTS 越来越短，mirror.md 越来越稳
- 团队讨论的焦点从“能不能模拟万物”转向“哪种推演最有价值”

---

## 26. 维护者备忘：何时考虑升级项目定位

只有当以下条件同时成立，才考虑从“虚构推演沙盘”升级到“授权知识环境决策沙盘”：

1. Phase 1 与 Phase 2 闭环稳定
2. claim / evidence / trace 体系成熟
3. 红线测试长期通过
4. 人工评审证明它对决策讨论有真实价值
5. 有清晰的数据授权边界
6. 有新的治理策略和访问控制方案

如果这些条件不满足，就不要提前升级项目叙事。

---

## 27. 附录 A：默认命令约定

```bash
make setup
make smoke
make test
make eval-demo
make dev-api
make dev-web

python -m backend.app.cli ingest data/demo/corpus/manifest.yaml --out artifacts/demo/ingest
python -m backend.app.cli build-graph artifacts/demo/ingest/chunks.jsonl --out artifacts/demo/graph
python -m backend.app.cli personas artifacts/demo/graph/graph.json --out artifacts/demo/personas
python -m backend.app.cli validate-scenario data/demo/scenarios/reporter_detained.yaml
python -m backend.app.cli simulate data/demo/scenarios/reporter_detained.yaml \
  --graph artifacts/demo/graph/graph.json \
  --personas artifacts/demo/personas/personas.json \
  --out artifacts/demo/run
python -m backend.app.cli report artifacts/demo/run --out artifacts/demo/report
```

---

## 28. 附录 B：默认动作集合（Phase 1）

为了让仿真可控，Phase 1 推荐动作集合固定且有限：

- `inform`
- `hide`
- `inspect`
- `move`
- `request`
- `delay`
- `publish`
- `evacuate`

这不是最终动作本体，而是 Phase 1 的控制壳。  
不要在 Phase 1 为了“更像真实对话”把动作集扩成自由文本世界。

---

## 29. 附录 C：推荐的人类评审 rubric

每次评审一个 run / report，都可以用下面 1–5 分打分：

| 维度 | 1 分 | 3 分 | 5 分 |
|---|---|---|---|
| 有用性 | 没新信息 | 有一点启发 | 明显帮助理解分支差异 |
| 可信度 | 很像乱写 | 有部分依据 | 证据与推理边界清楚 |
| 可解释性 | 看不出为什么 | 能大概看懂 | 可以沿 trace 回放 |
| 可操作性 | 不知道下一步改哪 | 有一些方向 | 很清楚下一步应该优化哪里 |

---

## 30. 附录 D：外部参考（最后核验：2026-04-14）

以下外部资料影响了本蓝图，但不改变本项目的自我约束：

1. **OpenAI Codex AGENTS.md 指南**  
   说明 Codex 会在开始工作前读取 `AGENTS.md`，并按全局/项目/目录链进行指令叠加。  
   启发：`AGENTS.md` 应保持短而硬，`mirror.md` 负责长期蓝图。  
   <https://developers.openai.com/codex/guides/agents-md>

2. **OpenAI Codex Skills 文档**  
   说明 skill 是可复用工作流的封装，带 `SKILL.md`，并采用渐进加载。  
   启发：skills 应小而专一，描述要清晰写出边界。  
   <https://developers.openai.com/codex/skills>

3. **OpenAI Codex app features / worktrees 文档**  
   说明 Codex app 支持多项目、并行线程、内建 worktree 与 handoff。  
   启发：Mirror 应按模块切分项目与线程，避免所有事情堆在一个上下文中。  
   <https://developers.openai.com/codex/app/features>  
   <https://developers.openai.com/codex/app/worktrees>

4. **Codex 配置与变更日志**  
   说明配置文件存在用户级与项目级覆盖，近期 app/CLI 能力持续演进。  
   启发：项目规则应尽量放在仓库可见文件中，而不是只依赖个人本地配置。  
   <https://developers.openai.com/codex/config-reference>  
   <https://developers.openai.com/codex/changelog>

5. **MiroFish 开源仓库**  
   其公开 README 提供了完整产品 workflow：Graph Building、Environment Setup、Simulation、Report Generation、Deep Interaction；同时仓库标注为 AGPL-3.0，且公开说明仿真引擎由 OASIS 支撑。  
   启发：Mirror 采用“工作流参考”，但不采用其“预测万物”定位。  
   <https://github.com/666ghj/MiroFish>

6. **OASIS 开源仓库**  
   说明其面向 Twitter/Reddit 类平台社交模拟，可扩展到大规模 agent。  
   启发：大规模社会模拟是研究路径，但不是 Mirror Phase 1 的目标。  
   <https://github.com/camel-ai/oasis>

7. **GraphRAG 论文与仓库**  
   论文强调 GraphRAG 在全局 sensemaking 问题上的价值；官方仓库也提醒 indexing 可能昂贵，应从小开始。  
   启发：Mirror 在 Phase 1 采用 GraphRAG-lite，而不是重型上车。  
   <https://arxiv.org/abs/2404.16130>  
   <https://github.com/microsoft/graphrag>

8. **Generative Agents 论文**  
   说明记忆、反思、计划可以在小世界中形成 believable agents。  
   启发：Mirror 可借其 persona/memory 思路，但不追求真实人物模拟。  
   <https://arxiv.org/abs/2304.03442>

9. **NIST 数字孪生安全与信任文档**  
   说明 digital twin 的安全与信任问题是基本面，不是附属议题。  
   启发：Mirror 必须把治理与信任写在主线上。  
   <https://nvlpubs.nist.gov/nistpubs/ir/2025/NIST.IR.8356.pdf>

---

## 31. 结尾：Mirror 的正确野心

Mirror 最值得保留的，不是“成为现实版《镜子》”，而是：

- 把复杂世界压缩成**受限、可操作、可审计**的实验沙盘
- 让人类能在不伤害现实对象的前提下，测试信息流、角色决策与结果分支
- 把“大而玄”的多智能体叙事，降维成一个**可施工、可回归、可评估**的工程项目

> **不要试图第一天就预测世界。**  
> **先把一个小世界做成。**
