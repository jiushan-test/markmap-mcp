import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import { tmpdir } from "os";
import { basename, join } from "path";

import { Transformer, builtInPlugins } from "markmap-lib";
import { fillTemplate } from "markmap-render";

import open from "open";
import logger from "../utils/logger.js";
import { OSSUploader } from "../utils/oss-uploader.js";

interface CreateMarkmapOptions {
    /**
     * Markdown content to be converted into a mind map
     */
    content: string;
    /**
     * Output file path, if not provided, a temporary file will be created
     */
    output?: string;
    /**
     * Whether to open the output file after generation
     * @default false
     */
    openIt?: boolean;
    /**
     * OSS uploader instance for uploading to cloud storage
     * If provided, the file will be uploaded to OSS
     */
    ossUploader?: OSSUploader | null;
    /**
     * Force upload to OSS even if openIt is true
     * When true, will throw error if OSS upload fails
     * @default false
     */
    forceOSSUpload?: boolean;
}

interface CreateMarkmapResult {
    /**
     * Path to the generated HTML file (local path or OSS URL)
     */
    filePath: string;
    /**
     * Content of the generated HTML file
     */
    content: string;
    /**
     * OSS URL if uploaded to cloud storage
     */
    ossUrl?: string;
    /**
     * Whether the file was uploaded to OSS
     */
    uploadedToOSS: boolean;
}

/**
 * Creates a mind map from Markdown content with additional features.
 *
 * @param options Options for creating the mind map
 * @returns Promise containing the generated mind map file path and content
 */
