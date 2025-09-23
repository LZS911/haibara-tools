import { useTranslation } from 'react-i18next';
import { cn } from '@/routes/-lib/utils';
import { type CategoryTabsProps, getCategoryConfig } from './types';
import { CategoryIcon, CheckMark } from './icons';

export function CategoryTabs({
  categories,
  active,
  onChange
}: CategoryTabsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {categories.map((key) => {
        const config = getCategoryConfig(key);
        const isActive = active === key;

        return (
          <button
            key={key}
            className={cn(
              'group relative p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg cursor-pointer',
              isActive
                ? `bg-gradient-to-br ${config.bgGradient} ${config.borderColor} shadow-lg scale-105`
                : 'bg-white border-gray-200 hover:border-gray-300'
            )}
            onClick={() => onChange(key)}
            type="button"
          >
            {/* 活跃状态的渐变背景 */}
            {isActive && (
              <div
                className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-5 rounded-2xl`}
              />
            )}

            {/* 内容 */}
            <div className="relative flex flex-col items-center gap-3">
              {/* 图标 */}
              <div
                className={cn(
                  'transition-transform duration-300',
                  isActive ? 'scale-110' : 'group-hover:scale-110'
                )}
              >
                <CategoryIcon 
                  category={key} 
                  className={cn(
                    'transition-colors duration-300',
                    isActive ? config.textColor : 'text-gray-600 group-hover:text-gray-800'
                  )} 
                  size={32} 
                />
              </div>

              {/* 标题 */}
              <div
                className={cn(
                  'font-semibold text-lg transition-colors duration-300',
                  isActive
                    ? config.textColor
                    : 'text-gray-700 group-hover:text-gray-900'
                )}
              >
                {t(`tab_${key}`)}
              </div>

              {/* 描述 */}
              <div
                className={cn(
                  'text-sm text-center transition-colors duration-300',
                  isActive
                    ? config.textColor
                    : 'text-gray-500 group-hover:text-gray-600'
                )}
              >
                {t(`section_${key}_desc`)}
              </div>
            </div>

            {/* 选中指示器 */}
            {isActive && (
              <div
                className={`absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r ${config.gradient} rounded-full flex items-center justify-center shadow-lg`}
              >
                <CheckMark className="text-white" size={14} />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
