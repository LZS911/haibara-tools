import { useTranslation } from 'react-i18next';
import { Button } from '@/routes/-components/ui/button';

interface StyleSelectorProps {
  onSelect: (style: string) => void;
  disabled?: boolean;
}

export function StyleSelector({ onSelect, disabled }: StyleSelectorProps) {
  const { t } = useTranslation();

  const STYLES = [
    { id: 'style_xiaohongshu', name: t('style_xiaohongshu', '小红书风格') },
    { id: 'style_wechat', name: t('style_wechat', '公众号风格') },
    { id: 'style_notes', name: t('style_notes', '知识笔记') },
    { id: 'style_mindmap', name: t('style_mindmap', '思维导图') },
    { id: 'style_summary', name: t('style_summary', '内容总结') }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {STYLES.map((style) => (
        <Button
          key={style.id}
          variant="outline"
          size="lg"
          className="p-6 h-auto text-lg hover:bg-blue-50 hover:border-blue-400"
          onClick={() => onSelect(style.id)}
          disabled={disabled}
        >
          {style.name}
        </Button>
      ))}
    </div>
  );
}