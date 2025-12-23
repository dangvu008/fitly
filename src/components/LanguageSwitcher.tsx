import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Circular flag components
const VietnamFlag = () => (
  <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center bg-red-600 shadow-sm">
    <span className="text-lg leading-none" role="img" aria-label="Vietnamese">🇻🇳</span>
  </div>
);

const USFlag = () => (
  <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center bg-blue-600 shadow-sm">
    <span className="text-lg leading-none" role="img" aria-label="English">🇺🇸</span>
  </div>
);

export const LanguageSwitcher = ({ className }: { className?: string }) => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'vi' ? 'en' : 'vi');
  };

  return (
    <Button
      variant="ghost"
      size="iconSm"
      onClick={toggleLanguage}
      className={cn("p-1 hover:bg-muted/50", className)}
      title={language === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
    >
      {language === 'vi' ? <VietnamFlag /> : <USFlag />}
    </Button>
  );
};
