import { randomUUID } from "crypto";
import { createWriteStream, promises as fs } from "fs";
import { get as httpGet } from "http";
import { get as httpsGet } from "https";
import { tmpdir } from "os";
import { join } from "path";
import logger from "./logger.js";

/**
 * HTTP下载结果接口
 */
export interface DownloadResult {
    /** 下载文件的本地路径 */
    filePath: string;
    /** 下载的内容 */
    content: string;
}

/**
 * HTTP下载器类
 * 负责从URL下载文件内容
 */
export class HttpDownloader {
    /**
     * 从URL下载文件到本地临时目录
     * @param url 要下载的文件URL
     * @returns Promise包含下载结果
     */
    async downloadFile(url: string): Promise<DownloadResult> {
        try {
            logger.info(`开始从URL下载文件: ${url}`);

            // 验证URL格式
            const parsedUrl = new URL(url);
            
            // 选择合适的HTTP客户端
            const httpClient = parsedUrl.protocol === "https:" ? httpsGet : httpGet;

            // 生成临时文件路径
            const tempFilePath = join(
                tmpdir(),
                `markdown-${randomUUID()}.md`
            );

            // 下载文件
            const content = await new Promise<string>((resolve, reject) => {
                httpClient(url, (response) => {
                    // 检查HTTP状态码
                    if (response.statusCode !== 200) {
                        reject(
                            new Error(
                                `下载失败，HTTP状态码: ${response.statusCode}`
                            )
                        );
                        return;
                    }

                    const chunks: Buffer[] = [];

                    // 接收数据块
                    response.on("data", (chunk) => {
                        chunks.push(chunk);
                    });

                    // 下载完成
                    response.on("end", () => {
                        const content = Buffer.concat(chunks).toString("utf-8");
                        resolve(content);
                    });

                    // 下载出错
                    response.on("error", (error) => {
                        reject(error);
                    });
                }).on("error", (error) => {
                    reject(error);
                });
            });

            // 将内容写入临时文件
            await fs.writeFile(tempFilePath, content, "utf-8");

            logger.info(`文件下载成功，保存到: ${tempFilePath}`);

            return {
                filePath: tempFilePath,
                content
            };
        } catch (error: any) {
            logger.error(`下载文件失败: ${error.message}`);
            throw new Error(`从URL下载文件失败: ${error.message}`);
        }
    }

    /**
     * 从URL直接获取文本内容（不保存到本地）
     * @param url 要下载的文件URL
     * @returns Promise包含文本内容
     */
    async downloadText(url: string): Promise<string> {
        try {
            logger.info(`开始获取URL内容: ${url}`);

            // 验证URL格式
            const parsedUrl = new URL(url);
            
            // 选择合适的HTTP客户端
            const httpClient = parsedUrl.protocol === "https:" ? httpsGet : httpGet;

            // 下载内容
            const content = await new Promise<string>((resolve, reject) => {
                httpClient(url, (response) => {
                    // 检查HTTP状态码
                    if (response.statusCode !== 200) {
                        reject(
                            new Error(
                                `获取内容失败，HTTP状态码: ${response.statusCode}`
                            )
                        );
                        return;
                    }

                    const chunks: Buffer[] = [];

                    response.on("data", (chunk) => {
                        chunks.push(chunk);
                    });

                    response.on("end", () => {
                        const content = Buffer.concat(chunks).toString("utf-8");
                        resolve(content);
                    });

                    response.on("error", (error) => {
                        reject(error);
                    });
                }).on("error", (error) => {
                    reject(error);
                });
            });

            logger.info(`成功获取URL内容，长度: ${content.length} 字符`);

            return content;
        } catch (error: any) {
            logger.error(`获取URL内容失败: ${error.message}`);
            throw new Error(`从URL获取内容失败: ${error.message}`);
        }
    }

    /**
     * 清理临时文件
     * @param filePath 要删除的文件路径
     */
    async cleanupTempFile(filePath: string): Promise<void> {
        try {
            await fs.unlink(filePath);
            logger.info(`成功删除临时文件: ${filePath}`);
        } catch (error: any) {
            logger.warn(`删除临时文件失败: ${error.message}`);
        }
    }
}

/**
 * 创建HTTP下载器实例
 * @returns HTTP下载器实例
 */
export function createHttpDownloader(): HttpDownloader {
    return new HttpDownloader();
}

