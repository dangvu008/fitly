import { useRef, useEffect, useState } from 'react';
import { Home, ShoppingBag, Zap, Globe2, FolderOpen } from 'lucide-react';
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
  { id: 'search', icon: ShoppingBag, labelKey: 'nav_shop' },
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
  const navRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const [isAnimating, setIsAnimating] = useState(false);

  // Calculate indicator position based on active tab
  useEffect(() => {
    if (!navRef.current) return;
    
    const activeIndex = navItems.findIndex(item => item.id === activeTab && !item.isFab);
    if (activeIndex === -1) return;

    const buttons = navRef.current.querySelectorAll('[data-nav-button]');
    const activeButton = buttons[activeIndex] as HTMLElement;
    
    if (activeButton) {
      const navRect = navRef.current.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();
      
      setIndicatorStyle({
        left: buttonRect.left - navRect.left + buttonRect.width / 2 - 12,
        width: 24,
      });
    }
  }, [activeTab]);

  const handleTabChange = (tabId: string) => {
    if (tabId === activeTab) return;
    
    setIsAnimating(true);
    onTabChange(tabId);
    
    // Reset animation state after transition
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border/50 safe-bottom">
      <div 
        ref={navRef}
        className="flex items-center justify-around py-2 px-2 max-w-md mx-auto relative"
      >
        {/* Sliding indicator */}
        <div 
          className="absolute top-0 h-0.5 bg-gradient-to-r from-primary/50 via-primary to-primary/50 rounded-full transition-all duration-300 ease-out"
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
            opacity: indicatorStyle.width > 0 ? 1 : 0,
          }}
        />

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
                  "press-effect",
                  "animate-pulse-subtle"
                )}
              >
                <Icon 
                  size={22} 
                  strokeWidth={2.5}
                  className="text-white drop-shadow-sm"
                />
              </button>
            );
          }
          
          // Regular tab buttons
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              data-nav-button
              onClick={() => handleTabChange(item.id)}
              aria-label={t(item.labelKey)}
              className={cn(
                "relative flex flex-col items-center gap-1 py-2 px-3",
                "min-w-[60px] min-h-[48px]",
                "transition-all duration-300 ease-out",
                "press-effect",
                isActive 
                  ? "text-foreground" 
                  : "text-muted-foreground/60 hover:text-muted-foreground"
              )}
              style={{
                transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
              }}
            >
              {/* Icon container with animation */}
              <div className={cn(
                "relative transition-all duration-300 ease-out",
                isActive && "scale-110"
              )}>
                <Icon 
                  size={22} 
                  strokeWidth={isActive ? 2.2 : 1.5}
                  className={cn(
                    "transition-all duration-300",
                    isActive && "drop-shadow-sm"
                  )}
                />
                
                {/* Active dot indicator with pulse animation */}
                <div className={cn(
                  "absolute -bottom-1.5 left-1/2 -translate-x-1/2",
                  "w-1 h-1 rounded-full bg-primary",
                  "transition-all duration-300 ease-out",
                  isActive 
                    ? "opacity-100 scale-100" 
                    : "opacity-0 scale-0"
                )}>
                  {isActive && (
                    <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-75" />
                  )}
                </div>
              </div>
              
              {/* Label with fade animation */}
              <span className={cn(
                "text-[10px] tracking-wide transition-all duration-300",
                isActive 
                  ? "font-semibold opacity-100" 
                  : "font-medium opacity-80"
              )}>
                {t(item.labelKey)}
              </span>

              {/* Ripple effect on tap */}
              {isActive && isAnimating && (
                <span 
                  className="absolute inset-0 rounded-xl bg-primary/10 animate-scale-in"
                  style={{ animationDuration: '300ms' }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
