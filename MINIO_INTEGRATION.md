# Minio 集成说明

## 版本 v0.2.8 更新

### 🎉 新功能：双存储支持

现在，markmap-mcp 项目支持同时上传到阿里云 OSS 和 Minio 对象存储，为用户提供两个访问链接：

#### 两个链接的用途

1. **downloadUrl (OSS 下载链接)**

   - 长期有效（5年签名URL）
   - 适合下载和长期归档
   - 稳定可靠的访问方式
   - 示例：`https://aiagenttest.oss-cn-beijing.aliyuncs.com/markmap/文件名.html?签名参数`

2. **previewUrl (Minio 预览链接)**
   - 快速访问
   - 适合即时预览
   - 更短的URL格式
   - 示例：`http://page.thingotech.com.cn/page/文件名.html`

### 📋 返回值格式

#### 成功时（双上传成功）

```json
{
  "success": true,
  "downloadUrl": "https://aiagenttest.oss-cn-beijing.aliyuncs.com/markmap/Python编程-1729152330123.html?Expires=...",
  "previewUrl": "http://page.thingotech.com.cn/page/Python编程-1729152330123.html",
  "filename": "Python编程-1729152330123.html",
  "timestamp": "2025-10-17T08:25:30.123Z",
  "message": "思维导图生成并上传成功（OSS + Minio）"
}
```

#### Minio 上传失败时（降级处理）

```json
{
  "success": true,
  "downloadUrl": "https://aiagenttest.oss-cn-beijing.aliyuncs.com/markmap/Python编程-1729152330123.html?Expires=...",
  "previewUrl": "https://aiagenttest.oss-cn-beijing.aliyuncs.com/markmap/Python编程-1729152330123.html?Expires=...",
  "filename": "Python编程-1729152330123.html",
  "timestamp": "2025-10-17T08:25:30.123Z",
  "message": "思维导图生成并上传成功（仅OSS，Minio上传失败）"
}
```

> 注意：Minio 上传失败时，`previewUrl` 会自动降级为 OSS 链接，确保用户始终能够访问生成的思维导图。

### 🔧 技术实现

#### 新增文件

- `src/utils/minio-uploader.ts` - Minio 上传工具类
  - `MinioUploader` 类：处理文件上传到 Minio
  - `createMinioUploaderFromEnv()` 函数：使用预设配置创建上传器实例

#### 修改文件

1. **src/markmap/createMarkmap.ts**

   - 添加 `minioUploader` 参数支持
   - 添加 Minio 上传逻辑
   - 更新返回值接口，新增 `minioUrl` 和 `uploadedToMinio` 字段

2. **src/mcp/tools/markmap-tools.ts**

   - 初始化 Minio 上传器
   - 更新返回值格式，使用 `downloadUrl` 和 `previewUrl`
   - 添加降级处理逻辑

3. **package.json**
   - 添加 `minio@^8.0.2` 依赖

### 🔐 Minio 配置

**必需的环境变量（需要配置）：**

```bash
MINIO_ACCESS_KEY=your-minio-access-key
MINIO_SECRET_KEY=your-minio-secret-key
```

**预设配置（已在代码中硬编码）：**

```typescript
const MINIO_ENDPOINT = "119.45.11.171";
const MINIO_BUCKET = "page";
const MINIO_USE_SSL = false;
const MINIO_PREVIEW_URL_BASE = "http://page.thingotech.com.cn/page";
```

**配置说明：**

- ✅ 需要配置：`MINIO_ACCESS_KEY` 和 `MINIO_SECRET_KEY`
- ✅ 已预设：端点、存储桶、SSL设置、预览URL基础路径

### 🚀 使用方法

#### 安装依赖

```bash
npm install
```

#### 构建项目

```bash
npm run build
```

#### 运行项目

```bash
npm start
```

### 📊 工作流程

1. 用户输入文本描述
2. 调用通义千问 AI 生成 Markdown
3. 将 Markdown 转换为思维导图 HTML
4. **同时上传到 OSS 和 Minio**
5. 返回两个访问链接
6. 删除本地临时文件

### 🛡️ 容错机制

- **OSS 上传失败**：整个流程失败，返回错误信息
- **Minio 上传失败**：不影响整体流程，`previewUrl` 降级为 OSS 链接，记录警告日志

### 📝 迁移指南

#### 从 v0.2.7 升级到 v0.2.8

**返回值字段变更：**

| v0.2.7 | v0.2.8        | 说明                   |
| ------ | ------------- | ---------------------- |
| `url`  | `downloadUrl` | OSS 下载链接           |
| -      | `previewUrl`  | Minio 预览链接（新增） |

**代码适配示例：**

```javascript
// v0.2.7
const response = JSON.parse(result);
console.log(response.url);

// v0.2.8
const response = JSON.parse(result);
console.log(response.downloadUrl); // OSS 下载链接
console.log(response.previewUrl); // Minio 预览链接
```

### 🔍 测试

运行测试：

```bash
npm test
```

### 📚 相关文档

- [README_zh-CN.md](./README_zh-CN.md) - 中文文档
- [README.md](./README.md) - 英文文档
- [CHANGELOG.md](./CHANGELOG.md) - 更新日志

### 🙏 致谢

本次集成参考了 [deepsiteAgent-main](./deepsiteAgent-main) 项目的 Minio 上传实现。

---

**更新时间**: 2025-10-17  
**版本**: v0.2.8
