import * as Minio from "minio";
import { basename } from "path";
import logger from "./logger.js";

/**
 * Minio上传器配置接口
 */
export interface MinioConfig {
    /** Minio服务器端点（不包含http://） */
    endPoint: string;
    /** Minio访问密钥 */
    accessKey: string;
    /** Minio访问密钥Secret */
    secretKey: string;
    /** Minio存储桶名称 */
    bucket: string;
    /** 是否使用SSL */
    useSSL?: boolean;
    /** 预览URL基础路径 */
    previewUrlBase?: string;
}

/**
 * Minio上传结果接口
 */
export interface MinioUploadResult {
    /** 文件在Minio中的访问URL（预览链接） */
    url: string;
    /** 文件在Minio中的对象名 */
    name: string;
}

/**
 * Minio上传器类
 * 负责将文件上传到Minio对象存储服务
 */
export class MinioUploader {
    private client: Minio.Client;
    private bucket: string;
    private previewUrlBase: string;

    /**
     * 创建Minio上传器实例
     * @param config Minio配置对象
     */
    constructor(private config: MinioConfig) {
        // 初始化Minio客户端
        this.client = new Minio.Client({
            endPoint: config.endPoint,
            accessKey: config.accessKey,
            secretKey: config.secretKey,
            useSSL: config.useSSL || false
        });
        this.bucket = config.bucket;
        this.previewUrlBase =
            config.previewUrlBase ||
            `http://${config.endPoint}/${config.bucket}`;
    }

    /**
     * 上传本地文件到Minio
     * @param localFilePath 本地文件路径
     * @param minioFileName Minio中的文件名（可选，默认使用原文件名）
     * @returns Promise包含上传结果
     */
    async uploadFile(
        localFilePath: string,
        minioFileName?: string
    ): Promise<MinioUploadResult> {
        try {
            // 如果未指定Minio文件名，使用本地文件的基础名
            const objectName = minioFileName || basename(localFilePath);

            logger.info(`开始上传文件到Minio: ${objectName}`);

            // 执行上传操作
            await this.client.fPutObject(
                this.bucket,
                objectName,
                localFilePath,
                {
                    "Content-Type": "text/html; charset=utf-8"
                }
            );

            // 生成预览URL
            const previewUrl = `${this.previewUrlBase}/${objectName}`;

            logger.info(`文件上传成功到Minio: ${previewUrl}`);

            return {
                url: previewUrl,
                name: objectName
            };
        } catch (error: any) {
            logger.error(`Minio上传失败: ${error.message}`);
            throw new Error(`上传文件到Minio失败: ${error.message}`);
        }
    }

    /**
     * 删除Minio上的文件
     * @param objectName Minio对象名
     */
    async deleteFile(objectName: string): Promise<void> {
        try {
            await this.client.removeObject(this.bucket, objectName);
            logger.info(`成功删除Minio文件: ${objectName}`);
        } catch (error: any) {
            logger.error(`删除Minio文件失败: ${error.message}`);
            throw new Error(`删除Minio文件失败: ${error.message}`);
        }
    }

    /**
     * 检查文件是否存在
     * @param objectName Minio对象名
     * @returns 文件是否存在
     */
    async fileExists(objectName: string): Promise<boolean> {
        try {
            await this.client.statObject(this.bucket, objectName);
            return true;
        } catch (error: any) {
            return false;
        }
    }
}

/**
 * 从环境变量创建Minio上传器实例
 * @returns Minio上传器实例，如果密钥未配置则返回null
 */
export function createMinioUploaderFromEnv(): MinioUploader | null {
    // 密钥必须从环境变量获取
    const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY;
    const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY;

    // 检查密钥是否已配置
    if (!MINIO_ACCESS_KEY || !MINIO_SECRET_KEY) {
        logger.warn("Minio密钥未配置，将无法使用Minio上传功能");
        logger.warn("请配置环境变量: MINIO_ACCESS_KEY 和 MINIO_SECRET_KEY");
        return null;
    }

    // 其他配置硬编码（参考deepsiteAgent-main项目）
    const MINIO_ENDPOINT = "119.45.11.171";
    const MINIO_BUCKET = "page";
    const MINIO_USE_SSL = false;
    const MINIO_PREVIEW_URL_BASE = "http://page.thingotech.com.cn/page";

    logger.info("初始化Minio上传器");
    logger.info(`Minio端点: ${MINIO_ENDPOINT}`);
    logger.info(`Minio存储桶: ${MINIO_BUCKET}`);
    logger.info(`Minio预览URL基础路径: ${MINIO_PREVIEW_URL_BASE}`);

    return new MinioUploader({
        endPoint: MINIO_ENDPOINT,
        accessKey: MINIO_ACCESS_KEY,
        secretKey: MINIO_SECRET_KEY,
        bucket: MINIO_BUCKET,
        useSSL: MINIO_USE_SSL,
        previewUrlBase: MINIO_PREVIEW_URL_BASE
    });
}
