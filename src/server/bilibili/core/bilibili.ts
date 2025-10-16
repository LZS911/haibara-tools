import axios from 'axios';
import { customAlphabet } from 'nanoid';
import { formatSeconed, filterTitle, sleep } from './utils';
import { qualityMap } from './data/quality';
import alphabet from './data/alphabet';
import {
  type VideoData,
  type Page,
  type DownloadUrl,
  type Subtitle,
  type SettingData,
  LoginStatus
} from '../../../types/bilibili';
import { UA } from './data/ua';

// 自定义uuid
const nanoid = customAlphabet(alphabet, 16);

/**
 * @params videoInfo: 当前下载的视频详情 selected：所选的分p quality：所选的清晰度
 * @returns 返回下载数据 Array
 */
const getDownloadList = async (
  videoInfo: VideoData,
  selected: number[],
  quality: number,
  settings: SettingData
) => {
  const downloadList: VideoData[] = [];
  for (let index = 0; index < selected.length; index++) {
    const currentPage = selected[index];
    // 请求选中清晰度视频下载地址
    const currentPageData = videoInfo.page.find(
      (item) => item.page === currentPage
    );
    if (!currentPageData) throw new Error('获取视频下载地址错误');
    const currentCid = currentPageData.cid;
    const currentBvid = currentPageData.bvid;
    // 获取下载地址
    // 判断当前数据是否有下载地址列表，有则直接用，没有再去请求
    const downloadUrl: DownloadUrl = { video: '', audio: '' };
    const videoUrl = videoInfo.video.find(
      (item) => item.id === quality && item.cid === currentCid
    );
    const audioUrl = getHighQualityAudio(videoInfo.audio);
    if (videoUrl && audioUrl) {
      downloadUrl.video = videoUrl.url;
      downloadUrl.audio = audioUrl.url;
    } else {
      const { video, audio } = await getDownloadUrl(
        currentCid,
        currentBvid,
        quality,
        settings
      );
      downloadUrl.video = video;
      downloadUrl.audio = audio;
    }
    // 获取字幕地址
    const subtitle = await getSubtitle(currentCid, currentBvid, settings);
    const taskId = nanoid();
    const fileDir = handleFileDir(videoInfo.title, currentBvid, settings);
    const videoData: VideoData = {
      ...videoInfo,
      id: taskId,
      title: currentPageData.title,
      url: currentPageData.url,
      quality: quality,
      duration: currentPageData.duration,
      createdTime: +new Date(),
      cid: currentCid,
      bvid: currentBvid,
      downloadUrl,
      filePathList: handleFilePathList(
        selected.length === 1 ? 0 : currentPage,
        currentPageData.title,
        fileDir
      ),
      fileDir,
      subtitle
    };
    downloadList.push(videoData);
    if (index !== selected.length - 1) {
      await sleep(1000);
    }
  }
  return downloadList;
};

/**
 *
 * @returns 0: 游客，未登录 1：普通用户 2：大会员
 */
const checkLogin = async (SESSDATA: string) => {
  const { data } = await axios.get(
    'https://api.bilibili.com/x/web-interface/nav',
    {
      headers: {
        'User-Agent': UA,
        cookie: `SESSDATA=${SESSDATA}`
      }
    }
  );
  if (data.data.isLogin && !data.data.vipStatus) {
    return LoginStatus.user;
  } else if (data.data.isLogin && data.data.vipStatus) {
    return LoginStatus.vip;
  } else {
    return LoginStatus.visitor;
  }
};

// 检查url合法
const checkUrl = (url: string) => {
  const mapUrl: Record<string, string> = {
    'video/av': 'BV',
    'video/BV': 'BV',
    'play/ss': 'ss',
    'play/ep': 'ep'
  };
  let flag = false;
  for (const key in mapUrl) {
    if (url.includes(key)) {
      flag = true;
      return mapUrl[key];
    }
  }
  if (!flag) {
    return '';
  }
};

// 检查url是否有重定向
const checkUrlRedirect = async (videoUrl: string, settings: SettingData) => {
  const { data, request } = await axios.get(videoUrl, {
    headers: {
      'User-Agent': UA,
      cookie: `SESSDATA=${settings.SESSDATA}`
    }
  });
  const url = request.res.responseUrl;
  return {
    body: data,
    url
  };
};

const parseHtml = (
  html: string,
  type: string,
  url: string,
  settings: SettingData
) => {
  switch (type) {
    case 'BV':
      return parseBV(html, url, settings);
    case 'ss':
      return parseSS(html, settings);
    case 'ep':
      return parseEP(html, url, settings);
    default:
      return -1;
  }
};

