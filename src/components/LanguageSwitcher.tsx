import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Language } from '@/i18n/translations';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

const ChinaFlag = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-5 h-5 rounded-full">
    <clipPath id="cn-clip">
      <circle cx="256" cy="256" r="256"/>
    </clipPath>
    <g clipPath="url(#cn-clip)">
      <rect fill="#de2910" width="512" height="512"/>
      <polygon fill="#ffde00" points="128,76.8 140.8,115.2 181.6,115.2 148.4,140.8 161.2,179.2 128,153.6 94.8,179.2 107.6,140.8 74.4,115.2 115.2,115.2"/>
      <polygon fill="#ffde00" points="217.6,38.4 224,51.2 238.4,51.2 226.4,60.8 230.4,75.2 217.6,65.6 204.8,75.2 208.8,60.8 196.8,51.2 211.2,51.2"/>
      <polygon fill="#ffde00" points="268.8,76.8 275.2,89.6 289.6,89.6 277.6,99.2 281.6,113.6 268.8,104 256,113.6 260,99.2 248,89.6 262.4,89.6"/>
      <polygon fill="#ffde00" points="268.8,140.8 275.2,153.6 289.6,153.6 277.6,163.2 281.6,177.6 268.8,168 256,177.6 260,163.2 248,153.6 262.4,153.6"/>
      <polygon fill="#ffde00" points="217.6,179.2 224,192 238.4,192 226.4,201.6 230.4,216 217.6,206.4 204.8,216 208.8,201.6 196.8,192 211.2,192"/>
    </g>
  </svg>
);

const KoreaFlag = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-5 h-5 rounded-full">
    <clipPath id="kr-clip">
      <circle cx="256" cy="256" r="256"/>
    </clipPath>
    <g clipPath="url(#kr-clip)">
      <rect fill="#fff" width="512" height="512"/>
      <circle fill="#c60c30" cx="256" cy="256" r="100"/>
      <path fill="#003478" d="M256,256 a50,50 0 0,1 0,100 a50,50 0 0,0 0,-100"/>
    </g>
  </svg>
);

const JapanFlag = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-5 h-5 rounded-full">
    <clipPath id="jp-clip">
      <circle cx="256" cy="256" r="256"/>
    </clipPath>
    <g clipPath="url(#jp-clip)">
      <rect fill="#fff" width="512" height="512"/>
      <circle fill="#bc002d" cx="256" cy="256" r="96"/>
    </g>
  </svg>
);

const ThailandFlag = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-5 h-5 rounded-full">
    <clipPath id="th-clip">
      <circle cx="256" cy="256" r="256"/>
    </clipPath>
    <g clipPath="url(#th-clip)">
      <rect fill="#A51931" y="0" width="512" height="85.3"/>
      <rect fill="#F4F5F8" y="85.3" width="512" height="85.3"/>
      <rect fill="#2D2A4A" y="170.6" width="512" height="170.8"/>
      <rect fill="#F4F5F8" y="341.4" width="512" height="85.3"/>
      <rect fill="#A51931" y="426.7" width="512" height="85.3"/>
    </g>
  </svg>
);

const languageOptions: { code: Language; name: string; Flag: React.FC }[] = [
  { code: 'vi', name: 'Tiếng Việt', Flag: VietnamFlag },
  { code: 'en', name: 'English', Flag: USFlag },
  { code: 'zh', name: '中文', Flag: ChinaFlag },
  { code: 'ko', name: '한국어', Flag: KoreaFlag },
  { code: 'ja', name: '日本語', Flag: JapanFlag },
  { code: 'th', name: 'ไทย', Flag: ThailandFlag },
];

export const LanguageSwitcher = ({ className }: { className?: string }) => {
  const { language, setLanguage } = useLanguage();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleLanguageChange = (lang: Language) => {
    if (lang === language) return;
    setIsAnimating(true);
    setTimeout(() => {
      setLanguage(lang);
      setTimeout(() => setIsAnimating(false), 300);
    }, 150);
  };

  const currentLang = languageOptions.find(l => l.code === language) || languageOptions[0];
  const CurrentFlag = currentLang.Flag;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="iconSm"
          className={cn("text-lg overflow-hidden", className)}
        >
          <div 
            className={cn(
              "transition-transform duration-300 ease-out",
              isAnimating && "animate-[spin_0.3s_ease-in-out]"
            )}
          >
            <CurrentFlag />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {languageOptions.map(({ code, name, Flag }) => (
          <DropdownMenuItem
            key={code}
            onClick={() => handleLanguageChange(code)}
            className={cn(
              "flex items-center gap-2 cursor-pointer",
              language === code && "bg-accent"
            )}
          >
            <Flag />
            <span className="text-sm">{name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
