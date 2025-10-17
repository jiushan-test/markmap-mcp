# 环境变量配置说明

## 必需的环境变量

### 阿里云 DashScope API（必需）

用于调用 Qwen 大模型生成 Markdown 内容。

```bash
# API 密钥（二选一）
QWEN_API_KEY=sk-xxxxxxxxxxxxxxxxxx
# 或
DASHSCOPE_API_KEY=sk-xxxxxxxxxxxxxxxxxx
```

**获取方式：**

1. 访问 https://dashscope.console.aliyun.com/
2. 注册/登录阿里云账号
3. 开通 DashScope 服务
4. 创建 API Key

---

### 阿里云 OSS（必需）

用于上传生成的思维导图 HTML 文件。

```bash
# OSS 访问密钥 ID
OSS_ACCESS_KEY_ID=your-oss-access-key-id

# OSS 访问密钥 Secret
OSS_ACCESS_KEY_SECRET=your-oss-access-key-secret

# OSS 存储桶名称
OSS_BUCKET=your-bucket-name

# OSS 区域（例如：oss-cn-hangzhou）
OSS_REGION=oss-cn-hangzhou
```

**获取方式：**

1. 访问 https://oss.console.aliyun.com/
2. 创建 Bucket
3. 获取 AccessKey（推荐使用 RAM 子账号）

---

### Minio 对象存储（必需）

用于上传生成的思维导图 HTML 文件，提供快速预览。

```bash
# Minio 访问密钥
MINIO_ACCESS_KEY=your-minio-access-key

# Minio 访问密钥 Secret
MINIO_SECRET_KEY=your-minio-secret-key
```

**预设配置（已硬编码在代码中）：**

- Minio 端点：`119.45.11.171`
- Minio 存储桶：`page`
- Minio 预览URL：`http://page.thingotech.com.cn/page`

---

## 可选的环境变量

### 自定义模型

```bash
# 默认：qwen3-235b-a22b-thinking-2507
QWEN_MODEL=qwen3-235b-a22b-thinking-2507
```

### 自定义 API 端点

```bash
# 默认：dashscope.aliyuncs.com
QWEN_ENDPOINT=dashscope.aliyuncs.com
```

### 自定义 OSS 端点

```bash
# 可选
OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com
```

### 本地输出目录

```bash
# Windows 示例
MARKMAP_DIR=D:\\mindmaps

# macOS/Linux 示例
MARKMAP_DIR=/Users/username/mindmaps
```

---

## 配置文件示例

参考 `claude_desktop_config.example.json` 文件。
