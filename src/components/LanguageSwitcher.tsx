import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

export const LanguageSwitcher = ({ className }: { className?: string }) => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'vi' ? 'en' : 'vi');
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className={cn("gap-1.5 text-xs font-medium", className)}
    >
      <Globe size={14} />
      <span className="uppercase">{language}</span>
    </Button>
  );
};
