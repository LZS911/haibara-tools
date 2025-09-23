import path from 'node:path';
import * as fs from 'node:fs';
import express from 'express';
import multer from 'multer';
import {
  getInputOutputPaths,
  readJobMeta,
  setJobStatus,
  writeJobMeta
} from './storage';
import {
  getMaxSizeBytesForExt,
  getMimeByExt,
  type ImageFormat,
  type VideoFormat
} from './types';
import { txtToDocx, docxToPdf, pdfToTxt } from './pipelines/text';
import { mdToPdf, mdToDocx, docxToMd, pdfToMd } from './pipelines/markdown';
import { convertImageFormat } from './pipelines/image';
import {
  mp3ToWav,
  wavToMp3,
  mp3ToAac,
  aacToMp3,
  wavToFlac,
  flacToWav
} from './pipelines/audio';
import { convertVideoFormat, videoToGif } from './pipelines/video';
import { addSSEConnection, updateProgress } from './progress';

const router = express.Router();

// SSE endpoint for progress updates
router.get('/api/convert/:jobId/progress', (req, res) => {
  const jobId = req.params.jobId;
  const meta = readJobMeta(jobId);

  if (!meta) {
    return res.status(404).json({ error: 'job_not_found' });
  }

  addSSEConnection(jobId, res);
});

// 上传文件端点
const diskStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const jobId = req.params.jobId;
    const meta = readJobMeta(jobId);
    if (!meta) return cb(new Error('job_not_found'), '');
    const { jobDir } = getInputOutputPaths(jobId);
    cb(null, jobDir);
  },
  filename: (_req, file, cb) => {
    cb(null, file.originalname);
  }
});

