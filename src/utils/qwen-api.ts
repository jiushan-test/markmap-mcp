import { get as httpsGet, request as httpsRequest } from "https";
import logger from "./logger.js";

/**
 * 阿里云Qwen API配置接口
 */
export interface QwenConfig {
    /** API密钥 */
    apiKey: string;
    /** 模型名称 */
    model?: string;
    /** API端点 */
    endpoint?: string;
}

/**
 * Qwen API响应接口
 */
export interface QwenResponse {
    /** 生成的Markdown内容 */
    markdown: string;
    /** 原始响应数据 */
    rawResponse?: any;
}

/**
 * 阿里云Qwen大模型API调用类
 * 负责调用阿里云通义千问大模型生成Markdown内容
 */
export class QwenAPI {
    private apiKey: string;
    private model: string;
    private endpoint: string;

    /**
     * 创建Qwen API实例
     * @param config Qwen配置对象
     */
    constructor(config: QwenConfig) {
        this.apiKey = config.apiKey;
        this.model = config.model || "qwen3-235b-a22b-thinking-2507";
        this.endpoint = config.endpoint || "dashscope.aliyuncs.com";
    }

    /**
     * 根据用户输入生成Markdown内容
     * @param userInput 用户输入的描述文本
     * @returns Promise包含生成的Markdown内容
     */
    async generateMarkdown(userInput: string): Promise<QwenResponse> {
        try {
            logger.info(`开始调用Qwen API生成Markdown，输入: ${userInput.substring(0, 50)}...`);

            // 构建请求提示词
            const systemPrompt = `你是一个专业的思维导图内容生成助手。根据用户的输入，生成结构化的Markdown内容，适合转换为思维导图。

要求：
1. 使用Markdown标题（#, ##, ###）表示层级关系
2. 使用列表（- 或 1.）表示并列内容
3. 内容要有逻辑性和层次性
4. 适合展示为思维导图的树形结构
5. 只返回Markdown内容，不要有其他说明文字

示例格式：
# 主题
## 分支1
- 要点1
- 要点2
## 分支2
### 子分支2.1
- 详细内容`;

            const requestBody = JSON.stringify({
                model: this.model,
                messages: [
                    {
                        role: "system",
                        content: systemPrompt
                    },
                    {
                        role: "user",
                        content: userInput
                    }
                ],
                temperature: 0.7,
                max_tokens: 4000
            });

            const response = await this.makeHttpsRequest(requestBody);

            // 解析响应
            if (!response.choices || response.choices.length === 0) {
                throw new Error("API返回的响应格式不正确");
            }

            const markdown = response.choices[0].message.content;

            logger.info(`成功生成Markdown内容，长度: ${markdown.length} 字符`);

            return {
                markdown,
                rawResponse: response
            };
        } catch (error: any) {
            logger.error(`调用Qwen API失败: ${error.message}`);
            throw new Error(`生成Markdown内容失败: ${error.message}`);
        }
    }

    /**
     * 执行HTTPS请求
     * @param requestBody 请求体
     * @returns Promise包含响应数据
     */
    private makeHttpsRequest(requestBody: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: this.endpoint,
                path: "/compatible-mode/v1/chat/completions",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.apiKey}`,
                    "Content-Length": Buffer.byteLength(requestBody)
                }
            };

            logger.info(`发送请求到: https://${options.hostname}${options.path}`);

            const req = httpsRequest(options, (res) => {
                // 检查HTTP状态码
                if (res.statusCode !== 200) {
                    logger.error(`API请求失败，状态码: ${res.statusCode}`);
                    reject(
                        new Error(
                            `API请求失败，HTTP状态码: ${res.statusCode}`
                        )
                    );
                    return;
                }

                const chunks: Buffer[] = [];

                // 接收数据块
                res.on("data", (chunk) => {
                    chunks.push(chunk);
                });

                // 请求完成
                res.on("end", () => {
                    try {
                        const responseText = Buffer.concat(chunks).toString("utf-8");
                        const responseData = JSON.parse(responseText);
                        resolve(responseData);
                    } catch (parseError: any) {
                        reject(new Error(`解析API响应失败: ${parseError.message}`));
                    }
                });

                // 请求出错
                res.on("error", (error) => {
                    reject(error);
                });
            });

            // 请求错误处理
            req.on("error", (error) => {
                logger.error(`HTTPS请求错误: ${error.message}`);
                reject(error);
            });

            // 发送请求体
            req.write(requestBody);
            req.end();
        });
    }
}

/**
 * 从环境变量创建Qwen API实例
 * @returns Qwen API实例，如果密钥未配置则返回null
 */
export function createQwenAPIFromEnv(): QwenAPI | null {
    // API密钥必须从环境变量获取
    const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY;
    
    // 其他配置硬编码
    const DASHSCOPE_MODEL = "qwen3-235b-a22b-thinking-2507";
    const DASHSCOPE_ENDPOINT = "dashscope.aliyuncs.com";
    const DASHSCOPE_API_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";

    // 检查密钥是否已配置
    if (!DASHSCOPE_API_KEY) {
        logger.warn("Qwen API密钥未配置，将无法使用AI生成功能");
        logger.warn("请配置环境变量: DASHSCOPE_API_KEY 或 QWEN_API_KEY");
        return null;
    }

    logger.info("初始化Qwen API客户端");
    logger.info(`使用模型: ${DASHSCOPE_MODEL}`);
    logger.info(`API端点: ${DASHSCOPE_ENDPOINT}`);

    return new QwenAPI({
        apiKey: DASHSCOPE_API_KEY,
        model: DASHSCOPE_MODEL,
        endpoint: DASHSCOPE_ENDPOINT
    });
}

