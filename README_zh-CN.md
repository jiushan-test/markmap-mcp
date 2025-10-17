# Markmap MCP 服务器

![Sample Mindmap](./docs/markmap_zh.svg)

[![NPM Version](https://img.shields.io/npm/v/@jiushan93/markmap-mcp-server.svg)](https://www.npmjs.com/package/@jiushan93/markmap-mcp-server)
[![GitHub License](https://img.shields.io/github/license/jiushan-test/markmap-mcp.svg)](LICENSE)
[![English Doc](https://img.shields.io/badge/English-Click-blue)](README.md)
[![Stars](https://img.shields.io/github/stars/jiushan-test/markmap-mcp)](https://github.com/jiushan-test/markmap-mcp)

Markmap MCP Server 基于 [模型上下文协议 (MCP)](https://modelcontextprotocol.io/introduction)，可将 Markdown 文本一键转换为交互式思维导图，底层采用开源项目 [markmap](https://github.com/markmap/markmap)。生成的思维导图支持丰富的交互操作，并可导出为多种图片格式。

> 🎉 **探索更多思维导图工具**
>
> 试试 [MarkXMind](https://github.com/jinzcdev/markxmind) - 一款使用简洁的 XMindMark 语法创建复杂思维导图的在线编辑器。支持实时预览、多格式导出(.xmind/.svg/.png)、导入现有 XMind 文件。[立即体验](https://markxmind.js.org/)！

## 特性

- 🤖 **AI 智能生成**：使用阿里云通义千问 AI 从文本描述生成思维导图（v0.2.0 新增）
- 🌠 **Markdown 转思维导图**：将 Markdown 文本转换为交互式思维导图
- 🔗 **双存储支持**：同时上传到阿里云 OSS 和 Minio，提供下载链接和预览链接（v0.2.8 新增）
- ☁️ **阿里云 OSS 集成**：自动上传生成的思维导图到阿里云对象存储，返回在线访问链接
- 🚀 **Minio 快速预览**：提供 Minio 预览链接，实现快速访问
- 🖼️ **多格式导出**：支持导出为 PNG、JPG、SVG 格式的图片，以及 XMind 兼容格式
- 🔄 **交互式操作**：支持缩放、展开/折叠节点等交互功能
- 📋 **Markdown 复制**：一键复制原始 Markdown 内容
- 🧹 **自动清理**：OSS 上传后自动删除本地临时文件

## 前提条件

1. Node.js (v20 或以上)

## 安装

### 手动安装

```bash
# 从 npm 安装
npm install @jiushan93/markmap-mcp-server -g

# 基本运行
npx -y @jiushan93/markmap-mcp-server

# 指定输出目录
npx -y @jiushan93/markmap-mcp-server --output /path/to/output/directory
```

或者，您可以克隆仓库并在本地运行：

```bash
# 克隆仓库
git clone https://github.com/jiushan-test/markmap-mcp.git

# 导航到项目目录
cd markmap-mcp

# 构建项目
npm install && npm run build

# 运行服务器
node build/index.js
```

## 使用方法

### 配置（必须配置 AI 和 OSS）

**⚠️ 重要提示：本工具需要配置 API 密钥才能使用。**

以下配置已在代码中**预设**：

- OSS 存储桶：`aiagenttest`
- OSS 区域：`oss-cn-beijing`
- OSS 端点：`oss-cn-beijing.aliyuncs.com`
- 通义千问模型：`qwen3-235b-a22b-thinking-2507`
- API 地址：`https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions`

**您需要提供以下 API 密钥：**

```json
{
  "mcpServers": {
    "markmap": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@jiushan93/markmap-mcp-server"],
      "env": {
        "DASHSCOPE_API_KEY": "sk-your-dashscope-api-key",
        "OSS_ACCESS_KEY_ID": "your-oss-access-key-id",
        "OSS_ACCESS_KEY_SECRET": "your-oss-access-key-secret",
        "MINIO_ACCESS_KEY": "your-minio-access-key",
        "MINIO_SECRET_KEY": "your-minio-secret-key"
      }
    }
  }
}
```

> [!IMPORTANT]
>
> ### 环境变量说明
>
> **必需的 API 密钥（必须配置）：**
>
> - `DASHSCOPE_API_KEY` 或 `QWEN_API_KEY`：阿里云 DashScope API 密钥 **（必需）**
>   - 获取地址：https://dashscope.console.aliyun.com/
> - `OSS_ACCESS_KEY_ID`：阿里云 OSS 访问密钥 ID **（必需）**
> - `OSS_ACCESS_KEY_SECRET`：阿里云 OSS 访问密钥 Secret **（必需）**
> - `MINIO_ACCESS_KEY`：Minio 访问密钥 **（必需）**
> - `MINIO_SECRET_KEY`：Minio 访问密钥 Secret **（必需）**
>
> **预设配置（已在程序中硬编码）：**
>
> - 模型：`qwen3-235b-a22b-thinking-2507`
> - API 地址：`https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions`
> - OSS 存储桶：`aiagenttest`
> - OSS 区域：`oss-cn-beijing`
> - OSS 端点：`oss-cn-beijing.aliyuncs.com`
> - Minio 端点：`119.45.11.171`
> - Minio 存储桶：`page`
> - Minio 预览URL：`http://page.thingotech.com.cn/page`
>
> **可选配置：**
>
> - `MARKMAP_DIR`：指定临时文件的输出目录（默认为系统临时目录）
>
> **⚠️ 重要说明：**
>
> - 需要配置 5 个 API 密钥环境变量（DashScope、OSS、Minio）
> - 其他设置（存储桶、区域、模型、端点）已预先配置
> - 思维导图同时上传到 OSS 和 Minio，返回两个链接
> - OSS 链接有效期 5 年，Minio 链接用于快速预览
> - 本地临时文件在上传后会自动删除

## 可用工具

### text-to-mindmap

**使用 AI 将文本描述转换为交互式思维导图。**

输入的文本将由通义千问 AI 处理并生成结构化的 Markdown，然后转换为思维导图并自动上传到 OSS。

**参数：**

- `text`：要转换为思维导图的文本描述（必需字符串）

**使用示例：**

```javascript
{
  "text": "Python 编程基础知识"
}
```

**返回值：**

成功时返回结构化的 JSON 响应（包含两个链接）：

```json
{
  "success": true,
  "downloadUrl": "https://aiagenttest.oss-cn-beijing.aliyuncs.com/markmap/Python编程基础知识-1234567890.html?...",
  "previewUrl": "http://page.thingotech.com.cn/page/Python编程基础知识-1234567890.html",
  "filename": "Python编程基础知识-1234567890.html",
  "timestamp": "2025-10-17T07:45:30.123Z",
  "message": "✓ 思维导图生成成功！（OSS + Minio 双存储）\n\n[📥 下载文件](https://aiagenttest.oss-cn-beijing.aliyuncs.com/markmap/Python编程基础知识-1234567890.html?...)\n\n[👁️ 在线预览](http://page.thingotech.com.cn/page/Python编程基础知识-1234567890.html)\n\n📄 文件名：Python编程基础知识-1234567890.html\n\n💡 提示：点击链接即可访问思维导图，支持缩放、展开/折叠、导出等交互操作。"
}
```

**字段说明：**

- `downloadUrl`: OSS下载链接（长期有效，5年签名URL）
- `previewUrl`: Minio预览链接（快速访问）
- `filename`: 生成的文件名
- `timestamp`: 生成时间戳
- `message`: Markdown 格式的状态消息（包含可点击链接）

失败时返回错误详情：

```json
{
  "success": false,
  "error": "OSS upload failed",
  "message": "思维导图已生成，但OSS上传失败",
  "localPath": "/path/to/local/file.html"
}
```

**配置要求：**

- ✅ 通义千问 API 配置（必需）
- ✅ OSS 配置（必需）

**可用的导出格式：**

生成的思维导图HTML包含多种导出格式按钮（中文界面）：

- 📸 **导出 PNG**：导出为PNG图片
- 📸 **导出 JPG**：导出为JPG图片
- 📸 **导出 SVG**：导出为SVG矢量图
- 🧠 **导出 .mm 文件**：导出为FreeMind格式（.mm文件）- 可在XMind、FreeMind、Freeplane中打开
- 📋 **复制 Markdown**：复制原始Markdown内容

## 许可证

本项目采用 [MIT](./LICENSE) 许可证。
