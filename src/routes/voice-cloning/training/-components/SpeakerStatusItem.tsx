import { useQuery } from '@tanstack/react-query';
import { Mic, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Spinner } from '@/routes/-components/spinner';
import { Button } from '@/routes/-components/ui/button';
import { trpc } from '@/router';
import { TrainingStatusEnum, type Speaker } from '@/types/voice-cloning';
import { Link } from '@tanstack/react-router';

interface SpeakerStatusItemProps {
  speaker: Speaker;
  refreshingSpeakerId: string | null;
  handleRefreshStatus: (speakerId: string) => void;
  getStatusText: (status: TrainingStatusEnum) => string;
  getStatusColor: (status: TrainingStatusEnum) => string;
}

export function SpeakerStatusItem({
  speaker,
  refreshingSpeakerId,
  handleRefreshStatus,
  getStatusText,
  getStatusColor
}: SpeakerStatusItemProps) {
  const { t } = useTranslation();
  const { data: trainingStatus, isLoading: isLoadingStatus } = useQuery(
    trpc.voiceCloning.getTrainingStatus.queryOptions({ speakerId: speaker.id })
  );

  const displayStatus = trainingStatus?.status || TrainingStatusEnum.NotFound;

  return (
    <div
      key={speaker.id}
      className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Mic className="h-4 w-4 text-slate-400 flex-shrink-0" />
          <h3 className="font-medium text-slate-900 truncate">
            {speaker.name}
          </h3>
        </div>
        <div className="mt-1 flex items-center gap-3 text-sm text-slate-500">
          <span>ID: {speaker.id}</span>
          {isLoadingStatus ? (
            <Spinner className="h-4 w-4" />
          ) : (
            <span className={getStatusColor(displayStatus)}>
              {getStatusText(displayStatus)}
            </span>
          )}
          <span>
            {t('voice_cloning.added_on')}:{' '}
            {new Date(speaker.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 ml-4">
        {displayStatus === TrainingStatusEnum.Training && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleRefreshStatus(speaker.id)}
            disabled={refreshingSpeakerId === speaker.id || isLoadingStatus}
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshingSpeakerId === speaker.id ? 'animate-spin' : ''
              }`}
            />
          </Button>
        )}
        {(displayStatus === TrainingStatusEnum.Success ||
          displayStatus === TrainingStatusEnum.Active) && (
          <Link
            to="/voice-cloning/synthesis"
            search={{ speakerId: speaker.id }}
          >
            <Button size="sm" variant="default">
              {t('voice_cloning.use_for_synthesis')}
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
