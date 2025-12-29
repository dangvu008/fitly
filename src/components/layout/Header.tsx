import { User, Bookmark, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useProSubscription } from '@/hooks/useProSubscription';
import { GemsCounter } from '@/components/monetization/GemsCounter';
import { FitlyLogo } from '@/components/ui/FitlyLogo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  showShare?: boolean;
  showNotification?: boolean;
  showLanguageSwitcher?: boolean;
  showGems?: boolean;
  gemsBalance?: number;
  onBack?: () => void;
  onShare?: () => void;
  onAvatarClick?: () => void;
  onSavedClick?: () => void;
  onGemsClick?: () => void;
}

export const Header = ({ 
  title, 
  showBack, 
  showShare, 
  showNotification,
  showLanguageSwitcher = false,
  showGems = true,
  gemsBalance = 0,
  onBack,
  onShare,
  onAvatarClick,
  onSavedClick,
  onGemsClick,
}: HeaderProps) => {
  const { user } = useAuth();
  const { isPro } = useProSubscription();

  const getInitials = () => {
    if (user?.user_metadata?.display_name) {
      return user.user_metadata.display_name.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border safe-top">
      <div className="flex items-center justify-between px-4 py-3 max-w-md mx-auto">
        {/* Logo - Far left */}
        <FitlyLogo size="sm" />
        
        {/* Right actions - Gem Badge, Bookmark, Avatar with 16px gaps */}
        <div className="flex items-center gap-4">
          {/* Language Switcher */}
          {showLanguageSwitcher && (
            <LanguageSwitcher />
          )}
          
          {/* Gems Counter - Pill Badge */}
          {showGems && (
            <GemsCounter onPurchaseClick={onGemsClick || (() => {})} />
          )}
          
          {/* Bookmark Icon */}
          {showNotification && (
            <Button 
              variant="ghost" 
              size="iconSm" 
              className="text-foreground hover:bg-muted"
              onClick={onSavedClick}
            >
              <Bookmark size={22} strokeWidth={1.5} />
            </Button>
          )}
          
          {/* User Avatar */}
          <button 
            onClick={onAvatarClick}
            className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full relative"
          >
            {user ? (
              <div className="story-ring">
                <div className="story-ring-inner">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user?.user_metadata?.avatar_url} alt="User avatar" />
                    <AvatarFallback className="bg-secondary text-foreground text-xs font-semibold">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
            ) : (
              <Avatar className="h-8 w-8 border border-border">
                <AvatarFallback className="bg-secondary text-muted-foreground">
                  <User size={16} />
                </AvatarFallback>
              </Avatar>
            )}
            {/* Pro Badge */}
            {user && isPro && (
              <div className="absolute -bottom-0.5 -right-0.5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-0.5">
                <Crown size={10} className="text-white" />
              </div>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
