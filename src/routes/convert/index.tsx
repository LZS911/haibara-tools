import { createFileRoute } from '@tanstack/react-router';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/routes/-components/ui/card';
import { Button } from '@/routes/-components/ui/button';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import { trpc } from '@/router';
import { useMemo, useState, useEffect } from 'react';
import {
  UploadDropzone,
  CategoryTabs,
  PairList,
  ProgressBar,
  StepIcon,
  type PairItem,
  type ConvertCategory,
  type FileFormat
} from './-components';
import type { ConvertStep, ConvertStatus } from './-types';

export const Route = createFileRoute('/convert/')({
  component: Convert
});

function Convert() {
  const { t } = useTranslation();
  const { data: supportMatrix } = useQuery(
    trpc.convert.support_type.queryOptions()
  );

  const categories = useMemo(() => {
    if (!supportMatrix) return [] as ConvertCategory[];
    return Object.keys(supportMatrix).filter(Boolean) as ConvertCategory[];
  }, [supportMatrix]);

  const [active, setActive] = useState<ConvertCategory>('text');

  const pairs = useMemo(() => {
    if (!supportMatrix) return [] as PairItem[];
    return (supportMatrix[active] ?? []) as PairItem[];
  }, [supportMatrix, active]);

  const [selectedSource, setSelectedSource] = useState<FileFormat | null>(null);
  const [selectedPair, setSelectedPair] = useState<PairItem | null>(null);
  const [currentStep, setCurrentStep] = useState<ConvertStep>('select-type');
  const [status, setStatus] = useState<ConvertStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [downloadUrl, setDownloadUrl] = useState<string | undefined>();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const createJob = useMutation(trpc.convert.create_job.mutationOptions());

  useEffect(() => {
    if (categories.length > 0 && !active) {
      setActive(categories[0]);
    }
  }, [categories, active]);

  const onPickPair = (pair: PairItem) => {
    setSelectedPair(pair);
    setCurrentStep('upload-file');
    setProgress(0);
    setErrorMessage(undefined);
    setDownloadUrl(undefined);
    setStatus('idle');
  };

  const handleFile = async (file: File) => {
    if (!selectedPair) return;

    setSelectedFile(file);
    setErrorMessage(undefined);
    setDownloadUrl(undefined);
    setCurrentStep('converting');
    setStatus('uploading');
    setProgress(20);

    try {
      const job = await createJob.mutateAsync({
        category: active,
        from: selectedPair.from,
        to: selectedPair.to
      });

      setProgress(40);

      const form = new FormData();
      form.append('file', file, file.name);

      const res = await fetch(job.uploadUrl, { method: 'POST', body: form });
      if (!res.ok) {
        const msg = 'upload_failed';
        setStatus('error');
        setErrorMessage(msg);
        setCurrentStep('upload-file');
        return;
      }

      setProgress(60);
      setStatus('processing');

      // Simulate processing progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 5;
        });
      }, 300);

      const data: { downloadUrl?: string; status?: string } = await res.json();
      clearInterval(progressInterval);

      if (data.downloadUrl) {
        setDownloadUrl(data.downloadUrl);
        setProgress(100);
        setStatus('done');
        setCurrentStep('completed');
      } else {
        setStatus('error');
        setCurrentStep('upload-file');
      }
    } catch (e) {
      setStatus('error');
      setErrorMessage(e instanceof Error ? e.message : 'unknown_error');
      setCurrentStep('upload-file');
    }
  };

  const resetConvert = () => {
    setSelectedPair(null);
    setCurrentStep('select-type');
    setStatus('idle');
    setProgress(0);
    setErrorMessage(undefined);
    setDownloadUrl(undefined);
    setSelectedFile(null);
  };

  const backToSelectType = () => {
    setCurrentStep('select-type');
    setSelectedPair(null);
  };

  const handleChangeCategory = (category: ConvertCategory) => {
    setActive(category);
    setSelectedPair(null);
    setSelectedSource(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {t('convert_title')}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{t('convert_desc')}</p>
        </div>
      </div>

      <div className="space-y-6">
        {currentStep === 'select-type' && (
          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 font-medium text-slate-900">
                <StepIcon
                  step="selectType"
                  className="text-slate-700"
                  size={20}
                />
                {t('step1_select_type')}
              </CardTitle>
              <CardDescription className="text-sm">
                {t('select_convert_type_format')}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <CategoryTabs
                  categories={categories}
                  active={active}
                  onChange={handleChangeCategory}
                />
                <PairList
                  pairs={pairs}
                  onPick={onPickPair}
                  selectedPair={selectedPair}
                  selectedSource={selectedSource}
                  setSelectedSource={setSelectedSource}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 'upload-file' && selectedPair && (
          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 font-medium text-slate-900">
                <StepIcon
                  step="uploadFile"
                  className="text-slate-700"
                  size={20}
                />
                {t('step2_upload_file')}
              </CardTitle>
              <CardDescription className="text-sm">
                {t('drag_upload_file_desc', {
                  type: selectedPair.from.toUpperCase()
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2 text-slate-700">
                  <StepIcon
                    step="converting_alt"
                    className="text-slate-600"
                    size={18}
                  />
                  <span className="font-medium text-sm">
                    {selectedPair.from.toUpperCase()} →{' '}
                    {selectedPair.to.toUpperCase()}
                  </span>
                </div>
              </div>
              <UploadDropzone
                acceptExtensions={[selectedPair.from]}
                disabled={false}
                onFileSelected={handleFile}
                selectedConvertType={selectedPair}
              />
              <div className="flex justify-between mt-4">
                <Button variant="outline" size="sm" onClick={backToSelectType}>
                  {t('back_to_select_type')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Converting */}
        {currentStep === 'converting' && (
          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 font-medium text-slate-900">
                <StepIcon
                  step="converting"
                  className="text-slate-700"
                  size={20}
                />
                {t('step3_converting')}
              </CardTitle>
              <CardDescription className="text-sm">
                {t('processing_file_please_wait')}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <ProgressBar
                progress={progress}
                status={status}
                fileName={selectedFile?.name}
              />
            </CardContent>
          </Card>
        )}

        {/* Step 4: Completed */}
        {currentStep === 'completed' && (
          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 font-medium text-slate-900">
                <StepIcon
                  step="completed"
                  className="text-green-600"
                  size={20}
                />
                {t('step4_completed')}
              </CardTitle>
              <CardDescription className="text-sm">
                {t('file_ready_download')}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-lg bg-green-50 border border-green-200 p-4">
                  <StepIcon
                    step="celebration"
                    className="text-green-600"
                    size={24}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">
                      {t('conversion_success')}
                    </p>
                    <p className="text-sm text-slate-600">
                      {t('file_converted_from_to', {
                        from: selectedPair?.from.toUpperCase(),
                        to: selectedPair?.to.toUpperCase()
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  {downloadUrl && (
                    <a href={downloadUrl} download className="flex-1">
                      <Button size="sm" className="w-full">
                        {t('download_converted_file')}
                      </Button>
                    </a>
                  )}
                  <Button size="sm" variant="outline" onClick={resetConvert}>
                    {t('start_new_conversion')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error status */}
        {status === 'error' && errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <StepIcon step="error" className="text-red-600" size={20} />
              <div>
                <div className="font-medium text-sm">
                  {t('conversion_failed')}
                </div>
                <div className="text-xs">{errorMessage}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
