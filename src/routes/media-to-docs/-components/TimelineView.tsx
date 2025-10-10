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
          `[${item.time}] ${item.title}\n\n画面描述：${item.sceneDescription}\n\n内容要点：\n${item.keyPoints.map((p) => `- ${p}`).join('\n')}\n\n`
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
          `## [${item.time}] ${item.title}\n\n**画面描述**：${item.sceneDescription}\n\n**内容要点**：\n${item.keyPoints.map((p) => `- ${p}`).join('\n')}\n\n`
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
      <div className="text-center py-12">
        <p className="text-gray-500">暂无时间轴内容</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 操作按钮 */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">
          视频时间轴 ({items.length} 个时间点)
        </h2>
        <div className="flex gap-2">
          <Button onClick={handleCopy} variant="outline" size="sm">
            {isCopied ? (
              <Check className="w-4 h-4 mr-2" />
            ) : (
              <Copy className="w-4 h-4 mr-2" />
            )}
            {isCopied ? '已复制' : '复制'}
          </Button>
          <Button onClick={handleDownload} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            下载
          </Button>
        </div>
      </div>

      {/* 时间轴 */}
      <div className="relative">
        {/* 时间轴线条 */}
        <div className="timeline-line" />

        {/* 时间轴项目 */}
        <div className="space-y-12">
          {items.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="relative pl-24"
            >
              {/* 时间标记 */}
              <div className="absolute left-0 top-0 flex items-center gap-3">
                <div className="timeline-dot" />
                <div className="flex items-center gap-2 text-blue-600 font-semibold">
                  <Clock className="w-4 h-4" />
                  <span>{item.time}</span>
                </div>
              </div>

              {/* 内容卡片 */}
              <Card className="timeline-card">
                <CardContent className="p-6">
                  {/* 标题 */}
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    {item.title}
                  </h3>

                  {/* 关键帧图片 */}
                  {item.imageUrl && (
                    <div className="mb-4">
                      <img
                        src={item.imageUrl}
                        alt={`关键帧 ${item.time}`}
                        className="keyframe-image"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* 画面描述 */}
                  {item.sceneDescription && (
                    <div className="mb-4">
                      <div className="text-sm font-semibold text-gray-600 mb-2">
                        📷 画面描述
                      </div>
                      <p className="text-gray-700 leading-relaxed">
                        {item.sceneDescription}
                      </p>
                    </div>
                  )}

                  {/* 内容要点 */}
                  {item.keyPoints.length > 0 && (
                    <div>
                      <div className="text-sm font-semibold text-gray-600 mb-2">
                        📝 内容要点
                      </div>
                      <ul className="space-y-2">
                        {item.keyPoints.map((point, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-gray-700"
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
      <div className="text-center pt-8">
        <Button onClick={onReset} size="lg" variant="outline">
          {t('try_again_button', '再试一次')}
        </Button>
      </div>
    </div>
  );
}
