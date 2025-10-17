# MCP 服务器端修改方案（最优解）

## 核心思路

既然你能控制 MCP 服务器的返回值，那就在 **`message` 字段里直接嵌入完整的链接**，框架的总结智能体会原样输出 message 内容。

## 当前返回值（需要修改）

```json
{
  "success": true,
  "downloadUrl": "https://aiagenttest.oss-cn-beijing.aliyuncs.com/markmap/Python-programming-basics-1234567890.html?...",
  "previewUrl": "http://page.thingotech.com.cn/page/Python-programming-basics-1234567890.html",
  "filename": "Python-programming-basics-1234567890.html",
  "timestamp": "2025-10-17T07:45:30.123Z",
  "message": "思维导图生成并上传成功（OSS + Minio）"
}
```

## 修改后的返回值（推荐格式 - Markdown 超链接）

```json
{
  "success": true,
  "downloadUrl": "https://aiagenttest.oss-cn-beijing.aliyuncs.com/markmap/Python-programming-basics-1234567890.html?...",
  "previewUrl": "http://page.thingotech.com.cn/page/Python-programming-basics-1234567890.html",
  "filename": "Python-programming-basics-1234567890.html",
  "timestamp": "2025-10-17T07:45:30.123Z",
  "message": "✓ 思维导图生成成功！\n\n[📥 下载文件](https://aiagenttest.oss-cn-beijing.aliyuncs.com/markmap/Python-programming-basics-1234567890.html?...)\n\n[👁️ 在线预览](http://page.thingotech.com.cn/page/Python-programming-basics-1234567890.html)\n\n📄 文件名：Python-programming-basics-1234567890.html\n\n💡 提示：点击链接即可访问思维导图，支持缩放、展开/折叠等交互操作。"
}
```

### 如果前端不支持 Markdown，使用 HTML 格式

```json
{
  "success": true,
  "downloadUrl": "https://aiagenttest.oss-cn-beijing.aliyuncs.com/markmap/Python-programming-basics-1234567890.html?...",
  "previewUrl": "http://page.thingotech.com.cn/page/Python-programming-basics-1234567890.html",
  "filename": "Python-programming-basics-1234567890.html",
  "timestamp": "2025-10-17T07:45:30.123Z",
  "message": "✓ 思维导图生成成功！\n\n<a href=\"https://aiagenttest.oss-cn-beijing.aliyuncs.com/markmap/Python-programming-basics-1234567890.html?...\" target=\"_blank\">📥 下载文件</a>\n\n<a href=\"http://page.thingotech.com.cn/page/Python-programming-basics-1234567890.html\" target=\"_blank\">👁️ 在线预览</a>\n\n📄 文件名：Python-programming-basics-1234567890.html\n\n💡 提示：点击链接即可访问思维导图，支持缩放、展开/折叠等交互操作。"
}
```

## 代码实现示例

### 方案 1：Markdown 格式（推荐）

**Python 实现**

```python
def generate_mindmap_response(download_url, preview_url, filename, timestamp):
    """
    生成 Markdown 超链接格式的 message
    前端支持 Markdown 渲染时使用
    """
    message = f"""✓ 思维导图生成成功！

[📥 下载文件]({download_url})

[👁️ 在线预览]({preview_url})

📄 文件名：{filename}

💡 提示：点击链接即可访问思维导图，支持缩放、展开/折叠等交互操作。"""

    return {
        "success": True,
        "downloadUrl": download_url,
        "previewUrl": preview_url,
        "filename": filename,
        "timestamp": timestamp,
        "message": message
    }
```

**JavaScript/TypeScript 实现**

```javascript
function generateMindmapResponse(downloadUrl, previewUrl, filename, timestamp) {
  const message = `✓ 思维导图生成成功！

[📥 下载文件](${downloadUrl})

[👁️ 在线预览](${previewUrl})

📄 文件名：${filename}

💡 提示：点击链接即可访问思维导图，支持缩放、展开/折叠等交互操作。`;

  return {
    success: true,
    downloadUrl,
    previewUrl,
    filename,
    timestamp,
    message
  };
}
```

### 方案 2：HTML 格式（备选）

**Python 实现**

