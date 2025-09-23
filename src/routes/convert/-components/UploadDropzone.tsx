import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/routes/-components/ui/button';
import { useTranslation } from 'react-i18next';
import { cn } from '@/routes/-lib/utils';
import { type UploadDropzoneProps, getFileTypeColor } from './types';
import { FileTypeIcon, UploadCloud, StatusIcon } from './icons';

export function UploadDropzone({
  acceptExtensions,
  disabled,
  onFileSelected,
  selectedConvertType
}: UploadDropzoneProps) {
  const { t } = useTranslation();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelected(acceptedFiles[0]);
      }
    },
    [onFileSelected]
  );

  const dropzone = useDropzone({
    onDrop,
    disabled: !!disabled,
    accept:
      acceptExtensions && acceptExtensions.length > 0
        ? acceptExtensions.reduce(
            (acc, ext) => {
              acc[`application/${ext}`] = [`.${ext}`];
              return acc;
            },
            {} as Record<string, string[]>
          )
        : undefined
  });

  const { getRootProps, getInputProps, isDragActive, isDragReject } = dropzone;

  const getDropzoneStyles = () => {
    if (disabled) {
      return 'border-gray-200 bg-gray-50 cursor-not-allowed';
    }
    if (isDragReject) {
      return 'border-red-300 bg-red-50 border-solid';
    }
    if (isDragActive) {
      return 'border-blue-400 bg-blue-50 border-solid shadow-lg scale-105';
    }
    return 'border-gray-300 bg-white hover:border-blue-300 hover:bg-blue-50';
  };

  const getIconColor = () => {
    if (disabled) return 'text-gray-400';
    if (isDragReject) return 'text-red-500';
    if (isDragActive) return 'text-blue-500';
    return 'text-gray-500 group-hover:text-blue-500';
  };

  return (
    <div
      {...getRootProps()}
      className={cn(
        'group relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer',
        getDropzoneStyles()
      )}
    >
      <input {...getInputProps()} />

      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300" />

      <div className="relative z-10">
        <div className="mb-6">
          {selectedConvertType ? (
            <div className="flex items-center justify-center gap-4 mb-4">
              <div
                className={cn(
                  'w-16 h-16 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300',
                  isDragActive ? 'scale-110' : 'group-hover:scale-110',
                  `bg-gradient-to-br ${getFileTypeColor(selectedConvertType.from)} text-white`
                )}
              >
                <FileTypeIcon
                  type={selectedConvertType.from}
                  className="text-white"
                  size={32}
                />
              </div>
              <div
                className={cn(
                  'text-2xl transition-colors duration-300',
                  getIconColor()
                )}
              >
                →
              </div>
              <div
                className={cn(
                  'w-16 h-16 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300',
                  'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400 border-2 border-dashed border-gray-300'
                )}
              >
                <FileTypeIcon
                  type={selectedConvertType.to}
                  className="text-gray-400"
                  size={32}
                />
              </div>
            </div>
          ) : (
            // Default upload icon
            <div
              className={cn(
                'w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-300',
                isDragActive
                  ? 'bg-blue-100 scale-110'
                  : 'bg-gray-100 group-hover:bg-blue-100 group-hover:scale-110'
              )}
            >
              <UploadCloud
                className={cn('transition-colors duration-300', getIconColor())}
                size={40}
              />
            </div>
          )}
        </div>

        <div className="space-y-3">
          {isDragActive ? (
            <div className="text-blue-600">
              <div className="text-lg font-semibold mb-2">
                {t('drop_file_to_convert')}
              </div>
              <div className="text-sm">{t('release_file_here')}</div>
            </div>
          ) : isDragReject ? (
            <div className="text-red-600">
              <div className="text-lg font-semibold mb-2">
                {t('file_type_not_supported')}
              </div>
              <div className="text-sm">
                {t('please_select_file_types', {
                  types: acceptExtensions
                    ?.map((ext) => ext.toUpperCase())
                    .join(', ')
                })}
              </div>
            </div>
          ) : disabled ? (
            <div className="text-gray-500">
              <div className="text-lg font-semibold mb-2">
                {t('please_select_convert_type_first')}
              </div>
              <div className="text-sm">{t('select_convert_type_above')}</div>
            </div>
          ) : selectedConvertType ? (
            <div className="text-gray-700">
              <div className="text-lg font-semibold mb-2">
                {t('upload_file_type', {
                  type: selectedConvertType.from.toUpperCase()
                })}
              </div>
              <div className="text-sm text-gray-600 mb-2">
                {t('drag_file_or_click_select', {
                  type: selectedConvertType.from.toUpperCase()
                })}
              </div>
              <div className="text-xs text-gray-500">
                {t('file_will_convert_to', {
                  type: selectedConvertType.to.toUpperCase()
                })}
              </div>
            </div>
          ) : (
            <div className="text-gray-700">
              <div className="text-lg font-semibold mb-2">
                {t('upload_drop')}
              </div>
              <div className="text-sm text-gray-600">{t('upload_or')}</div>
            </div>
          )}
        </div>

        {!isDragActive && (
          <div className="mt-6">
            <Button
              type="button"
              variant={disabled ? 'outline' : 'default'}
              disabled={disabled}
              className={cn(
                'transition-all duration-300',
                !disabled &&
                  'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0'
              )}
            >
              {disabled
                ? t('please_select_convert_type_first').replace('⏳ ', '')
                : t('upload_btn')}
            </Button>
          </div>
        )}

        {acceptExtensions && acceptExtensions.length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
              <span className="font-medium">
                {t('supported_formats_label')}:
              </span>
              <div className="flex gap-1">
                {acceptExtensions.map((ext, index) => (
                  <span key={ext} className="inline-flex items-center gap-1">
                    <FileTypeIcon
                      type={ext}
                      className="text-gray-600"
                      size={16}
                    />
                    <span className="font-mono bg-white px-2 py-1 rounded border">
                      .{ext.toUpperCase()}
                    </span>
                    {index < acceptExtensions.length - 1 && (
                      <span className="text-gray-400">|</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {isDragActive && (
          <div className="absolute inset-0 border-2 border-blue-400 border-dashed rounded-2xl bg-blue-50 bg-opacity-90 flex items-center justify-center">
            <div className="text-blue-600 text-center">
              <div className="mb-4">
                <StatusIcon
                  status="cloudUpload"
                  className="text-blue-600"
                  size={64}
                />
              </div>
              <div className="text-xl font-bold">
                {t('drop_file_to_start_convert')}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
