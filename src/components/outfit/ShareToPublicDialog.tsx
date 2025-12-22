import { useState } from 'react';
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
import { Upload, Loader2, Globe } from 'lucide-react';
import { useSharedOutfits } from '@/hooks/useSharedOutfits';

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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSharing, setIsSharing] = useState(false);
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
      setTitle('');
      setDescription('');
      onOpenChange(false);
      onSuccess?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe size={20} className="text-primary" />
            Chia sẻ outfit công khai
          </DialogTitle>
          <DialogDescription>
            Outfit của bạn sẽ được hiển thị trên trang chủ cho mọi người xem
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
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
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
                  Đang chia sẻ...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Chia sẻ
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
