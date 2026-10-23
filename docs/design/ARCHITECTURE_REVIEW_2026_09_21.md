# 架构评审报告 — ProjectContractLedger

> 评审日期：2026-09-21
> 评审范围：合同/发票/付款/客户前后端实现、领域模型、订阅模块、UI 引导
> 评审身份：独立架构评审（不修改代码）

---

## 0. TL;DR

当前系统是一个**单客户-单合同-单发票链-单付款**的线性台账。它能跑通"签一个合同 → 开一张票 → 收一笔钱"的最简路径，但面对评审提出的四类真实业务场景（合同族谱、甲签乙付、集团代付、多方分摊），**数据模型层直接缺位**——不是实现不完善，而是实体和关系根本不存在。

最小可行改造路径：**先补合同类型枚举 + 付款方/分摊表两个实体**，其他改造围绕这两个锚点展开。不要重写订阅模块，不要引入工作流引擎。

---

## 1. 现状证据

### 1.1 领域模型现状（来自 `apps/backend/src/entity/`）

| 实体 | 关键字段 | 缺失 |
|---|---|---|
| `Contract` | `customer_id`, `total_amount`, `status`, `is_renewable`, `previous_contract_id` | **无 `contract_type` 枚举**；无 `parent_contract_id`（运维/补充协议无法挂主合同）；无 `party_roles` |
| `Invoice` | `contract_id`, `plan_id`, `amount`, `tax_amount`, `total_amount` | 发票只能挂一个合同；无"代开"标识 |
| `Payment` | `invoice_id`, `amount`, `payment_method` | **无 `payer_customer_id`**（付款方 ≠ 合同甲方时无法表达）；无分摊关系 |
| `Customer` | `name`, `status`, `last_contract_end_date` | 无"集团/子公司"层级；无 `parent_customer_id` |
| `ContractInvoicePlan` | `contract_id`, `phase_name`, `planned_amount`, `status` | 仅支持单合同分期开票，不支持跨合同计划 |
| `SubscriptionRecord` + `SubscriptionRenewalRecord` | 独立的订阅台账，与 Contract 零关联 | 订阅续费产生的合同/发票走的是另一套模型，与主合同台账**完全割裂** |

### 1.2 续签链路（来自 `contract.service.ts` `buildContractHistory`）

- 仅通过 `previous_contract_id` 形成**单链**（每个合同最多一个前任）。
- `buildContractHistory` 实现了环检测、断链检测、按 kit+customer 分组，算法本身是健壮的。
- **但"续签"被等同于"上一个合同"**——无法区分：
  - 主合同 vs 运维合同（运维是主合同的延续还是独立合同？）
  - 续签合同 vs 补充协议（补充协议金额变更，不应该是一条新链）
  - 一个主合同下挂多个运维子合同（当前模型不支持一对多）

### 1.3 付款模型（来自 `payment.entity.ts` + `payment.service.ts`）

```
Payment.invoice_id → Invoice → Contract → Customer
```

- 付款**必须**通过发票中转，不能直接付合同。
- 没有"谁付的"字段——隐含假设付款方 = 合同客户。
- 没有分摊表——一笔付款只能对应一张发票，无法表达"一笔银行流水对应三张发票"或"一张发票由两家公司分摊付款"。

### 1.4 前端表单（来自 `ContractForm.vue` 1-321 行）

四段式平铺表单：基本信息 → 金额日期 → 续签配置 → 条款备注。

- **无表单向导**：用户看到的是一堆字段，没有"先选合同类型，再按类型展开不同字段"的引导。
- **续签配置**只有 `is_renewable` 布尔 + 提醒天数 + 关联旧合同下拉。没有"这是主合同/运维/续签/补充"的选择。
- **关联旧合同**是可选下拉，没有任何引导告诉用户"什么时候该关联、关联后有什么效果"。
- **空状态**：合同详情页有"暂无关联发票，立即开票"按钮（`ContractDetail.vue:162-174`），这点做得可以。但付款列表、续签链没有对等的空状态引导。
- **错误恢复**：表单提交失败只靠 `el-form` 的字段级校验，无全局错误 toast 重试、无草稿自动保存。

### 1.5 订阅模块的割裂（来自 `subscription-record.entity.ts` + `subscription-renewal-record.entity.ts`）

