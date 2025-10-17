# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.2.7] - 2025-10-17

### ✨ New Features

- **结构化返回值**: `text-to-mindmap` 工具现在返回结构化的 JSON 响应
  - 包含 `success` 状态
  - 包含 `url` 链接
  - 包含 `filename` 文件名
  - 包含 `timestamp` 时间戳（ISO 8601 格式）
  - 包含 `message` 状态消息

### 📝 Documentation

- 更新 README 和 README_zh-CN，展示新的结构化返回值格式
- 更新返回值示例，展示完整的 JSON 响应结构

### 🔄 Breaking Changes

- **返回格式变更**: 成功时不再只返回纯文本 URL，而是返回包含完整信息的 JSON 对象
  - **旧格式**: `https://aiagenttest.oss-cn-beijing.aliyuncs.com/markmap/file.html?...`
  - **新格式**:
    ```json
    {
      "success": true,
      "url": "https://aiagenttest.oss-cn-beijing.aliyuncs.com/markmap/file.html?...",
      "filename": "file.html",
      "timestamp": "2025-10-17T07:45:30.123Z",
      "message": "思维导图生成并上传成功"
    }
    ```

---

## [0.2.6] - 2025-10-16

### ✨ New Features

- **导出 .mm 文件**: 新增"导出 .mm 文件"按钮，可导出为FreeMind格式（.mm文件）
  - 使用FreeMind XML格式，兼容XMind、FreeMind、Freeplane等思维导图软件
  - 将Markdown结构转换为层级化的思维导图节点
  - 下载的`.mm`文件可在多种思维导图工具中打开
  - 按钮为橙色，视觉上易于区分
  - 导出成功后显示确认提示

### 🌐 Internationalization

- **所有按钮改为中文**: 所有导出和操作按钮文本改为中文
  - "导出 PNG"、"导出 JPG"、"导出 SVG"
  - "导出 .mm 文件"（原"Export XMind"）
  - "复制 Markdown"（原"Copy Markdown"）
  - 所有提示信息和错误消息也改为中文

### 🔧 Technical Details

