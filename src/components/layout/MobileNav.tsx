import { Home, Shirt, Scale, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCompare } from '@/contexts/CompareContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { TranslationKey } from '@/i18n/translations';

interface MobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems: { id: string; icon: typeof Home; labelKey: TranslationKey }[] = [
  { id: 'home', icon: Home, labelKey: 'nav_home' },
  { id: 'tryOn', icon: Shirt, labelKey: 'nav_tryon' },
  { id: 'closet', icon: ShoppingBag, labelKey: 'nav_wardrobe' },
  { id: 'compare', icon: Scale, labelKey: 'nav_compare' },
];

export const MobileNav = ({ activeTab, onTabChange }: MobileNavProps) => {
  const { outfitsToCompare } = useCompare();
  const { t } = useLanguage();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-bottom">
      <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          const showBadge = item.id === 'compare' && outfitsToCompare.length > 0;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "relative flex flex-col items-center gap-0.5 py-1 px-4 transition-colors duration-200 press-effect",
                isActive 
                  ? "text-foreground" 
                  : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <Icon 
                  size={24} 
                  strokeWidth={isActive ? 2.5 : 1.5}
                  className="transition-all duration-200"
                />
                {/* Badge for compare count - Instagram style */}
                {showBadge && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-accent text-[10px] font-bold text-white flex items-center justify-center animate-bounce-in">
                    {outfitsToCompare.length}
                  </span>
                )}
              </div>
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
