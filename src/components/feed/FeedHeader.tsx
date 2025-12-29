import { useNavigate } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { FitlyLogo } from '@/components/ui/FitlyLogo';

/**
 * FeedHeader - Header component for Community Feed page
 * 
 * Displays:
 * - Fitly Logo
 * - Saved button (navigates to SavedOutfitsPage)
 * - User avatar (navigates to ProfilePage)
 * 
 * Requirements: 1.1
 */
export const FeedHeader = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useUserProfile();

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="flex items-center justify-between px-4 h-14">
        <FitlyLogo size="sm" />
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/saved')}
            className="h-9 w-9"
          >
            <Bookmark size={20} />
          </Button>
          
          <button
            onClick={() => navigate(user ? '/profile' : '/auth')}
            className="hover:opacity-80 transition-opacity"
          >
            <Avatar className="w-8 h-8 ring-2 ring-primary/20">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-xs">
                {profile?.display_name?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </button>
        </div>
      </div>
    </header>
  );
};
