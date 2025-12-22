import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
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
  Copy
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ShareOutfitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  title: string;
  shareUrl?: string;
}

interface ShareOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
}

export const ShareOutfitDialog = ({ 
  open, 
  onOpenChange, 
  imageUrl, 
  title,
  shareUrl 
}: ShareOutfitDialogProps) => {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  
  const currentUrl = shareUrl || window.location.href;
  const encodedUrl = encodeURIComponent(currentUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedText = encodeURIComponent(`Xem outfit \"${title}\" của tôi!`);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      toast.success('Đã sao chép link!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
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
      link.download = `outfit-${title.replace(/\s+/g, '-').toLowerCase()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Đã tải ảnh về máy!');
    } catch (error) {
      toast.error('Không thể tải ảnh');
    } finally {
      setDownloading(false);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `Xem outfit \"${title}\" của tôi!`,
          url: currentUrl,
        });
        toast.success('Đã chia sẻ thành công!');
      } catch (error) {
        // User cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  const socialOptions: ShareOption[] = [
    {
      id: 'facebook',
      label: 'Facebook',
      icon: <Facebook size={20} />,
      color: 'bg-[#1877F2] hover:bg-[#1877F2]/90',
      onClick: () => {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
          '_blank',
          'width=600,height=400'
        );
      },
    },
    {
      id: 'twitter',
      label: 'Twitter',
      icon: <Twitter size={20} />,
      color: 'bg-[#1DA1F2] hover:bg-[#1DA1F2]/90',
      onClick: () => {
        window.open(
          `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
          '_blank',
          'width=600,height=400'
        );
      },
    },
    {
      id: 'messenger',
      label: 'Messenger',
      icon: <MessageCircle size={20} />,
      color: 'bg-gradient-to-r from-[#00B2FF] to-[#006AFF] hover:opacity-90',
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
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 17.703c-.063.063-.188.125-.375.125H6.856c-.375 0-.563-.25-.563-.563V6.734c0-.375.25-.563.563-.563h10.663c.188 0 .313.063.375.125.063.063.106.188.106.313v10.781c0 .125-.063.25-.106.313z"/>
        </svg>
      ),
      color: 'bg-[#0068FF] hover:bg-[#0068FF]/90',
      onClick: () => {
        window.open(
          `https://zalo.me/share?url=${encodedUrl}`,
          '_blank',
          'width=600,height=400'
        );
      },
    },
    {
      id: 'email',
      label: 'Email',
      icon: <Mail size={20} />,
      color: 'bg-muted hover:bg-muted/80 text-foreground',
      onClick: () => {
        window.location.href = `mailto:?subject=${encodedTitle}&body=${encodedText}%0A${encodedUrl}`;
      },
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto bg-card">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <Share2 size={20} className="text-primary" />
            Chia sẻ outfit
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Preview */}
          <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
            <div className="w-16 h-20 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
              <img 
                src={imageUrl} 
                alt={title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{title}</p>
              <p className="text-xs text-muted-foreground">Outfit thử đồ AI</p>
            </div>
          </div>

          {/* Social share buttons */}
          <div>
            <p className="text-sm text-muted-foreground mb-3">Chia sẻ qua mạng xã hội</p>
            <div className="grid grid-cols-5 gap-2">
              {socialOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={option.onClick}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-xl text-white transition-all",
                    option.color
                  )}
                >
                  {option.icon}
                  <span className="text-[10px] mt-1 font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Copy link */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Hoặc sao chép link</p>
            <div className="flex gap-2">
              <Input 
                value={currentUrl}
                readOnly
                className="text-xs bg-secondary border-0"
              />
              <Button
                size="icon"
                variant={copied ? "default" : "outline"}
                onClick={handleCopyLink}
                className="flex-shrink-0"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </Button>
            </div>
          </div>

          {/* Other actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleDownloadImage}
              disabled={downloading}
            >
              <Download size={16} />
              {downloading ? 'Đang tải...' : 'Tải ảnh'}
            </Button>
            
            {navigator.share && (
              <Button
                variant="default"
                className="gap-2"
                onClick={handleNativeShare}
              >
                <Share2 size={16} />
                Chia sẻ khác
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
