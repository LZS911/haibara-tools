import fs from 'fs/promises';
import axios from 'axios';
import { getConfig } from '../../lib/config';
import { TrainingStatusEnum, type TrainingStatus } from '@/types/voice-cloning';

const VOLCANO_ENGINE_HOST = 'https://openspeech.bytedance.com';

/**
 * 将音频文件编码为 base64
 * @param filePath 音频文件路径
 * @returns base64 编码的音频数据和格式
 */
async function encodeAudioFile(
  filePath: string
): Promise<{ encodedData: string; audioFormat: string }> {
  const audioData = await fs.readFile(filePath);
  const encodedData = audioData.toString('base64');
  const audioFormat = filePath.split('.').pop() || 'mp3';
  return { encodedData, audioFormat };
}

/**
 * 上传音频文件到火山引擎进行音色训练
 * @param audioPath 音频文件路径
 * @param speakerId 音色 ID
 * @returns 训练任务状态
 */
export async function uploadAudioForTraining(
  audioPath: string,
  speakerId: string
): Promise<TrainingStatus> {
  const config = getConfig();
  const appId = config.VOLC_APP_ID;
  const token = config.VOLC_ACCESS_TOKEN;

  if (!appId || !token) {
    throw new Error(
      'VOLC_APP_ID 和 VOLC_ACCESS_TOKEN 未配置。请在设置中配置火山引擎凭证。'
    );
  }

  const url = `${VOLCANO_ENGINE_HOST}/api/v1/mega_tts/audio/upload`;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer; ${token}`,
    'Resource-Id': 'volc.megatts.voiceclone'
  };

  const { encodedData, audioFormat } = await encodeAudioFile(audioPath);
  const audios = [{ audio_bytes: encodedData, audio_format: audioFormat }];

  /**
   * source: 固定值：2
   * language: model_type为0或者1时候，支持以下语种
   * cn = 0 中文（默认）
   * en = 1 英文
   * ja = 2 日语
   * es = 3 西班牙语
   * id = 4 印尼语
   * pt = 5 葡萄牙语
   * model_type为2时候，支持以下语种
   * cn = 0 中文（默认）
   * en = 1 英文
   * ja = 2 日语
   * es = 3 西班牙语
   * id = 4 印尼语
   * pt = 5 葡萄牙语
   * de = 6 德语
   * fr = 7 法语
   * model_type为3或4时候，仅支持以下语种
   * cn = 0 中文（默认）
   * en = 1 英文
   * model_type: 默认为0
   * 1为ICL效果，0为1.0效果
   * 2为DiT标准版效果（音色、不还原用户的风格）
   * 3为DiT还原版效果（音色、还原用户口音、语速等风格）
   * 4为豆包声音复刻2.0效果
   */
  const data = {
    appid: appId,
    speaker_id: speakerId,
    audios: audios,
    source: 2,
    language: 0,
    model_type: 1,
    extra_params: JSON.stringify({ voice_clone_enable_mss: true })
  };

  try {
    const response = await axios.post(url, data, { headers });

    if (response.status !== 200) {
      throw new Error(`上传失败: ${response.statusText}`);
    }

    console.log('音频上传成功:', response.data);

    return {
      status: TrainingStatusEnum.Training,
      speakerId: speakerId,
      message: '音频上传成功，训练已开始'
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(`上传音频失败: ${errorMessage}`);
    }
    throw error;
  }
}

/**
 * 查询训练状态
 * @param speakerId 音色 ID
 * @returns 训练状态
 */
export async function getTrainingStatus(
  speakerId: string
): Promise<TrainingStatus> {
  const config = getConfig();
  const appId = config.VOLC_APP_ID;
  const token = config.VOLC_ACCESS_TOKEN;

  if (!appId || !token) {
    throw new Error(
      'VOLC_APP_ID 和 VOLC_ACCESS_TOKEN 未配置。请在设置中配置火山引擎凭证。'
    );
  }

  const url = `${VOLCANO_ENGINE_HOST}/api/v1/mega_tts/status`;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer;${token}`,
    'Resource-Id': 'volc.megatts.voiceclone'
  };

  const body = {
    appid: appId,
    speaker_id: speakerId
  };

  try {
    const response = await axios.post(url, body, { headers });

    if (response.status !== 200) {
      throw new Error(`查询状态失败: ${response.statusText}`);
    }

    const responseData = response.data;
    console.log('训练状态查询结果:', responseData);

    // 解析火山引擎返回的状态
    // 根据实际 API 返回格式调整
    const status =
      responseData.data?.status || responseData.status || 'unknown';
    const message = responseData.data?.message || responseData.message;

    return {
      status: status,
      speakerId: speakerId,
      message: message
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(`查询训练状态失败: ${errorMessage}`);
    }
    throw error;
  }
}
