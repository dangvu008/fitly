import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, Loader2, Globe, CheckCircle2, Sparkles } from 'lucide-react';
import { useSharedOutfits } from '@/hooks/useSharedOutfits';
import confetti from 'canvas-confetti';

interface ClothingItemData {
  id?: string;
  name: string;
  imageUrl: string;
  category?: string;
  purchaseUrl?: string;
}

interface ShareToPublicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resultImageUrl: string;
  clothingItems: ClothingItemData[];
  onSuccess?: () => void;
}

export const ShareToPublicDialog = ({ 
  open, 
  onOpenChange, 
  resultImageUrl, 
  clothingItems,
  onSuccess 
}: ShareToPublicDialogProps) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { shareOutfit } = useSharedOutfits();

  const handleShare = async () => {
    if (!title.trim()) {
      return;
    }

    setIsSharing(true);
    const success = await shareOutfit(
      title.trim(),
      resultImageUrl,
      clothingItems,
      description.trim() || undefined
    );
    setIsSharing(false);

    if (success) {
      setIsSuccess(true);
      
      // Fire confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setIsSuccess(false);
    onOpenChange(false);
  };

  const handleViewOnFeed = () => {
    handleClose();
    onSuccess?.();
    navigate('/');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm mx-auto bg-card">
        {isSuccess ? (
          <div className="py-6 text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-foreground">Đăng thành công! 🎉</h3>
              <p className="text-sm text-muted-foreground">
                Outfit của bạn đã được chia sẻ lên cộng đồng
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleClose}
              >
                Đóng
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={handleViewOnFeed}
              >
                <Sparkles size={16} />
                Xem trên Feed
              </Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Globe size={20} className="text-primary" />
                Đăng outfit lên Feed
              </DialogTitle>
              <DialogDescription>
                Outfit của bạn sẽ được hiển thị trên trang chủ cho mọi người xem và tương tác
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Preview */}
              <div className="flex gap-3 p-3 bg-secondary/50 rounded-xl">
                <div className="w-20 h-24 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                  <img 
                    src={resultImageUrl} 
                    alt="Outfit preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {clothingItems.length} món đồ
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {clothingItems.slice(0, 3).map((item, idx) => (
                      <span 
                        key={idx}
                        className="text-[10px] px-1.5 py-0.5 bg-secondary rounded-full text-muted-foreground"
                      >
                        {item.name}
                      </span>
                    ))}
                    {clothingItems.length > 3 && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-secondary rounded-full text-muted-foreground">
                        +{clothingItems.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Title input */}
              <div className="space-y-2">
                <Label htmlFor="title">Tiêu đề outfit *</Label>
                <Input
                  id="title"
                  placeholder="Ví dụ: Outfit đi làm mùa hè"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                />
                <p className="text-[10px] text-muted-foreground text-right">
                  {title.length}/100
                </p>
              </div>

              {/* Description input */}
              <div className="space-y-2">
                <Label htmlFor="description">Mô tả (tùy chọn)</Label>
                <Textarea
                  id="description"
                  placeholder="Chia sẻ cảm nghĩ về outfit này..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                  rows={3}
                  className="resize-none"
                />
                <p className="text-[10px] text-muted-foreground text-right">
                  {description.length}/500
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleClose}
                  disabled={isSharing}
                >
                  Hủy
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={handleShare}
                  disabled={!title.trim() || isSharing}
                >
                  {isSharing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Đang đăng...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Đăng outfit
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
