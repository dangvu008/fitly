import { Progress } from '@/components/ui/progress';
import { Loader2, Upload, Brain, Sparkles, CheckCircle, XCircle } from 'lucide-react';
import { TryOnProgress } from '@/hooks/useAITryOn';
import { cn } from '@/lib/utils';

interface AIProgressBarProps {
  progress: TryOnProgress;
  isVisible: boolean;
}

const stageConfig = {
  idle: { icon: null, color: 'text-muted-foreground' },
  compressing: { icon: Loader2, color: 'text-blue-500' },
  uploading: { icon: Upload, color: 'text-blue-500' },
  processing: { icon: Brain, color: 'text-purple-500' },
  generating: { icon: Sparkles, color: 'text-amber-500' },
  complete: { icon: CheckCircle, color: 'text-green-500' },
  error: { icon: XCircle, color: 'text-destructive' },
};

export const AIProgressBar = ({ progress, isVisible }: AIProgressBarProps) => {
  if (!isVisible || progress.stage === 'idle') return null;

  const config = stageConfig[progress.stage];
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 p-6 bg-card rounded-xl border shadow-lg space-y-4">
        {/* Header with icon */}
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={cn("p-2 rounded-full bg-muted", config.color)}>
              <Icon className={cn("w-6 h-6", progress.stage !== 'complete' && progress.stage !== 'error' && "animate-spin")} />
            </div>
          )}
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">
              {progress.stage === 'complete' ? 'Hoàn thành!' : 
               progress.stage === 'error' ? 'Có lỗi xảy ra' : 
               'Đang xử lý AI...'}
            </h3>
            <p className="text-sm text-muted-foreground">{progress.message}</p>
          </div>
          <span className={cn("text-lg font-bold", config.color)}>
            {progress.progress}%
          </span>
        </div>

        {/* Progress bar */}
        <Progress 
          value={progress.progress} 
          className="h-3"
        />

        {/* Stage indicators */}
        <div className="flex justify-between text-xs text-muted-foreground">
          <StageIndicator 
            label="Tải lên" 
            isActive={progress.stage === 'uploading'} 
            isComplete={['processing', 'generating', 'complete'].includes(progress.stage)}
          />
          <StageIndicator 
            label="Phân tích" 
            isActive={progress.stage === 'processing'} 
            isComplete={['generating', 'complete'].includes(progress.stage)}
          />
          <StageIndicator 
            label="Tạo ảnh" 
            isActive={progress.stage === 'generating'} 
            isComplete={progress.stage === 'complete'}
          />
          <StageIndicator 
            label="Hoàn thành" 
            isActive={progress.stage === 'complete'} 
            isComplete={false}
          />
        </div>
      </div>
    </div>
  );
};

interface StageIndicatorProps {
  label: string;
  isActive: boolean;
  isComplete: boolean;
}

const StageIndicator = ({ label, isActive, isComplete }: StageIndicatorProps) => (
  <div className={cn(
    "flex flex-col items-center gap-1 transition-colors",
    isActive && "text-primary font-medium",
    isComplete && "text-green-500"
  )}>
    <div className={cn(
      "w-2 h-2 rounded-full transition-colors",
      isActive && "bg-primary animate-pulse",
      isComplete && "bg-green-500",
      !isActive && !isComplete && "bg-muted"
    )} />
    <span>{label}</span>
  </div>
);
