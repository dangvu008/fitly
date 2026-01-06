import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Camera, Share2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/**
 * FloatingCreateButton - Floating action button for creating new posts
 * 
 * Positioned at bottom-right corner.
 * Opens menu with options:
 * - Create new try-on
 * - Share existing outfit
 * - Add StyleHint (new)
 * 
 * Features:
 * - Pulse animation to attract attention
 * - Tooltip on hover
 * - Smooth rotation animation when open
 * 
 * Requirements: 6.1, 6.2, StyleHint
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

  const handleAddStyleHint = () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để thêm gợi ý phong cách');
      navigate('/auth');
      return;
    }
    // Navigate to try-on with intent to share
    navigate('/try-on?intent=stylehint');
    setOpen(false);
  };

  return (
    <div className="fixed bottom-20 right-4 z-50">
      <TooltipProvider>
        <Tooltip>
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  className={cn(
                    "h-14 w-14 rounded-full shadow-lg",
                    "bg-gradient-to-br from-primary to-accent",
                    "hover:from-primary/90 hover:to-accent/90",
                    "transition-all duration-300",
                    // Pulse animation when closed
                    !open && "animate-pulse-subtle"
                  )}
                >
                  <Plus
                    size={24}
                    className={cn(
                      "transition-transform duration-300",
                      open && "rotate-45"
                    )}
                  />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            {!open && (
              <TooltipContent side="left" className="bg-card">
                <p className="text-sm font-medium">Thêm gợi ý phong cách</p>
              </TooltipContent>
            )}
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={handleAddStyleHint} className="gap-3 cursor-pointer py-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles size={16} className="text-primary" />
                </div>
                <div>
                  <p className="font-medium">Thêm gợi ý phong cách</p>
                  <p className="text-xs text-muted-foreground">Chia sẻ outfit của bạn</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleCreateTryOn} className="gap-3 cursor-pointer py-3">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                  <Camera size={16} className="text-foreground" />
                </div>
                <div>
                  <p className="font-medium">Tạo outfit mới</p>
                  <p className="text-xs text-muted-foreground">Thử đồ với AI</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShareOutfit} className="gap-3 cursor-pointer py-3">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                  <Share2 size={16} className="text-foreground" />
                </div>
                <div>
                  <p className="font-medium">Chia sẻ từ lịch sử</p>
                  <p className="text-xs text-muted-foreground">Chọn outfit đã thử</p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