router.post('/api/convert/:jobId/upload', (req, res) => {
  const jobId = req.params.jobId;
  const meta = readJobMeta(jobId);

  if (!meta) return res.status(404).json({ error: 'job_not_found' });
  if (
    meta.category !== 'text' &&
    meta.category !== 'image' &&
    meta.category !== 'audio' &&
    meta.category !== 'video'
  ) {
    return res.status(400).json({ error: 'unsupported_category' });
  }
  if (meta.status !== 'queued') {
    return res.status(409).json({ error: 'invalid_status' });
  }

  setJobStatus(jobId, 'uploading');
  updateProgress(jobId, 10, 'uploading', 'Starting upload...');

  // Create a multer instance with per-job file size limit and validation
  const maxSize = getMaxSizeBytesForExt(meta.from);
  const upload = multer({
    storage: diskStorage,
    limits: { fileSize: maxSize },
    fileFilter: (req, file, cb) => {
      const freshMeta = readJobMeta(req.params.jobId);
      if (!freshMeta) return cb(new Error('job_not_found'));
      if (freshMeta.status !== 'uploading' && freshMeta.status !== 'queued') {
        return cb(new Error('invalid_status'));
      }

      const ext = path
        .extname(file.originalname)
        .replace(/^\./, '')
        .toLowerCase();
      if (ext !== freshMeta.from) return cb(new Error('ext_mismatch'));

      const expectedMime = getMimeByExt(freshMeta.from);
      if (
        expectedMime.startsWith('application/') &&
        !file.mimetype.startsWith('application/')
      ) {
        return cb(new Error('mime_mismatch'));
      }
      if (
        expectedMime.startsWith('text/') &&
        !file.mimetype.startsWith('text/')
      ) {
        return cb(new Error('mime_mismatch'));
      }
      if (
        expectedMime.startsWith('image/') &&
        !file.mimetype.startsWith('image/')
      ) {
        return cb(new Error('mime_mismatch'));
      }
      if (
        expectedMime.startsWith('audio/') &&
        !file.mimetype.startsWith('audio/')
      ) {
        return cb(new Error('mime_mismatch'));
      }
      if (
        expectedMime.startsWith('video/') &&
        !file.mimetype.startsWith('video/')
      ) {
        return cb(new Error('mime_mismatch'));
      }
      cb(null, true);
    }
  }).single('file');

  upload(req, res, async (err: unknown) => {
    if (err) {
      setJobStatus(
        jobId,
        'error',
        err instanceof Error ? err.message : 'upload_error'
      );
      updateProgress(jobId, 0, 'error', 'Upload failed');

      const code = String(err).includes('file too large') ? 413 : 400;
      return res.status(code).json({ error: 'upload_failed' });
    }

    const fresh = readJobMeta(jobId);
    if (!fresh) return res.status(404).json({ error: 'job_not_found' });
    if (!req.file) {
      setJobStatus(jobId, 'error', 'no_file');
      updateProgress(jobId, 0, 'error', 'No file provided');
      return res.status(400).json({ error: 'no_file' });
    }

    const inputFileName = req.file.originalname;
    fresh.inputFileName = inputFileName;
    writeJobMeta(fresh);

    updateProgress(
      jobId,
      40,
      'uploading',
      'File uploaded successfully',
      inputFileName
    );

    try {
      setJobStatus(jobId, 'processing');
      updateProgress(
        jobId,
        50,
        'processing',
        'Starting conversion...',
        inputFileName
      );

      const { inputPath, outputPath } = getInputOutputPaths(
        jobId,
        inputFileName,
        fresh.to
      );
      if (!inputPath || !outputPath) throw new Error('path_error');

      const from = fresh.from;
      const to = fresh.to;
      const category = fresh.category;

      // 根据转换类型调用不同的处理函数
      if (category === 'image') {
        updateProgress(
          jobId,
          60,
          'processing',
          `Converting ${from.toUpperCase()} to ${to.toUpperCase()}...`
        );
        await convertImageFormat(
          inputPath,
          outputPath,
          from as ImageFormat, // 类型已在创建任务时验证
          to as ImageFormat
        );
      } else if (category === 'audio') {
        updateProgress(
          jobId,
          60,
          'processing',
          `Converting ${from.toUpperCase()} to ${to.toUpperCase()}...`
        );

        // 音频进度回调
        const onProgress = (percent: number) => {
          const adjustedPercent = 60 + percent * 0.3; // 60% -> 90%
          updateProgress(
            jobId,
            Math.round(adjustedPercent),
            'processing',
            `Converting audio... ${Math.round(percent)}%`
          );
        };

        // 根据具体的音频转换类型调用相应函数
        if (from === 'mp3' && to === 'wav') {
          await mp3ToWav(inputPath, outputPath, onProgress);
        } else if (from === 'wav' && to === 'mp3') {
          await wavToMp3(inputPath, outputPath, onProgress);
        } else if (from === 'mp3' && to === 'aac') {
          await mp3ToAac(inputPath, outputPath, onProgress);
        } else if (from === 'aac' && to === 'mp3') {
          await aacToMp3(inputPath, outputPath, onProgress);
        } else if (from === 'wav' && to === 'flac') {
          await wavToFlac(inputPath, outputPath, onProgress);
        } else if (from === 'flac' && to === 'wav') {
          await flacToWav(inputPath, outputPath, onProgress);
        } else {
          throw new Error(`Unsupported audio conversion: ${from} -> ${to}`);
        }
      } else if (category === 'video') {
        updateProgress(
          jobId,
          60,
          'processing',
          `Converting ${from.toUpperCase()} to ${to.toUpperCase()}...`
        );

        // 视频进度回调
        const onProgress = (percent: number) => {
          const adjustedPercent = 60 + percent * 0.3; // 60% -> 90%
          updateProgress(
            jobId,
            Math.round(adjustedPercent),
            'processing',
            `Converting video... ${Math.round(percent)}%`
          );
        };

        // 特殊处理 GIF 转换
        if (to === 'gif') {
          await videoToGif(
            inputPath,
            outputPath,
            {
              startTime: 0,
              duration: 10, // 转换前10秒
              fps: 10,
              width: 480
            },
            onProgress
          );
        } else {
          // 通用视频格式转换
          await convertVideoFormat(
            inputPath,
            outputPath,
            from as VideoFormat, // 类型已在创建任务时验证
            to as VideoFormat,
            onProgress
          );
        }
      } else if (from === 'md' && to === 'docx') {
        updateProgress(
          jobId,
          60,
          'processing',
          'Converting Markdown to DOCX...'
        );
        await mdToDocx(inputPath, outputPath);
      } else if (from === 'md' && to === 'pdf') {
        updateProgress(
          jobId,
          60,
          'processing',
          'Converting Markdown to PDF...'
        );
        await mdToPdf(inputPath, outputPath);
      } else if (from === 'docx' && to === 'md') {
        updateProgress(
          jobId,
          60,
          'processing',
          'Converting DOCX to Markdown...'
        );
        await docxToMd(inputPath, outputPath);
      } else if (from === 'docx' && to === 'pdf') {
        updateProgress(jobId, 60, 'processing', 'Converting DOCX to PDF...');
        await docxToPdf(inputPath, outputPath);
      } else if (from === 'pdf' && to === 'md') {
        updateProgress(
          jobId,
          60,
          'processing',
          'Converting PDF to Markdown...'
        );
        await pdfToMd(inputPath, outputPath);
      } else if (from === 'pdf' && to === 'docx') {
        updateProgress(jobId, 60, 'processing', 'Converting PDF to DOCX...');
        // PDF到DOCX：先转换为文本，再转换为DOCX
        const tempTxtPath = inputPath.replace(/\.pdf$/, '.temp.txt');
        await pdfToTxt(inputPath, tempTxtPath);
        updateProgress(jobId, 80, 'processing', 'Converting text to DOCX...');
        await txtToDocx(tempTxtPath, outputPath);
        // 清理临时文件
        try {
          await fs.promises.unlink(tempTxtPath);
        } catch (_e) {
          console.warn('Failed to delete temp file:', tempTxtPath);
        }
      } else {
        throw new Error('unsupported_pair');
      }

      updateProgress(jobId, 90, 'processing', 'Finalizing conversion...');

      const outName = path.basename(outputPath);
      const done = readJobMeta(jobId);
      if (!done) return res.status(404).json({ error: 'job_not_found' });

      done.outputFileName = outName;
      writeJobMeta(done);
      setJobStatus(jobId, 'done');

      updateProgress(jobId, 100, 'done', 'Conversion completed successfully!');

      return res.json({
        jobId,
        status: 'done',
        downloadUrl: `/api/convert/${jobId}/download`
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'process_error';
      setJobStatus(jobId, 'error', message);
      updateProgress(jobId, 0, 'error', `Conversion failed: ${message}`);
      return res.status(500).json({ error: 'process_failed' });
    }
  });
});

// 下载文件端点
router.get('/api/convert/:jobId/download', (req, res) => {
  const jobId = req.params.jobId;
  const meta = readJobMeta(jobId);

  if (!meta) return res.status(404).json({ error: 'job_not_found' });
  if (meta.status !== 'done' || !meta.outputFileName) {
    return res.status(409).json({ error: 'not_ready' });
  }

  const { jobDir } = getInputOutputPaths(jobId);
  const filePath = path.join(jobDir, meta.outputFileName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'file_missing' });
  }

  const mime = getMimeByExt(path.extname(filePath));
  res.setHeader('Content-Type', mime);
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${meta.outputFileName}"`
  );

  fs.createReadStream(filePath).pipe(res);
});

export default router;
