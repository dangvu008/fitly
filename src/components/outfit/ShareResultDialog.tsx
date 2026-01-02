import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Facebook,
  Twitter,
  MessageCircle,
  Link2,
  Download,
  Check,
  Share2,
  Mail,
  Copy,
  Globe,
  Image,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface ShareResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  title?: string;
  onShareToFeed?: () => void;
}

export const ShareResultDialog = ({
  open,
  onOpenChange,
  imageUrl,
  title = 'Outfit thử đồ AI',
  onShareToFeed,
}: ShareResultDialogProps) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [sharingImage, setSharingImage] = useState(false);

  // Generate a temporary share URL (in production, this would be a real shareable link)
  const shareUrl = window.location.href;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedText = encodeURIComponent(`Xem outfit "${title}" của tôi! 👗✨`);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Đã sao chép link!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Không thể sao chép link');
    }
  };

  const handleDownloadImage = async () => {
    setDownloading(true);
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `outfit-tryon-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Đã tải ảnh về máy!');
    } catch {
      toast.error('Không thể tải ảnh');
    } finally {
      setDownloading(false);
    }
  };

  // Share image directly using Web Share API (if supported)
  const handleShareImage = async () => {
    if (!navigator.share) {
      // Fallback to download
      handleDownloadImage();
      return;
    }

    setSharingImage(true);
    try {
      // Fetch image and convert to blob
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'outfit-tryon.png', { type: 'image/png' });

      await navigator.share({
        title: title,
        text: `Xem outfit "${title}" của tôi! 👗✨`,
        files: [file],
      });
      toast.success('Đã chia sẻ thành công!');
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        // If file sharing not supported, try sharing URL only
        try {
          await navigator.share({
            title: title,
            text: `Xem outfit "${title}" của tôi! 👗✨`,
            url: shareUrl,
          });
        } catch {
          handleDownloadImage();
        }
      }
    } finally {
      setSharingImage(false);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `Xem outfit "${title}" của tôi! 👗✨`,
          url: shareUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  const socialOptions = [
    {
      id: 'facebook',
      label: 'Facebook',
      icon: <Facebook size={18} />,
      color: 'bg-social-facebook',
      onClick: () => {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
          '_blank',
          'width=600,height=400'
        );
      },
    },
    {
      id: 'messenger',
      label: 'Messenger',
      icon: <MessageCircle size={18} />,
      color: 'bg-gradient-to-r from-social-messenger to-social-facebook',
      onClick: () => {
        window.open(
          `https://www.facebook.com/dialog/send?link=${encodedUrl}&app_id=291494419107518&redirect_uri=${encodedUrl}`,
          '_blank',
          'width=600,height=400'
        );
      },
    },
    {
      id: 'zalo',
      label: 'Zalo',
      icon: (
        <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 17.703c-.063.063-.188.125-.375.125H6.856c-.375 0-.563-.25-.563-.563V6.734c0-.375.25-.563.563-.563h10.663c.188 0 .313.063.375.125.063.063.106.188.106.313v10.781c0 .125-.063.25-.106.313z" />
        </svg>
      ),
      color: 'bg-social-zalo',
      onClick: () => {
        window.open(`https://zalo.me/share?url=${encodedUrl}`, '_blank', 'width=600,height=400');
      },
    },
    {
      id: 'twitter',
      label: 'Twitter',
      icon: <Twitter size={18} />,
      color: 'bg-social-twitter',
      onClick: () => {
        window.open(
          `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
          '_blank',
          'width=600,height=400'
        );
      },
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto bg-card p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <Share2 size={20} className="text-primary" />
            Chia sẻ kết quả
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* Preview */}
          <div className="aspect-[3/4] max-h-48 rounded-xl overflow-hidden bg-muted mx-auto">
            <img src={imageUrl} alt={title} className="w-full h-full object-contain" />
          </div>

          {/* Quick share actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="gap-2 h-12"
              onClick={handleShareImage}
              disabled={sharingImage}
            >
              {sharingImage ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Image size={18} />
              )}
              Chia sẻ ảnh
            </Button>
            <Button
              variant="outline"
              className="gap-2 h-12"
              onClick={handleDownloadImage}
              disabled={downloading}
            >
              {downloading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Download size={18} />
              )}
              Tải về
            </Button>
          </div>

          {/* Social share */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Chia sẻ qua</p>
            <div className="flex gap-2">
              {socialOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={option.onClick}
                  className={cn(
                    'flex-1 flex flex-col items-center justify-center p-2.5 rounded-xl text-white transition-all hover:opacity-90 active:scale-95',
                    option.color
                  )}
                >
                  {option.icon}
                  <span className="text-[10px] mt-1">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Copy link */}
          <div className="flex gap-2">
            <Input
              value={shareUrl}
              readOnly
              className="text-xs bg-muted border-0 flex-1"
            />
            <Button
              size="icon"
              variant={copied ? 'default' : 'outline'}
              onClick={handleCopyLink}
              className="flex-shrink-0"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </Button>
          </div>

          {/* Post to feed option */}
          {onShareToFeed && (
            <div className="pt-2 border-t border-border">
              <Button
                className="w-full gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                onClick={() => {
                  onOpenChange(false);
                  onShareToFeed();
                }}
              >
                <Globe size={18} />
                Đăng lên cộng đồng
              </Button>
              <p className="text-[10px] text-muted-foreground text-center mt-1.5">
                Chia sẻ outfit với mọi người trên TryOn
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
