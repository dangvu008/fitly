import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Upload,
  Loader2,
  Globe,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Link2,
  Pencil,
  ShoppingBag,
  X,
  Ruler,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useSharedOutfits } from '@/hooks/useSharedOutfits';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

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
  inspiredByOutfitId?: string | null;
}

export const ShareToPublicDialog = ({
  open,
  onOpenChange,
  resultImageUrl,
  clothingItems: initialClothingItems,
  onSuccess,
  inspiredByOutfitId,
}: ShareToPublicDialogProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [isSharing, setIsSharing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [itemsExpanded, setItemsExpanded] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [clothingItems, setClothingItems] = useState<ClothingItemData[]>([]);
  const { shareOutfit } = useSharedOutfits();

  // Size options for StyleHint feature
  const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  // Initialize clothing items when dialog opens
  useEffect(() => {
    if (open) {
      setClothingItems(initialClothingItems.map(item => ({ ...item })));
    }
  }, [open, initialClothingItems]);

  const handleItemChange = (index: number, field: keyof ClothingItemData, value: string) => {
    setClothingItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveItem = (index: number) => {
    setClothingItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleShare = async () => {
    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề');
      return;
    }

    console.log('Starting share with:', {
      title: title.trim(),
      resultImageUrl,
      clothingItems: clothingItems.filter(item => item.name.trim()),
      description: description.trim() || undefined,
    });

    setIsSharing(true);
    const success = await shareOutfit(
      title.trim(),
      resultImageUrl,
      clothingItems.filter(item => item.name.trim()), // Only include items with names
      description.trim() || undefined,
      inspiredByOutfitId
    );
    setIsSharing(false);

    console.log('Share result:', success);

    if (success) {
      setIsSuccess(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setIsSuccess(false);
    setItemsExpanded(false);
    setEditingItemIndex(null);
    onOpenChange(false);
  };

  const handleViewOnFeed = () => {
    handleClose();
    onSuccess?.();
    navigate('/');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-auto bg-card max-h-[90vh] overflow-y-auto">
        {isSuccess ? (
          <div className="py-6 text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-foreground">{t('share_success')}</h3>
              <p className="text-sm text-muted-foreground">{t('share_success_desc')}</p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={handleClose}>
                {t('close')}
              </Button>
              <Button className="flex-1 gap-2" onClick={handleViewOnFeed}>
                <Sparkles size={16} />
                {t('share_view_on_feed')}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Globe size={20} className="text-primary" />
                {t('share_post_to_feed')}
              </DialogTitle>
              <DialogDescription>{t('share_post_desc')}</DialogDescription>
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
                    {t('feed_items_count').replace('{count}', String(clothingItems.length))}
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
                <Label htmlFor="title">{t('share_outfit_title')}</Label>
                <Input
                  id="title"
                  placeholder={t('share_outfit_title_placeholder')}
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  maxLength={100}
                />
                <p className="text-[10px] text-muted-foreground text-right">{title.length}/100</p>
              </div>

              {/* Description input */}
              <div className="space-y-2">
                <Label htmlFor="description">{t('share_description')}</Label>
                <Textarea
                  id="description"
                  placeholder={t('share_description_placeholder')}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  maxLength={500}
                  rows={2}
                  className="resize-none"
                />
                <p className="text-[10px] text-muted-foreground text-right">
                  {description.length}/500
                </p>
              </div>

              {/* Size selector - StyleHint feature */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Ruler size={14} className="text-primary" />
                  Kích cỡ bạn đang mặc
                </Label>
                <div className="flex flex-wrap gap-2">
                  {sizeOptions.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(selectedSize === size ? '' : size)}
                      className={cn(
                        'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                        'border-2',
                        selectedSize === size
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/50 hover:bg-muted/50'
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  💡 Giúp người khác biết bạn đang mặc size gì (tùy chọn)
                </p>
              </div>

              {/* Clothing items editor */}
              <Collapsible open={itemsExpanded} onOpenChange={setItemsExpanded}>
                <CollapsibleTrigger asChild>
                  <button className="w-full flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                    <div className="flex items-center gap-2">
                      <ShoppingBag size={16} className="text-primary" />
                      <span className="text-sm font-medium">
                        Chỉnh sửa thông tin món đồ ({clothingItems.length})
                      </span>
                    </div>
                    {itemsExpanded ? (
                      <ChevronUp size={16} className="text-muted-foreground" />
                    ) : (
                      <ChevronDown size={16} className="text-muted-foreground" />
                    )}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3 space-y-3">
                  {clothingItems.map((item, index) => (
                    <div
                      key={index}
                      className={cn(
                        'p-3 rounded-lg border transition-all',
                        editingItemIndex === index
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-muted/30'
                      )}
                    >
                      <div className="flex gap-3">
                        {/* Item image */}
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Item info */}
                        <div className="flex-1 min-w-0 space-y-2">
                          {editingItemIndex === index ? (
                            <>
                              <Input
                                value={item.name}
                                onChange={e => handleItemChange(index, 'name', e.target.value)}
                                placeholder="Tên món đồ"
                                className="h-8 text-sm"
                              />
                              <div className="flex items-center gap-1">
                                <Link2 size={12} className="text-muted-foreground flex-shrink-0" />
                                <Input
                                  value={item.purchaseUrl || ''}
                                  onChange={e =>
                                    handleItemChange(index, 'purchaseUrl', e.target.value)
                                  }
                                  placeholder="Link mua hàng (tuỳ chọn)"
                                  className="h-8 text-xs"
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              <p className="text-sm font-medium truncate">{item.name}</p>
                              {item.purchaseUrl ? (
                                <p className="text-xs text-primary truncate flex items-center gap-1">
                                  <Link2 size={10} />
                                  {item.purchaseUrl}
                                </p>
                              ) : (
                                <p className="text-xs text-muted-foreground">Chưa có link mua</p>
                              )}
                            </>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() =>
                              setEditingItemIndex(editingItemIndex === index ? null : index)
                            }
                            className={cn(
                              'p-1.5 rounded-md transition-colors',
                              editingItemIndex === index
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-muted'
                            )}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {clothingItems.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Không có món đồ nào
                    </p>
                  )}

                  <p className="text-[10px] text-muted-foreground">
                    💡 Thêm link mua hàng để người khác có thể mua được món đồ giống bạn
                  </p>
                </CollapsibleContent>
              </Collapsible>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={handleClose} disabled={isSharing}>
                  {t('cancel')}
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={handleShare}
                  disabled={!title.trim() || isSharing}
                >
                  {isSharing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {t('share_posting')}
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      {t('share_post_outfit')}
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
