import fs from 'node:fs/promises';
import { Document, Packer, Paragraph } from 'docx';
import mammoth from 'mammoth';
import puppeteer from 'puppeteer';
// @ts-expect-error (无法找到 pdf-parse 的类型定义)
import pdf from 'pdf-parse/lib/pdf-parse.js';

export async function txtToDocx(
  inputPath: string,
  outputPath: string
): Promise<void> {
  const content = await fs.readFile(inputPath, 'utf-8');
  const paragraphs = content
    .split(/\r?\n/g)
    .map((line) => new Paragraph({ text: line.length > 0 ? line : ' ' }));
  const doc = new Document({
    sections: [{ properties: {}, children: paragraphs }]
  });
  const buffer = await Packer.toBuffer(doc);
  await fs.writeFile(outputPath, buffer);
}

export async function docxToPdf(
  inputPath: string,
  outputPath: string
): Promise<void> {
  const { value: html } = await mammoth.convertToHtml({ path: inputPath });
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  try {
    const page = await browser.newPage();
    await page.setContent(
      `<!doctype html><html><head><meta charset="utf-8"/></head><body>${html}</body></html>`,
      { waitUntil: 'networkidle0' }
    );
    await page.pdf({ path: outputPath, format: 'A4', printBackground: true });
  } finally {
    await browser.close();
  }
}

export async function pdfToTxt(
  inputPath: string,
  outputPath: string
): Promise<void> {
  const data = await fs.readFile(inputPath);
  const parsed = await pdf(data);
  const text = parsed.text ?? '';
  await fs.writeFile(outputPath, text, 'utf-8');
}
