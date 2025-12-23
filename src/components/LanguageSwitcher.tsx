import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// SVG Flag components for cross-platform compatibility
const VietnamFlag = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-5 h-5 rounded-full">
    <clipPath id="vn-clip">
      <circle cx="256" cy="256" r="256"/>
    </clipPath>
    <g clipPath="url(#vn-clip)">
      <rect fill="#da251d" width="512" height="512"/>
      <polygon fill="#ff0" points="256,133 295,243 411,243 317,308 349,418 256,353 163,418 195,308 101,243 217,243"/>
    </g>
  </svg>
);

const USFlag = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-5 h-5 rounded-full">
    <clipPath id="us-clip">
      <circle cx="256" cy="256" r="256"/>
    </clipPath>
    <g clipPath="url(#us-clip)">
      <rect fill="#fff" width="512" height="512"/>
      <g fill="#bf0a30">
        <rect y="39.4" width="512" height="39.4"/>
        <rect y="118.2" width="512" height="39.4"/>
        <rect y="197" width="512" height="39.4"/>
        <rect y="275.8" width="512" height="39.4"/>
        <rect y="354.6" width="512" height="39.4"/>
        <rect y="433.4" width="512" height="39.4"/>
      </g>
      <rect fill="#002868" width="204.8" height="275.7"/>
    </g>
  </svg>
);

export const LanguageSwitcher = ({ className }: { className?: string }) => {
  const { language, setLanguage } = useLanguage();
  const [isAnimating, setIsAnimating] = useState(false);

  const toggleLanguage = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setLanguage(language === 'vi' ? 'en' : 'vi');
      setTimeout(() => setIsAnimating(false), 300);
    }, 150);
  };

  return (
    <Button
      variant="ghost"
      size="iconSm"
      onClick={toggleLanguage}
      className={cn("text-lg overflow-hidden", className)}
    >
      <div 
        className={cn(
          "transition-transform duration-300 ease-out",
          isAnimating && "animate-[spin_0.3s_ease-in-out]"
        )}
      >
        {language === 'vi' ? <VietnamFlag /> : <USFlag />}
      </div>
    </Button>
  );
};
