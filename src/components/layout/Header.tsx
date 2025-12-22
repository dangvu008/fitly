import { Bell, User, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import logoImage from '@/assets/logo.png';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  showShare?: boolean;
  showNotification?: boolean;
  showLanguageSwitcher?: boolean;
  onBack?: () => void;
  onShare?: () => void;
  onAvatarClick?: () => void;
  onSavedClick?: () => void;
}

export const Header = ({ 
  title, 
  showBack, 
  showShare, 
  showNotification,
  showLanguageSwitcher = true,
  onBack,
  onShare,
  onAvatarClick,
  onSavedClick,
}: HeaderProps) => {
  const { user } = useAuth();

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
        {/* Logo - Instagram style */}
        <div className="flex items-center gap-2.5">
          <img 
            src={logoImage} 
            alt="TryOn Logo" 
            className="w-8 h-8 object-contain"
          />
          <span className="font-display font-bold text-xl text-foreground">
            TryOn
          </span>
        </div>
        
        {/* Right actions */}
        <div className="flex items-center gap-1">
          {showLanguageSwitcher && <LanguageSwitcher />}
          {showNotification && (
            <>
              <Button 
                variant="ghost" 
                size="iconSm" 
                className="text-foreground"
                onClick={onSavedClick}
              >
                <Bookmark size={22} strokeWidth={1.5} />
              </Button>
              <Button variant="ghost" size="iconSm" className="text-foreground">
                <Bell size={22} strokeWidth={1.5} />
              </Button>
            </>
          )}
          
          {/* User Avatar - Instagram style with story ring for logged in users */}
          <button 
            onClick={onAvatarClick}
            className="ml-1 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full"
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
          </button>
        </div>
      </div>
    </header>
  );
};
