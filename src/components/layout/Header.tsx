import { ArrowLeft, Share2, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  showShare?: boolean;
  showNotification?: boolean;
  onBack?: () => void;
  onShare?: () => void;
}

export const Header = ({ 
  title, 
  showBack, 
  showShare, 
  showNotification,
  onBack,
  onShare 
}: HeaderProps) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border">
      <div className="flex items-center justify-between px-4 py-3 max-w-md mx-auto">
        <div className="w-10">
          {showBack && (
            <Button variant="ghost" size="iconSm" onClick={onBack}>
              <ArrowLeft size={20} />
            </Button>
          )}
        </div>
        
        <h1 className="font-display font-bold text-lg text-foreground">
          {title}
        </h1>
        
        <div className="flex items-center gap-1 w-10 justify-end">
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
        </div>
      </div>
    </header>
  );
};
