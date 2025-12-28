import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Camera, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

/**
 * FloatingCreateButton - Floating action button for creating new posts
 * 
 * Positioned at bottom-right corner.
 * Opens menu with options:
 * - Create new try-on
 * - Share existing outfit
 * 
 * Requirements: 6.1, 6.2
 */
export const FloatingCreateButton = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const handleCreateTryOn = () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để tạo outfit');
      navigate('/auth');
      return;
    }
    navigate('/try-on');
    setOpen(false);
  };

  const handleShareOutfit = () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để chia sẻ outfit');
      navigate('/auth');
      return;
    }
    // Navigate to history to select an outfit to share
    navigate('/history');
    setOpen(false);
  };

  return (
    <div className="fixed bottom-20 right-4 z-50">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
          >
            <Plus size={24} className={`transition-transform ${open ? 'rotate-45' : ''}`} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleCreateTryOn} className="gap-2 cursor-pointer">
            <Camera size={16} />
            Tạo outfit mới
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleShareOutfit} className="gap-2 cursor-pointer">
            <Share2 size={16} />
            Chia sẻ từ lịch sử
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
