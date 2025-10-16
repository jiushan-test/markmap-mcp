# Markmap MCP Server

![Sample Mindmap](./docs/markmap.svg)

[![NPM Version](https://img.shields.io/npm/v/@jiushan93/markmap-mcp-server.svg)](https://www.npmjs.com/package/@jiushan93/markmap-mcp-server)
[![GitHub License](https://img.shields.io/github/license/jiushan-test/markmap-mcp.svg)](LICENSE)
[![中文文档](https://img.shields.io/badge/中文文档-点击查看-blue)](README_zh-CN.md)
[![Stars](https://img.shields.io/github/stars/jiushan-test/markmap-mcp)](https://github.com/jiushan-test/markmap-mcp)

Markmap MCP Server is based on the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/introduction) that allows one-click conversion of Markdown text to interactive mind maps, built on the open source project [markmap](https://github.com/markmap/markmap). The generated mind maps support rich interactive operations and can be exported in various image formats.

> 🎉 **Explore More Mind Mapping Tools**
>
> Try [MarkXMind](https://github.com/jinzcdev/markxmind) - An online editor that creates complex mind maps using simple XMindMark syntax. It supports real-time preview, multi-format export (.xmind/.svg/.png), importing existing XMind files. [Try it now](https://markxmind.js.org/)!

## Features

- 🤖 **AI-Powered Generation**: Generate mind maps from plain text using Alibaba Cloud Qwen AI (NEW in v0.2.0)
- 🌠 **Markdown to Mind Map**: Convert Markdown text to interactive mind maps
- 🔗 **URL Download Support**: Download Markdown files directly from URLs for conversion
- ☁️ **Aliyun OSS Integration**: Automatically upload generated mind maps to Aliyun Object Storage and get online access links
- 🖼️ **Multi-format Export**: Support for exporting as PNG, JPG, and SVG images
- 🔄 **Interactive Operations**: Support for zooming, expanding/collapsing nodes, and other interactive features
- 📋 **Markdown Copy**: One-click copy of the original Markdown content
- 🧹 **Auto Cleanup**: Automatically delete local temporary files after OSS upload

## Prerequisites

1. Node.js (v20 or above)

## Installation

### Manual Installation

```bash
# Install from npm
npm install @jiushan93/markmap-mcp-server -g

# Basic run
npx -y @jiushan93/markmap-mcp-server

# Specify output directory
npx -y @jiushan93/markmap-mcp-server --output /path/to/output/directory
```

Alternatively, you can clone the repository and run locally:

```bash
# Clone the repository
git clone https://github.com/jiushan-test/markmap-mcp.git

# Navigate to the project directory
cd markmap-mcp

# Build project
npm install && npm run build

# Run the server
node build/index.js
```

## Usage

### Configuration (AI and OSS Required)

**⚠️ Important: This tool requires API keys from environment variables to work.**

The following configurations are **pre-configured** in the code:

- OSS Bucket: `aiagenttest`
- OSS Region: `oss-cn-beijing`
- OSS Endpoint: `oss-cn-beijing.aliyuncs.com`
- Qwen Model: `qwen3-235b-a22b-thinking-2507`
- API URL: `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions`

**You only need to provide the API keys:**

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
        "OSS_ACCESS_KEY_SECRET": "your-oss-access-key-secret"
      }
    }
  }
}
```

> [!IMPORTANT]
>
> ### Environment Variables
>
> **Required API Keys (Must be configured):**
>
> - `DASHSCOPE_API_KEY` or `QWEN_API_KEY`: Your Alibaba Cloud DashScope API key **(Required)**
>   - Get from: https://dashscope.console.aliyun.com/
> - `OSS_ACCESS_KEY_ID`: Aliyun OSS Access Key ID **(Required)**
> - `OSS_ACCESS_KEY_SECRET`: Aliyun OSS Access Key Secret **(Required)**
>
> **Pre-configured Settings (Hard-coded in the application):**
>
> - Model: `qwen3-235b-a22b-thinking-2507`
> - API URL: `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions`
> - OSS Bucket: `aiagenttest`
> - OSS Region: `oss-cn-beijing`
> - OSS Endpoint: `oss-cn-beijing.aliyuncs.com`
>
> **Optional Configuration:**
>
> - `MARKMAP_DIR`: Specify the output directory for temporary files (defaults to system temp directory)
>
> **⚠️ Important Notes:**
>
> - Only API keys need to be configured via environment variables
> - All other settings (bucket, region, model) are pre-configured
> - Mind maps are stored in OSS and return signed URLs (5-year validity)
> - Temporary local files are automatically deleted after OSS upload

## Available Tool

### text-to-mindmap

**Convert plain text descriptions into interactive mind maps using AI.**

The text will be processed by Qwen AI model to generate structured Markdown, then converted to a mind map and automatically uploaded to OSS.

**Parameters:**

- `text`: Text description to convert into a mind map (required string)

**Example:**

```javascript
{
  "text": "Python programming basics"
}
```

**Return Value:**

On success, returns only the URL:

```
https://aiagenttest.oss-cn-beijing.aliyuncs.com/markmap/Python-programming-basics-1234567890.html?...
```

On failure, returns error details:

```json
{
  "success": false,
  "error": "OSS upload failed",
  "message": "思维导图已生成，但OSS上传失败",
  "localPath": "/path/to/local/file.html"
}
```

**Requirements:**

- ✅ Qwen API configuration (required)
- ✅ OSS configuration (required)

## License

This project is licensed under the [MIT](./LICENSE) License.
