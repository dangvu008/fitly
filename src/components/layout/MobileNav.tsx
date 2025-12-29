import { Home, Search, Zap, Globe2, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { TranslationKey } from '@/i18n/translations';

interface NavItem {
  id: string;
  icon: typeof Home;
  labelKey: TranslationKey;
  isFab?: boolean;
}

const navItems: NavItem[] = [
  { id: 'home', icon: Home, labelKey: 'nav_home' },
  { id: 'search', icon: Search, labelKey: 'nav_search' },
  { id: 'studio', icon: Zap, labelKey: 'nav_studio', isFab: true },
  { id: 'community', icon: Globe2, labelKey: 'nav_community' },
  { id: 'wardrobe', icon: FolderOpen, labelKey: 'nav_wardrobe' },
];

interface MobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenStudio?: () => void;
}

export const MobileNav = ({ activeTab, onTabChange, onOpenStudio = () => {} }: MobileNavProps) => {
  const { t } = useLanguage();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border/50 safe-bottom">
      <div className="flex items-center justify-around py-2 px-2 max-w-md mx-auto relative">
        {navItems.map((item) => {
          const Icon = item.icon;
          
          // FAB (Floating Action Button) - center button for Studio
          if (item.isFab) {
            return (
              <button
                key={item.id}
                onClick={onOpenStudio}
                aria-label={t(item.labelKey)}
                className={cn(
                  "relative flex items-center justify-center",
                  "w-14 h-14 min-w-[56px] min-h-[56px]",
                  "rounded-full",
                  "bg-gradient-to-br from-[hsl(280,80%,60%)] via-[hsl(300,70%,55%)] to-[hsl(320,75%,50%)]",
                  "shadow-lg shadow-primary/25",
                  "-mt-6",
                  "transition-all duration-300 ease-out",
                  "hover:scale-105 hover:shadow-xl hover:shadow-primary/35",
                  "active:scale-95",
                  "press-effect"
                )}
              >
                <Icon 
                  size={22} 
                  strokeWidth={2.5}
                  className="text-white"
                />
              </button>
            );
          }
          
          // Regular tab buttons
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              aria-label={t(item.labelKey)}
              className={cn(
                "relative flex flex-col items-center gap-1 py-2 px-3 transition-all duration-200 press-effect",
                "min-w-[60px] min-h-[48px]",
                isActive 
                  ? "text-foreground" 
                  : "text-muted-foreground/70 hover:text-muted-foreground"
              )}
            >
              <div className={cn(
                "relative transition-all duration-200",
                isActive && "scale-110"
              )}>
                <Icon 
                  size={22} 
                  strokeWidth={isActive ? 2 : 1.5}
                  className="transition-all duration-200"
                />
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </div>
              <span className={cn(
                "text-[10px] transition-all duration-200 tracking-wide",
                isActive ? "font-semibold" : "font-medium"
              )}>
                {t(item.labelKey)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};