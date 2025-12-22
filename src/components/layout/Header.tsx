import { Share2, Bell, User } from 'lucide-react';
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
}

export const Header = ({ 
  title, 
  showBack, 
  showShare, 
  showNotification,
  showLanguageSwitcher = true,
  onBack,
  onShare,
  onAvatarClick 
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
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border">
      <div className="flex items-center justify-between px-4 py-2 max-w-md mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <img 
            src={logoImage} 
            alt="TryOn Logo" 
            className="w-9 h-9 object-contain"
          />
          <span className="font-display font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            TryOn
          </span>
        </div>
        
        {/* Right actions */}
        <div className="flex items-center gap-1">
          {showLanguageSwitcher && <LanguageSwitcher />}
          {showNotification && (
            <Button variant="ghost" size="iconSm">
              <Bell size={18} />
            </Button>
          )}
          {showShare && (
            <Button variant="ghost" size="iconSm" onClick={onShare}>
              <Share2 size={18} />
            </Button>
          )}
          
          {/* User Avatar */}
          <button 
            onClick={onAvatarClick}
            className="ml-1 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full"
          >
            <Avatar className="h-8 w-8 border-2 border-primary/20 hover:border-primary/50 transition-colors">
              <AvatarImage src={user?.user_metadata?.avatar_url} alt="User avatar" />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                {user ? getInitials() : <User size={16} />}
              </AvatarFallback>
            </Avatar>
          </button>
        </div>
      </div>
    </header>
  );
};
