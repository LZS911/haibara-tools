/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import lodash from 'lodash';
import { promises as fs } from 'fs';
import { ascendingSort } from './utils/sort';
import { decodeDanmakuSegment, decodeDanmakuView } from './danmaku-segment';
import {
  type DanmakuConverterConfig,
  DanmakuConverter
} from './danmaku-converter';
import { XmlDanmaku } from './xml-danmaku';
import { UA } from '../data/ua';
import { getConfig } from '../../../lib/config';
import { handleFilePath } from '../utils';

// 封装请求，替换 window.electron.gotBuffer
async function fetchBuffer(url: string, sessdata: string) {
  const response = await axios.get(url, {
    headers: {
      'User-Agent': UA,
      Cookie: `SESSDATA=${sessdata}`
    },
    responseType: 'arraybuffer'
  });
  return response.data;
}

class JsonDanmaku {
  public jsonDanmakus: any[] = [];

  constructor(public cid: number | string) {}

  get xmlDanmakus(): XmlDanmakuData[] {
    return this.jsonDanmakus.map((json) => ({
      content: json.content,
      time: json.progress ? (json.progress / 1000).toString() : '0',
      type: json.mode?.toString() ?? '1',
      fontSize: json.fontsize?.toString() ?? '25',
      color: json.color?.toString() ?? '16777215',
      timeStamp: json.ctime?.toString() ?? '0',
      pool: json.pool?.toString() ?? '0',
      userHash: json.midHash ?? '0',
      rowId: json.idStr ?? '0'
    }));
  }

  async fetchInfo(sessdata: string) {
    const viewBuffer = await fetchBuffer(
      `https://api.bilibili.com/x/v2/dm/web/view?type=1&oid=${this.cid}`,
      sessdata
    );

    const view = await decodeDanmakuView(viewBuffer);
    const total = view.dmSge?.total;

    if (total === undefined) {
      throw new Error(
        `获取弹幕分页数失败: ${JSON.stringify(lodash.omit(view, 'flag'))}`
      );
    }

    const segments = await Promise.all(
      new Array(total).fill(0).map(async (_, index) => {
        try {
          const buffer = await fetchBuffer(
            `https://api.bilibili.com/x/v2/dm/web/seg.so?type=1&oid=${this.cid}&segment_index=${index + 1}`,
            sessdata
          );
          const result = await decodeDanmakuSegment(buffer);
          return result.elems ?? [];
        } catch (error) {
          console.error(`弹幕片段 ${index + 1} 下载失败`, error);
          return []; // 单个片段失败不影响整体
        }
      })
    );

    this.jsonDanmakus = segments
      .flat()
      .sort(ascendingSort((it) => it.progress));
    return this;
  }
}

// 从项目配置中获取默认值
function getDefaultDanmakuConfig(title: string): DanmakuConverterConfig {
  return {
    title,
    font: 'Microsoft YaHei', // 默认字体
    alpha: 0.4,
    duration: (danmaku: { type: number }) => (danmaku.type < 4 ? 6 : 4),
    blockTypes: [7, 8], // 屏蔽高级弹幕
    resolution: { x: 1920, y: 1080 },
    bottomMarginPercent: 0.15,
    bold: false
  };
}

async function convertToAss(danmaku: JsonDanmaku, title: string) {
  const config = getDefaultDanmakuConfig(title);
  const converter = new DanmakuConverter(config);
  const assDocument = converter.xmlDanmakuToAssDocument(
    danmaku.xmlDanmakus.map((x) => new XmlDanmaku(x as any))
  );
  return assDocument.generateAss();
}

interface DownloadAndConvertOptions {
  cid: number;
  title: string;
  outputDir: string;
}

/**
 * 主入口函数：下载并转换弹幕为 .ass 文件
 */
export async function downloadAndConvertDanmaku({
  cid,
  title,
  outputDir
}: DownloadAndConvertOptions): Promise<void> {
  try {
    const config = getConfig();
    const sessdata = config.BILIBILI_SESSDATA || '';

    // 1. 获取所有弹幕数据
    const danmaku = await new JsonDanmaku(cid).fetchInfo(sessdata);

    // 2. 将弹幕转换为 ASS 格式字符串
    const assString = await convertToAss(danmaku, title);

    // 3. 构建保存路径并保存文件
    const outputPath = handleFilePath(title, outputDir, '.ass');
    await fs.writeFile(outputPath, assString, 'utf-8');

    console.log(`Danmaku downloaded and converted successfully: ${outputPath}`);
  } catch (error: any) {
    // 只打印错误，不向上抛出，避免中断主下载流程
    console.error(`下载或转换弹幕失败 (CID: ${cid}): ${error.message}`);
  }
}

// 为 xmlDanmakus 属性添加一个辅助类型，避免类型检查错误
interface XmlDanmakuData {
  content: string;
  time: string;
  type: string;
  fontSize: string;
  color: string;
  timeStamp: string;
  pool: string;
  userHash: string;
  rowId: string;
}
