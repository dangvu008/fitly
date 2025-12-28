import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { TryOnProgress } from '@/hooks/useAITryOn';
import { cn } from '@/lib/utils';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useEffect, useState, useRef } from 'react';
import confetti from 'canvas-confetti';

interface AIProgressBarProps {
  progress: TryOnProgress;
  isVisible: boolean;
  onCancel?: () => void;
}

// Lottie animation URLs for each stage
const lottieAnimations = {
  compressing: 'https://lottie.host/0c5e8c0a-6af5-4b32-bdbd-25d0d04f7980/W8dWzCXoD9.lottie', // clothes hanger
  uploading: 'https://lottie.host/1d9c8fa8-1f07-4e26-a906-46a6f76c1c54/qGQNKNuMJM.lottie', // cloud upload
  scanning: 'https://lottie.host/c2e8b9fc-c7ae-4eab-9b54-5f0f67e9c548/GWEqPF1Tza.lottie', // body scan
  processing: 'https://lottie.host/c2e8b9fc-c7ae-4eab-9b54-5f0f67e9c548/GWEqPF1Tza.lottie', // washing machine
  warping: 'https://lottie.host/d10e8b97-a4d3-4f9e-b0f8-7e9cdef05ec8/5EF3wJWe17.lottie', // cloth warping
  generating: 'https://lottie.host/d10e8b97-a4d3-4f9e-b0f8-7e9cdef05ec8/5EF3wJWe17.lottie', // magic wand / sparkles
  finalizing: 'https://lottie.host/d10e8b97-a4d3-4f9e-b0f8-7e9cdef05ec8/5EF3wJWe17.lottie', // finalizing
  complete: 'https://lottie.host/5be1e31c-5cb4-4c8e-bc69-ff456b4cc7c0/YmWTlWOYdM.lottie', // celebration
  error: 'https://lottie.host/77bd4b33-f8d0-4c08-9e4d-4a45d4e9e556/T5lmKhJlLP.lottie', // sad face
  cancelled: 'https://lottie.host/77bd4b33-f8d0-4c08-9e4d-4a45d4e9e556/T5lmKhJlLP.lottie',
  timeout: 'https://lottie.host/c2e8b9fc-c7ae-4eab-9b54-5f0f67e9c548/GWEqPF1Tza.lottie', // still processing
};

// Funny messages that change over time for each stage
const funnyMessages = {
  compressing: [
    { text: '🗜️ Đang nén ảnh cho gọn gàng...', subtext: 'Ép cho vừa túi thôi!' },
    { text: '📦 Đóng gói hành lý thời trang...', subtext: 'Quần áo đang xếp vali!' },
    { text: '🎁 Gói quà xong chưa nhỉ...', subtext: 'Sắp xong rồi đó!' },
  ],
  uploading: [
    { text: '☁️ Đang gửi lên cloud...', subtext: 'Bay lên trời nào!' },
    { text: '🚀 Phóng tên lửa thời trang!', subtext: 'Đợi tí, sắp tới đích rồi!' },
    { text: '📨 Gửi thư bồ câu đi...', subtext: 'Bồ câu đang bay thật nhanh!' },
    { text: '🎈 Thả bóng bay lên trời...', subtext: 'Bay cao, bay xa!' },
  ],
  scanning: [
    { text: '📷 Scanning Body...', subtext: 'Đang quét cơ thể của bạn!' },
    { text: '👀 Đang ngắm nghía bạn...', subtext: 'Ôi, đẹp thế này cơ à!' },
    { text: '🔍 Phân tích dáng người...', subtext: 'Tìm tỷ lệ hoàn hảo!' },
    { text: '📐 Đo đạc kích thước...', subtext: 'Chính xác từng milimet!' },
  ],
  processing: [
    { text: '🧠 AI đang suy nghĩ...', subtext: 'Hmm, để xem nào...' },
    { text: '👀 Đang ngắm nghía bạn...', subtext: 'Ôi, đẹp thế này cơ à!' },
    { text: '🔍 Phân tích style của bạn...', subtext: 'Fashionista đây rồi!' },
    { text: '💭 AI đang mơ mộng...', subtext: 'Mơ về bộ đồ hoàn hảo!' },
    { text: '🧹 Đang giặt ủi đồ cho bạn...', subtext: 'Thơm tho, sạch sẽ!' },
    { text: '🎨 Họa sĩ AI đang vẽ...', subtext: 'Nghệ thuật cần thời gian!' },
  ],
  warping: [
    { text: '👗 Warping Cloth...', subtext: 'Đang điều chỉnh quần áo!' },
    { text: '✂️ Cắt may theo dáng bạn...', subtext: 'Vừa vặn như đo!' },
    { text: '🪡 Đang khâu vá tinh tế...', subtext: 'Từng đường kim mũi chỉ!' },
    { text: '👔 Ướm thử lên người...', subtext: 'Sắp xong rồi đó!' },
  ],
  generating: [
    { text: '✨ Phép màu đang diễn ra...', subtext: 'Bibbidi Bobbidi Boo!' },
    { text: '🪄 Gậy thần đang làm việc!', subtext: 'Abracadabra!' },
    { text: '🌟 Sao sáng đang lấp lánh...', subtext: 'Bạn sẽ tỏa sáng!' },
    { text: '🎭 Đang biến hình...', subtext: 'Sailor Moon biến hình!' },
    { text: '💫 Ma thuật thời trang!', subtext: 'Expecto Patronum!' },
    { text: '🦋 Đang hóa bướm...', subtext: 'Từ kén bước ra!' },
  ],
  finalizing: [
    { text: '🎬 Finalizing...', subtext: 'Đang hoàn thiện tác phẩm!' },
    { text: '💅 Chỉnh sửa chi tiết cuối...', subtext: 'Hoàn hảo từng pixel!' },
    { text: '🖼️ Đóng khung tác phẩm...', subtext: 'Sắp xong rồi!' },
    { text: '✅ Kiểm tra lần cuối...', subtext: 'Đảm bảo chất lượng!' },
  ],
  complete: [
    { text: '🎉 Hoàn thành rồi nè!', subtext: 'Woohooo! Đẹp quá đi!' },
    { text: '🎊 Xong xuôi cả rồi!', subtext: 'Fashionista đích thực!' },
    { text: '🌈 Tuyệt vời ông mặt trời!', subtext: 'Bạn thật lung linh!' },
  ],
  error: [
    { text: '😢 Ối, có lỗi rồi...', subtext: 'Đừng buồn, thử lại nhé!' },
    { text: '🙈 Úi, xin lỗi bạn...', subtext: 'AI bị đơ một chút!' },
  ],
  cancelled: [
    { text: '⏹️ Đã dừng lại rồi!', subtext: 'Khi nào sẵn sàng, quay lại nhé!' },
  ],
  timeout: [
    { text: '⏳ Vẫn đang xử lý...', subtext: 'Xin đợi thêm một chút!' },
    { text: '🐢 Chậm mà chắc...', subtext: 'Đang cố gắng hết sức!' },
    { text: '💪 Kiên nhẫn nhé!', subtext: 'Sắp xong rồi đó!' },
  ],
};

