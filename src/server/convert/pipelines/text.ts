import fs from 'node:fs/promises';
import { Document, Packer, Paragraph } from 'docx';
import mammoth from 'mammoth';
import { getBrowser } from '@/server/lib/puppeteer-utils';
import pdf from 'pdf-parse';

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
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(
      `<!doctype html><html><head><meta charset="utf-8"/></head><body>${html}</body></html>`,
      { waitUntil: 'networkidle0' }
    );
    await page.pdf({ path: outputPath, format: 'A4', printBackground: true });
  } finally {
    await page.close();
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
