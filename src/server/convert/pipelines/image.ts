import sharp from 'sharp';
import type { ImageFormat } from '../types';

interface ConvertOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
}

// 默认转换选项
const DEFAULT_OPTIONS: Required<ConvertOptions> = {
  quality: 85,
  maxWidth: 4096,
  maxHeight: 4096
};

// 通用图片转换函数
async function convertImage(
  inputPath: string,
  outputPath: string,
  outputFormat: ImageFormat,
  options: ConvertOptions = {}
): Promise<void> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  let pipeline = sharp(inputPath);

  // 限制图片尺寸
  pipeline = pipeline.resize({
    width: opts.maxWidth,
    height: opts.maxHeight,
    fit: 'inside',
    withoutEnlargement: true
  });

  // 根据输出格式设置转换参数
  switch (outputFormat) {
    case 'jpg':
      pipeline = pipeline.jpeg({ quality: opts.quality, progressive: true });
      break;
    case 'png':
      pipeline = pipeline.png({ quality: opts.quality, progressive: true });
      break;
    case 'webp':
      pipeline = pipeline.webp({ quality: opts.quality });
      break;
    default:
      throw new Error(`unsupported_output_format: ${outputFormat}`);
  }

  await pipeline.toFile(outputPath);
}

// JPG 转换函数
export async function jpgToPng(
  inputPath: string,
  outputPath: string,
  options?: ConvertOptions
): Promise<void> {
  await convertImage(inputPath, outputPath, 'png', options);
}

export async function jpgToWebp(
  inputPath: string,
  outputPath: string,
  options?: ConvertOptions
): Promise<void> {
  await convertImage(inputPath, outputPath, 'webp', options);
}

// PNG 转换函数
export async function pngToJpg(
  inputPath: string,
  outputPath: string,
  options?: ConvertOptions
): Promise<void> {
  // PNG转JPG时，如果有透明背景，需要设置白色背景
  const opts = { ...DEFAULT_OPTIONS, ...options };

  await sharp(inputPath)
    .resize({
      width: opts.maxWidth,
      height: opts.maxHeight,
      fit: 'inside',
      withoutEnlargement: true
    })
    .flatten({ background: { r: 255, g: 255, b: 255 } }) // 设置白色背景
    .jpeg({ quality: opts.quality, progressive: true })
    .toFile(outputPath);
}

export async function pngToWebp(
  inputPath: string,
  outputPath: string,
  options?: ConvertOptions
): Promise<void> {
  await convertImage(inputPath, outputPath, 'webp', options);
}

// WebP 转换函数
export async function webpToJpg(
  inputPath: string,
  outputPath: string,
  options?: ConvertOptions
): Promise<void> {
  // WebP转JPG时，如果有透明背景，需要设置白色背景
  const opts = { ...DEFAULT_OPTIONS, ...options };

  await sharp(inputPath)
    .resize({
      width: opts.maxWidth,
      height: opts.maxHeight,
      fit: 'inside',
      withoutEnlargement: true
    })
    .flatten({ background: { r: 255, g: 255, b: 255 } }) // 设置白色背景
    .jpeg({ quality: opts.quality, progressive: true })
    .toFile(outputPath);
}

export async function webpToPng(
  inputPath: string,
  outputPath: string,
  options?: ConvertOptions
): Promise<void> {
  await convertImage(inputPath, outputPath, 'png', options);
}

// 统一的图片转换入口函数
export async function convertImageFormat(
  inputPath: string,
  outputPath: string,
  fromFormat: ImageFormat,
  toFormat: ImageFormat,
  options?: ConvertOptions
): Promise<void> {
  const key = `${fromFormat}_to_${toFormat}`;

  switch (key) {
    // JPG 转换
    case 'jpg_to_png':
      await jpgToPng(inputPath, outputPath, options);
      break;
    case 'jpg_to_webp':
      await jpgToWebp(inputPath, outputPath, options);
      break;

    // PNG 转换
    case 'png_to_jpg':
      await pngToJpg(inputPath, outputPath, options);
      break;
    case 'png_to_webp':
      await pngToWebp(inputPath, outputPath, options);
      break;

    // WebP 转换
    case 'webp_to_jpg':
      await webpToJpg(inputPath, outputPath, options);
      break;
    case 'webp_to_png':
      await webpToPng(inputPath, outputPath, options);
      break;

    default:
      throw new Error(`unsupported_conversion: ${fromFormat} to ${toFormat}`);
  }
}
