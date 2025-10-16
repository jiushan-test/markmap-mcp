import OSS from "ali-oss";
import { readFileSync } from "fs";
import logger from "./logger.js";

/**
 * 阿里云OSS上传器配置接口
 */
export interface OSSConfig {
    /** OSS访问密钥ID */
    accessKeyId: string;
    /** OSS访问密钥Secret */
    accessKeySecret: string;
    /** OSS存储桶名称 */
    bucket: string;
    /** OSS区域 */
    region: string;
    /** (可选) 自定义域名 */
    endpoint?: string;
}

/**
 * OSS上传结果接口
 */
export interface OSSUploadResult {
    /** 文件在OSS中的访问URL（如果是私有bucket，这将是签名URL） */
    url: string;
    /** 文件在OSS中的对象名 */
    name: string;
    /** 签名URL（带有效期的临时访问链接） */
    signedUrl?: string;
}

/**
 * 阿里云OSS上传器类
 * 负责将文件上传到阿里云对象存储服务
 */
export class OSSUploader {
    private client: OSS;

    /**
     * 创建OSS上传器实例
     * @param config OSS配置对象
     */
    constructor(private config: OSSConfig) {
        // 初始化OSS客户端
        this.client = new OSS({
            accessKeyId: config.accessKeyId,
            accessKeySecret: config.accessKeySecret,
            bucket: config.bucket,
            region: config.region,
            endpoint: config.endpoint
        });
    }

    /**
     * 上传本地文件到OSS
     * @param localFilePath 本地文件路径
     * @param ossFileName OSS中的文件名（可选，默认使用原文件名）
     * @returns Promise包含上传结果
     */
    async uploadFile(
        localFilePath: string,
        ossFileName?: string
    ): Promise<OSSUploadResult> {
        try {
            // 如果未指定OSS文件名，使用本地文件的基础名
            const objectName =
                ossFileName ||
                `markmap/${Date.now()}-${localFilePath.split("/").pop()}`;

            logger.info(`开始上传文件到OSS: ${objectName}`);

            // 执行上传操作
            const result = await this.client.put(
                objectName,
                localFilePath,
                {
                    headers: {
                        'Content-Type': 'text/html; charset=utf-8'  // 设置正确的内容类型
                    }
                }
            );

            logger.info(`文件上传成功: ${result.url}`);

            // 生成签名URL（有效期5年，约157680000秒）
            const signedUrl = this.generateSignedUrl(objectName, 157680000);
            logger.info(`已生成签名URL（有效期5年）`);

            return {
                url: signedUrl,  // 返回签名URL作为主要访问地址
                name: result.name,
                signedUrl: signedUrl
            };
        } catch (error: any) {
            logger.error(`OSS上传失败: ${error.message}`);
            throw new Error(`上传文件到OSS失败: ${error.message}`);
        }
    }

    /**
     * 上传Buffer数据到OSS
     * @param buffer 文件Buffer数据
     * @param fileName OSS中的文件名
     * @returns Promise包含上传结果
     */
    async uploadBuffer(
        buffer: Buffer,
        fileName: string
    ): Promise<OSSUploadResult> {
        try {
            const objectName = `markmap/${Date.now()}-${fileName}`;

            logger.info(`开始上传Buffer到OSS: ${objectName}`);

            // 上传Buffer数据
            const result = await this.client.put(objectName, buffer, {
                headers: {
                    'Content-Type': 'text/html; charset=utf-8'  // 设置正确的内容类型
                }
            });

            logger.info(`Buffer上传成功: ${result.url}`);

            // 生成签名URL（有效期5年）
            const signedUrl = this.generateSignedUrl(objectName, 157680000);
            logger.info(`已生成签名URL（有效期5年）`);

            return {
                url: signedUrl,  // 返回签名URL作为主要访问地址
                name: result.name,
                signedUrl: signedUrl
            };
        } catch (error: any) {
            logger.error(`OSS Buffer上传失败: ${error.message}`);
            throw new Error(`上传Buffer到OSS失败: ${error.message}`);
        }
    }

    /**
     * 生成签名URL
     * @param objectName OSS对象名
     * @param expires 过期时间（秒），默认5年
     * @returns 签名URL
     */
    generateSignedUrl(objectName: string, expires: number = 157680000): string {
        try {
            // 使用signatureUrl方法生成带签名的URL
            // expires: URL过期时间（秒）
            const signedUrl = this.client.signatureUrl(objectName, {
                expires: expires,
                method: 'GET'
            });
            
            return signedUrl;
        } catch (error: any) {
            logger.error(`生成签名URL失败: ${error.message}`);
            throw new Error(`生成签名URL失败: ${error.message}`);
        }
    }

    /**
     * 删除OSS上的文件
     * @param objectName OSS对象名
     */
    async deleteFile(objectName: string): Promise<void> {
        try {
            await this.client.delete(objectName);
            logger.info(`成功删除OSS文件: ${objectName}`);
        } catch (error: any) {
            logger.error(`删除OSS文件失败: ${error.message}`);
            throw new Error(`删除OSS文件失败: ${error.message}`);
        }
    }
}

/**
 * 从环境变量创建OSS上传器实例
 * @returns OSS上传器实例，如果环境变量未配置则返回null
 */
export function createOSSUploaderFromEnv(): OSSUploader | null {
    const accessKeyId = process.env.OSS_ACCESS_KEY_ID;
    const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET;
    const bucket = process.env.OSS_BUCKET;
    const region = process.env.OSS_REGION;
    const endpoint = process.env.OSS_ENDPOINT;

    // 检查必需的环境变量
    if (!accessKeyId || !accessKeySecret || !bucket || !region) {
        logger.warn("OSS环境变量未完全配置，将使用本地存储模式");
        logger.warn("需要配置: OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET, OSS_BUCKET, OSS_REGION");
        return null;
    }

    logger.info("使用环境变量初始化OSS上传器");

    return new OSSUploader({
        accessKeyId,
        accessKeySecret,
        bucket,
        region,
        endpoint
    });
}