订阅台账有自己的续费记录、附件、推送日志，与合同模块**零关联**：

- 订阅续费时上传的合同附件存在 `subscription_renewal_attachments`，不是 `contract_attachments`。
- 订阅的 `fee` 字段和合同的 `total_amount` 字段语义重叠但数据不互通。
- 这意味着：一个客户的"阿里云 ECS 年费"记在订阅模块，"运维服务合同"记在合同模块，**两者之间没有对账能力**。

---

## 2. 需求缺口

| 业务场景 | 当前支持度 | 缺口 |
|---|---|---|
| 主合同 + 运维合同 + 续签 + 补充协议 | ❌ 不支持 | 缺 `contract_type` 枚举；缺 `parent_contract_id`；补充协议被错误地建模为"续签新合同" |
| 甲签乙付（A 签合同，B 付款） | ❌ 不支持 | `Payment` 无 `payer_customer_id`；隐含假设付款方=合同客户 |
| 集团统一代付（母公司替所有子公司付） | ❌ 不支持 | `Customer` 无层级关系；无代付授权记录 |
| 一个合同多方分摊（多客户按比例分摊） | ❌ 不支持 | 缺 `contract_cost_allocation` 分摊表 |
| 终端用户引导录入 | ⚠️ 部分支持 | 有基础校验和空状态 CTA，但无向导、无上下文帮助、无错误恢复 |

---

## 3. 架构问题

### P0 — 数据模型缺位（阻塞性）

1. **合同类型未建模**。`Contract` 没有 `type` 字段，所有合同在数据库层面是同构的。"主合同 vs 运维 vs 续签 vs 补充协议"只能靠 `title` 字段的文本约定区分，无法被查询、统计、校验。
2. **补充协议被错误建模**。当前 `previous_contract_id` 只能表达"线性续签"。补充协议（金额变更、期限延长）应该是原合同的**修改记录**，不是新合同。把它建模为新合同会导致：合同链膨胀、金额统计重复、状态机混乱。
3. **付款方未建模**。`Payment` 没有 `payer` 字段。甲签乙付场景下，财务对账无法完成——你无法回答"这笔钱是谁付的"。
4. **分摊未建模**。多方分摊需要一张 `contract_cost_allocation` 表（contract_id, customer_id, ratio, amount），当前完全缺失。

### P1 — 模块割裂（高成本）

5. **订阅模块与合同模块是两个独立宇宙**。同一个客户的续费，在订阅模块记一次，在合同模块再记一次，没有对账机制。长期看必然出现数据不一致。
6. **客户无层级**。集团-子公司关系未建模，集团代付场景无法实现。

### P2 — 前端引导不足（体验债）

7. **合同表单无向导**。用户面对 20+ 字段平铺，没有"先选类型，再填对应字段"的引导。
8. **关联旧合同无引导**。用户不知道什么时候该关联、关联后能看到什么。
9. **无草稿自动保存**。长表单填到一半浏览器崩溃，数据全丢。
10. **错误恢复薄弱**。提交失败只有字段级红框，无全局错误聚合和重试。

### P3 — 技术债（中低风险）

11. **Service 层循环依赖靠 `any` 绕过**。`contract.service.ts:24`、`invoice.service.ts:28` 的 `statisticsService: any` 是定时炸弹。
12. **合同状态机分散**。状态转换逻辑散落在 `contract.service.ts`、`invoice.service.ts`、`payment.service.ts` 三处，没有统一的状态机抽象。
13. **日期处理不一致**。`renewal_reminder_days` 是 `enum('5','30','60')` 字符串，不是整数。这种硬编码枚举在业务变化时必然要改表。

---

## 4. 推荐目标模型

### 4.1 合同族谱（Contract Family）

```
Contract (新增字段)
├── type: enum('main', 'maintenance', 'renewal', 'supplement', 'standalone')
├── parent_contract_id: FK → Contract (nullable)  -- 运维/补充挂主合同
├── previous_contract_id: FK → Contract (nullable) -- 续签链（保留现有）
└── supplement_of_id: FK → Contract (nullable)     -- 补充协议指向被补充的合同
```