const parseBV = async (html: string, url: string, settings: SettingData) => {
  try {
    const videoInfo = html.match(
      /<\/script><script>window\.__INITIAL_STATE__=([\s\S]*?);\(function\(\)/
    );
    if (!videoInfo) throw new Error('parse bv error');
    const { videoData } = JSON.parse(videoInfo[1]);
    // 获取视频下载地址
    let acceptQuality = null;
    try {
      let downLoadData: any = html.match(
        /<script>window\.__playinfo__=([\s\S]*?)<\/script><script>window\.__INITIAL_STATE__=/
      );
      if (!downLoadData) throw new Error('parse bv error');
      downLoadData = JSON.parse(downLoadData[1]);
      acceptQuality = {
        accept_quality: downLoadData.data.accept_quality,
        video: downLoadData.data.dash.video,
        audio: downLoadData.data.dash.audio
      };
    } catch {
      acceptQuality = await getAcceptQuality(
        videoData.cid,
        videoData.bvid,
        settings
      );
    }
    const obj: VideoData = {
      id: '',
      title: videoData.title,
      url,
      bvid: videoData.bvid,
      cid: videoData.cid,
      cover: videoData.pic,
      createdTime: -1,
      quality: -1,
      view: videoData.stat.view,
      danmaku: videoData.stat.danmaku,
      reply: videoData.stat.reply,
      duration: formatSeconed(videoData.duration),
      up: Object.prototype.hasOwnProperty.call(videoData, 'staff')
        ? videoData.staff.map((item: any) => ({
            name: item.name,
            mid: item.mid
          }))
        : [{ name: videoData.owner.name, mid: videoData.owner.mid }],
      qualityOptions: acceptQuality.accept_quality.map((item: number) => ({
        label: qualityMap[item as keyof typeof qualityMap] || String(item),
        value: item
      })),
      page: parseBVPageData(videoData, url),
      subtitle: [],
      video: acceptQuality.video
        ? acceptQuality.video.map((item: any) => ({
            id: item.id,
            cid: videoData.cid,
            url: item.baseUrl
          }))
        : [],
      audio: acceptQuality.audio
        ? acceptQuality.audio.map((item: any) => ({
            id: item.id,
            cid: videoData.cid,
            url: item.baseUrl
          }))
        : [],
      filePathList: [],
      fileDir: '',
      size: -1,
      downloadUrl: { video: '', audio: '' }
    };
    return obj;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(errorMessage);
  }
};

const parseEP = async (html: string, url: string, settings: SettingData) => {
  try {
    const videoInfo = html.match(
      /<script>window\.__INITIAL_STATE__=([\s\S]*?);\(function\(\){var s;/
    );
    if (!videoInfo) throw new Error('parse ep error');
    const { h1Title, mediaInfo, epInfo, epList } = JSON.parse(videoInfo[1]);
    // 获取视频下载地址
    let acceptQuality = null;
    try {
      let downLoadData: any = html.match(
        /<script>window\.__playinfo__=([\s\S]*?)<\/script><script>window\.__INITIAL_STATE__=/
      );
      if (!downLoadData) throw new Error('parse ep error');
      downLoadData = JSON.parse(downLoadData[1]);
      acceptQuality = {
        accept_quality: downLoadData.data.accept_quality,
        video: downLoadData.data.dash.video,
        audio: downLoadData.data.dash.audio
      };
    } catch {
      acceptQuality = await getAcceptQuality(epInfo.cid, epInfo.bvid, settings);
    }
    const obj: VideoData = {
      id: '',
      title: h1Title,
      url,
      bvid: epInfo.bvid,
      cid: epInfo.cid,
      cover: `http:${mediaInfo.cover}`,
      createdTime: -1,
      quality: -1,
      view: mediaInfo.stat.views,
      danmaku: mediaInfo.stat.danmakus,
      reply: mediaInfo.stat.reply,
      duration: formatSeconed(epInfo.duration / 1000),
      up: [{ name: mediaInfo.upInfo.name, mid: mediaInfo.upInfo.mid }],
      qualityOptions: acceptQuality.accept_quality.map((item: number) => ({
        label: qualityMap[item as keyof typeof qualityMap] || String(item),
        value: item
      })),
      page: parseEPPageData(epList),
      subtitle: [],
      video: acceptQuality.video
        ? acceptQuality.video.map((item: any) => ({
            id: item.id,
            cid: epInfo.cid,
            url: item.baseUrl
          }))
        : [],
      audio: acceptQuality.audio
        ? acceptQuality.audio.map((item: any) => ({
            id: item.id,
            cid: epInfo.cid,
            url: item.baseUrl
          }))
        : [],
      filePathList: [],
      fileDir: '',
      size: -1,
      downloadUrl: { video: '', audio: '' }
    };
    return obj;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(errorMessage);
  }
};

const parseSS = async (html: string, settings: SettingData) => {
  try {
    const videoInfo = html.match(
      /<script>window\.__INITIAL_STATE__=([\s\S]*?);\(function\(\){var s;/
    );
    if (!videoInfo) throw new Error('parse ss error');
    const { mediaInfo } = JSON.parse(videoInfo[1]);
    const { data } = await axios.get(
      `https://www.bilibili.com/bangumi/play/ep${mediaInfo.newestEp.id}`,
      {
        headers: {
          'User-Agent': UA,
          cookie: `SESSDATA=${settings.SESSDATA}`
        }
      }
    );
    return parseEP(
      data,
      `https://www.bilibili.com/bangumi/play/ep${mediaInfo.newestEp.id}`,
      settings
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(errorMessage);
  }
};

// 获取视频清晰度列表
const getAcceptQuality = async (
  cid: string,
  bvid: string,
  settings: SettingData
) => {
  const { data } = await axios.get(
    `https://api.bilibili.com/x/player/playurl?cid=${cid}&bvid=${bvid}&qn=127&type=&otype=json&fourk=1&fnver=0&fnval=80&session=68191c1dc3c75042c6f35fba895d65b0`,
    {
      headers: {
        'User-Agent': UA,
        cookie: `SESSDATA=${settings.SESSDATA};bfe_id=${settings.bfeId}`
      }
    }
  );
  return {
    accept_quality: data.data.accept_quality,
    video: data.data.dash.video,
    audio: data.data.dash.audio
  };
};

// 获取指定清晰度视频下载地址
const getDownloadUrl = async (
  cid: number,
  bvid: string,
  quality: number,
  settings: SettingData
) => {
  const { data } = await axios.get(
    `https://api.bilibili.com/x/player/playurl?cid=${cid}&bvid=${bvid}&qn=${quality}&type=&otype=json&fourk=1&fnver=0&fnval=80&session=68191c1dc3c75042c6f35fba895d65b0`,
    {
      headers: {
        'User-Agent': UA,
        cookie: `SESSDATA=${settings.SESSDATA};bfe_id=${settings.bfeId}`
      }
    }
  );
  return {
    video: data.data.dash.video.find((item: any) => item.id === quality)
      ? data.data.dash.video.find((item: any) => item.id === quality).baseUrl
      : data.data.dash.video[0].baseUrl,
    audio: getHighQualityAudio(data.data.dash.audio).baseUrl
  };
};

// 获取视频字幕
const getSubtitle = async (
  cid: number,
  bvid: string,
  settings: SettingData
) => {
  const { data } = await axios.get(
    `https://api.bilibili.com/x/player/v2?cid=${cid}&bvid=${bvid}`,
    {
      headers: {
        'User-Agent': UA,
        cookie: `SESSDATA=${settings.SESSDATA};bfe_id=${settings.bfeId}`
      }
    }
  );
  const subtitleList: Subtitle[] = data.data.subtitle.subtitles
    ? data.data.subtitle.subtitles.map((item: any) => ({
        title: item.lan_doc,
        url: item.subtitle_url
      }))
    : [];
  return subtitleList;
};

// 处理filePathList
const handleFilePathList = (
  page: number,
  partTitle: string,
  fileDir: string
): string[] => {
  const baseName = `${page ? `[P${page}]` : ''}${filterTitle(partTitle)}`;
  return [
    `${fileDir}${baseName}.mp4`, // merged
    `${fileDir}cover.png`, // cover
    `${fileDir}${baseName}-video.mp4`, // temp video
    `${fileDir}${baseName}-audio.m4s`, // temp audio
    fileDir // directory path
  ];
};

// 处理fileDir
const handleFileDir = (
  mainTitle: string,
  bvid: string,
  settings: SettingData
): string => {
  const downloadPath = settings.downloadPath;
  const folderName = filterTitle(`${mainTitle} - ${bvid}`);
  if (settings.isFolder) {
    return `${downloadPath}/${folderName}/`;
  }
  return `${downloadPath}/`;
};

// 处理bv多p逻辑
const parseBVPageData = (
  { bvid, title, pages }: { bvid: string; title: string; pages: any[] },
  url: string
): Page[] => {
  const len = pages.length;
  if (len === 1) {
    return [
      {
        title,
        url,
        page: pages[0].page,
        duration: formatSeconed(pages[0].duration),
        cid: pages[0].cid,
        bvid: bvid
      }
    ];
  } else {
    return pages.map((item) => ({
      title: item.part,
      page: item.page,
      duration: formatSeconed(item.duration),
      cid: item.cid,
      bvid: bvid,
      url: `${url}?p=${item.page}`
    }));
  }
};

// 处理ep多p逻辑
const parseEPPageData = (epList: any[]): Page[] => {
  return epList.map((item, index) => ({
    title: item.share_copy,
    page: index + 1,
    duration: formatSeconed(item.duration / 1000),
    cid: item.cid,
    bvid: item.bvid,
    url: item.share_url
  }));
};

// 获取码率最高的audio
const getHighQualityAudio = (audioArray: any[]) => {
  return audioArray.sort((a, b) => b.id - a.id)[0];
};

export { checkLogin, checkUrl, checkUrlRedirect, parseHtml, getDownloadList };
