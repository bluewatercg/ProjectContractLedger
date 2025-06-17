# 健康检查路径修复说明

## 🔍 问题发现

在测试健康检查接口时发现路径不匹配：

- ❌ 错误路径：`http://192.168.1.115:8000/api/v1/health` → 404错误
- ✅ 正确路径：`http://192.168.1.115:8000/api/health` → 正常返回

## 📋 路径分析

### 后端控制器配置
```typescript
// apps/backend/src/controller/health.controller.ts
@Controller('/health')  // 控制器路径：/health
export class HealthController {
  @Get('/')  // 方法路径：/
  async health() {
    // 健康检查逻辑
  }
}
```

### 实际API路径
- **完整路径**：`/health` + `/` = `/health`
- **通过nginx代理**：`/api/health`（nginx将 `/api/` 代理到后端）

### 为什么不是 `/api/v1/health`？
健康检查接口通常设计为：
1. **无版本号** - 健康检查是基础设施接口，不需要版本控制
2. **简单路径** - 便于监控系统和负载均衡器调用
3. **独立于业务API** - 不受API版本变更影响

## 🛠️ 修复内容

### 1. 部署脚本修复
```bash
# scripts/deploy-production.sh
HEALTH_URL="http://192.168.1.115:8000/api/health"  # 修复路径

# scripts/deploy-production.ps1  
$HealthUrl = "http://192.168.1.115:8000/api/health"  # 修复路径
```

### 2. 文档更新
- ✅ `DEPLOYMENT_GUIDE.md` - 更新健康检查URL
- ✅ `API_PATH_FIX_SUMMARY.md` - 更新验证命令
- ✅ 部署脚本中的健康检查逻辑

### 3. Docker配置确认
Docker容器的健康检查配置是正确的：
```yaml
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost/health"]
```

## 🧪 验证测试

### 正确的健康检查接口
```bash
# 基础健康检查
curl http://192.168.1.115:8000/api/health

# 预期返回
{
  "status": "ok",
  "timestamp": "2025-06-17T08:50:08.235Z",
  "uptime": 43.852150076,
  "version": "1.0.0",
  "environment": "production",
  "checks": {
    "database": "ok",
    "memory": "ok"
  },
  "memory": {
    "heapUsed": "26MB",
    "heapTotal": "28MB",
    "external": "2MB"
  }
}
```

### 其他健康检查端点
```bash
# 简单健康检查
curl http://192.168.1.115:8000/api/health/simple
# 返回：{"status": "ok"}

# 就绪检查
curl http://192.168.1.115:8000/api/health/ready
# 返回：{"status": "ready"}

# 存活检查
curl http://192.168.1.115:8000/api/health/live
# 返回：{"status": "alive", "timestamp": "...", "uptime": ...}
```

## 📊 API路径总结

### 健康检查相关接口
- `/api/health` - 完整健康检查
- `/api/health/simple` - 简单状态检查
- `/api/health/ready` - 就绪检查
- `/api/health/live` - 存活检查

### 业务API接口
- `/api/v1/auth/login` - 用户登录
- `/api/v1/contracts` - 合同管理
- `/api/v1/invoices` - 发票管理
- `/api/v1/attachments` - 附件管理

### 其他接口
- `/api-docs` - API文档
- `/` - 前端页面

## 🎯 最佳实践

### 健康检查设计原则
1. **路径简单** - 使用 `/health` 而不是 `/api/v1/health`
2. **响应快速** - 避免复杂的业务逻辑
3. **信息丰富** - 包含关键组件状态
4. **标准格式** - 使用统一的响应格式

### 监控集成
```bash
# Kubernetes liveness probe
livenessProbe:
  httpGet:
    path: /api/health/live
    port: 80
  initialDelaySeconds: 30
  periodSeconds: 10

# Kubernetes readiness probe  
readinessProbe:
  httpGet:
    path: /api/health/ready
    port: 80
  initialDelaySeconds: 5
  periodSeconds: 5
```

### 负载均衡器配置
```nginx
# Nginx upstream health check
upstream backend {
    server 192.168.1.115:8080;
    # health_check uri=/health;
}
```

## 🚨 注意事项

1. **路径一致性** - 确保所有配置使用相同的健康检查路径
2. **网络访问** - 健康检查路径应该可以从监控系统访问
3. **响应时间** - 健康检查应该快速响应，避免超时
4. **错误处理** - 健康检查失败时应该返回适当的HTTP状态码

## 📈 监控建议

### 监控指标
- **响应时间** - 健康检查接口的响应时间
- **成功率** - 健康检查的成功率
- **数据库状态** - 数据库连接状态
- **内存使用** - 应用内存使用情况

### 告警规则
```yaml
# Prometheus 告警规则示例
- alert: HealthCheckFailed
  expr: up{job="contract-ledger"} == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "应用健康检查失败"
    description: "合同管理系统健康检查连续失败超过1分钟"
```

## 🎉 总结

健康检查路径修复完成：
- ✅ 正确路径：`/api/health`
- ✅ 部署脚本已更新
- ✅ 文档已同步更新
- ✅ 验证测试通过

现在您可以使用正确的健康检查路径进行监控和部署验证了！
