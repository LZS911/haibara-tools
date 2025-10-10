import { useTranslation } from 'react-i18next';
import { Button } from '@/routes/-components/ui/button';

const STYLES = [
  { id: 'xiaohongshu', name: '小红书风格' },
  { id: 'wechat', name: '公众号风格' },
  { id: 'notes', name: '知识笔记' },
  { id: 'mindmap', name: '思维导图' },
  { id: 'summary', name: '内容总结' }
];

interface StyleSelectorProps {
  onSelect: (style: string) => void;
  disabled?: boolean;
}

export function StyleSelector({ onSelect, disabled }: StyleSelectorProps) {
  const { t } = useTranslation();

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
          {t(style.id, style.name)}
        </Button>
      ))}
    </div>
  );
}