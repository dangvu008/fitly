import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface ClothingProgress {
  stage: 'checking_size' | 'analyzing' | 'removing_background' | 'complete' | 'error';
  progress: number;
}

interface ClothingValidationOverlayProps {
  isVisible: boolean;
  progress: ClothingProgress | null;
}

export const ClothingValidationOverlay: React.FC<ClothingValidationOverlayProps> = ({
  isVisible,
  progress,
}) => {
  if (!isVisible || !progress) return null;

  const getStageEmoji = () => {
    switch (progress.stage) {
      case 'analyzing': return '🔍';
      case 'removing_background': return '✂️';
      default: return '👗';
    }
  };

  const getStageTitle = () => {
    switch (progress.stage) {
      case 'analyzing': return '🧠 AI đang ngắm nghía...';
      case 'removing_background': return '✨ Đang tách nền xinh xắn...';
      case 'checking_size': return '📏 Đang đo đạc...';
      default: return '👗 Đang xử lý quần áo...';
    }
  };

  const getStageSubtitle = () => {
    switch (progress.stage) {
      case 'analyzing': return 'Hmm, món đồ này đẹp thế!';
      case 'removing_background': return 'Cắt cho gọn gàng nào!';
      case 'checking_size': return 'Kiểm tra kích thước...';
      default: return 'Sắp xong rồi đó!';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-card rounded-xl p-6 max-w-xs w-full shadow-medium space-y-4 border border-border">
        {/* Lottie Animation */}
        <div className="flex justify-center">
          <div className="w-24 h-24 relative">
            <DotLottieReact
              src="https://lottie.host/0c5e8c0a-6af5-4b32-bdbd-25d0d04f7980/W8dWzCXoD9.lottie"
              loop
              autoplay
              style={{ width: '100%', height: '100%' }}
            />
            <div className="absolute -top-1 -right-1 text-xl animate-bounce">
              {getStageEmoji()}
            </div>
          </div>
        </div>
        
        {/* Messages */}
        <div className="text-center space-y-2">
          <p className="font-semibold text-foreground text-lg">
            {getStageTitle()}
          </p>
          <p className="text-sm text-muted-foreground">
            {getStageSubtitle()}
          </p>
        </div>
        
        {/* Fun Progress Bar */}
        <div className="space-y-2">
          <div className="relative h-4 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500"
              style={{ width: `${progress.progress}%` }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                  animation: 'shimmer 1.5s infinite',
                }}
              />
            </div>
            <div
              className="absolute top-1/2 -translate-y-1/2 text-sm transition-all duration-500"
              style={{ left: `calc(${Math.max(8, progress.progress)}% - 10px)` }}
            >
              {progress.progress < 100 ? '👕' : '🎉'}
            </div>
          </div>
          <p className="text-xs text-center text-muted-foreground font-medium">
            {progress.progress}%
          </p>
        </div>
        
        {/* Animated dots */}
        <div className="flex justify-center gap-1.5 pt-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-primary"
              style={{
                animation: 'bounce 1s infinite',
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
      </div>
      
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};
