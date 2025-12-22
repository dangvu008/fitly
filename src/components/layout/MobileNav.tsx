import { Home, Shirt, User, Scale, Archive, History } from 'lucide-react';
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
  { id: 'history', icon: History, labelKey: 'nav_history' },
  { id: 'compare', icon: Scale, labelKey: 'nav_compare' },
  { id: 'profile', icon: User, labelKey: 'nav_profile' },
];

export const MobileNav = ({ activeTab, onTabChange }: MobileNavProps) => {
  const { outfitsToCompare } = useCompare();
  const { t } = useLanguage();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border">
      <div className="flex items-center justify-around py-2 px-2 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          const showBadge = item.id === 'compare' && outfitsToCompare.length > 0;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-300",
                isActive 
                  ? "text-primary scale-105" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "relative p-2 rounded-xl transition-all duration-300",
                isActive && "gradient-primary shadow-glow"
              )}>
                <Icon 
                  size={20} 
                  className={cn(
                    "transition-colors duration-300",
                    isActive && "text-primary-foreground"
                  )} 
                />
                {/* Badge for compare count */}
                {showBadge && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full gradient-accent text-[10px] font-bold text-accent-foreground flex items-center justify-center">
                    {outfitsToCompare.length}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{t(item.labelKey)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
