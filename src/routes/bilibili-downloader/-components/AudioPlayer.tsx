import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/routes/-components/ui/button';
import { Card } from '@/routes/-components/ui/card';
import { useTranslation } from 'react-i18next';

interface AudioPlayerProps {
  audioPath: string;
  title: string;
  onClose: () => void;
}

export function AudioPlayer({ audioPath, title, onClose }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // 转换文件路径为可访问的URL
  const audioUrl = `file://${audioPath}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium text-slate-900">{title}</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <audio
          ref={audioRef}
          src={audioUrl}
          controls
          autoPlay
          className="w-full"
        >
          {t('bilibili_downloader.browser_not_support_audio_playback')}
        </audio>
      </Card>
    </div>
  );
}
