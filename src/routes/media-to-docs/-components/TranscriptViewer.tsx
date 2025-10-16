import { useTranslation } from 'react-i18next';

export function TranscriptViewer() {
  const { t } = useTranslation();
  return (
    <div>
      {t('transcript_viewer_placeholder', 'Transcript Viewer Placeholder')}
    </div>
  );
}
