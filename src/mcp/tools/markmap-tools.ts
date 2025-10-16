import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { join } from "path";
import { z } from "zod";
import { createMarkmap } from "../../markmap/createMarkmap.js";
import { MarkmapMcpContext } from "./context.js";
import { ToolRegistry } from "./tool-registry.js";
import { createOSSUploaderFromEnv } from "../../utils/oss-uploader.js";
import { createHttpDownloader } from "../../utils/http-downloader.js";
import { createQwenAPIFromEnv } from "../../utils/qwen-api.js";
import logger from "../../utils/logger.js";

export class MarkmapToolRegistry extends ToolRegistry {
    // 初始化OSS上传器（如果环境变量已配置）
    private ossUploader = createOSSUploaderFromEnv();
    // 初始化HTTP下载器
    private httpDownloader = createHttpDownloader();
    // 初始化Qwen API客户端（如果环境变量已配置）
    private qwenAPI = createQwenAPIFromEnv();

    public register(): void {
        // 注册新的文本到思维导图工具（使用AI生成Markdown）
        this.registerTextToMindmap();
        // 注册原有的Markdown到思维导图工具
        this.registerMarkdownToMindmap();
    }

    /**
     * 注册文本到思维导图工具
     * 输入一句话，通过AI生成Markdown，然后转换为思维导图并上传到OSS
     */
    private registerTextToMindmap(): void {
        this.server.tool(
            "text_to_mindmap",
            "Convert a text description into an interactive mind map using AI. The text will be processed by Qwen AI model to generate Markdown, then converted to a mind map and uploaded to OSS.",
            {
                text: z
                    .string()
                    .describe("The text description to convert into a mind map")
            },
            async ({ text }) => {
                try {
                    // 检查Qwen API是否可用
                    if (!this.qwenAPI) {
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: JSON.stringify({
                                        error: "Qwen API not configured",
                                        message:
                                            "请配置环境变量 QWEN_API_KEY 或 DASHSCOPE_API_KEY 以启用AI生成功能"
                                    })
                                }
                            ]
                        };
                    }

                    // 检查OSS上传器是否可用
                    if (!this.ossUploader) {
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: JSON.stringify({
                                        error: "OSS not configured",
                                        message:
                                            "请配置OSS环境变量以启用云存储功能。需要配置: OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET, OSS_BUCKET, OSS_REGION"
                                    })
                                }
                            ]
                        };
                    }

                    logger.info(`接收到文本输入: ${text.substring(0, 100)}...`);

                    // 步骤1: 调用Qwen API生成Markdown内容（仅在内存中）
                    logger.info("步骤1: 调用Qwen API生成Markdown内容");
                    const qwenResponse = await this.qwenAPI.generateMarkdown(text);
                    const markdownContent = qwenResponse.markdown;

                    logger.info(`生成的Markdown内容长度: ${markdownContent.length} 字符`);
                    logger.info(`Markdown内容预览:\n${markdownContent.substring(0, 200)}...`);

                    // 步骤2: 直接从Markdown内容生成思维导图HTML（本地临时文件）
                    logger.info("步骤2: 从Markdown内容生成思维导图HTML");
                    const filename = `mindmap-${Date.now()}.html`;
                    const outputPath = join(this.context.output, filename);

                    // 注意：这里不会生成 .md 文件，Markdown 内容仅在内存中处理
                    const result = await createMarkmap({
                        content: markdownContent,
                        output: outputPath,
                        openIt: false,
                        ossUploader: this.ossUploader,
                        forceOSSUpload: true // 强制上传HTML到OSS，上传后会自动删除本地临时HTML文件
                    });

                    // 构建返回信息
                    const responseData: any = {
                        success: true,
                        userInput: text,
                        generatedMarkdown: markdownContent,
                        mindmapUrl: result.ossUrl || result.filePath,
                        uploadedToOSS: result.uploadedToOSS
                    };

                    if (result.uploadedToOSS && result.ossUrl) {
                        responseData.message =
                            "成功！已生成思维导图并上传到阿里云OSS";
                        logger.info(`任务完成，思维导图URL: ${result.ossUrl}`);
                    } else {
                        responseData.message =
                            "思维导图已生成，但OSS上传失败，返回本地路径";
                        responseData.warning = "建议检查OSS配置";
                        logger.warn(`OSS上传失败，本地路径: ${result.filePath}`);
                    }

                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify(responseData, null, 2)
                            }
                        ]
                    };
                } catch (error: any) {
                    logger.error(`生成思维导图失败: ${error.message}`);
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify({
                                    success: false,
                                    error: "Failed to generate mind map",
                                    message: error.message
                                })
                            }
                        ]
                    };
                }
            }
        );
    }

    /**
     * 注册原有的Markdown到思维导图工具
     */
    private registerMarkdownToMindmap(): void {
        this.server.tool(
            "markdown_to_mindmap",
            "Convert a Markdown document or URL into an interactive mind map. Supports downloading Markdown from URL and uploading result to Aliyun OSS.",
            {
                markdown: z
                    .string()
                    .optional()
                    .describe(
                        "Markdown content to convert into a mind map (provide either markdown or url, not both)"
                    ),
                url: z
                    .string()
                    .optional()
                    .describe(
                        "URL to download Markdown content from (provide either markdown or url, not both)"
                    ),
                open: z
                    .boolean()
                    .default(false)
                    .describe(
                        "Whether to open the generated mind map in a browser (default: false, only works when not uploading to OSS)"
                    )
            },
            async ({ markdown, url, open }) => {
                try {
                    // 参数验证：必须提供markdown或url之一，但不能同时提供
                    if (!markdown && !url) {
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: JSON.stringify({
                                        error: "Invalid parameters",
                                        message:
                                            "必须提供 'markdown' 或 'url' 参数之一"
                                    })
                                }
                            ]
                        };
                    }

                    if (markdown && url) {
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: JSON.stringify({
                                        error: "Invalid parameters",
                                        message:
                                            "不能同时提供 'markdown' 和 'url' 参数，请只提供其中一个"
                                    })
                                }
                            ]
                        };
                    }

                    let markdownContent: string;

                    // 如果提供了URL，从URL下载Markdown内容
                    if (url) {
                        logger.info(`从URL下载Markdown内容: ${url}`);
                        try {
                            markdownContent =
                                await this.httpDownloader.downloadText(url);
                            logger.info(
                                `成功下载Markdown内容，长度: ${markdownContent.length} 字符`
                            );
                        } catch (downloadError: any) {
                            logger.error(
                                `下载Markdown失败: ${downloadError.message}`
                            );
                            return {
                                content: [
                                    {
                                        type: "text",
                                        text: JSON.stringify({
                                            error: "Download failed",
                                            message: `从URL下载Markdown失败: ${downloadError.message}`
                                        })
                                    }
                                ]
                            };
                        }
                    } else {
                        markdownContent = markdown!;
                    }

                    // 生成思维导图
                    const filename = `markmap-${Date.now()}.html`;
                    const outputPath = join(this.context.output, filename);

                    logger.info(
                        `开始生成思维导图，OSS上传器状态: ${this.ossUploader ? "已启用" : "未启用"}`
                    );

                    const result = await createMarkmap({
                        content: markdownContent,
                        output: outputPath,
                        openIt: open,
                        ossUploader: this.ossUploader,
                        forceOSSUpload: false // 保持原有行为
                    });

                    // 构建返回信息
                    const responseData: any = {
                        success: true,
                        filePath: result.filePath,
                        uploadedToOSS: result.uploadedToOSS
                    };

                    if (result.uploadedToOSS && result.ossUrl) {
                        responseData.ossUrl = result.ossUrl;
                        responseData.message =
                            "思维导图已生成并成功上传到阿里云OSS";
                        logger.info(`任务完成，OSS URL: ${result.ossUrl}`);
                    } else {
                        responseData.message =
                            "思维导图已生成并保存到本地";
                        logger.info(`任务完成，本地路径: ${result.filePath}`);
                    }

                    // 如果从URL下载，添加来源信息
                    if (url) {
                        responseData.source = url;
                    }

                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify(responseData, null, 2)
                            }
                        ]
                    };
                } catch (error: any) {
                    logger.error(`生成思维导图失败: ${error.message}`);
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify({
                                    success: false,
                                    error: "Failed to generate markmap",
                                    message: error.message
                                })
                            }
                        ]
                    };
                }
            }
        );
    }
}

/**
 * Registers Markmap tools with the provided server and context.
 * @param server - The MCP server instance to register tools with
 * @param context - The context object containing configuration and state information
 */
export function registerMarkmapTools(
    server: McpServer,
    context: MarkmapMcpContext
): void {
    const registry = new MarkmapToolRegistry(server, context);
    registry.register();
}
