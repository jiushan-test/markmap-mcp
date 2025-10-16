import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import { tmpdir } from "os";
import { join } from "path";

import { Transformer, builtInPlugins } from "markmap-lib";
import { fillTemplate } from "markmap-render";

import open from "open";
import { OSSUploader } from "../utils/oss-uploader.js";
import logger from "../utils/logger.js";

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
    const { content, output, openIt = false, ossUploader = null, forceOSSUpload = false } = options;

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
        pngBtn.innerHTML = 'Export PNG';
        pngBtn.title = 'Export as PNG image';
        pngBtn.onclick = () => {
          exportToImage('png');
        };
        exportToolbar.appendChild(pngBtn);

        // Export as JPG image
        const jpgBtn = document.createElement('button');
        jpgBtn.className = 'mm-export-btn jpg-export';
        jpgBtn.innerHTML = 'Export JPG';
        jpgBtn.title = 'Export as JPG image';
        jpgBtn.onclick = () => {
          exportToImage('jpeg');
        };
        exportToolbar.appendChild(jpgBtn);
        
        // Export as SVG image
        const svgBtn = document.createElement('button');
        svgBtn.className = 'mm-export-btn svg-export';
        svgBtn.innerHTML = 'Export SVG';
        svgBtn.title = 'Export as SVG image';
        svgBtn.onclick = () => {
          exportToImage('svg');
        };
        exportToolbar.appendChild(svgBtn);

        // Copy original Markdown button
        const copyBtn = document.createElement('button');
        copyBtn.className = 'mm-export-btn mm-copy-btn copy-markdown';
        copyBtn.innerHTML = 'Copy Markdown';
        copyBtn.title = 'Copy original Markdown content';
        copyBtn.onclick = copyOriginalMarkdown;
        exportToolbar.appendChild(copyBtn);

        // Function to copy original Markdown content
        function copyOriginalMarkdown() {
          try {
            const markdownElement = document.getElementById('original-markdown');
            if (!markdownElement) {
              throw new Error('Original Markdown content not found');
            }
            
            const markdownContent = markdownElement.value;
            
            // Copy to clipboard
            navigator.clipboard.writeText(markdownContent)
              .then(() => {
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '✓ Copied';
                copyBtn.style.backgroundColor = '#2ecc71';
                
                setTimeout(() => {
                  copyBtn.innerHTML = originalText;
                  copyBtn.style.backgroundColor = '';
                }, 2000);
              })
              .catch(err => {
                console.error('Copy failed:', err);
                alert('Failed to copy to clipboard, please check browser permissions');
              });
          } catch (e) {
            console.error('Error copying Markdown:', e);
            alert('Unable to copy Markdown: ' + e.message);
          }
        }

        // Function to export image
        function exportToImage(format) {
          try {
            const node = window.mm.svg._groups[0][0];
            
            if (!node) {
              throw new Error('Cannot find mind map SVG element');
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
                .catch((err) => console.error("Export failed:", err));
            })
            .catch((err) => {
                throw err;
            });
              
          } catch (e) {
            console.error('Error exporting image:', e);
            alert('Image export failed: ' + e.message);
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
            const uploadResult = await ossUploader.uploadFile(
                filePath,
                `markmap-${Date.now()}.html`
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
                throw new Error(`强制OSS上传模式下上传失败: ${uploadError.message}`);
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