```python
def generate_mindmap_response_html(download_url, preview_url, filename, timestamp):
    """
    生成 HTML 超链接格式的 message
    前端支持 HTML 渲染时使用
    """
    message = f"""✓ 思维导图生成成功！

<a href="{download_url}" target="_blank">📥 下载文件</a>

<a href="{preview_url}" target="_blank">👁️ 在线预览</a>

📄 文件名：{filename}

💡 提示：点击链接即可访问思维导图，支持缩放、展开/折叠等交互操作。"""

    return {
        "success": True,
        "downloadUrl": download_url,
        "previewUrl": preview_url,
        "filename": filename,
        "timestamp": timestamp,
        "message": message
    }
```

**JavaScript/TypeScript 实现**

```javascript
function generateMindmapResponseHTML(
  downloadUrl,
  previewUrl,
  filename,
  timestamp
) {
  const message = `✓ 思维导图生成成功！

<a href="${downloadUrl}" target="_blank">📥 下载文件</a>

<a href="${previewUrl}" target="_blank">👁️ 在线预览</a>

📄 文件名：${filename}

💡 提示：点击链接即可访问思维导图，支持缩放、展开/折叠等交互操作。`;

  return {
    success: true,
    downloadUrl,
    previewUrl,
    filename,
    timestamp,
    message
  };
}
```

## 关键要点

### ✅ 为什么这样有效？

1. **框架总结智能体会保留 message 内容** - 这是"任务结果描述"
2. **中文 + URL 的组合符合"便于用户理解"** - URL 是描述的一部分
3. **无需修改框架** - 完全在你的控制范围内
4. **用户体验最佳** - 格式化展示，带 emoji 图标

### ⚠️ 注意事项

1. **message 里的 URL 必须完整** - 包含协议（http://、https://）
2. **保持换行格式** - 用 `\n` 确保多行显示
3. **downloadUrl 和 previewUrl 字段保留** - 虽然 message 里有，但保留字段便于未来扩展

## 测试验证

### 方案 1 测试（Markdown 超链接）

MCP 服务器返回：

```json
{
  "success": true,
  "downloadUrl": "https://...",
  "previewUrl": "http://...",
  "filename": "xxx.html",
  "timestamp": "2025-10-17T...",
  "message": "✓ 思维导图生成成功！\n\n[📥 下载文件](https://...)\n\n[👁️ 在线预览](http://...)\n\n📄 文件名：xxx.html\n\n💡 提示：点击链接即可访问思维导图，支持缩放、展开/折叠等交互操作。"
}
```

**前端渲染效果（如果支持 Markdown）：**

✓ 思维导图生成成功！

<u style="color: blue; cursor: pointer;">📥 下载文件</u> ← 可点击

<u style="color: blue; cursor: pointer;">👁️ 在线预览</u> ← 可点击

📄 文件名：xxx.html

💡 提示：点击链接即可访问思维导图，支持缩放、展开/折叠等交互操作。

---

### 方案 2 测试（HTML 超链接）

MCP 服务器返回：

```json
{
  "success": true,
  "downloadUrl": "https://...",
  "previewUrl": "http://...",
  "filename": "xxx.html",
  "timestamp": "2025-10-17T...",
  "message": "✓ 思维导图生成成功！\n\n<a href=\"https://...\" target=\"_blank\">📥 下载文件</a>\n\n<a href=\"http://...\" target=\"_blank\">👁️ 在线预览</a>\n\n📄 文件名：xxx.html\n\n💡 提示：点击链接即可访问思维导图，支持缩放、展开/折叠等交互操作。"
}
```

**前端渲染效果（如果支持 HTML）：**

✓ 思维导图生成成功！

<a href="#" style="color: blue;">📥 下载文件</a> ← 可点击，新标签页打开

<a href="#" style="color: blue;">👁️ 在线预览</a> ← 可点击，新标签页打开

📄 文件名：xxx.html

💡 提示：点击链接即可访问思维导图，支持缩放、展开/折叠等交互操作。

## 总结

- ✅ **不修改 agent-network 框架**
- ✅ **配置文件已优化**（`config/mcp/mindmap.json`）
- ✅ **只需修改 MCP 服务器的 message 字段格式**
- ✅ **用户体验最佳**（第一轮就能看到完整链接）

**下一步：修改你的 MCP 服务器代码，重启服务测试！** 🚀
