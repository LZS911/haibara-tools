import { createFileRoute } from '@tanstack/react-router';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/routes/-components/ui/card';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { trpc } from '@/router';
import { Spinner } from '@/routes/-components/spinner';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/routes/-components/ui/button';
import { Label } from '@/routes/-components/ui/label';
import { Textarea } from '@/routes/-components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/routes/-components/ui/select';
import { TrainingStatusEnum } from '@/types/voice-cloning';
import { toast } from 'sonner';
import { Download, RefreshCw } from 'lucide-react';

export const Route = createFileRoute('/voice-cloning/synthesis/')({
  component: VoiceSynthesisPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      speakerId: (search.speakerId as string) || undefined
    };
  }
});

function VoiceSynthesisPage() {
  const { t } = useTranslation();
  const { speakerId: initialSpeakerId } = Route.useSearch();

  const [selectedSpeakerId, setSelectedSpeakerId] = useState<string>(
    initialSpeakerId || ''
  );
  const [text, setText] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // 查询训练列表
  const {
    data: trainings = [],
    refetch: refetchTrainings,
    isLoading: isLoadingTrainings
  } = useQuery(trpc.voiceCloning.listTrainings.queryOptions());

  // 过滤出训练成功的音色
  const availableVoices = trainings.filter(
    (t) =>
      t.status === TrainingStatusEnum.Success ||
      t.status === TrainingStatusEnum.Active
  );

  // 语音合成 mutation
  const synthesizeMutation = useMutation(
    trpc.voiceCloning.synthesizeSpeech.mutationOptions()
  );

  // 如果从其他页面传入了 speakerId，自动选中
  useEffect(() => {
    if (initialSpeakerId && !selectedSpeakerId) {
      setSelectedSpeakerId(initialSpeakerId);
    }
  }, [initialSpeakerId, selectedSpeakerId]);

  const handleGenerate = () => {
    if (!selectedSpeakerId) {
      toast.error(t('voice_cloning.error_no_voice_selected'));
      return;
    }

    if (!text.trim()) {
      toast.error(t('voice_cloning.error_no_text'));
      return;
    }

    synthesizeMutation.mutate(
      {
        text: text.trim(),
        speakerId: selectedSpeakerId
      },
      {
        onSuccess: (data) => {
          if (data.success && data.audioUrl) {
            setAudioUrl(data.audioUrl);
            toast.success(t('voice_cloning.generate_success'));
          } else {
            toast.error(t('voice_cloning.generate_failed'));
          }
        },
        onError: (error) => {
          toast.error(error.message);
        }
      }
    );
  };

  const handleDownload = () => {
    if (!audioUrl) return;

    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `tts_${selectedSpeakerId}_${Date.now()}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {t('voice_cloning.synthesis_page_title')}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t('voice_cloning.synthesis_page_desc')}
          </p>
        </div>
      </div>

      {/* 语音合成表单 */}
      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-base font-medium text-slate-900">
            {t('voice_cloning.generate_button')}
          </CardTitle>
          <CardDescription className="text-sm">
            {t('voice_cloning.select_voice_placeholder')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 音色选择 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="voice-select">
                {t('voice_cloning.select_voice_label')}
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetchTrainings()}
                disabled={isLoadingTrainings}
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoadingTrainings ? 'animate-spin' : ''}`}
                />
              </Button>
            </div>
            {availableVoices.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                {t('voice_cloning.no_trained_voices')}
              </div>
            ) : (
              <Select
                value={selectedSpeakerId}
                onValueChange={setSelectedSpeakerId}
              >
                <SelectTrigger id="voice-select">
                  <SelectValue
                    placeholder={t('voice_cloning.select_voice_placeholder')}
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableVoices.map((voice) => (
                    <SelectItem key={voice.speakerId} value={voice.speakerId}>
                      {voice.title} ({voice.speakerId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* 文本输入 */}
          <div className="space-y-2">
            <Label htmlFor="text-input">
              {t('voice_cloning.text_input_label')}
            </Label>
            <Textarea
              id="text-input"
              placeholder={t('voice_cloning.text_input_placeholder')}
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={synthesizeMutation.isPending}
              rows={6}
              maxLength={500}
            />
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{t('voice_cloning.text_input_help')}</span>
              <span>{text.length} / 500</span>
            </div>
          </div>

          {/* 生成按钮 */}
          <Button
            onClick={handleGenerate}
            disabled={
              synthesizeMutation.isPending ||
              !selectedSpeakerId ||
              !text.trim() ||
              availableVoices.length === 0
            }
            className="w-full"
          >
            {synthesizeMutation.isPending ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                {t('voice_cloning.generating')}
              </>
            ) : (
              t('voice_cloning.generate_button')
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 音频播放器 */}
      {audioUrl && (
        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-base font-medium text-slate-900">
              {t('voice_cloning.audio_player_title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
              <audio
                controls
                src={audioUrl}
                className="flex-1"
                style={{ width: '100%' }}
              >
                Your browser does not support the audio element.
              </audio>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleDownload}
                className="flex-1"
              >
                <Download className="mr-2 h-4 w-4" />
                {t('voice_cloning.download_audio')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
