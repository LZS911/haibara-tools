import { z } from 'zod';
import { initTRPC, TRPCError } from '@trpc/server';
import type { TRPCContext } from '../../types';
import { randomUUID } from 'crypto';
import axios from 'axios';
import { setTimeout } from 'timers/promises';

const t = initTRPC.context<TRPCContext>().create();

// --- Constants based on Python script ---
const SUBMIT_URL =
  'https://openspeech-direct.zijieapi.com/api/v3/auc/bigmodel/submit';
const QUERY_URL =
  'https://openspeech-direct.zijieapi.com/api/v3/auc/bigmodel/query';

// --- Config ---
const APP_ID = process.env.VOLC_APP_ID;
const ACCESS_TOKEN = process.env.VOLC_ACCESS_TOKEN;

// --- Utilities ---

const checkConfig = () => {
  if (!APP_ID || !ACCESS_TOKEN) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: '火山引擎凭证未配置'
    });
  }
};

const submitTask = async (fileUrl: string) => {
  checkConfig();
  const taskId = randomUUID();
  const headers = {
    'X-Api-App-Key': APP_ID,
    'X-Api-Access-Key': ACCESS_TOKEN,
    'X-Api-Resource-Id': 'volc.bigasr.auc',
    'X-Api-Request-Id': taskId,
    'X-Api-Sequence': '-1',
    'Content-Type': 'application/json'
  };

  const requestBody = {
    user: {
      uid: 'fake_uid'
    },
    audio: {
      url: fileUrl
    },
    request: {
      model_name: 'bigmodel',
      enable_channel_split: true,
      enable_ddc: true,
      enable_speaker_info: true,
      enable_punc: true,
      enable_itn: true
    }
  };

  const response = await axios.post(SUBMIT_URL, requestBody, { headers });

  if (response.headers['x-api-status-code'] === '20000000') {
    return {
      taskId,
      logId: response.headers['x-tt-logid']
    };
  } else {
    console.error('Submit task failed. Response headers:', response.headers);
    throw new Error(
      `Submit task failed with status: ${response.headers['x-api-status-code']}`
    );
  }
};

const queryTask = async (taskId: string, logId: string) => {
  checkConfig();
  const headers = {
    'X-Api-App-Key': APP_ID,
    'X-Api-Access-Key': ACCESS_TOKEN,
    'X-Api-Resource-Id': 'volc.bigasr.auc',
    'X-Api-Request-Id': taskId,
    'X-Tt-Logid': logId,
    'Content-Type': 'application/json'
  };

  console.log(`Querying task ID: ${taskId}`);
  const response = await axios.post(QUERY_URL, {}, { headers });

  const statusCode = response.headers['x-api-status-code'];
  console.log(`Query response status code: ${statusCode}`);

  if (statusCode === '20000000') {
    // Task finished
    return { status: 'finished', data: response.data };
  } else if (statusCode === '20000001' || statusCode === '20000002') {
    // Task in progress
    return { status: 'running', data: null };
  } else {
    // Task failed
    console.error('Query task failed. Response headers:', response.headers);
    throw new Error(`Query task failed with status: ${statusCode}`);
  }
};

// --- tRPC Router ---

export const asrDirectRouter = t.router({
  /**
   * Transcribes an audio file using Volcano Engine ASR (non-streaming).
   * This requires a publicly accessible URL for the audio file.
   */
  transcribeDirect: t.procedure
    .input(z.object({ audioUrl: z.string().url() }))
    .mutation(async ({ input }) => {
      try {
        // 1. Submit the transcription task
        const { taskId, logId } = await submitTask(input.audioUrl);

        // 2. Poll for the result
        let attempts = 0;
        const maxAttempts = 60; // Poll for a maximum of 5 minutes (60 * 5s)
        while (attempts < maxAttempts) {
          const result = await queryTask(taskId, logId);

          if (result.status === 'finished') {
            console.log('Transcription finished successfully.');
            const fullText = result.data?.result?.[0]?.text ?? '';
            return {
              fullText,
              utterances: result.data?.result ?? []
            };
          }

          // Wait for 5 seconds before the next poll
          await setTimeout(5000);
          attempts++;
        }

        throw new Error('Transcription task timed out.');
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'An unknown error occurred during direct transcription.';
        console.error('Direct transcription failed:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: errorMessage
        });
      }
    })
});
