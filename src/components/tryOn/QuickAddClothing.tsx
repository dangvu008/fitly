import { useState, useRef } from 'react';
import { Link2, Image, Camera, Loader2, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { detectShoppingPlatform } from '@/hooks/useClipboardDetection';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface QuickAddClothingProps {
  onImageSelected: (imageDataUrl: string, name?: string) => void;
  isProcessing?: boolean;
  className?: string;
}

type TabId = 'link' | 'gallery' | 'camera';

/**
 * Quick Add Clothing - Inline component for adding clothing via link or upload
 * Integrated into TryOnDialog for seamless experience
 */
export function QuickAddClothing({
  onImageSelected,
  isProcessing = false,
  className,
}: QuickAddClothingProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('link');
  const [linkInput, setLinkInput] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);
  const [isCrawling, setIsCrawling] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tabs: { id: TabId; icon: typeof Link2; label: string }[] = [
    { id: 'link', icon: Link2, label: 'Link' },
    { id: 'gallery', icon: Image, label: 'Gallery' },
    { id: 'camera', icon: Camera, label: 'Camera' },
  ];

  const handleLinkSubmit = async () => {
    if (!linkInput.trim()) {
      setLinkError('Vui lòng nhập URL');
      return;
    }

    // Validate URL
    try {
      new URL(linkInput);
    } catch {
      setLinkError('URL không hợp lệ');
      return;
    }

    // Check if it's a supported shopping link
    const platform = detectShoppingPlatform(linkInput);
    if (!platform) {
      setLinkError(t('crawl_unsupported') || 'Nền tảng này chưa được hỗ trợ');
      return;
    }

    setLinkError(null);
    setIsCrawling(true);

    try {
      const { data, error } = await supabase.functions.invoke('crawl-product-image', {
        body: { url: linkInput, removeBackground: true },
      });

      if (error) throw error;

      if (data?.success && data?.productImage) {
        const imageUrl = data.backgroundRemovedImage || data.productImage;
        onImageSelected(imageUrl, data.productName || 'Quick Try Item');
        setLinkInput('');
        setIsOpen(false);
        toast.success('Đã thêm sản phẩm');
      } else {
        throw new Error(data?.error || 'Không thể lấy hình ảnh sản phẩm');
      }
    } catch (error: any) {
      console.error('Crawl error:', error);
      setLinkError(error.message || 'Không thể lấy hình ảnh sản phẩm');
    } finally {
      setIsCrawling(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Hình ảnh quá lớn. Tối đa 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onImageSelected(dataUrl, file.name.replace(/\.[^/.]+$/, ''));
      setIsOpen(false);
    };
    reader.readAsDataURL(file);

    // Reset input
    e.target.value = '';
  };

  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.click();
    }
  };

  const handleGallerySelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
  };

  const processing = isProcessing || isCrawling;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full",
            "bg-gradient-to-r from-primary to-accent text-white",
            "text-xs font-medium shadow-sm",
            "hover:opacity-90 active:scale-95 transition-all",
            className
          )}
        >
          <Plus size={14} />
          <span>Thử nhanh</span>
        </button>
      </PopoverTrigger>
      
      <PopoverContent 
        side="top" 
        align="center"
        className="w-80 p-0 z-[60]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <h4 className="text-sm font-semibold">Thêm đồ nhanh</h4>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-full hover:bg-muted transition-colors"
          >
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-2 border-b border-border">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-3">
          {activeTab === 'link' && (
            <div className="space-y-2">
              <Input
                type="url"
                placeholder="https://shopee.vn/product/..."
                value={linkInput}
                onChange={(e) => {
                  setLinkInput(e.target.value);
                  setLinkError(null);
                }}
                className={cn(
                  'h-9 text-sm',
                  linkError && 'border-destructive focus-visible:ring-destructive'
                )}
                disabled={processing}
              />
              {linkError && (
                <p className="text-[10px] text-destructive">{linkError}</p>
              )}
              <Button
                variant="instagram"
                size="sm"
                className="w-full h-8"
                onClick={handleLinkSubmit}
                disabled={processing || !linkInput.trim()}
              >
                {processing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Link2 size={14} />
                    Thử ngay
                  </>
                )}
              </Button>
              <p className="text-[9px] text-muted-foreground text-center">
                Shopee, Lazada, Zara, Amazon, TikTok Shop, H&M, Uniqlo
              </p>
            </div>
          )}

          {activeTab === 'gallery' && (
            <button
              onClick={handleGallerySelect}
              disabled={processing}
              className="w-full aspect-[2/1] rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30 flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all disabled:opacity-50"
            >
              {processing ? (
                <Loader2 size={24} className="text-primary animate-spin" />
              ) : (
                <>
                  <Image size={24} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Chọn từ thư viện
                  </span>
                </>
              )}
            </button>
          )}

          {activeTab === 'camera' && (
            <button
              onClick={handleCameraCapture}
              disabled={processing}
              className="w-full aspect-[2/1] rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30 flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all disabled:opacity-50"
            >
              {processing ? (
                <Loader2 size={24} className="text-primary animate-spin" />
              ) : (
                <>
                  <Camera size={24} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Chụp ảnh
                  </span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </PopoverContent>
    </Popover>
  );
}

export default QuickAddClothing;
