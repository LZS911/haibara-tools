import { useTranslation } from 'react-i18next';
import { Button } from '@/routes/-components/ui/button';
import { Card, CardContent } from '@/routes/-components/ui/card';
import { Clock, Download, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import type { TimelineItem } from '../-lib/utils';

interface TimelineViewProps {
  items: TimelineItem[];
  onReset: () => void;
}

export function TimelineView({ items, onReset }: TimelineViewProps) {
  const { t } = useTranslation();
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    // 复制整个时间轴的文本内容
    const textContent = items
      .map(
        (item) =>
          `[${item.time}] ${item.title}\n\n${t('media_to_docs.scene_description')}: ${item.sceneDescription}\n\n${t('media_to_docs.content_points')}: \n${item.keyPoints.map((p) => `- ${p}`).join('\n')}\n\n`
      )
      .join('---\n\n');

    navigator.clipboard.writeText(textContent).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    const textContent = items
      .map(
        (item) =>
          `## [${item.time}] ${item.title}\n\n${t('media_to_docs.scene_description')}: ${item.sceneDescription}\n\n${t('media_to_docs.content_points')}: \n${item.keyPoints.map((p) => `- ${p}`).join('\n')}\n\n`
      )
      .join('');

    const blob = new Blob([textContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timeline-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">
          {t('media_to_docs.no_timeline_content')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 操作按钮 */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-800">
          {t('media_to_docs.video_timeline', { count: items.length })}
        </h2>
        <div className="flex gap-2">
          <Button onClick={handleCopy} variant="outline" size="sm">
            {isCopied ? (
              <Check className="w-4 h-4 mr-1" />
            ) : (
              <Copy className="w-4 h-4 mr-1" />
            )}
            {isCopied ? t('media_to_docs.copied') : t('media_to_docs.copy')}
          </Button>
          <Button onClick={handleDownload} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1" />
            {t('media_to_docs.download')}
          </Button>
        </div>
      </div>

      {/* 时间轴 */}
      <div className="relative">
        {/* 时间轴线条 */}
        <div className="timeline-line" />

        {/* 时间轴项目 */}
        <div className="space-y-8">
          {items.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="relative pl-20"
            >
              {/* 时间标记 */}
              <div className="absolute left-0 top-0 flex items-center gap-2">
                <div className="timeline-dot" />
                <div className="flex items-center gap-1 text-blue-600 font-semibold text-sm">
                  <Clock className="w-4 h-4" />
                  <span>{item.time}</span>
                </div>
              </div>

              {/* 内容卡片 */}
              <Card className="timeline-card">
                <CardContent className="p-4">
                  {/* 标题 */}
                  <h3 className="text-base font-bold text-gray-800 mb-2">
                    {item.title}
                  </h3>

                  {/* 关键帧图片 */}
                  {item.imageUrl && (
                    <div className="mb-2">
                      <img
                        src={item.imageUrl}
                        alt={`${t('media_to_docs.keyframe')} ${item.time}`}
                        className="keyframe-image"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* 画面描述 */}
                  {item.sceneDescription && (
                    <div className="mb-2">
                      <div className="text-xs font-semibold text-gray-600 mb-1">
                        {t('media_to_docs.scene_description_title')}
                      </div>
                      <p className="text-gray-700 leading-relaxed text-sm">
                        {item.sceneDescription}
                      </p>
                    </div>
                  )}

                  {/* 内容要点 */}
                  {item.keyPoints.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-gray-600 mb-1">
                        {t('media_to_docs.content_points_title')}
                      </div>
                      <ul className="space-y-1">
                        {item.keyPoints.map((point, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-gray-700 text-sm"
                          >
                            <span className="text-blue-500 mt-1">•</span>
                            <span className="flex-1">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 底部操作 */}
      <div className="text-center pt-4">
        <Button onClick={onReset} variant="outline">
          {t('media_to_docs.try_again_button')}
        </Button>
      </div>
    </div>
  );
}
