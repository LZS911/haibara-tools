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
import {
  TrainingStatusEnum,
  type SynthesisRecord
} from '@/types/voice-cloning';
import { toast } from 'sonner';
import { RefreshCw, Play, FolderOpen, X } from 'lucide-react';
import { format } from 'date-fns';

export const Route = createFileRoute('/voice-cloning/synthesis/')({
  component: VoiceSynthesisPage,
  staticData: { keepAlive: true },
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
  const [audioPath, setAudioPath] = useState<string | null>(null);

  // 查询音色 ID 列表
  const {
    data: speakerIDs = [],
    refetch: refetchSpeakerIDs,
    isLoading: isLoadingSpeakerIDs
  } = useQuery(trpc.voiceCloning.listSpeakerIDs.queryOptions());

  // 查询合成历史
  const {
    data: synthesisHistory = [],
    refetch: refetchHistory,
    isLoading: isLoadingHistory
  } = useQuery(trpc.voiceCloning.listSynthesisHistory.queryOptions());

  // 过滤出训练成功的音色
  const availableVoices = speakerIDs.filter(
    (s) =>
      s.status === TrainingStatusEnum.Success ||
      s.status === TrainingStatusEnum.Active
  );

  // 语音合成 mutation
  const synthesizeMutation = useMutation({
    ...trpc.voiceCloning.synthesizeSpeech.mutationOptions(),
    onSuccess: (data) => {
      if (data.success) {
        setAudioUrl(data.audioUrl);
        setAudioPath(data.audioPath);
        toast.success(t('voice_cloning.generate_success'));
        refetchHistory(); // 成功后刷新历史记录
      } else {
        toast.error(t('voice_cloning.generate_failed'));
      }
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  // 如果从其他页面传入了 speakerId，自动选中
  useEffect(() => {
    if (initialSpeakerId && !selectedSpeakerId && availableVoices.length > 0) {
      const foundVoice = availableVoices.find(
        (voice) => voice.id === initialSpeakerId
      );
      if (foundVoice) {
        setSelectedSpeakerId(initialSpeakerId);
      }
    }
  }, [initialSpeakerId, selectedSpeakerId, availableVoices]);

  const handleGenerate = () => {
    if (!selectedSpeakerId) {
      toast.error(t('voice_cloning.error_no_voice_selected'));
      return;
    }

    if (!text.trim()) {
      toast.error(t('voice_cloning.error_no_text'));
      return;
    }

    synthesizeMutation.mutate({
      text: text.trim(),
      speakerId: selectedSpeakerId
    });
  };

  const handleOpenFolder = (filePath: string) => {
    if (window.electronAPI) {
      const folderPath = filePath.substring(0, filePath.lastIndexOf('/'));
      window.electronAPI.openPath(folderPath);
    }
  };

  const handlePlayHistory = (record: SynthesisRecord) => {
    setAudioUrl(record.audioUrl);
    setAudioPath(record.audioPath);
    setText(record.text);
    setSelectedSpeakerId(record.speakerId);
  };

  const handleCloseAudioPlayer = () => {
    setAudioUrl(null);
    setAudioPath(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          {t('voice_cloning.synthesis_page_title')}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {t('voice_cloning.synthesis_page_desc')}
        </p>
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
                onClick={() => refetchSpeakerIDs()}
                disabled={isLoadingSpeakerIDs}
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    isLoadingSpeakerIDs ? 'animate-spin' : ''
                  }`}
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
                  {availableVoices.map((speaker) => (
                    <SelectItem key={speaker.id} value={speaker.id}>
                      {speaker.name} ({speaker.id})
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
              <>{t('voice_cloning.generating')}</>
            ) : (
              t('voice_cloning.generate_button')
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 音频播放器 */}
      {audioUrl && audioPath && (
        <Card className="border-slate-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-medium text-slate-900">
              {t('voice_cloning.audio_player_title')}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCloseAudioPlayer}
              className="h-8 w-8"
              title={t('common.close_button')}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
              <audio
                controls
                src={audioUrl}
                className="flex-1"
                style={{ width: '100%' }}
                autoPlay
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleOpenFolder(audioPath)}
                className="flex-1"
              >
                <FolderOpen className="mr-2 h-4 w-4" />
                {t('voice_cloning.open_folder_button')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* History */}
      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium text-slate-900">
              {t('voice_cloning.history_title')}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetchHistory()}
              disabled={isLoadingHistory}
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoadingHistory ? 'animate-spin' : ''}`}
              />
            </Button>
          </div>
          <CardDescription className="text-sm">
            {t('voice_cloning.history_desc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
          {synthesisHistory.length === 0 ? (
            <div className="text-sm text-slate-500 text-center py-4">
              {t('voice_cloning.no_history')}
            </div>
          ) : (
            synthesisHistory.map((record) => (
              <div
                key={record.id}
                className="p-3 border border-slate-100 rounded-lg flex items-center justify-between gap-4 hover:bg-slate-50"
              >
                <div className="flex-1 space-y-1.5">
                  <p
                    className="text-sm text-slate-800 line-clamp-2"
                    title={record.text}
                  >
                    {record.text}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="font-medium text-slate-600">
                        {t('voice_cloning.voice_label')}:
                      </span>
                      {speakerIDs.find((s) => s.id === record.speakerId)
                        ?.name || record.speakerId}
                    </span>
                    <span>
                      {format(new Date(record.createdAt), 'yyyy-MM-dd HH:mm')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => handlePlayHistory(record)}
                    title={t('voice_cloning.play_history_tooltip')}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => handleOpenFolder(record.audioPath)}
                    title={t('voice_cloning.open_folder_button')}
                  >
                    <FolderOpen className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
