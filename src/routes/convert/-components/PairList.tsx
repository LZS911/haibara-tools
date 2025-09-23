import { Button } from '@/routes/-components/ui/button';
import { useTranslation } from 'react-i18next';
import { cn } from '@/routes/-lib/utils';
import { useMemo } from 'react';
import { type PairListProps, type FileFormat, getFileTypeColor } from './types';
import { FileTypeIcon, StatusIcon, StepIcon, CheckMark } from './icons';

// 重新导出 PairItem 类型供外部使用
export type { PairItem } from './types';

interface GroupedPairs {
  [sourceFormat: string]: FileFormat[];
}

export function PairList({
  pairs,
  onPick,
  selectedPair,
  selectedSource,
  setSelectedSource
}: PairListProps) {
  const { t } = useTranslation();

  // 将 pairs 按源格式分组
  const groupedPairs = useMemo<GroupedPairs>(() => {
    const groups: GroupedPairs = {};
    pairs.forEach((pair) => {
      if (!groups[pair.from]) {
        groups[pair.from] = [];
      }
      if (!groups[pair.from].includes(pair.to)) {
        groups[pair.from].push(pair.to);
      }
    });
    return groups;
  }, [pairs]);

  // 获取所有源格式
  const sourceFormats = useMemo(() => {
    return Object.keys(groupedPairs) as FileFormat[];
  }, [groupedPairs]);

  // 获取当前选中源格式的目标格式
  const targetFormats = useMemo(() => {
    return selectedSource ? groupedPairs[selectedSource] || [] : [];
  }, [groupedPairs, selectedSource]);

  if (pairs.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="mb-4">
          <StatusIcon status="search" className="text-gray-400" size={48} />
        </div>
        <div className="text-lg font-medium mb-2">
          {t('no_convert_types_available')}
        </div>
        <div className="text-sm">{t('please_select_other_category')}</div>
      </div>
    );
  }

  const handleTargetSelect = (targetFormat: FileFormat) => {
    if (selectedSource) {
      onPick({ from: selectedSource, to: targetFormat });
    }
  };

  return (
    <div className="space-y-6">
      {/* 步骤 1: 源格式选择器 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-500 text-white text-sm font-bold rounded-full">
            1
          </span>
          {t('select_source_format')}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {sourceFormats.map((sourceFormat) => {
            const isSelected = selectedSource === sourceFormat;
            return (
              <div
                key={sourceFormat}
                onClick={() => {
                  setSelectedSource(sourceFormat);
                }}
                className={cn(
                  'group relative cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105',
                  isSelected
                    ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg scale-105'
                    : 'border-gray-200 bg-white hover:border-blue-200 hover:shadow-md'
                )}
              >
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center transition-transform duration-300',
                      isSelected ? 'scale-110' : 'group-hover:scale-110',
                      `bg-gradient-to-br ${getFileTypeColor(sourceFormat)} text-white shadow-md`
                    )}
                  >
                    <FileTypeIcon
                      type={sourceFormat}
                      className="text-white"
                      size={20}
                    />
                  </div>
                  <div
                    className={cn(
                      'text-xs font-medium transition-colors duration-300',
                      isSelected
                        ? 'text-blue-700'
                        : 'text-gray-700 group-hover:text-gray-900'
                    )}
                  >
                    {sourceFormat.toUpperCase()}
                  </div>
                </div>
                {isSelected && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <CheckMark className="text-white" size={10} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 步骤 2: 目标格式网格 */}
      {selectedSource && (
        <div className="animate-in slide-in-from-bottom-4 duration-300">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 bg-green-500 text-white text-sm font-bold rounded-full">
              2
            </span>
            {t('select_target_format')}
            <span className="text-sm font-normal text-gray-500">
              (
              {t('convert_from_format', {
                format: selectedSource.toUpperCase()
              })}
              )
            </span>
          </h3>

          {targetFormats.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {targetFormats.map((targetFormat) => {
                const isSelected =
                  selectedPair &&
                  selectedPair.from === selectedSource &&
                  selectedPair.to === targetFormat;

                return (
                  <div
                    key={targetFormat}
                    onClick={() => handleTargetSelect(targetFormat)}
                    className={cn(
                      'group relative cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105',
                      isSelected
                        ? 'border-green-400 bg-gradient-to-br from-green-50 to-green-100 shadow-lg scale-105'
                        : 'border-gray-200 bg-white hover:border-green-200 hover:shadow-md'
                    )}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center transition-transform duration-300',
                          isSelected ? 'scale-110' : 'group-hover:scale-110',
                          `bg-gradient-to-br ${getFileTypeColor(targetFormat)} text-white shadow-md`
                        )}
                      >
                        <FileTypeIcon
                          type={targetFormat}
                          className="text-white"
                          size={20}
                        />
                      </div>
                      <div
                        className={cn(
                          'text-xs font-medium transition-colors duration-300',
                          isSelected
                            ? 'text-green-700'
                            : 'text-gray-700 group-hover:text-gray-900'
                        )}
                      >
                        {targetFormat.toUpperCase()}
                      </div>
                    </div>

                    {/* 转换箭头 */}
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <div
                        className={cn(
                          'flex items-center justify-center w-5 h-5 rounded-full transition-colors duration-300',
                          isSelected
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-300 text-gray-600 group-hover:bg-green-400 group-hover:text-white'
                        )}
                      >
                        <StepIcon step="conversion" className="" size={12} />
                      </div>
                    </div>

                    {isSelected && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckMark className="text-white" size={10} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="mb-2">
                <StatusIcon status="info" className="text-gray-400" size={24} />
              </div>
              <div className="text-sm">{t('no_target_formats_available')}</div>
            </div>
          )}
        </div>
      )}

      {/* 选择结果摘要 */}
      {selectedPair && (
        <div className="animate-in slide-in-from-bottom-4 duration-300">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <StepIcon
                  step="selectType"
                  className="text-blue-600"
                  size={20}
                />
                <div>
                  <div className="font-semibold text-gray-800">
                    {t('conversion_ready')}
                  </div>
                  <div className="text-sm text-gray-600">
                    {selectedPair.from.toUpperCase()} →{' '}
                    {selectedPair.to.toUpperCase()}
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white"
                onClick={() => onPick(selectedPair)}
              >
                {t('continue_to_upload')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
