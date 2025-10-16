import { Card } from '@/routes/-components/ui/card';
import { Button } from '@/routes/-components/ui/button';
import type { DownloadHistoryItem as HistoryItem } from '../-types';
import { Trash2, Calendar, Video, Folder } from 'lucide-react';
import { CONSTANT } from '@/data/constant';
import { qualityMap } from '@/data/quality';

interface DownloadHistoryItemProps {
  item: HistoryItem;
  onDelete: (recordId: string) => void;
}

export function DownloadHistoryItem({
  item,
  onDelete
}: DownloadHistoryItemProps) {
  // 格式化日期
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // 获取清晰度文本
  const getQualityText = (quality: number) => {
    return qualityMap[quality] || `${quality}P`;
  };

  // 处理封面图片路径
  const getCoverUrl = () => {
    if (!item.coverPath) {
      return undefined;
    }
    // 如果是 Electron 环境，使用 file:// 协议
    if (CONSTANT.IS_ELECTRON) {
      return `local-resource://${item.coverPath}`;
    }
    // Web 环境可能需要通过服务器提供静态文件
    return item.coverPath;
  };

  const handleOpenFolder = () => {
    const path = item.mergedPath || item.videoPath;
    if (path && CONSTANT.IS_ELECTRON && window.electronAPI) {
      const folderPath = path.substring(0, path.lastIndexOf('/'));
      window.electronAPI.openPath(folderPath);
    }
  };

  const coverUrl = getCoverUrl();

  return (
    <Card className="border-slate-200 bg-white p-4 transition-shadow hover:shadow-md">
      <div className="flex gap-4">
        {/* 封面 */}
        <div className="flex-shrink-0">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={item.title}
              className="h-24 w-36 rounded-lg object-cover"
              onError={(e) => {
                // 如果图片加载失败，显示默认占位符
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div
            className={`flex h-24 w-36 items-center justify-center rounded-lg bg-slate-100 ${coverUrl ? 'hidden' : ''}`}
          >
            <Video className="h-8 w-8 text-slate-400" />
          </div>
        </div>

        {/* 视频信息 */}
        <div className="flex flex-1 flex-col justify-between">
          <div>
            <h4 className="line-clamp-2 text-sm font-medium text-slate-900">
              {item.title}
            </h4>
            <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
              <span>{item.bvId}</span>
              <span>{getQualityText(item.quality)}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(item.downloadedAt)}</span>
            </div>
            <div className="flex items-center">
              {CONSTANT.IS_ELECTRON && (item.mergedPath || item.videoPath) ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleOpenFolder}
                  className="h-8 px-2"
                >
                  <Folder className="h-4 w-4 text-slate-500" />
                </Button>
              ) : null}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(item.id)}
                className="h-8 px-2"
              >
                <Trash2 className="h-4 w-4 text-slate-500" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
