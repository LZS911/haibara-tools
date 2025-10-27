import path from 'path';

/* eslint-disable no-irregular-whitespace */
export const formatSeconed = (duration: number) => {
  const hours = Math.floor(duration / 3600);
  const minus = Math.floor((duration - hours * 3600) / 60);
  const secends = Math.floor(duration - minus * 60 - hours * 3600);
  return `${hours > 9 ? hours : '0' + hours}:${minus > 9 ? minus : '0' + minus}:${secends > 9 ? secends : '0' + secends}`;
};

export const filterTitle = (title: string) => {
  const pattern =
    // eslint-disable-next-line no-useless-escape
    /[「」`~!@#$^&*()=|{}':;\',[\].<>​/?~！@#￥……&*（）——|{}【】'；：""'。，、？\s]/g;
  return title.replace(pattern, '');
};

export const sleep = (timeountMS: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, timeountMS);
  });

export const handleFilePath = (
  title: string,
  dir: string,
  ext: string
): string => {
  const filteredTitle = filterTitle(title);
  return path.join(dir, `${filteredTitle}${ext}`);
};
