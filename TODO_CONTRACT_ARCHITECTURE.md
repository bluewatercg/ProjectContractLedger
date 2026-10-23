# 合同关联与代付架构改造 Todo

> 目标：在不引入集团组织树、老板实体或代付审批工作流的前提下，支持主合同/运维合同/续签/补充协议、甲签乙付、发票级多付款方分摊，并提供业务语言引导 UI。
>
> 协作规则：Herdr 一个 pane 只修改一个文件；任务之间不得交叉修改；不得重写或覆盖用户已有无关变更。各 pane 修改前读取当前文件，完成后仅运行该文件相关的最小检查，不运行全仓库格式化/测试。
>
> 已确认的业务决策：
> - 不增加 `customers.parent_customer_id`、集团/子公司树、老板实体、代付授权工作流。
> - `payments.payer_customer_id` 表示实际付款公司；为空的旧记录按合同客户解释。
> - 暂不增加 `on_behalf_of_id`；合同客户可由 `payment -> invoice -> contract -> customer` 推导。
> - 分摊以发票为边界，使用 `invoice_payment_allocations`；第一期不做跨发票付款核销。
> - `previous_contract_id` 只保留续签链兼容语义；新关系由 `contract_relations` 表达。
>
> ## 共享接口契约
>
> ### 合同
> - `contract_type`: `main | maintenance | renewal | supplement | standalone`。
> - `contract_relations`: `source_contract_id`, `target_contract_id`, `relation_type`，关系类型为 `main_operation | main_supplement | renewal | replacement | related`。
> - 运维合同必须关联主合同；续签必须关联前一合同；补充协议必须关联被补充合同；关系双方必须同 `kit_id`，禁止自环。
> - 新增接口保持现有 REST 风格：合同详情返回 `contractType`/`contract_type`、关系列表；新增关系接口以合同 ID 为路径上下文。
>
> ### 付款与分摊
> - `Payment.payer_customer_id` 可空，创建付款未指定时后端使用发票合同客户。
> - `invoice_payment_allocations`: `invoice_id`, `payer_customer_id`, `allocated_amount`, `allocated_ratio`；金额总和等于发票 `total_amount`，比例总和等于 1 或 100%（后端统一规范为 0-1）。
> - 所有新增/修改关联校验 `kit_id`；金额使用数据库 decimal 和字符串/安全数值转换，不依赖浮点累加。
>
> ## 分阶段任务
>
> ### Phase 1：数据库和实体（先完成）
>
> - [ ] `database/migrations/003-contract-architecture.sql`：新增合同类型字段、合同关系表、付款方字段、发票分摊表；包含 kit_id、索引、唯一约束、外键/回滚说明；不得加入集团层级字段。
> - [ ] `apps/backend/src/entity/contract.entity.ts`：增加 `contract_type`，增加关系实体映射，保留 `previous_contract_id`。
> - [ ] `apps/backend/src/entity/payment.entity.ts`：增加可空 `payer_customer_id` 及 Customer 关系。
> - [ ] `apps/backend/src/entity/contract-relation.entity.ts`：创建合同关系实体，枚举、kit、双方合同、时间戳。
> - [ ] `apps/backend/src/entity/invoice-payment-allocation.entity.ts`：创建发票付款分摊实体，枚举/金额/比例/kit/发票/付款方关系。
>
> ### Phase 2：后端 DTO、服务、控制器
>
> - [ ] `apps/backend/src/interface.ts`：扩展合同创建/更新 DTO、付款 DTO；增加关系和分摊 DTO，字段名称与共享契约一致。
> - [ ] `apps/backend/src/service/contract.service.ts`：创建/更新合同类型和关系校验；提供合同关系查询；保留旧续签时间线行为；事务边界不跨文件臆造。
> - [ ] `apps/backend/src/controller/contract.controller.ts`：暴露合同关系查询/创建/删除或合同创建扩展接口，沿用现有响应格式和权限/kit 约束。
> - [ ] `apps/backend/src/service/payment.service.ts`：付款方默认、同 kit 校验、代付展示数据，保持原发票核销行为。
> - [ ] `apps/backend/src/controller/payment.controller.ts`：接受/返回 `payer_customer_id`，错误信息使用中文。
> - [ ] `apps/backend/src/service/invoice.service.ts`：增加发票分摊读取/保存/校验，保证总额和比例约束；发票创建和既有支付流程不回归。
> - [ ] `apps/backend/src/controller/invoice.controller.ts`：增加发票分摊 CRUD/保存入口，复用现有发票 kit 校验。
>
> ### Phase 3：前端类型、API 和表单
>
> - [ ] `apps/frontend/src/api/types.ts`：增加合同类型、关系、付款方、发票分摊类型；保留旧字段可读兼容。
> - [ ] `apps/frontend/src/api/contract.ts`：增加合同关系 API 和扩展创建/更新请求。
> - [ ] `apps/frontend/src/api/payment.ts`：增加付款方字段传输。
> - [ ] `apps/frontend/src/api/invoice.ts`：增加发票分摊 API。
> - [ ] `apps/frontend/src/views/contracts/ContractForm.vue`：改为三步业务向导：选择合同用途 → 按类型填写 → 确认；关系字段用“主合同/上一份合同/被补充合同”文案；保存失败保留输入。
> - [ ] `apps/frontend/src/views/payments/PaymentForm.vue`：增加“本次是谁付款？”单选；选择其他公司代付后才显示代付公司；默认合同客户。
>
> ### Phase 4：详情、空状态和验证
>
> - [ ] `apps/frontend/src/views/contracts/ContractDetail.vue`：增加合同类型/关系/付款配置/待处理事项；空状态必须带 CTA；展示“公司 B 代公司 A 付款”。
> - [ ] `apps/frontend/src/views/invoices/InvoiceDetail.vue`：增加发票付款分摊配置和未完成配置提示；不改变既有开票/收款流程。
> - [ ] `apps/frontend/src/components/ContractRelationPanel.vue`：展示主合同、运维、续签、补充协议分组；区分续签时间线与普通关联。
> - [ ] `apps/backend/test/service/contract.service.test.ts`：补充合同类型/关系、同 kit、自环和旧续签链回归用例。
> - [ ] `apps/backend/test/service/payment.service.test.ts`：新增付款方默认、代付和跨 kit 拒绝用例；若文件不存在由该 pane 创建。
> - [ ] `apps/backend/test/service/invoice.service.test.ts`：新增分摊总额/比例边界与跨 kit 拒绝用例；若文件不存在由该 pane 创建。
>
> ## 协作顺序
>
> 1. Phase 1 五个 pane 可并行；迁移文件先定义数据库字段，实体 pane 只实现对应实体。
> 2. Phase 2 在 Phase 1 完成后并行，但 `interface.ts` 先完成并将契约视为冻结；服务和控制器不得改动其他文件。
> 3. Phase 3 在 Phase 2 API 契约冻结后并行；前端各 pane 只修改指定文件。
> 4. Phase 4 在前端接口完成后并行；最后由主控运行后端定向测试、前端构建和数据库脚本检查。
>
> ## 最终验证
>
> - 后端：`cd apps/backend && yarn test service/contract.service.test.ts service/payment.service.test.ts service/invoice.service.test.ts`。
> - 前端：`cd apps/frontend && yarn build`。
> - 数据库：在测试数据库执行迁移并验证新增表、索引、旧数据默认行为；不得在生产库直接执行。
> - 验收：主合同多个运维合同；续签不混入运维；补充协议不进入续签链；A 签 B 付；单发票多付款方且金额/比例严格校验；跨 kit 关联拒绝；表单失败不丢数据。
