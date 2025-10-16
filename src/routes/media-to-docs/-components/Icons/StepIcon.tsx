import {
  Target,
  Zap,
  CheckCircle,
  PartyPopper,
  XCircle,
  ArrowLeftRight,
  RotateCw,
  FolderUp
} from 'lucide-react';
import { cn } from '@/routes/-lib/utils';

const STEP_ICONS = {
  selectType: Target,
  uploadFile: FolderUp,
  converting: Zap,
  completed: CheckCircle,
  celebration: PartyPopper,
  error: XCircle,
  conversion: ArrowLeftRight,
  converting_alt: RotateCw
} as const;

interface IconProps {
  className?: string;
  size?: number;
}

export function StepIcon({
  step,
  className,
  size = 20
}: IconProps & {
  step: keyof typeof STEP_ICONS;
}) {
  const Icon = STEP_ICONS[step];
  return <Icon className={cn('', className)} size={size} />;
}
