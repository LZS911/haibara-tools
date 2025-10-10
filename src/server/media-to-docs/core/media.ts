import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';

ffmpeg.setFfmpegPath(ffmpegPath.path);

export const mergeVideoAudio = (
  videoPath: string,
  audioPath: string,
  out: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(videoPath)
      .input(audioPath)
      .audioCodec('copy')
      .videoCodec('copy')
      .on('start', (cmd: string) => {
        console.log(`开始转码：${cmd}`);
      })
      .on('end', () => {
        resolve('end');
      })
      .on('error', (err: Error) => {
        reject(err);
      })
      .save(out);
  });
};