- Added `exportToFreeMind()` function to convert and download mind map data
- Added `convertMarkdownToFreeMind()` function to parse Markdown into FreeMind XML format
- Supports nested headings (#, ##, ###) and list items (-, \*)
- Properly escapes XML special characters for data safety
- Localized all UI text and error messages to Chinese
- Updated package description to include .mm file export support

---

## [0.2.5] - 2025-10-16

### 🐛 Bug Fixes

- **Fixed Smart File Naming**: Corrected the issue where OSS uploaded files were not using the smart file names based on user input
  - Files are now correctly named with user input (e.g., `计算机科学-1760589461510.html` instead of `markmap-1760589461510.html`)
  - Fixed path separator issue for cross-platform compatibility (Windows/Unix)
  - Used `basename()` function to properly extract file names from paths

### 🔧 Technical Changes

- Updated `createMarkmap.ts`: Now passes local filename to OSS uploader
- Updated `oss-uploader.ts`: Uses `basename()` for cross-platform path handling
- Ensured `markmap/` directory prefix is maintained in OSS storage

---

## [0.2.4] - 2025-10-16

### 🎯 Enhanced User Experience

- **Simplified Return Value**: On success, now returns only the mind map URL (plain text) instead of JSON object
- **Smart File Naming**: Generated files are now named based on user input content (sanitized and truncated to 50 characters)
  - Example: `Python-programming-basics-1234567890.html`
  - Special characters are removed, spaces are converted to hyphens
  - Falls back to `mindmap` if input contains no valid characters

### 🔧 Changes

- **Response Format**: Success response is now just the URL string for easier direct access
- **Error Format**: Failure response still returns detailed JSON with error information
- **File Management**: More meaningful file names for better organization in OSS

### 📝 Documentation

- Updated README files (English and Chinese) with new return value format examples

---

## [0.2.3] - 2025-10-16

### ⚡ Breaking Changes

- **Removed `markdown-to-mindmap` tool**: This tool has been removed. The server now only provides the `text-to-mindmap` tool which uses AI to generate mind maps from plain text descriptions.

### 🔧 Changes

- **Simplified tool set**: Only one tool (`text-to-mindmap`) is now available, making the API simpler and more focused on AI-powered generation.
- **Code cleanup**: Removed HTTP downloader dependency as it's no longer needed.
- **Updated documentation**: Both English and Chinese README files updated to reflect the single tool.

### 📝 Migration Guide

If you were using `markdown-to-mindmap`:

- **For plain text**: Use `text-to-mindmap` instead - it will use AI to structure your content
- **For Markdown content**: Convert your markdown to plain text description and use `text-to-mindmap`
- **For URLs**: Download the content first, then use `text-to-mindmap`

---

## [0.2.2] - 2025-10-16

### 🎯 Simplified Configuration

- **Hardcoded Settings**: Pre-configured OSS bucket (`aiagenttest`), region (`oss-cn-beijing`), endpoint, and Qwen model settings
- **Simplified Setup**: Users now only need to provide 3 environment variables (API keys):
  - `DASHSCOPE_API_KEY` or `QWEN_API_KEY`
  - `OSS_ACCESS_KEY_ID`
  - `OSS_ACCESS_KEY_SECRET`
- **Removed Configuration**: No longer need to configure bucket name, region, endpoint, or model name

### 📝 Documentation

- **Updated README**: Simplified configuration instructions in both English and Chinese
- **Clear Requirements**: Clearly marked which settings are pre-configured vs. which need user input

### 🔧 Code Changes

- **`src/utils/qwen-api.ts`**: Hardcoded model name, API endpoint, and API URL
- **`src/utils/oss-uploader.ts`**: Hardcoded bucket name, region, and endpoint
- **Security**: API keys still must be provided via environment variables (no default values)

---

## [0.2.1] - 2025-10-16

### 📝 Documentation

- **Clarified Configuration Requirements**: Updated both English and Chinese README files to clearly state that both AI (Qwen) and OSS configurations are **required** for all features
- **Removed Local-Only Mode**: Removed references to "local storage only" mode to prevent confusion - all mind maps are stored in OSS
- **Enhanced Security**: Added comprehensive security documentation and improved `.gitignore` to prevent credential leaks
- **Updated Tool Requirements**: Clearly marked which tools require which configurations (AI + OSS for `text-to-mindmap`, OSS only for `markdown-to-mindmap`)

### 🔒 Security

- **Removed Hardcoded Credentials**: Deleted test files containing real API keys and secrets
- **Added Security Guide**: Created `SECURITY.md` with best practices for credential management
- **Enhanced .gitignore**: Added comprehensive patterns to prevent accidental credential commits
- **Added Example Files**: Created `.env.example`, `test-qwen-api.example.js`, and `claude_desktop_config.example.json` with placeholder values

### 🐛 Bug Fixes

- Fixed misleading documentation that suggested local-only mode was available
- Removed confusing `open` parameter that was only relevant for local mode

---

## [0.2.0] - 2025-10-16

### 🎉 Added

#### AI-Powered Features

- **🤖 Text to Mind Map**: New `text_to_mindmap` tool that converts plain text descriptions into interactive mind maps using Qwen AI
- **🧠 Qwen API Integration**: Integrated Alibaba Cloud DashScope (Qwen3-235B) for intelligent Markdown generation
- **☁️ Cloud Storage**: Automatic upload to Alibaba Cloud OSS with signed URLs (5-year validity)
- **🧹 Auto Cleanup**: Automatic deletion of local temporary files after OSS upload

#### New Tools & APIs

- `qwen-api.ts`: Qwen API client for AI-powered content generation
- `createQwenAPIFromEnv()`: Environment-based Qwen API initialization
- `text_to_mindmap` MCP tool: One-sentence mind map generation

#### Documentation

- `README_AI_FEATURE.md`: Comprehensive AI feature documentation
- `QUICK_START_GUIDE.md`: Quick start guide for new users
- `PROCESS_FLOW.md`: Detailed process flow explanation
- `TEST_GUIDE.md`: Complete testing guide
- `FINAL_TEST_REPORT.md`: Test report with validation results
- `PUBLISHING_GUIDE.md`: NPM publishing guide
- `CHANGELOG.md`: This file

### 🔧 Changed

#### Code Improvements

- **Enhanced `createMarkmap()`**: Added `forceOSSUpload` parameter for mandatory cloud upload
- **Refactored Tool Registration**: Split into `registerTextToMindmap()` and `registerMarkdownToMindmap()`
- **Improved File Cleanup**: Enhanced cleanup logic for temporary files
- **Better Error Handling**: Added comprehensive error messages for API and OSS failures

#### Configuration

- **Environment Variables**: Added support for `QWEN_API_KEY`, `DASHSCOPE_API_KEY`, `QWEN_MODEL`, `QWEN_ENDPOINT`
- **OSS Configuration**: Enhanced OSS configuration with better validation
- **Package Keywords**: Added AI-related keywords for better discoverability

### 🐛 Fixed

- Fixed issue where temporary HTML files were not cleaned up in force upload mode
- Improved error messages for missing API keys and OSS configuration

### 📚 Documentation Updates

- Updated `README.md` with AI features
- Enhanced Chinese documentation (`README_zh-CN.md`)
- Added example configuration files

### 🔒 Security

- API keys and secrets stored in environment variables only
- No credentials in code or logs
- Signed URLs with configurable expiration

---

## [0.1.1] - Previous Release

### Features

- Convert Markdown to interactive mind maps
- Support for downloading Markdown from URLs
- Optional upload to Alibaba Cloud OSS
- Export to PNG/JPG/SVG formats
- Interactive toolbar with zoom and expand/collapse
- Copy original Markdown functionality
- Automatic browser preview (local mode)

### Technical Stack

- TypeScript
- Model Context Protocol (MCP)
- markmap-lib for mind map generation
- D3.js for visualization
- Alibaba Cloud OSS for storage

---

## Upgrade Guide

### From 0.1.x to 0.2.0

#### New Environment Variables (Optional)

If you want to use AI features, add these to your configuration:

```json
{
  "env": {
    "QWEN_API_KEY": "sk-your-api-key",
    "OSS_ACCESS_KEY_ID": "your-oss-key",
    "OSS_ACCESS_KEY_SECRET": "your-oss-secret",
    "OSS_BUCKET": "your-bucket",
    "OSS_REGION": "oss-cn-beijing"
  }
}
```

#### New Tools Available

- `text_to_mindmap`: Generate mind maps from text descriptions
- `markdown_to_mindmap`: Original tool (unchanged)

#### Breaking Changes

None! All existing functionality remains unchanged. The new features are additive.

#### Migration Steps

1. Update to v0.2.0: `npm install -g @jinzcdev/markmap-mcp-server@0.2.0`
2. (Optional) Add AI environment variables to your configuration
3. Restart your MCP client (e.g., Claude Desktop)
4. Start using AI-powered mind map generation!

---

## Roadmap

### Planned for v0.3.0

- Support for more AI models (GPT-4, Claude, etc.)
- Custom mind map templates
- Batch processing support
- More export formats
- Improved caching mechanism

### Future Considerations

- Support for more cloud storage providers (AWS S3, Google Cloud Storage)
- Mind map collaboration features
- API rate limiting and quotas
- Performance optimizations
- Enhanced visualization options

---

## Links

- **GitHub Repository**: https://github.com/jinzcdev/markmap-mcp-server
- **NPM Package**: https://www.npmjs.com/package/@jinzcdev/markmap-mcp-server
- **Issues**: https://github.com/jinzcdev/markmap-mcp-server/issues
- **Documentation**: See README files in the repository

---

## Contributors

- **jinzcdev** - Original author and maintainer
- **AI Assistant** - AI feature development

---

**Thank you for using Markmap MCP Server!** 🎉

For questions or support, please open an issue on GitHub.