**类型语义**：
- `main`：主合同，可挂运维子合同，可被续签
- `maintenance`：运维合同，必须挂 `parent_contract_id`
- `renewal`：续签合同，必须挂 `previous_contract_id`
- `supplement`：补充协议，必须挂 `supplement_of_id`，**不创建新合同链**
- `standalone`：一次性合同，无族谱关系

**补充协议的特殊处理**：补充协议不应该创建新的合同记录，而应该创建 `ContractAmendment` 记录（原合同 ID、变更字段、变更金额、生效日期）。当前 `previous_contract_id` 被滥用为"补充协议"的入口，这是 P0 问题。

### 4.2 付款方与分摊

```
Payment (新增字段)
├── payer_customer_id: FK → Customer (nullable)  -- 实际付款方
└── on_behalf_of_id: FK → Customer (nullable)    -- 代付场景：替谁付

ContractCostAllocation (新表)
├── contract_id: FK → Contract
├── customer_id: FK → Customer
├── ratio: decimal(5,4)  -- 分摊比例，0.0000-1.0000
├── amount: decimal(15,2)
└── effective_date: date

Customer (新增字段)
└── parent_customer_id: FK → Customer (nullable)  -- 集团层级
```

**甲签乙付**：`payer_customer_id` ≠ `contract.customer_id`，`on_behalf_of_id` = `contract.customer_id`。
**集团代付**：付款方的 `parent_customer_id` 指向集团，`on_behalf_of_id` 指向子公司。
**多方分摊**：`ContractCostAllocation` 记录每个客户的分摊比例，所有比例之和必须 = 1.0000（数据库 CHECK 约束）。

### 4.3 状态机统一

抽取 `ContractStateMachine` 服务，集中所有状态转换规则：

```
draft → active: 首次开票 / 上传附件
active → completed: 所有发票已付款
active → expired_non_renewed: 到期且未续签
active → cancelled: 手动取消
* → cancelled: 任何状态可取消（需审批）
```

不再让 `invoice.service.ts` 和 `payment.service.ts` 各自调用 `contractRepository.update`。

---

## 5. 迁移策略

### 5.1 原则

- **向后兼容**：所有新增字段 nullable，老数据不需要立即迁移。
- **渐进式**：先加字段和表，再改 UI，最后清理旧逻辑。
- **不重写订阅模块**：订阅和合同保持独立，通过 `subscription_renewal_attachments.attachment_type = 'contract'` 的记录关联到合同 ID（新增 `contract_id` 字段），不做数据合并。

### 5.2 迁移步骤

**Phase 0 — 数据模型补全（2-3 天）**

```sql
-- 1. 合同类型
ALTER TABLE contracts ADD COLUMN type ENUM('main','maintenance','renewal','supplement','standalone') 
  DEFAULT 'standalone' AFTER customer_id;

-- 2. 合同族谱
ALTER TABLE contracts ADD COLUMN parent_contract_id INT NULL AFTER previous_contract_id;
ALTER TABLE contracts ADD COLUMN supplement_of_id INT NULL AFTER parent_contract_id;
ALTER TABLE contracts ADD CONSTRAINT fk_contract_parent FOREIGN KEY (parent_contract_id) REFERENCES contracts(id);
ALTER TABLE contracts ADD CONSTRAINT fk_contract_supplement FOREIGN KEY (supplement_of_id) REFERENCES contracts(id);

-- 3. 付款方
ALTER TABLE payments ADD COLUMN payer_customer_id INT NULL AFTER invoice_id;
ALTER TABLE payments ADD COLUMN on_behalf_of_id INT NULL AFTER payer_customer_id;
ALTER TABLE payments ADD CONSTRAINT fk_payment_payer FOREIGN KEY (payer_customer_id) REFERENCES customers(id);
ALTER TABLE payments ADD CONSTRAINT fk_payment_behalf FOREIGN KEY (on_behalf_of_id) REFERENCES customers(id);

-- 4. 分摊表
CREATE TABLE contract_cost_allocations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contract_id INT NOT NULL,
  customer_id INT NOT NULL,
  ratio DECIMAL(5,4) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  effective_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contract_id) REFERENCES contracts(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  CONSTRAINT chk_ratio_sum CHECK (...)  -- 应用层校验更实际
);

-- 5. 客户层级
ALTER TABLE customers ADD COLUMN parent_customer_id INT NULL AFTER kit_id;
ALTER TABLE customers ADD CONSTRAINT fk_customer_parent FOREIGN KEY (parent_customer_id) REFERENCES customers(id);
```

