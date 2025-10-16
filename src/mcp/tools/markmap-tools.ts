import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { join } from "path";
import { z } from "zod";
import { createMarkmap } from "../../markmap/createMarkmap.js";
import logger from "../../utils/logger.js";
import { createOSSUploaderFromEnv } from "../../utils/oss-uploader.js";
import { createQwenAPIFromEnv } from "../../utils/qwen-api.js";
import { MarkmapMcpContext } from "./context.js";
import { ToolRegistry } from "./tool-registry.js";

export class MarkmapToolRegistry extends ToolRegistry {
    // 初始化OSS上传器（如果环境变量已配置）
    private ossUploader = createOSSUploaderFromEnv();
    // 初始化Qwen API客户端（如果环境变量已配置）
    private qwenAPI = createQwenAPIFromEnv();

    public register(): void {
        // 注册文本到思维导图工具（使用AI生成Markdown）
        this.registerTextToMindmap();
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
                    const qwenResponse =
                        await this.qwenAPI.generateMarkdown(text);
                    const markdownContent = qwenResponse.markdown;

                    logger.info(
                        `生成的Markdown内容长度: ${markdownContent.length} 字符`
                    );
                    logger.info(
                        `Markdown内容预览:\n${markdownContent.substring(0, 200)}...`
                    );

                    // 步骤2: 直接从Markdown内容生成思维导图HTML（本地临时文件）
                    logger.info("步骤2: 从Markdown内容生成思维导图HTML");

                    // 根据用户输入生成文件名（清理特殊字符，限制长度）
                    const sanitizedName =
                        text
                            .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, "") // 只保留中文、英文、数字和空格
                            .replace(/\s+/g, "-") // 空格替换为横线
                            .substring(0, 50) || // 限制长度
                        "mindmap"; // 如果清理后为空，使用默认名称

                    const filename = `${sanitizedName}-${Date.now()}.html`;
                    const outputPath = join(this.context.output, filename);

                    // 注意：这里不会生成 .md 文件，Markdown 内容仅在内存中处理
                    const result = await createMarkmap({
                        content: markdownContent,
                        output: outputPath,
                        openIt: false,
                        ossUploader: this.ossUploader,
                        forceOSSUpload: true // 强制上传HTML到OSS，上传后会自动删除本地临时HTML文件
                    });

                    // 如果上传成功，只返回URL链接
                    if (result.uploadedToOSS && result.ossUrl) {
                        logger.info(`任务完成，思维导图URL: ${result.ossUrl}`);
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: result.ossUrl
                                }
                            ]
                        };
                    } else {
                        // 如果上传失败，返回详细错误信息
                        logger.error(
                            `OSS上传失败，本地路径: ${result.filePath}`
                        );
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: JSON.stringify(
                                        {
                                            success: false,
                                            error: "OSS upload failed",
                                            message:
                                                "思维导图已生成，但OSS上传失败",
                                            localPath: result.filePath
                                        },
                                        null,
                                        2
                                    )
                                }
                            ]
                        };
                    }
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
