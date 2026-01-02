import { useState, useRef } from 'react';
import { Link2, Image, Camera, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { detectShoppingPlatform } from '@/hooks/useClipboardDetection';
import { toast } from 'sonner';

interface QuickTrySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLinkSubmit: (url: string) => void;
  onImageSelected: (imageDataUrl: string) => void;
  isProcessing?: boolean;
}

type TabId = 'link' | 'gallery' | 'camera';

/**
 * Bottom sheet for Quick Try feature
 * Allows user to paste link, select from gallery, or take photo
 * 
 * @requirements REQ-4.2, REQ-4.3
 */
export function QuickTrySheet({
  open,
  onOpenChange,
  onLinkSubmit,
  onImageSelected,
  isProcessing = false,
}: QuickTrySheetProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabId>('link');
  const [linkInput, setLinkInput] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tabs: { id: TabId; icon: typeof Link2; label: string }[] = [
    { id: 'link', icon: Link2, label: t('quick_try_tab_link') || 'Paste Link' },
    { id: 'gallery', icon: Image, label: t('quick_try_tab_gallery') || 'From Gallery' },
    { id: 'camera', icon: Camera, label: t('quick_try_tab_camera') || 'Take Photo' },
  ];

  const handleLinkSubmit = () => {
    if (!linkInput.trim()) {
      setLinkError('Please enter a URL');
      return;
    }

    // Validate URL
    try {
      new URL(linkInput);
    } catch {
      setLinkError('Invalid URL format');
      return;
    }

    // Check if it's a supported shopping link
    const platform = detectShoppingPlatform(linkInput);
    if (!platform) {
      setLinkError(t('crawl_unsupported') || 'This platform is not supported yet');
      return;
    }

    setLinkError(null);
    onLinkSubmit(linkInput);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image too large. Max 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onImageSelected(dataUrl);
    };
    reader.readAsDataURL(file);

    // Reset input
    e.target.value = '';
  };

  const handleCameraCapture = () => {
    // Trigger file input with camera capture
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

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-fade-in"
        onClick={() => onOpenChange(false)}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
        <div className="bg-card border-t border-border rounded-t-3xl shadow-lg max-w-lg mx-auto">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full bg-muted" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-3">
            <h3 className="text-lg font-semibold text-foreground">
              {t('try_now') || 'Quick Try'}
            </h3>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 rounded-full hover:bg-muted transition-colors"
            >
              <X size={20} className="text-muted-foreground" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-4 pb-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  <Icon size={16} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="px-4 pb-6">
            {activeTab === 'link' && (
              <div className="space-y-3">
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
                      'h-12',
                      linkError && 'border-destructive focus-visible:ring-destructive'
                    )}
                    disabled={isProcessing}
                  />
                  {linkError && (
                    <p className="text-xs text-destructive">{linkError}</p>
                  )}
                </div>
                <Button
                  variant="instagram"
                  className="w-full h-11"
                  onClick={handleLinkSubmit}
                  disabled={isProcessing || !linkInput.trim()}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      {t('loading') || 'Loading...'}
                    </>
                  ) : (
                    <>
                      <Link2 size={18} />
                      {t('try_now') || 'Try Now'}
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Supports: Shopee, Lazada, Zara, Amazon, TikTok Shop, H&M, Uniqlo
                </p>
              </div>
            )}

            {activeTab === 'gallery' && (
              <div className="space-y-3">
                <button
                  onClick={handleGallerySelect}
                  disabled={isProcessing}
                  className="w-full aspect-video rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/30 flex flex-col items-center justify-center gap-3 hover:border-primary/50 hover:bg-primary/5 transition-all disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Loader2 size={32} className="text-primary animate-spin" />
                  ) : (
                    <>
                      <Image size={32} className="text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {t('quick_try_tab_gallery') || 'Select from Gallery'}
                      </span>
                    </>
                  )}
                </button>
                <p className="text-xs text-muted-foreground text-center">
                  Select a screenshot or photo of clothing to try on
                </p>
              </div>
            )}

            {activeTab === 'camera' && (
              <div className="space-y-3">
                <button
                  onClick={handleCameraCapture}
                  disabled={isProcessing}
                  className="w-full aspect-video rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/30 flex flex-col items-center justify-center gap-3 hover:border-primary/50 hover:bg-primary/5 transition-all disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Loader2 size={32} className="text-primary animate-spin" />
                  ) : (
                    <>
                      <Camera size={32} className="text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {t('quick_try_tab_camera') || 'Take Photo'}
                      </span>
                    </>
                  )}
                </button>
                <p className="text-xs text-muted-foreground text-center">
                  Take a photo of clothing item to try on
                </p>
              </div>
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
        </div>
      </div>
    </>
  );
}

export default QuickTrySheet;
