import fs from 'node:fs/promises';
import { marked } from 'marked';
import TurndownService from 'turndown';
import mammoth from 'mammoth';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import puppeteer from 'puppeteer';
import pdf from 'pdf-parse';

// 配置marked选项
marked.setOptions({
  gfm: true, // GitHub Flavored Markdown
  breaks: true // 支持换行
});

// 配置Turndown选项
const turndownService = new TurndownService({
  headingStyle: 'atx', // 使用 # 风格的标题
  codeBlockStyle: 'fenced' // 使用围栏式代码块
});

/**
 * Markdown转HTML
 */
export async function markdownToHtml(markdownContent: string): Promise<string> {
  const html = await marked(markdownContent);
  return html;
}

/**
 * HTML转Markdown
 */
export function htmlToMarkdown(htmlContent: string): string {
  return turndownService.turndown(htmlContent);
}

/**
 * Markdown转PDF
 */
export async function mdToPdf(
  inputPath: string,
  outputPath: string
): Promise<void> {
  const markdownContent = await fs.readFile(inputPath, 'utf-8');
  const html = await markdownToHtml(markdownContent);

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // 设置CSS样式以改善PDF外观
    const styledHtml = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8"/>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            h1, h2, h3, h4, h5, h6 {
              color: #333;
              margin-top: 24px;
              margin-bottom: 16px;
            }
            pre {
              background-color: #f6f8fa;
              border-radius: 6px;
              padding: 16px;
              overflow: auto;
            }
            code {
              background-color: #f6f8fa;
              padding: 2px 4px;
              border-radius: 3px;
            }
            blockquote {
              border-left: 4px solid #dfe2e5;
              padding-left: 16px;
              margin-left: 0;
              color: #6a737d;
            }
          </style>
        </head>
        <body>${html}</body>
      </html>
    `;

    await page.setContent(styledHtml, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    });
  } finally {
    await browser.close();
  }
}

/**
 * Markdown转DOCX
 */
export async function mdToDocx(
  inputPath: string,
  outputPath: string
): Promise<void> {
  const markdownContent = await fs.readFile(inputPath, 'utf-8');
  const html = await markdownToHtml(markdownContent);

  // 简单的HTML到DOCX转换
  // 这里可以进一步改进，解析HTML结构转换为更丰富的DOCX格式
  const textContent = turndownService.turndown(html);
  const lines = textContent.split('\n');

  const children = lines.map((line) => {
    // 检测标题
    if (line.startsWith('# ')) {
      return new Paragraph({
        text: line.substring(2),
        heading: HeadingLevel.HEADING_1
      });
    } else if (line.startsWith('## ')) {
      return new Paragraph({
        text: line.substring(3),
        heading: HeadingLevel.HEADING_2
      });
    } else if (line.startsWith('### ')) {
      return new Paragraph({
        text: line.substring(4),
        heading: HeadingLevel.HEADING_3
      });
    } else {
      return new Paragraph({
        children: [new TextRun(line || ' ')]
      });
    }
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  await fs.writeFile(outputPath, buffer);
}

/**
 * DOCX转Markdown
 */
export async function docxToMd(
  inputPath: string,
  outputPath: string
): Promise<void> {
  const { value: html } = await mammoth.convertToHtml({ path: inputPath });
  const markdown = htmlToMarkdown(html);
  await fs.writeFile(outputPath, markdown, 'utf-8');
}

/**
 * PDF转Markdown (保留基本格式)
 */
export async function pdfToMd(
  inputPath: string,
  outputPath: string
): Promise<void> {
  const data = await fs.readFile(inputPath);
  const parsed = await pdf(data);
  const text = parsed.text ?? '';

  // 简单的文本格式化为Markdown
  // 检测可能的标题行 (全大写或短行)
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  let markdown = '';
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = lines[i + 1];

    // 检测代码块
    if (line.includes('```') || line.includes('---')) {
      inCodeBlock = !inCodeBlock;
      markdown += line + '\n\n';
      continue;
    }

    if (inCodeBlock) {
      markdown += line + '\n';
      continue;
    }

    // 检测标题 (短行且下一行存在)
    if (line.length < 60 && nextLine && nextLine.length > line.length * 1.5) {
      // 可能是标题
      if (line.toUpperCase() === line && line.length > 3) {
        markdown += `# ${line}\n\n`;
      } else {
        markdown += `## ${line}\n\n`;
      }
    } else {
      markdown += line + '\n\n';
    }
  }

  await fs.writeFile(outputPath, markdown, 'utf-8');
}
