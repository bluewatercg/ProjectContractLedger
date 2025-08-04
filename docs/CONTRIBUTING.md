# 🤝 贡献指南

感谢您对 ProjectContractLedger 项目的关注！我们欢迎所有形式的贡献。

## 🎯 贡献方式

### 代码贡献
- 🐛 修复Bug
- ✨ 新增功能  
- ⚡ 性能优化
- 🎨 代码重构

### 文档贡献
- 📝 完善文档
- 🌍 多语言翻译
- 📖 教程编写

### 测试贡献
- 🧪 编写测试用例
- 🔍 问题反馈
- 📊 性能测试

## 🚀 快速开始

### 1. 环境准备
- Node.js >= 16.0.0
- Yarn >= 1.22.0
- MySQL >= 5.7
- Redis >= 5.0

### 2. Fork 和克隆项目
```bash
# 1. Fork 项目到您的GitHub账户
# 2. 克隆您的Fork
git clone https://github.com/YOUR_USERNAME/projectcontractledger.git
cd projectcontractledger

# 3. 添加上游仓库
git remote add upstream https://github.com/bluewatercg/projectcontractledger.git
```

### 3. 设置开发环境
```bash
# 安装依赖
yarn install-all

# 配置环境变量
cp apps/backend/.env.local.template apps/backend/.env.local

# 启动开发服务
yarn start-ps
```

### 4. 创建功能分支
```bash
# 同步最新代码
git fetch upstream
git checkout main
git merge upstream/main

# 创建功能分支
git checkout -b feature/your-feature-name
```

## 📋 开发规范

### 代码风格

#### TypeScript/JavaScript
```typescript
// ✅ 好的示例
export class CustomerService {
  async findById(id: number): Promise<Customer | null> {
    if (!id || id <= 0) {
      throw new BusinessError('无效的客户ID');
    }
    
    return await this.customerRepository.findOne({
      where: { customer_id: id }
    });
  }
}
```

#### Vue 组件
```vue
<template>
  <div class="customer-form">
    <el-form ref="formRef" :model="form" :rules="rules">
      <el-form-item label="客户名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入客户名称" />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import type { FormInstance } from 'element-plus';

const formRef = ref<FormInstance>();
const form = reactive({
  name: '',
  contact_person: ''
});
</script>
```

### API 设计规范

#### RESTful API
```typescript
@Controller('/api/v1/customers')
export class CustomerController {
  @Get('/')
  async list(@Query() query: QueryCustomerDto) {
    // GET /api/v1/customers - 获取客户列表
  }

  @Post('/')
  async create(@Body() createDto: CreateCustomerDto) {
    // POST /api/v1/customers - 创建客户
  }
}
```

## 🧪 测试规范

### 单元测试
```typescript
describe('CustomerService', () => {
  it('should return customer when id exists', async () => {
    // Arrange
    const customerId = 1;
    const expectedCustomer = { customer_id: 1, name: '测试客户' };
    
    // Act
    const result = await service.findById(customerId);
    
    // Assert
    expect(result).toEqual(expectedCustomer);
  });
});
```

## 📝 提交规范

### Commit Message 格式
使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>[optional scope]: <description>
```

#### 示例
```bash
# 新功能
git commit -m "feat(customer): add customer search functionality"

# Bug修复  
git commit -m "fix(api): resolve customer creation validation issue"

# 文档更新
git commit -m "docs: update API development guide"
```

### Pull Request 规范

#### PR 描述模板
```markdown
## 📋 变更类型
- [ ] 新功能 (feat)
- [ ] Bug修复 (fix)
- [ ] 文档更新 (docs)

## 📝 变更描述
简要描述本次变更的内容和目的。

## 🧪 测试
- [ ] 单元测试已通过
- [ ] 集成测试已通过
- [ ] 手动测试已完成

## ✅ 检查清单
- [ ] 代码遵循项目规范
- [ ] 已添加必要的测试
- [ ] 文档已更新
```

## 🐛 问题报告

### Bug 报告模板
```markdown
## 🐛 Bug描述
简要描述遇到的问题。

## 🔄 复现步骤
1. 进入 '...'
2. 点击 '....'
3. 看到错误

## 🎯 期望行为
描述您期望发生的行为。

## 🖥️ 环境信息
- OS: [e.g. Windows 10]
- Browser: [e.g. Chrome 96]
- Node.js: [e.g. 16.14.0]
- 项目版本: [e.g. v2.1.0]
```

## 📞 获取帮助

如果您在贡献过程中遇到任何问题：

- 📖 查看 [开发文档](development/API_Development_Guide.md)
- 🐛 提交 [Issue](https://github.com/bluewatercg/projectcontractledger/issues)
- 💬 参与 [讨论](https://github.com/bluewatercg/projectcontractledger/discussions)

## 📄 许可证

通过贡献代码，您同意您的贡献将在 [MIT License](../LICENSE) 下获得许可。

---

再次感谢您对 ProjectContractLedger 项目的贡献！🎉