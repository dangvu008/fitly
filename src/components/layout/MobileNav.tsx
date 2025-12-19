import { Home, Shirt, Heart, User, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: 'home', icon: Home, label: 'Trang chủ' },
  { id: 'tryOn', icon: Shirt, label: 'Thử đồ' },
  { id: 'suggest', icon: Sparkles, label: 'Gợi ý' },
  { id: 'favorites', icon: Heart, label: 'Yêu thích' },
  { id: 'profile', icon: User, label: 'Tôi' },
];

export const MobileNav = ({ activeTab, onTabChange }: MobileNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border">
      <div className="flex items-center justify-around py-2 px-2 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-300",
                isActive 
                  ? "text-primary scale-105" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "p-2 rounded-xl transition-all duration-300",
                isActive && "gradient-primary shadow-glow"
              )}>
                <Icon 
                  size={20} 
                  className={cn(
                    "transition-colors duration-300",
                    isActive && "text-primary-foreground"
                  )} 
                />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