export const AIProgressBar = ({ progress, isVisible, onCancel }: AIProgressBarProps) => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [currentMessage, setCurrentMessage] = useState({ text: '', subtext: '' });
  const hasTriggeredConfetti = useRef(false);

  // Trigger confetti when complete
  useEffect(() => {
    if (progress.stage === 'complete' && !hasTriggeredConfetti.current) {
      hasTriggeredConfetti.current = true;
      
      // Fire multiple confetti bursts for celebration effect
      const duration = 3000;
      const end = Date.now() + duration;

      const colors = ['#ff69b4', '#00ff88', '#ffd700', '#ff6b6b', '#4ecdc4', '#a855f7'];

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: colors,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      // Initial big burst
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: colors,
      });

      // Continuous side bursts
      frame();

      // Star burst
      setTimeout(() => {
        confetti({
          particleCount: 50,
          spread: 100,
          origin: { y: 0.5, x: 0.5 },
          colors: colors,
          shapes: ['star'],
          scalar: 1.2,
        });
      }, 500);
    }
  }, [progress.stage]);

  // Reset confetti trigger when stage changes from complete
  useEffect(() => {
    if (progress.stage !== 'complete') {
      hasTriggeredConfetti.current = false;
    }
  }, [progress.stage]);

  // Cycle through funny messages
  useEffect(() => {
    if (!isVisible || progress.stage === 'idle') return;

    const messages = funnyMessages[progress.stage as keyof typeof funnyMessages] || [];
    if (messages.length === 0) return;

    // Set initial message
    setCurrentMessage(messages[0]);
    setMessageIndex(0);

    // Cycle through messages every 3 seconds
    const interval = setInterval(() => {
      setMessageIndex((prev) => {
        const nextIndex = (prev + 1) % messages.length;
        setCurrentMessage(messages[nextIndex]);
        return nextIndex;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [progress.stage, isVisible]);

  // Reset message when stage changes
  useEffect(() => {
    const messages = funnyMessages[progress.stage as keyof typeof funnyMessages] || [];
    if (messages.length > 0) {
      setCurrentMessage(messages[0]);
      setMessageIndex(0);
    }
  }, [progress.stage]);

  if (!isVisible || progress.stage === 'idle' || progress.stage === 'cancelled') return null;

  const lottieUrl = lottieAnimations[progress.stage as keyof typeof lottieAnimations];
  const canCancel = !['complete', 'error', 'cancelled'].includes(progress.stage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4 p-6 bg-card rounded-2xl border shadow-lg space-y-4">
        {/* Lottie Animation */}
        <div className="flex justify-center">
          <div className="w-32 h-32 relative">
            {lottieUrl ? (
              <DotLottieReact
                src={lottieUrl}
                loop
                autoplay
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              // Fallback animated icon
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 animate-pulse flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-primary animate-ping" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Animated Message */}
        <div className="text-center space-y-1 min-h-[60px]">
          <h3 
            key={`${progress.stage}-${messageIndex}`}
            className="font-semibold text-lg text-foreground animate-fade-in"
          >
            {currentMessage.text || progress.message}
          </h3>
          <p 
            key={`sub-${progress.stage}-${messageIndex}`}
            className="text-sm text-muted-foreground animate-fade-in"
            style={{ animationDelay: '0.1s' }}
          >
            {currentMessage.subtext}
          </p>
        </div>

        {/* Progress bar with cute styling */}
        <div className="relative pt-2">
          {/* Background track with pattern */}
          <div className="h-5 bg-muted rounded-full overflow-hidden relative">
            {/* Striped pattern background */}
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, currentColor 10px, currentColor 12px)',
              }}
            />
            
            {/* Progress fill with gradient and animation */}
            <div 
              className="h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden"
              style={{ 
                width: `${progress.progress}%`,
                background: progress.stage === 'error' 
                  ? 'hsl(var(--destructive))' 
                  : progress.stage === 'complete'
                  ? 'linear-gradient(90deg, #10b981, #34d399)'
                  : 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.7), hsl(var(--primary)))'
              }}
            >
              {/* Moving shimmer effect */}
              {!['complete', 'error'].includes(progress.stage) && (
                <div 
                  className="absolute inset-0 animate-pulse"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                    animation: 'shimmer 2s infinite',
                  }}
                />
              )}
              
              {/* Cute moving dots inside progress */}
              {!['complete', 'error'].includes(progress.stage) && (
                <div className="absolute inset-0 flex items-center justify-end pr-2 gap-1">
                  {[0, 1, 2].map((i) => (
                    <div 
                      key={i}
                      className="w-2 h-2 rounded-full bg-white/60"
                      style={{
                        animation: 'bounce 1s infinite',
                        animationDelay: `${i * 0.2}s`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Cute floating percentage badge */}
          <div 
            className={cn(
              "absolute -top-1 transform -translate-x-1/2 bg-card border-2 rounded-full px-3 py-1 text-xs font-bold shadow-md transition-all duration-300",
              progress.stage === 'complete' ? 'border-green-500 text-green-500' :
              progress.stage === 'error' ? 'border-destructive text-destructive' :
              'border-primary text-primary'
            )}
            style={{ left: `${Math.max(12, Math.min(88, progress.progress))}%` }}
          >
            {progress.progress}%
          </div>
        </div>

        {/* Stage indicator with cute icons */}
        <div className="flex justify-center gap-1 pt-3">
          {[
            { stage: 'scanning', icon: '📷', label: 'Quét' },
            { stage: 'warping', icon: '👗', label: 'Điều chỉnh' },
            { stage: 'generating', icon: '✨', label: 'Tạo' },
            { stage: 'finalizing', icon: '🎬', label: 'Hoàn thiện' },
            { stage: 'complete', icon: '🎉', label: 'Xong' },
          ].map((item, index) => {
            const stages = ['uploading', 'scanning', 'warping', 'generating', 'finalizing', 'complete'];
            const currentIndex = stages.indexOf(progress.stage);
            const itemIndex = stages.indexOf(item.stage);
            const isActive = progress.stage === item.stage || 
                            (progress.stage === 'compressing' && item.stage === 'scanning') ||
                            (progress.stage === 'uploading' && item.stage === 'scanning') ||
                            (progress.stage === 'processing' && item.stage === 'warping') ||
                            (progress.stage === 'timeout' && itemIndex <= currentIndex);
            const isComplete = currentIndex > itemIndex || progress.stage === 'complete';
            
            return (
              <div key={item.stage} className="flex items-center">
                <div className={cn(
                  "flex flex-col items-center transition-all duration-300",
                  isActive && "scale-110",
                )}>
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-300",
                    isActive && "bg-primary/20 animate-pulse",
                    isComplete && "bg-green-500/20",
                    !isActive && !isComplete && "bg-muted"
                  )}>
                    {item.icon}
                  </div>
                  <span className={cn(
                    "text-[10px] mt-0.5 transition-colors",
                    isActive && "text-primary font-semibold",
                    isComplete && "text-green-500",
                    !isActive && !isComplete && "text-muted-foreground"
                  )}>
                    {item.label}
                  </span>
                </div>
                {index < 4 && (
                  <div className={cn(
                    "w-4 h-0.5 mx-0.5 mt-[-12px]",
                    isComplete ? "bg-green-500" : "bg-muted"
                  )} />
                )}
              </div>
            );
          })}
        </div>

        {/* Fun facts while waiting */}
        {!['complete', 'error', 'cancelled'].includes(progress.stage) && (
          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground/70 italic">
              💡 Bạn có biết: AI của chúng tôi đã thử hàng triệu bộ đồ!
            </p>
          </div>
        )}

        {/* Cancel button */}
        {canCancel && onCancel && (
          <Button 
            variant="outline" 
            className="w-full gap-2 mt-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-colors"
            onClick={onCancel}
          >
            <X className="w-4 h-4" />
            Hủy xử lý
          </Button>
        )}
      </div>

      {/* Custom keyframes */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};
