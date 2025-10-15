import { Card } from '@/routes/-components/ui/card';
import type { VideoInfo } from '../-types';
import { Eye, ImageOff, MessageCircle, ThumbsUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { trpc } from '@/router';
import { Spinner } from '@/routes/-components/spinner';
import type { ImgHTMLAttributes } from 'react';
import { useQuery } from '@tanstack/react-query';

// Component to handle fetching and displaying remote images via proxy
function ProxiedImage({ src, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const imageQuery = useQuery(
    trpc.bilibili.imageProxy.queryOptions(
      { url: src || '' },
      {
        enabled: !!src && src.startsWith('http'),
        staleTime: Infinity // Cache the image indefinitely
      }
    )
  );

  if (imageQuery.isLoading) {
    return (
      <div className="flex h-32 w-48 items-center justify-center rounded-lg bg-slate-100">
        <Spinner />
      </div>
    );
  }

  if (imageQuery.isError || !imageQuery.data) {
    return (
      <div className="flex h-32 w-48 items-center justify-center rounded-lg bg-slate-100">
        <ImageOff className="h-8 w-8 text-slate-400" />
      </div>
    );
  }

  return <img src={imageQuery.data} {...props} />;
}

interface VideoInfoCardProps {
  videoInfo: VideoInfo;
}

export function VideoInfoCard({ videoInfo }: VideoInfoCardProps) {
  const { t } = useTranslation();
  const isRemoteImage = videoInfo.cover.startsWith('http');

  return (
    <Card className="border-slate-200 bg-white p-6">
      <div className="flex gap-6">
        {/* 封面 */}
        <div className="flex-shrink-0">
          {isRemoteImage ? (
            <ProxiedImage
              src={videoInfo.cover}
              alt={videoInfo.title}
              className="h-32 w-48 rounded-lg object-cover"
            />
          ) : (
            <img
              src={`local-resource://${videoInfo.cover}`}
              alt={videoInfo.title}
              className="h-32 w-48 rounded-lg object-cover"
            />
          )}
        </div>

        {/* 视频信息 */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-900">
            {videoInfo.title}
          </h3>
          <div className="mt-2 flex items-center gap-4 text-sm text-slate-600">
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {videoInfo.view.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              {videoInfo.reply.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <ThumbsUp className="h-4 w-4" />
              {videoInfo.danmaku.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 text-sm text-slate-600">
            <p>UP主: {videoInfo.up.map((u) => u.name).join(', ')}</p>
            <p>
              {t('video_duration', '时长')}: {videoInfo.duration}
            </p>
            <p>BV号: {videoInfo.bvid}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
