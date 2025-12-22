import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LogIn, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

interface LoginRequiredDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export const LoginRequiredDialog = ({ 
  isOpen, 
  onClose, 
  title, 
  description 
}: LoginRequiredDialogProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleLogin = () => {
    onClose();
    navigate('/auth');
  };

  const handleSignup = () => {
    onClose();
    navigate('/auth?mode=signup');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <LogIn className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-xl">
            {title || t('login_required_title')}
          </DialogTitle>
          <DialogDescription className="text-center">
            {description || t('login_required_desc')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-4">
          <Button onClick={handleLogin} className="w-full" size="lg">
            <LogIn className="w-4 h-4 mr-2" />
            {t('login')}
          </Button>
          <Button onClick={handleSignup} variant="outline" className="w-full" size="lg">
            <UserPlus className="w-4 h-4 mr-2" />
            {t('signup')}
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          {t('login_required_benefits')}
        </p>
      </DialogContent>
    </Dialog>
  );
};