export async function createMarkmap(
    options: CreateMarkmapOptions
): Promise<CreateMarkmapResult> {
    const {
        content,
        output,
        openIt = false,
        ossUploader = null,
        forceOSSUpload = false
    } = options;

    // 如果没有提供输出路径，在临时目录生成默认文件路径
    const filePath = output || join(tmpdir(), `markmap-${randomUUID()}.html`);

    logger.info(`开始生成思维导图，输出路径: ${filePath}`);

    const transformer = new Transformer([...builtInPlugins]);
    const { root, features } = transformer.transform(content);
    const assets = transformer.getUsedAssets(features);
    const html = fillTemplate(root, assets, undefined);

    // Add markmap-toolbar related code
    const toolbarCode = `
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/markmap-toolbar@0.18.10/dist/style.css"
    />

    <script src="https://cdn.jsdelivr.net/npm/markmap-toolbar@0.18.10/dist/index.js"></script>
    <script>
      ((r) => {
          setTimeout(r);
      })(() => {
          const { markmap, mm } = window;
          const toolbar = new markmap.Toolbar();
          toolbar.attach(mm);
          const el = toolbar.render();
          el.setAttribute(
              "style",
              "position:absolute;bottom:20px;right:20px"
          );
          document.body.append(el);
          
          // Ensure the mind map fits the current view
          setTimeout(() => {
            if (mm && typeof mm.fit === 'function') {
              mm.fit();
            }
          }, 1200);
      });
    </script>
  `;

    // Add scripts and styles for additional features
    const additionalCode = `
    <!-- Add html-to-image library -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js"></script>

    <!-- Hidden element to store original Markdown content -->
    <textarea id="original-markdown" style="display:none;">${content}</textarea>

    <style>
      /* Export toolbar styles */
      .mm-export-toolbar {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1000;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 8px;
        padding: 8px 16px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        display: flex;
        gap: 10px;
      }
      .mm-export-btn {
        padding: 6px 12px;
        border: none;
        border-radius: 4px;
        background-color: #3498db;
        color: white;
        cursor: pointer;
        font-size: 14px;
        transition: background-color 0.3s;
      }
      .mm-export-btn:hover {
        background-color: #2980b9;
      }
      .mm-copy-btn {
        background-color: #27ae60;
      }
      .mm-copy-btn:hover {
        background-color: #219653;
      }
      @media print {
        .mm-export-toolbar { display: none !important; }
        .mm-toolbar { display: none !important; }
        svg.markmap, svg#mindmap, #mindmap svg { 
          display: block !important;
          visibility: visible !important; 
          opacity: 1 !important;
          height: 100vh !important;
          width: 100% !important;
          max-width: 100% !important;
          max-height: 100vh !important;
          overflow: visible !important;
          page-break-inside: avoid !important;
        }
        body, html {
          height: 100% !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: visible !important;
        }
      }
    </style>

    <script>
      (function() {
        // Create bottom export toolbar
        const exportToolbar = document.createElement('div');
        exportToolbar.className = 'mm-export-toolbar';
        document.body.appendChild(exportToolbar);
        
        // Export as PNG image
        const pngBtn = document.createElement('button');
        pngBtn.className = 'mm-export-btn png-export';
        pngBtn.innerHTML = '导出 PNG';
        pngBtn.title = '导出为PNG图片';
        pngBtn.onclick = () => {
          exportToImage('png');
        };
        exportToolbar.appendChild(pngBtn);

        // Export as JPG image
        const jpgBtn = document.createElement('button');
        jpgBtn.className = 'mm-export-btn jpg-export';
        jpgBtn.innerHTML = '导出 JPG';
        jpgBtn.title = '导出为JPG图片';
        jpgBtn.onclick = () => {
          exportToImage('jpeg');
        };
        exportToolbar.appendChild(jpgBtn);
        
        // Export as SVG image
        const svgBtn = document.createElement('button');
        svgBtn.className = 'mm-export-btn svg-export';
        svgBtn.innerHTML = '导出 SVG';
        svgBtn.title = '导出为SVG矢量图';
        svgBtn.onclick = () => {
          exportToImage('svg');
        };
        exportToolbar.appendChild(svgBtn);

        // Export as FreeMind .mm format
        const mmBtn = document.createElement('button');
        mmBtn.className = 'mm-export-btn mm-export';
        mmBtn.innerHTML = '导出 .mm 文件';
        mmBtn.title = '导出为 .mm 文件（可用XMind、FreeMind等软件打开）';
        mmBtn.style.backgroundColor = '#ff6b35';
        mmBtn.onclick = exportToFreeMind;
        exportToolbar.appendChild(mmBtn);

        // Copy original Markdown button
        const copyBtn = document.createElement('button');
        copyBtn.className = 'mm-export-btn mm-copy-btn copy-markdown';
        copyBtn.innerHTML = '复制 Markdown';
        copyBtn.title = '复制原始Markdown内容';
        copyBtn.onclick = copyOriginalMarkdown;
        exportToolbar.appendChild(copyBtn);

        // Function to export to FreeMind .mm format
        function exportToFreeMind() {
          try {
            const markdownElement = document.getElementById('original-markdown');
            if (!markdownElement) {
              throw new Error('未找到原始Markdown内容');
            }
            
            const markdownContent = markdownElement.value;
            
            // Convert Markdown to FreeMind XML
            const freemindXml = convertMarkdownToFreeMind(markdownContent);
            
            // Create download link
            const blob = new Blob([freemindXml], { type: 'application/xml' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().slice(0, 10);
            link.download = \`markmap-\${timestamp}.mm\`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
            
            // Show success message
            const originalText = mmBtn.innerHTML;
            mmBtn.innerHTML = '✓ 已导出';
            mmBtn.style.backgroundColor = '#2ecc71';
            setTimeout(() => {
              mmBtn.innerHTML = originalText;
              mmBtn.style.backgroundColor = '#ff6b35';
            }, 2000);
          } catch (e) {
            console.error('导出.mm文件错误:', e);
            alert('导出失败：' + e.message);
          }
        }

        // Convert Markdown to FreeMind XML format
        function convertMarkdownToFreeMind(markdown) {
          const lines = markdown.split('\\n');
          let xml = '<?xml version="1.0" encoding="UTF-8"?>\\n';
          xml += '<map version="1.0.1">\\n';
          
          // 栈用于跟踪当前层级，初始化为根层级
          const stack = [{ level: 0 }];
          let nodeId = 0;
          let rootNodeAdded = false;
          
          lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) return;
            
            let level = 0;
            let text = trimmed;
            
            // 检测标题层级 (# ## ###)
            if (trimmed.startsWith('#')) {
              const match = trimmed.match(/^(#+)\\s+(.+)$/);
              if (match) {
                level = match[1].length;
                text = match[2];
              } else {
                return; // 无效的标题格式
              }
            } 
            // 检测列表项 (- 或 *)
            else if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
              // 计算缩进层级
              const leadingSpaces = line.match(/^\\s*/)[0].length;
              const indent = Math.floor(leadingSpaces / 2);
              
              // 列表项的层级 = 其父标题层级 + 1 + 缩进层级
              // 找到最近的标题层级
              let parentHeadingLevel = 0;
              for (let i = stack.length - 1; i >= 0; i--) {
                if (stack[i].level > 0) {
                  parentHeadingLevel = stack[i].level;
                  break;
                }
              }
              level = parentHeadingLevel + 1 + indent;
              text = trimmed.substring(1).trim();
            } else {
              // 忽略不是标题或列表项的行
              return;
            }
            
            // 清理文本中的XML特殊字符
            text = text.replace(/[<>&"']/g, (char) => {
              const entities = { 
                '<': '&lt;', 
                '>': '&gt;', 
                '&': '&amp;', 
                '"': '&quot;', 
                "'": '&apos;' 
              };
              return entities[char];
            });
            
            // 关闭比当前层级高或相等的节点
            while (stack.length > 1 && stack[stack.length - 1].level >= level) {
              const indent = '  '.repeat(stack.length - 1);
              xml += \`\${indent}</node>\\n\`;
              stack.pop();
            }
            
            // 添加新节点
            const indent = '  '.repeat(stack.length);
            
            if (!rootNodeAdded && level === 1) {
              // 第一个一级标题作为根节点
              xml += \`\${indent}<node ID="ID_\${nodeId++}" TEXT="\${text}">\\n\`;
              rootNodeAdded = true;
            } else {
              // 其他节点
              xml += \`\${indent}<node ID="ID_\${nodeId++}" TEXT="\${text}">\\n\`;
            }
            
            stack.push({ level });
          });
          
          // 关闭所有未关闭的节点
          while (stack.length > 1) {
            const indent = '  '.repeat(stack.length - 1);
            xml += \`\${indent}</node>\\n\`;
            stack.pop();
          }
          
          xml += '</map>';
          return xml;
        }

        // Function to copy original Markdown content
        function copyOriginalMarkdown() {
          try {
            const markdownElement = document.getElementById('original-markdown');
            if (!markdownElement) {
              throw new Error('未找到原始Markdown内容');
            }
            
            const markdownContent = markdownElement.value;
            
            // Copy to clipboard
            navigator.clipboard.writeText(markdownContent)
              .then(() => {
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '✓ 已复制';
                copyBtn.style.backgroundColor = '#2ecc71';
                
                setTimeout(() => {
                  copyBtn.innerHTML = originalText;
                  copyBtn.style.backgroundColor = '';
                }, 2000);
              })
              .catch(err => {
                console.error('复制失败:', err);
                alert('复制失败，请检查浏览器权限');
              });
          } catch (e) {
            console.error('复制Markdown错误:', e);
            alert('无法复制Markdown：' + e.message);
          }
        }

        // Function to export image
        function exportToImage(format) {
          try {
            const node = window.mm.svg._groups[0][0];
            
            if (!node) {
              throw new Error('找不到思维导图SVG元素');
            }

            window.mm.fit().then(() => {
              const options = {
                backgroundColor: "#ffffff", 
                quality: 1.0,
                width: node.getBoundingClientRect().width,
                height: node.getBoundingClientRect().height
              };
              
              const exportPromise = format === 'svg' 
                ? htmlToImage.toSvg(node, options)
                : format === 'jpeg' 
                  ? htmlToImage.toJpeg(node, options) 
                  : htmlToImage.toPng(node, options);
              
              exportPromise
                .then((dataUrl) => {
                  const link = document.createElement('a');
                  const timestamp = new Date().toISOString().slice(0, 10);
                  link.download = \`markmap-\${timestamp}.\${format === 'jpeg' ? 'jpg' : format === 'svg' ? 'svg' : 'png'}\`;
                  link.href = dataUrl;
                  link.click();
                })
                .catch((err) => console.error("导出失败:", err));
            })
            .catch((err) => {
                throw err;
            });
              
          } catch (e) {
            console.error('导出图片错误:', e);
            alert('图片导出失败：' + e.message);
          }
        }
      })();
    </script>
  `;

    const updatedContent = html.replace(
        "</body>",
        `${toolbarCode}\n${additionalCode}\n</body>`
    );

    // 写入本地文件
    await fs.writeFile(filePath, updatedContent);
    logger.info(`思维导图HTML文件已生成: ${filePath}`);

    // 如果提供了OSS上传器，则上传到云存储
    let ossUrl: string | undefined;
    let uploadedToOSS = false;

    if (ossUploader) {
        try {
            logger.info("检测到OSS上传器，开始上传文件到阿里云OSS");
            // 使用本地文件的basename作为OSS文件名，保留智能命名
            const fileName = basename(filePath);
            const uploadResult = await ossUploader.uploadFile(
                filePath,
                `markmap/${fileName}` // 包含markmap目录前缀
            );
            ossUrl = uploadResult.url;
            uploadedToOSS = true;
            logger.info(`文件已成功上传到OSS: ${ossUrl}`);

            // 清理本地临时文件的条件：
            // 1. 强制OSS上传模式下，总是清理
            // 2. 或者：不需要在本地打开 且 没有指定输出路径
            const shouldCleanup = forceOSSUpload || (!openIt && !output);

            if (shouldCleanup) {
                try {
                    await fs.unlink(filePath);
                    logger.info(`已清理本地临时HTML文件: ${filePath}`);
                } catch (cleanupError) {
                    logger.warn(`清理临时HTML文件失败: ${cleanupError}`);
                }
            }
        } catch (uploadError: any) {
            logger.error(`上传到OSS失败: ${uploadError.message}`);

            // 如果强制要求OSS上传，则抛出错误
            if (forceOSSUpload) {
                throw new Error(
                    `强制OSS上传模式下上传失败: ${uploadError.message}`
                );
            }

            logger.warn("将继续使用本地文件路径");
            // 非强制模式下，上传失败不影响整体流程，继续使用本地文件
        }
    } else if (forceOSSUpload) {
        // 如果强制要求OSS上传但没有配置上传器，抛出错误
        throw new Error("强制OSS上传模式下必须配置OSS上传器");
    }

    // 如果需要在浏览器中打开（仅当文件在本地时）
    if (openIt && !uploadedToOSS) {
        await open(filePath);
        logger.info(`已在浏览器中打开: ${filePath}`);
    }

    return {
        filePath: uploadedToOSS ? ossUrl! : filePath,
        content: updatedContent,
        ossUrl,
        uploadedToOSS
    };
}