**Phase 1 — 后端 API 扩展（3-5 天）**

- `ContractController.create` 接受 `type`, `parent_contract_id`, `supplement_of_id`。
- `PaymentController.create` 接受 `payer_customer_id`, `on_behalf_of_id`。
- 新增 `ContractCostAllocationController` CRUD。
- 新增 `ContractService.getContractFamily(id)` 返回主合同+运维+续签+补充的完整族谱。
- 抽取 `ContractStateMachine`，替换散落在三处的状态转换逻辑。

**Phase 2 — 前端表单改造（5-7 天）**

- 合同表单改为**向导式**：第一步选类型 → 第二步按类型展开不同字段。
- 付款表单增加"付款方"下拉，默认 = 合同客户，可切换。
- 新增"分摊配置"面板，在合同详情页可编辑。
- 客户表单增加"上级客户"下拉，支持集团层级。

**Phase 3 — 数据清洗（2-3 天）**

- 根据 `title` 和 `is_renewable` 推断现有合同的 `type`，批量更新。
- 识别被错误建模为"续签"的补充协议，迁移到 `ContractAmendment` 表。
- 校验所有分摊比例之和 = 1.0。

---

## 6. 前端引导方案

### 6.1 合同创建向导

**当前**：平铺 20+ 字段。
**目标**：三步向导。

```
Step 1: 选择合同类型
┌─────────────────────────────────────┐
│  请选择合同类型                       │
│                                     │
│  ○ 主合同 — 长期服务的主协议          │
│  ○ 运维合同 — 挂靠在主合同下的运维     │
│  ○ 续签合同 — 到期后续签的新合同       │
│  ○ 补充协议 — 变更现有合同的金额/期限  │
│  ○ 一次性合同 — 项目制，无续签         │
│                                     │
│  [i] 不确定选哪个？查看合同类型说明 →   │
└─────────────────────────────────────┘

Step 2: 填写基本信息（按类型动态渲染）
- 主合同：客户、金额、日期、是否续签
- 运维合同：选择主合同（下拉，只显示同客户的主合同）
- 续签合同：选择旧合同（下拉，自动填充客户/金额/业务分类）
- 补充协议：选择被补充合同（下拉，显示变更字段输入）
- 一次性合同：同主合同，但隐藏续签配置

Step 3: 确认并提交
- 显示合同族谱预览（如果是运维/续签/补充）
- 显示金额和日期校验结果
```

### 6.2 空状态引导

| 场景 | 当前 | 目标 |
|---|---|---|
| 合同无发票 | ✅ "立即开票"按钮 | 保持 |
| 合同无续签链 | ❌ 无提示 | 增加"这是首份合同，到期后可创建续签"提示 |
| 付款无记录 | ⚠️ 只有表格空 | 增加"登记收款"按钮 + "为什么没有收款？"帮助链接 |
| 分摊未配置 | ❌ 不存在 | 合同详情页增加"配置分摊"入口，提示"多个客户共同承担此合同？" |

### 6.3 错误恢复

- **草稿自动保存**：`ContractForm` 每 30 秒 `localStorage.setItem('contract_draft_' + kitId, JSON.stringify(form))`，页面加载时恢复。
- **提交失败重试**：全局错误 toast，带"重试"按钮，不丢失表单数据。
- **字段校验前置**：金额 > 0、结束日期 > 开始日期、分摊比例之和 = 1.0，在失焦时立即校验，不等提交。

---

## 7. 验收标准

### 7.1 数据模型验收

- [ ] `contracts.type` 字段存在，枚举值 5 种，默认 `standalone`。
- [ ] `contracts.parent_contract_id` 和 `supplement_of_id` 存在，外键约束正确。
- [ ] `payments.payer_customer_id` 存在，可空，外键约束正确。
- [ ] `contract_cost_allocations` 表存在，`(contract_id, customer_id)` 唯一约束。
- [ ] 应用层校验：同一合同的分摊比例之和 = 1.0000（允许浮点误差 0.0001）。

### 7.2 业务场景验收

