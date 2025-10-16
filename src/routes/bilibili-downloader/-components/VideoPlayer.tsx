import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/routes/-components/ui/button';

interface VideoPlayerProps {
  videoPath: string;
  title: string;
  onClose: () => void;
}

export function VideoPlayer({ videoPath, title, onClose }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

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
  const videoUrl = `file://${videoPath}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="relative w-full max-w-4xl">
        <div className="mb-4 flex items-center justify-between text-white">
          <h3 className="text-lg font-medium">{title}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          autoPlay
          className="w-full rounded-lg"
        >
          您的浏览器不支持视频播放
        </video>
      </div>
    </div>
  );
}
