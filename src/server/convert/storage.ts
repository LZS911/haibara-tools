import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import {
  type ConvertCategory,
  type ConvertJobMeta,
  type JobStatus,
  type FileFormat,
  sanitizeFileName
} from './types';

const JOB_ROOT_DIR = path.resolve(process.cwd(), 'tmp', 'convert-jobs');

function ensureDirSync(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function getJobDir(jobId: string): string {
  const dir = path.join(JOB_ROOT_DIR, jobId);
  return dir;
}

export function createJobMeta(
  category: ConvertCategory,
  from: FileFormat,
  to: FileFormat
): ConvertJobMeta {
  ensureDirSync(JOB_ROOT_DIR);
  const id = randomUUID();
  const now = Date.now();
  const meta: ConvertJobMeta = {
    id,
    category,
    from,
    to,
    status: 'queued',
    createdAt: now,
    updatedAt: now
  };
  const jobDir = getJobDir(id);
  ensureDirSync(jobDir);
  writeJobMeta(meta);
  return meta;
}

export function metaFilePath(jobId: string): string {
  return path.join(getJobDir(jobId), 'meta.json');
}

export function readJobMeta(jobId: string): ConvertJobMeta | null {
  try {
    const metaPath = metaFilePath(jobId);
    const content = fs.readFileSync(metaPath, 'utf-8');
    const meta = JSON.parse(content) as ConvertJobMeta;
    return meta;
  } catch {
    return null;
  }
}

export function writeJobMeta(meta: ConvertJobMeta): void {
  const metaPath = metaFilePath(meta.id);
  meta.updatedAt = Date.now();
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8');
}

export function setJobStatus(
  jobId: string,
  status: JobStatus,
  errorMessage?: string
): void {
  const meta = readJobMeta(jobId);
  if (!meta) return;
  meta.status = status;
  if (typeof errorMessage === 'string') {
    meta.errorMessage = errorMessage;
  }
  writeJobMeta(meta);
}

export function getInputOutputPaths(
  jobId: string,
  inputFileName?: string,
  toExt?: string
): { jobDir: string; inputPath?: string; outputPath?: string } {
  const jobDir = getJobDir(jobId);
  let inputPath: string | undefined;
  let outputPath: string | undefined;
  if (inputFileName) {
    inputPath = path.join(jobDir, sanitizeFileName(inputFileName));
  }
  if (inputFileName && toExt) {
    const base = path.parse(inputFileName).name;
    outputPath = path.join(jobDir, `${base}.${toExt.replace(/^\./, '')}`);
  }
  return { jobDir, inputPath, outputPath };
}
