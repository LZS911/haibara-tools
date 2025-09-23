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
  ConversionArrow,
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
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-6">
          <ConversionArrow className="w-8 h-8 text-white" size={32} />
        </div>
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
          {t('convert_title')}
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          {t('convert_desc')}
        </p>
      </div>

      <div className="space-y-8">
        {currentStep === 'select-type' && (
          <Card className="border-2 border-blue-100 shadow-xl bg-gradient-to-br from-white to-blue-50">
            <CardHeader className="rounded-t-lg">
              <CardTitle className="text-2xl flex items-center gap-3">
                <StepIcon
                  step="selectType"
                  className="text-blue-600"
                  size={24}
                />
                {t('step1_select_type')}
              </CardTitle>
              <CardDescription className="text-lg">
                {t('select_convert_type_format')}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
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
          <Card className="border-2 border-green-100 shadow-xl bg-gradient-to-br from-white to-green-50">
            <CardHeader className=" rounded-t-lg">
              <CardTitle className="text-2xl flex items-center gap-3">
                <StepIcon
                  step="uploadFile"
                  className="text-green-600"
                  size={24}
                />
                {t('step2_upload_file')}
              </CardTitle>
              <CardDescription className="text-lg">
                {t('drag_upload_file_desc', {
                  type: selectedPair.from.toUpperCase()
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3 text-blue-700">
                  <StepIcon
                    step="converting_alt"
                    className="text-blue-700"
                    size={24}
                  />
                  <span className="font-semibold text-lg">
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
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={backToSelectType}>
                  {t('back_to_select_type')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Converting */}
        {currentStep === 'converting' && (
          <Card className="border-2 border-yellow-100 shadow-xl bg-gradient-to-br from-white to-yellow-50">
            <CardHeader className="rounded-t-lg">
              <CardTitle className="text-2xl flex items-center gap-3">
                <StepIcon
                  step="converting"
                  className="text-yellow-600"
                  size={24}
                />
                {t('step3_converting')}
              </CardTitle>
              <CardDescription className="text-lg">
                {t('processing_file_please_wait')}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
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
          <Card className="border-2 border-emerald-100 shadow-xl bg-gradient-to-br from-white to-emerald-50">
            <CardHeader className="rounded-t-lg">
              <CardTitle className="text-2xl flex items-center gap-3">
                <StepIcon
                  step="completed"
                  className="text-emerald-600"
                  size={24}
                />
                {t('step4_completed')}
              </CardTitle>
              <CardDescription className="text-lg">
                {t('file_ready_download')}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                  <StepIcon
                    step="celebration"
                    className="text-emerald-600"
                    size={40}
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {t('conversion_success')}
                  </h3>
                  <p className="text-gray-600">
                    {t('file_converted_from_to', {
                      from: selectedPair?.from.toUpperCase(),
                      to: selectedPair?.to.toUpperCase()
                    })}
                  </p>
                </div>
                <div className="flex justify-center gap-4">
                  {downloadUrl && (
                    <a href={downloadUrl} download>
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white px-8 py-3"
                      >
                        {t('download_converted_file')}
                      </Button>
                    </a>
                  )}
                  <Button size="lg" variant="outline" onClick={resetConvert}>
                    {t('start_new_conversion')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error status */}
        {status === 'error' && errorMessage && (
          <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-3 text-red-700">
              <StepIcon step="error" className="text-red-600" size={24} />
              <div>
                <div className="font-semibold">{t('conversion_failed')}</div>
                <div className="text-sm">{errorMessage}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