- [ ] **甲签乙付**：创建合同 A（客户 X），创建付款 P（payer = 客户 Y，on_behalf_of = 客户 X），付款记录正确关联。
- [ ] **集团代付**：客户 X 的 `parent_customer_id` = 集团 G，创建付款 P（payer = G，on_behalf_of = X），查询集团代付列表能返回 P。
- [ ] **多方分摊**：合同 C 金额 100 万，配置分摊：客户 A 60%、客户 B 40%，创建付款时自动显示分摊明细。
- [ ] **合同族谱**：主合同 M 下挂运维合同 W1、W2，补充协议 S，续签合同 R。查询 `getContractFamily(M.id)` 返回完整族谱树。
- [ ] **补充协议不创建新链**：补充协议 S 的 `previous_contract_id` = null，`supplement_of_id` = M.id。合同链统计不包含 S。

### 7.3 前端验收

- [ ] 合同创建向导三步完成，类型选择后动态渲染对应字段。
- [ ] 付款表单"付款方"下拉可切换，默认 = 合同客户。
- [ ] 合同详情页显示族谱面板（主合同 → 运维 → 续签 → 补充）。
- [ ] 表单草稿自动保存，刷新页面后恢复。
- [ ] 所有空状态有 CTA 按钮和帮助链接。

---

## 8. 分阶段实施计划

| 阶段 | 工期 | 交付物 | 风险 |
|---|---|---|---|
| **Phase 0: 数据模型** | 2-3 天 | 5 条 ALTER/CREATE 迁移脚本，回滚脚本 | 低。向后兼容，老数据不受影响。 |
| **Phase 1: 后端 API** | 3-5 天 | 4 个新接口（合同族谱、分摊 CRUD），2 个接口扩展（合同创建、付款创建），`ContractStateMachine` 抽取 | 中。状态机抽取可能影响现有发票/付款流程，需回归测试。 |
| **Phase 2: 前端向导** | 5-7 天 | 合同创建向导、付款方选择、分摊面板、族谱面板、草稿保存 | 中。向导改造涉及 `ContractForm.vue` 30KB 大文件，需拆分组件。 |
| **Phase 3: 数据清洗** | 2-3 天 | 批量推断 `type`，迁移错误补充协议，校验分摊比例 | 高。需要人工审核推断结果，不能全自动。 |
| **Phase 4: 订阅模块桥接** | 3-5 天 | `subscription_renewal_attachments` 增加 `contract_id`，订阅续费时可选择关联合同 | 低。增量改造，不动订阅核心逻辑。 |

**总工期：15-23 天**（单人全职）。建议 Phase 0-1 合并为一个 PR，Phase 2 拆为 2-3 个 PR，Phase 3 单独一个 PR（需要 DBA 审核）。

---

## 9. 不推荐做的事

- ❌ **不要重写订阅模块**。订阅和合同保持独立，通过 `contract_id` 桥接即可。合并两个模块的成本远大于收益。
- ❌ **不要引入工作流引擎**。合同状态机用简单的 `switch` 实现即可，不需要 Activiti/Flowable。
- ❌ **不要做微服务拆分**。当前单体 Midway 应用足够支撑到 10 倍数据量。
- ❌ **不要立即迁移到 PostgreSQL**。MySQL 的 `ENUM` 和 `DECIMAL` 足够，迁移成本不值得。
- ❌ **不要在 `Contract` 表加超过 5 个新字段**。族谱关系用 `parent_contract_id` + `supplement_of_id` 两个字段足够，不要加 `is_maintenance`、`is_renewal`、`is_supplement` 三个布尔。

---

## 10. 结论

当前系统的核心问题不是"实现不完善"，而是**领域模型缺位**。四类真实业务场景（合同族谱、甲签乙付、集团代付、多方分摊）在数据库层面没有对应的实体和关系。

最小可行改造：**先补 `contract_type` 枚举 + `payer_customer_id` + `contract_cost_allocations` 表**。这三个改动覆盖了 80% 的需求缺口，工期 5-8 天，向后兼容，老数据不需要迁移。

前端引导的核心问题是**表单平铺无向导**。改为三步向导（选类型 → 填字段 → 确认）后，用户错误率预计下降 50%+。

不要过度设计。不要重写订阅模块。不要引入工作流引擎。先把数据模型补全，其他改造围绕这两个锚点展开。
