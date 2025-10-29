import { Label } from '@/routes/-components/ui/label';
import { Textarea } from '@/routes/-components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/routes/-components/ui/select';
import { useTranslation } from 'react-i18next';
import type { TemplateType, ImageTool } from '@/types/prompt-optimizer';

interface AdvancedValue {
  templateType?: TemplateType;
  context?: string;
  imageTool?: ImageTool;
  artisticStyle?: string;
  composition?: string;
  additionalRequirements?: string;
}

interface AdvancedOptionsProps {
  value: AdvancedValue;
  onChange: (value: AdvancedValue) => void;
  disabled?: boolean;
}

const templateTypes: TemplateType[] = ['text', 'context', 'image'];
const imageTools: ImageTool[] = [
  'stable-diffusion',
  'midjourney',
  'dall-e',
  'other'
];

export function AdvancedOptions({
  value,
  onChange,
  disabled
}: AdvancedOptionsProps) {
  const { t } = useTranslation();
  const tt = value.templateType || 'text';

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-sm">{t('prompt_optimizer.template_type')}</Label>
        <Select
          value={tt}
          onValueChange={(v) =>
            onChange({ ...value, templateType: v as TemplateType })
          }
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {templateTypes.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {tt === 'context' && (
        <div className="space-y-1">
          <Label className="text-sm">{t('prompt_optimizer.context')}</Label>
          <Textarea
            rows={6}
            value={value.context || ''}
            onChange={(e) => onChange({ ...value, context: e.target.value })}
            disabled={disabled}
            placeholder={t('prompt_optimizer.context_placeholder')}
          />
        </div>
      )}

      {tt === 'image' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1 md:col-span-2">
            <Label className="text-sm">
              {t('prompt_optimizer.image_tool')}
            </Label>
            <Select
              value={value.imageTool || 'stable-diffusion'}
              onValueChange={(v) =>
                onChange({ ...value, imageTool: v as ImageTool })
              }
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {imageTools.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-sm">
              {t('prompt_optimizer.artistic_style')}
            </Label>
            <Textarea
              rows={3}
              value={value.artisticStyle || ''}
              onChange={(e) =>
                onChange({ ...value, artisticStyle: e.target.value })
              }
              disabled={disabled}
              placeholder={t('prompt_optimizer.artistic_style_placeholder')}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-sm">
              {t('prompt_optimizer.composition')}
            </Label>
            <Textarea
              rows={3}
              value={value.composition || ''}
              onChange={(e) =>
                onChange({ ...value, composition: e.target.value })
              }
              disabled={disabled}
              placeholder={t('prompt_optimizer.composition_placeholder')}
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <Label className="text-sm">
              {t('prompt_optimizer.additional_requirements')}
            </Label>
            <Textarea
              rows={3}
              value={value.additionalRequirements || ''}
              onChange={(e) =>
                onChange({ ...value, additionalRequirements: e.target.value })
              }
              disabled={disabled}
              placeholder={t(
                'prompt_optimizer.additional_requirements_placeholder'
              )}
            />
          </div>
        </div>
      )}
    </div>
  );
}
