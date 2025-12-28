import { Home, Search, Zap, Globe, FolderOpen } from 'lucide-react';
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
  { id: 'community', icon: Globe, labelKey: 'nav_community' },
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-bottom">
      <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto relative">
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
                  "bg-gradient-to-br from-primary to-accent",
                  "shadow-lg shadow-primary/30",
                  "-mt-6",
                  "transition-all duration-200",
                  "hover:scale-105 hover:shadow-xl hover:shadow-primary/40",
                  "active:scale-95",
                  "press-effect"
                )}
              >
                <Icon 
                  size={24} 
                  strokeWidth={2}
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
                "relative flex flex-col items-center gap-0.5 py-1 px-4 transition-colors duration-200 press-effect",
                "min-w-[44px] min-h-[44px]",
                isActive 
                  ? "text-foreground" 
                  : "text-muted-foreground"
              )}
            >
              <Icon 
                size={24} 
                strokeWidth={isActive ? 2.5 : 1.5}
                className="transition-all duration-200"
              />
              <span className={cn(
                "text-[10px] transition-all duration-200",
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
