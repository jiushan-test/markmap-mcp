// 测试 Qwen API 连接和 OSS 上传
// 这是示例文件，请复制为 test-qwen-api.js 并填入真实的密钥
import { createQwenAPIFromEnv } from './build/utils/qwen-api.js';
import { createOSSUploaderFromEnv } from './build/utils/oss-uploader.js';
import { createMarkmap } from './build/markmap/createMarkmap.js';
import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// ⚠️ 警告：不要在代码中硬编码真实密钥！
// 请从环境变量或 .env 文件读取

// 设置环境变量（使用占位符）
process.env.DASHSCOPE_API_KEY = "sk-your-dashscope-api-key-here";
process.env.OSS_ACCESS_KEY_ID = "your-oss-access-key-id";
process.env.OSS_ACCESS_KEY_SECRET = "your-oss-access-key-secret";
process.env.OSS_BUCKET = "your-bucket-name";
process.env.OSS_REGION = "oss-cn-beijing";
process.env.OSS_ENDPOINT = "oss-cn-beijing.aliyuncs.com";
process.env.MARKMAP_DIR = "./output";

console.log('==========================================');
console.log('🧪 开始测试 Markmap MCP Server');
console.log('==========================================\n');

async function runTests() {
    try {
        // 测试 1: 检查 Qwen API 配置
        console.log('📝 测试 1: 检查 Qwen API 配置...');
        const qwenAPI = createQwenAPIFromEnv();
        
        if (!qwenAPI) {
            console.error('❌ Qwen API 配置失败');
            console.error('   请检查 DASHSCOPE_API_KEY 环境变量');
            return;
        }
        console.log('✅ Qwen API 配置成功\n');

        // 测试 2: 检查 OSS 配置
        console.log('📝 测试 2: 检查 OSS 配置...');
        const ossUploader = createOSSUploaderFromEnv();
        
        if (!ossUploader) {
            console.error('❌ OSS 配置失败');
            console.error('   请检查 OSS 相关环境变量');
            return;
        }
        console.log('✅ OSS 配置成功\n');

        // 测试 3: 测试 Qwen API 调用
        console.log('📝 测试 3: 测试 Qwen API 调用...');
        console.log('   正在生成测试 Markdown...');
        
        const testInput = "Python 编程语言的基础知识";
        const startTime = Date.now();
        
        const result = await qwenAPI.generateMarkdown(testInput);
        const apiTime = Date.now() - startTime;
        
        console.log(`✅ Qwen API 调用成功 (耗时: ${apiTime}ms)`);
        console.log(`   生成的 Markdown 长度: ${result.markdown.length} 字符`);
        console.log(`   Markdown 预览:\n`);
        console.log('   ' + '-'.repeat(50));
        console.log(result.markdown.split('\n').slice(0, 15).map(line => '   ' + line).join('\n'));
        console.log('   ' + '-'.repeat(50));
        console.log('');

        // 测试 4: 测试思维导图生成和 OSS 上传
        console.log('📝 测试 4: 测试思维导图生成和 OSS 上传...');
        
        // 确保输出目录存在
        const outputDir = './output';
        if (!existsSync(outputDir)) {
            mkdirSync(outputDir, { recursive: true });
        }
        
        const filename = `test-mindmap-${Date.now()}.html`;
        const outputPath = join(outputDir, filename);
        
        console.log('   正在生成思维导图 HTML...');
        const markmapStartTime = Date.now();
        
        const markmapResult = await createMarkmap({
            content: result.markdown,
            output: outputPath,
            openIt: false,
            ossUploader: ossUploader,
            forceOSSUpload: true
        });
        
        const markmapTime = Date.now() - markmapStartTime;
        
        if (markmapResult.uploadedToOSS && markmapResult.ossUrl) {
            console.log(`✅ 思维导图生成并上传成功 (耗时: ${markmapTime}ms)`);
            console.log(`   OSS URL: ${markmapResult.ossUrl}`);
            console.log(`   HTML 内容长度: ${markmapResult.content.length} 字符`);
        } else {
            console.log(`⚠️  思维导图生成成功，但 OSS 上传失败`);
            console.log(`   本地路径: ${markmapResult.filePath}`);
        }
        console.log('');

        // 测试总结
        console.log('==========================================');
        console.log('🎉 测试完成！');
        console.log('==========================================');
        console.log(`总耗时: ${Date.now() - startTime}ms`);
        console.log(`  - Qwen API 调用: ${apiTime}ms`);
        console.log(`  - 思维导图生成: ${markmapTime}ms`);
        
        if (markmapResult.uploadedToOSS && markmapResult.ossUrl) {
            console.log('\n✅ 所有测试通过！');
            console.log('🔗 在浏览器中打开以下链接查看思维导图：');
            console.log(`   ${markmapResult.ossUrl}`);
        } else {
            console.log('\n⚠️  部分测试通过，但 OSS 上传失败');
            console.log('   请检查 OSS 配置和权限');
        }
        
    } catch (error) {
        console.error('\n❌ 测试失败！');
        console.error('错误信息:', error.message);
        console.error('\n详细错误:');
        console.error(error);
        process.exit(1);
    }
}

// 运行测试
runTests();

