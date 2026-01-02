import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export interface ProcessingAnimationProps {
  /** Progress percentage (0-100) */
  progress: number;
  /** Estimated time remaining in seconds */
  estimatedTimeRemaining: number;
  /** Whether processing is taking longer than expected */
  isOvertime: boolean;
  /** Whether the animation is visible */
  isVisible?: boolean;
  /** Additional class names */
  className?: string;
}

// Fun rotating messages in multiple languages
const funMessages = {
  vi: [
    'Đang ướm thử vừa vặn với eo của bạn...',
    'AI đang suy nghĩ về phong cách của bạn...',
    'Đang phối màu hoàn hảo...',
    'Chỉnh sửa từng chi tiết nhỏ...',
    'Sắp xong rồi, đợi tí nhé!',
    'Đang tạo phép màu thời trang...',
    'Fashionista AI đang làm việc...',
    'Đang biến hóa outfit cho bạn...',
  ],
  en: [
    'Fitting the outfit to your body...',
    'AI is thinking about your style...',
    'Matching colors perfectly...',
    'Fine-tuning every detail...',
    'Almost there, hang tight!',
    'Creating fashion magic...',
    'Fashionista AI at work...',
    'Transforming your outfit...',
  ],
  zh: [
    '正在为您量身定制...',
    'AI正在思考您的风格...',
    '完美搭配颜色中...',
    '调整每一个细节...',
    '马上就好，请稍等！',
    '创造时尚魔法中...',
    '时尚AI正在工作...',
    '为您变换服装中...',
  ],
  ko: [
    '체형에 맞게 조정 중...',
    'AI가 스타일을 분석 중...',
    '완벽한 색상 매칭 중...',
    '세부 사항 조정 중...',
    '거의 다 됐어요!',
    '패션 마법 생성 중...',
    '패셔니스타 AI 작업 중...',
    '의상 변환 중...',
  ],
  ja: [
    '体型に合わせて調整中...',
    'AIがスタイルを考え中...',
    '完璧な色合わせ中...',
    '細部を調整中...',
    'もうすぐ完成です！',
    'ファッションマジック作成中...',
    'ファッショニスタAI作業中...',
    'コーディネート変換中...',
  ],
  th: [
    'กำลังปรับให้พอดีกับรูปร่างของคุณ...',
    'AI กำลังคิดเกี่ยวกับสไตล์ของคุณ...',
    'จับคู่สีอย่างสมบูรณ์แบบ...',
    'ปรับแต่งทุกรายละเอียด...',
    'เกือบเสร็จแล้ว รอสักครู่!',
    'สร้างเวทมนตร์แฟชั่น...',
    'แฟชั่นนิสต้า AI กำลังทำงาน...',
    'กำลังเปลี่ยนชุดของคุณ...',
  ],
};

// Overtime messages when processing takes longer
const overtimeMessages = {
  vi: [
    'Vẫn đang xử lý, xin đợi thêm chút...',
    'AI đang cố gắng hết sức!',
    'Chậm mà chắc, sắp xong rồi!',
    'Kiên nhẫn nhé, kết quả sẽ đẹp!',
  ],
  en: [
    'Still processing, please wait...',
    'AI is working hard!',
    'Slow but steady, almost done!',
    'Patience, the result will be great!',
  ],
  zh: [
    '仍在处理中，请稍候...',
    'AI正在努力工作！',
    '慢工出细活，快好了！',
    '请耐心等待，结果会很棒！',
  ],
  ko: [
    '아직 처리 중입니다, 잠시만요...',
    'AI가 열심히 작업 중!',
    '천천히 하지만 확실하게!',
    '조금만 기다려주세요!',
  ],
  ja: [
    'まだ処理中です、お待ちください...',
    'AIが頑張っています！',
    'ゆっくりでも確実に！',
    'もう少しお待ちください！',
  ],
  th: [
    'ยังคงประมวลผลอยู่ กรุณารอสักครู่...',
    'AI กำลังทำงานอย่างหนัก!',
    'ช้าแต่ชัวร์ เกือบเสร็จแล้ว!',
    'อดทนหน่อยนะ ผลลัพธ์จะดีมาก!',
  ],
};

/**
 * ProcessingAnimation - Animated skeleton loader with fun messages
 * 
 * Displays during AI try-on processing with:
 * - Pulsing skeleton animation
 * - Rotating fun messages (every 3 seconds)
 * - Time estimate display
 * - Overtime message when processing takes longer
 * 
 * @requirements 4.1, 4.2, 4.3, 4.4
 */
export const ProcessingAnimation = ({
  progress,
  estimatedTimeRemaining,
  isOvertime,
  isVisible = true,
  className,
}: ProcessingAnimationProps) => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [currentLang] = useState<keyof typeof funMessages>('vi'); // Could be from context
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get current messages based on overtime state
  const messages = isOvertime ? overtimeMessages[currentLang] : funMessages[currentLang];

  // Rotate messages every 3 seconds
  useEffect(() => {
    if (!isVisible) return;

    intervalRef.current = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 3000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isVisible, messages.length]);

  // Reset message index when overtime state changes
  useEffect(() => {
    setMessageIndex(0);
  }, [isOvertime]);

  // Format time remaining
  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return '< 1s';
    if (seconds < 60) return `~${Math.ceil(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `~${mins}m ${secs}s`;
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-6 space-y-6',
        className
      )}
      data-testid="processing-animation"
    >
      {/* Animated skeleton loader */}
      <div className="relative w-full max-w-xs aspect-[3/4] rounded-2xl overflow-hidden">
        {/* Base skeleton with pulse */}
        <Skeleton className="absolute inset-0 animate-pulse" />
        
        {/* Shimmer overlay */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite]"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
            }}
          />
        </div>

        {/* Progress overlay */}
        <div
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary/30 to-transparent transition-all duration-500"
          style={{ height: `${progress}%` }}
        />

        {/* Center icon animation */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {/* Outer ring */}
            <div className="w-20 h-20 rounded-full border-4 border-primary/20 animate-pulse" />
            {/* Inner spinning ring */}
            <div
              className="absolute inset-0 w-20 h-20 rounded-full border-4 border-transparent border-t-primary animate-spin"
              style={{ animationDuration: '1.5s' }}
            />
            {/* Center percentage */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-primary">{progress}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fun rotating message */}
      <div className="text-center space-y-2 min-h-[60px]">
        <p
          key={`msg-${messageIndex}-${isOvertime}`}
          className={cn(
            'text-base font-medium animate-fade-in',
            isOvertime ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'
          )}
        >
          {messages[messageIndex]}
        </p>

        {/* Time estimate */}
        <p className="text-sm text-muted-foreground">
          {isOvertime ? (
            <span className="text-amber-600 dark:text-amber-400">
              ⏳ Đang xử lý lâu hơn dự kiến...
            </span>
          ) : (
            <span>
              ⏱️ Còn khoảng {formatTime(estimatedTimeRemaining)}
            </span>
          )}
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              isOvertime
                ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                : 'bg-gradient-to-r from-primary via-ig-purple to-accent'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProcessingAnimation;
