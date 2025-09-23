import { initTRPC } from '@trpc/server';
import type { TRPCContext } from '@/server/types';
import { z } from 'zod';
import {
  type SupportConvertType,
  type ConvertCategory,
  type FileFormat,
  isValidConvertType
} from './types';
import { createJobMeta, readJobMeta } from './storage';

const t = initTRPC.context<TRPCContext>().create();

// 定义支持的转换类型
const SUPPORT_CONVERT_TYPE_CONFIG: SupportConvertType = {
  video: [
    // MP4 转换 - 最常用的格式
    { from: 'mp4', to: 'avi' },
    { from: 'mp4', to: 'mov' },
    { from: 'mp4', to: 'mkv' },
    { from: 'mp4', to: 'gif' },
    // AVI 转换
    { from: 'avi', to: 'mp4' },
    { from: 'avi', to: 'mov' },
    { from: 'avi', to: 'mkv' },
    // MOV 转换 (QuickTime)
    { from: 'mov', to: 'mp4' },
    { from: 'mov', to: 'avi' },
    { from: 'mov', to: 'mkv' },
    { from: 'mov', to: 'gif' },
    // MKV 转换 (Matroska)
    { from: 'mkv', to: 'mp4' },
    { from: 'mkv', to: 'avi' },
    { from: 'mkv', to: 'mov' }
  ],
  text: [
    { from: 'docx', to: 'pdf' },
    { from: 'docx', to: 'md' },
    { from: 'pdf', to: 'docx' },
    { from: 'pdf', to: 'md' },
    { from: 'md', to: 'docx' },
    { from: 'md', to: 'pdf' }
  ],
  image: [
    { from: 'jpg', to: 'png' },
    { from: 'jpg', to: 'webp' },
    { from: 'png', to: 'jpg' },
    { from: 'png', to: 'webp' },
    { from: 'webp', to: 'jpg' },
    { from: 'webp', to: 'png' }
  ],
  audio: [
    { from: 'mp3', to: 'wav' },
    { from: 'wav', to: 'mp3' },
    { from: 'mp3', to: 'aac' },
    { from: 'aac', to: 'mp3' },
    { from: 'wav', to: 'flac' },
    { from: 'flac', to: 'wav' }
  ]
};

function isSupported(
  category: ConvertCategory,
  from: FileFormat,
  to: FileFormat
): boolean {
  return (
    isValidConvertType(category, from, to) &&
    SUPPORT_CONVERT_TYPE_CONFIG[category].some(
      (p) => p.from === from && p.to === to
    )
  );
}

export const convertRouter = t.router({
  support_type: t.procedure.query(async () => {
    return SUPPORT_CONVERT_TYPE_CONFIG;
  }),
  create_job: t.procedure
    .input(
      z
        .object({
          category: z.enum(['text', 'image', 'audio', 'video']),
          from: z.string(),
          to: z.string()
        })
        .refine((v) => v.from !== v.to, { message: 'from/to must differ' })
        .refine(
          (v) => {
            // 验证格式是否属于对应类别
            const { category, from, to } = v;
            try {
              return isValidConvertType(
                category,
                from as FileFormat,
                to as FileFormat
              );
            } catch {
              return false;
            }
          },
          { message: 'Invalid format for category' }
        )
    )
    .mutation(async ({ input }) => {
      const { category, from, to } = input;
      const fromFormat = from as FileFormat;
      const toFormat = to as FileFormat;

      if (!isSupported(category, fromFormat, toFormat)) {
        throw new Error('Unsupported convert type');
      }

      const meta = createJobMeta(category, fromFormat, toFormat);
      const uploadUrl = `/api/convert/${meta.id}/upload`;
      return { jobId: meta.id, uploadUrl };
    }),
  job_status: t.procedure
    .input(z.object({ jobId: z.string().min(1) }))
    .query(async ({ input }) => {
      const meta = readJobMeta(input.jobId);
      if (!meta) {
        throw new Error('Job not found');
      }
      const downloadUrl =
        meta.status === 'done' && meta.outputFileName
          ? `/api/convert/${meta.id}/download`
          : undefined;
      return {
        status: meta.status,
        errorMessage: meta.errorMessage,
        downloadUrl
      } as const;
    })
});
