# PDF.js 集成与在线预览功能技术实施方案

## 第一阶段：现状分析与评估

此阶段的目标是明确当前项目的技术细节、现有功能和集成新功能可能带来的影响。

1.  **代码审查：**
    *   **技术栈分析：**
        *   **前端框架：** Vue 3 (基于 `apps/frontend/vite.config.ts` 和 `*.vue` 文件)。
        *   **构建工具：** Vite。
        *   **UI 组件库：** 需通过 `apps/frontend/package.json` 确认，可能是 Element Plus, Naive UI 或 Ant Design Vue。
        *   **后端框架：** Midway.js (基于 `apps/backend/src/configuration.ts` 和 `midway-api` 依赖)。
    *   **核心逻辑定位：**
        *   附件预览功能与发票 (`invoices`) 和合同 (`contracts`) 模块强相关。
        *   关键前端组件可能包括：`apps/frontend/src/views/invoices/InvoiceDetail.vue` 和 `apps/frontend/src/components/AttachmentList.vue` (如果存在)。
    *   **数据流分析：**
        *   **API：** 后端通过 `apps/backend/src/service/invoice-attachment.service.ts` 和 `contract-attachment.service.ts` 提供服务。需要审查相关 Controller 以确定附件信息的具体 API 格式。
        *   **前端：** 前端页面调用 API 获取附件列表，当前对非图片文件的操作很可能是直接下载。

2.  **功能梳理：**
    *   **已支持类型：** 至少支持图片格式（如 `.png`, `.jpg`）的预览。
    *   **现有交互：** 图片预览可能支持缩放、切换等。其他文件类型（如 `.txt`, `.docx`）目前可能仅提供下载链接。

3.  **影响评估：**
    *   **主要影响模块：**
        *   **附件展示组件：** 需修改，以便在文件类型为 PDF 时渲染新的 `PdfViewer` 组件。
        *   **API 接口：** 可能需要扩展，增加 `fileType` 或 `mimeType` 字段，便于前端进行逻辑判断。
        *   **构建配置：** `apps/frontend/vite.config.ts` 需更新，以处理 PDF.js 的静态资源（如 worker 文件）。

## 第二阶段：技术方案设计

此阶段设计一个健壮、可复用的 PDF 预览解决方案。

1.  **技术选型：**
    *   **库：** **`pdfjs-dist`**。
    *   **版本：** 选用最新的稳定版 (Stable)。
    *   **集成方式：** **通过 npm 包进行模块化集成**。
    *   **理由：** 便于依赖管理、版本控制，并能利用 Vite 实现按需加载，同时获得 TypeScript 类型支持。

2.  **架构设计 (`PdfViewer.vue` 组件):**
    *   **Props:**
        *   `fileUrl: string` (required): PDF 文件 URL。
        *   `workerSrc: string` (required): PDF.js worker 文件路径。
        *   `cMapUrl: string` (optional): CMap 文件基础路径，用于正确显示亚洲字符。
    *   **Events:**
        *   `onLoadSuccess(pdf: PDFDocumentProxy)`: 文档加载成功。
        *   `onLoadError(error: Error)`: 文档加载失败。
        *   `onPageChange(currentPage: number, totalPages: number)`: 页码变化。
        *   `onClose()`: 关闭预览器。

3.  **功能设计：**
    *   **核心渲染：** 使用 `pdfjsLib.getDocument()` 加载文档，并在 `<canvas>` 元素上渲染页面。
    *   **UI 工具栏：**
        *   **功能：** 上一页/下一页、页码显示/跳转、放大/缩小、全屏、下载、打印。
        *   **实现：** 使用固定的 `div` 作为工具栏容器，通过