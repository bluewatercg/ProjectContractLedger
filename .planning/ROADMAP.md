# Roadmap: 业务分类与统计分析模块

## Overview

为现有合同管理系统增加业务类型分类体系和统计分析能力。从建立分类基础设施开始，到将分类集成到现有合同流程，再到构建完整的统计分析和可视化，最后提供报表导出能力。4个阶段依次递进，每个阶段交付独立可验证的用户价值。

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3, 4): Planned milestone work
- Decimal phases (e.g., 2.1): Urgent insertions (marked with INSERTED)

- [ ] **Phase 1: 业务类型基础设施** - 建立多层级业务类型树形管理能力
- [ ] **Phase 2: 合同集成** - 将业务类型集成到合同流程并支持历史数据处理
- [ ] **Phase 3: 统计分析与可视化** - 构建统计计算引擎、Dashboard卡片和独立分析页面
- [ ] **Phase 4: 报表导出** - 生成Excel和PDF格式的业务分析报告

## Phase Details

### Phase 1: 业务类型基础设施
**Goal**: 用户可以独立管理业务类型的多层级树形结构
**Depends on**: Nothing (first phase)
**Requirements**: CAT-01, CAT-02, CAT-03, CAT-04, CAT-05, CAT-08
**Success Criteria** (what must be TRUE):
  1. 用户可以创建多层级业务类型（如：服务 > 运维服务 > 角膜类运维）
  2. 用户可以编辑业务类型名称和调整其层级关系
  3. 用户可以删除业务类型（系统提示关联合同数量并确认）
  4. 用户可以拖拽排序业务类型并调整层级
  5. 用户可以启用/禁用业务类型（禁用后新合同不可选择该类型）
**Plans**: 3 plans in 2 waves

Plans:
- [ ] 01-01-PLAN.md — Backend infrastructure (Entity, Service, Controller)
- [ ] 01-02-PLAN.md — Frontend tree management UI
- [ ] 01-03-PLAN.md — Database migration and integration testing

### Phase 2: 合同集成
**Goal**: 业务类型与合同流程完全集成，历史合同可批量分类
**Depends on**: Phase 1
**Requirements**: CAT-06, CAT-07
**Success Criteria** (what must be TRUE):
  1. 用户在创建/编辑合同时可以通过级联选择器选择业务类型
  2. 用户可以筛选多个合同并批量设置业务类型
  3. 批量设置支持按客户、日期、状态等条件筛选目标合同
**Plans**: TBD

Plans:
- [ ] 02-01: [TBD during plan-phase]

### Phase 3: 统计分析与可视化
**Goal**: 用户可以按业务类型维度全面分析合同表现
**Depends on**: Phase 2
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, ANALYSIS-01, ANALYSIS-02, ANALYSIS-03, ANALYSIS-04, ANALYSIS-05, STAT-01, STAT-02, STAT-03, STAT-04, STAT-05, STAT-06, VIS-01, VIS-02, VIS-03, VIS-04, VIS-05, VIS-06
**Success Criteria** (what must be TRUE):
  1. Dashboard显示业务类型占比饼图卡片，展示前5大业务类型摘要
  2. 点击Dashboard卡片可跳转到独立业务分析页面
  3. 业务分析页面支持时间范围（年/月/季度/自定义）和业务类型多选筛选
  4. 页面顶部显示合同数量、总金额、回款金额、回款率等关键指标概览
  5. 饼图、柱状图、折线图正确展示业务类型对比和趋势数据
  6. 明细表格支持排序和展开子类数据，图表支持点击交互和下钻
**Plans**: TBD

Plans:
- [ ] 03-01: [TBD during plan-phase]

### Phase 4: 报表导出
**Goal**: 用户可以将业务分析结果导出为Excel和PDF报告
**Depends on**: Phase 3
**Requirements**: EXPORT-01, EXPORT-02, EXPORT-03
**Success Criteria** (what must be TRUE):
  1. 用户可以导出包含图表和明细数据的Excel报表
  2. 用户可以生成包含图表和汇总数据的PDF分析报告
  3. 导出文件名自动包含时间范围和导出时间信息
**Plans**: TBD

Plans:
- [ ] 04-01: [TBD during plan-phase]

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. 业务类型基础设施 | 0/3 | Ready | - |
| 2. 合同集成 | 0/TBD | Not started | - |
| 3. 统计分析与可视化 | 0/TBD | Not started | - |
| 4. 报表导出 | 0/TBD | Not started | - |

---
*Roadmap created: 2026-02-06*
*Depth: Quick (3-5 phases)*
*Coverage: 30/30 v1 requirements mapped*
