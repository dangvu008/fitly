import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Flag emoji components for better rendering
const VietnamFlag = () => (
  <span className="text-base leading-none" role="img" aria-label="Vietnamese">🇻🇳</span>
);

const USFlag = () => (
  <span className="text-base leading-none" role="img" aria-label="English">🇺🇸</span>
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
      className={cn("text-lg", className)}
    >
      {language === 'vi' ? <VietnamFlag /> : <USFlag />}
    </Button>
  );
};
