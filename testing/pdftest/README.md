# PDF Base64 Proxy Server MVP

一个简单有效的PDF代理服务器，通过Base64编码传输PDF文件，**防止IDM等下载管理器拦截**。

## 🎯 项目特点

- **防IDM拦截**：通过Base64编码传输，IDM无法识别文件类型
- **简单易用**：单文件服务器，开箱即用
- **跨域支持**：内置CORS支持，可在Web应用中调用
- **JSON API**：返回JSON格式的Base64数据，易于前端处理

## 🚀 快速开始

### 方法一：一键启动脚本（推荐）

**完整版启动（推荐新手）：**
```powershell
.\start-services.ps1
```
- 自动启动前后端服务
- 提供交互式菜单
- 可查看实时日志
- 支持一键打开页面

**快速启动：**
```powershell
.\start-quick.ps1
```
- 快速启动，适合熟悉用户
- 后端后台运行，前端前台显示日志

**停止服务：**
```powershell
.\stop-services.ps1
```

### 方法二：手动启动

**启动后端服务器：**
```bash
npm start
# 或者
node pdf-base64-server.js
```

**启动前端Vue应用：**
```bash
npm run dev
```

### 方法三：仅后端服务

1. **启动服务器**：
```bash
npm start
```

2. **打开浏览器访问**：
   - 静态测试页面：`http://localhost:3003`

### 访问服务
- **Vue前端应用**: `http://localhost:3001` （推荐）
- **静态测试页面**: `http://localhost:3003`
- **API接口**: `http://localhost:3003/your-file.pdf`

### API使用示例
```javascript
// 获取PDF的Base64数据
fetch('http://localhost:3003/invoice.pdf')
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // 将Base64转换为Blob URL在iframe中显示
      const binaryString = atob(data.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const pdfUrl = URL.createObjectURL(blob);
      
      // 在iframe中显示PDF
      document.getElementById('pdf-iframe').src = pdfUrl;
    }
  });
```

## 📝 配置说明

在 `pdf-base64-server.js` 中可以修改以下配置：

```javascript
const PORT = 3003;                          // 服务端口
const HFS_BASE_URL = 'http://192.168.1.31:81'; // 目标PDF服务器地址
```

## 🔧 工作原理

1. 接收PDF文件请求
2. 从目标服务器获取PDF文件
3. 将PDF文件转换为Base64编码
4. 以JSON格式返回Base64数据
5. 前端将Base64转换为Blob URL显示

## 🚫 常见问题解决

### CORS错误（跨域问题）

**现象**：直接打开HTML文件时出现“fetch failed”或CORS错误

**原因**：浏览器限制`file://`协议向`http://localhost`的请求

**解决方案**：
1. **优先选择**：访问 `http://localhost:3003`
2. **备选方案**：使用Chrome关闭安全检查：
   ```bash
   chrome --disable-web-security --user-data-dir="/tmp/chrome_dev"
   ```

### 服务器无法启动

**现象**：端口3003被占用

**解决方案**：
```bash
# Windows
Get-Process -Name node | Stop-Process -Force
# 然后重新启动
npm start
```

## 📊 API 响应格式

```json
{
  "success": true,
  "data": "JVBERi0xLjQKMSAwIG9iago...",
  "contentType": "application/pdf",
  "size": 108075
}
```

## 🛡️ 防IDM原理

- **内容类型伪装**：响应Content-Type为`application/json`而非`application/pdf`
- **Base64编码**：文件内容被编码，IDM无法直接识别
- **API接口形式**：以JSON API形式传输，避免被识别为下载链接

## 📞 适用场景

- 在线PDF预览系统
- 防止用户直接下载PDF文件
- 需要绕过下载管理器的场景
- 企业内部文档安全展示

## 📄 许可证

MIT License