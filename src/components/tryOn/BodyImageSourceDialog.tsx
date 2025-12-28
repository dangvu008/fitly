import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Camera, History, Loader2, ImagePlus, Star, Check, Link, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface BodyImageRecord {
  id: string;
  body_image_url: string;
  created_at: string;
}

interface BodyImageSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadNew: () => void;
  onSelectFromHistory: (imageUrl: string) => void;
  defaultBodyImageUrl?: string | null;
  onSetDefault?: (imageUrl: string | null) => Promise<boolean>;
}

// Allowed image extensions
const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];

// Blocked domains (known malicious or untrusted)
const BLOCKED_DOMAINS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
];

// Validate URL format and safety
const validateImageUrl = (url: string): { valid: boolean; error?: string } => {
  // Check if URL is empty
  if (!url.trim()) {
    return { valid: false, error: 'url_required' };
  }

  // Check URL format
  try {
    const parsed = new URL(url);
    
    // Must be http or https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'url_invalid_protocol' };
    }

    // Check for blocked domains
    if (BLOCKED_DOMAINS.some(domain => parsed.hostname.includes(domain))) {
      return { valid: false, error: 'url_blocked_domain' };
    }

    // Check file extension if present
    const pathname = parsed.pathname.toLowerCase();
    const hasExtension = pathname.includes('.');
    if (hasExtension) {
      const extension = pathname.split('.').pop();
      if (extension && !ALLOWED_IMAGE_EXTENSIONS.includes(extension)) {
        return { valid: false, error: 'url_not_image' };
      }
    }

    return { valid: true };
  } catch (e) {
    return { valid: false, error: 'url_invalid_format' };
  }
};

// Fetch image and convert to base64
const fetchImageAsBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url, {
    headers: {
      'Accept': 'image/*',
    },
  });

  if (!response.ok) {
    throw new Error('fetch_failed');
  }

  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.startsWith('image/')) {
    throw new Error('not_image_content');
  }

  const blob = await response.blob();
  
  // Check file size (max 10MB)
  if (blob.size > 10 * 1024 * 1024) {
    throw new Error('file_too_large');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const BodyImageSourceDialog = ({
  open,
  onOpenChange,
  onUploadNew,
  onSelectFromHistory,
  defaultBodyImageUrl,
  onSetDefault,
}: BodyImageSourceDialogProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [historyImages, setHistoryImages] = useState<BodyImageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSettingDefault, setIsSettingDefault] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isValidatingUrl, setIsValidatingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    if (open && user) {
      fetchHistoryImages();
    }
    if (!open) {
      setShowUrlInput(false);
      setUrlInput('');
      setUrlError(null);
    }
  }, [open, user]);

  const fetchHistoryImages = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('try_on_history')
        .select('id, body_image_url, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Remove duplicates based on body_image_url
      const uniqueImages = data?.reduce((acc: BodyImageRecord[], current) => {
        const exists = acc.find(item => item.body_image_url === current.body_image_url);
        if (!exists) {
          acc.push(current);
        }
        return acc;
      }, []) || [];

      setHistoryImages(uniqueImages);
    } catch (error) {
      console.error('Error fetching history images:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadNew = () => {
    onOpenChange(false);
    onUploadNew();
  };

  const handleSelectImage = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  const handleConfirmSelection = () => {
    if (selectedImage) {
      onSelectFromHistory(selectedImage);
      onOpenChange(false);
      setSelectedImage(null);
    }
  };

  const handleSetDefault = async () => {
    if (!selectedImage || !onSetDefault) return;
    
    setIsSettingDefault(true);
    const success = await onSetDefault(selectedImage);
    setIsSettingDefault(false);
    
    if (success) {
      onSelectFromHistory(selectedImage);
      onOpenChange(false);
      setSelectedImage(null);
    }
  };

  const handleClearDefault = async () => {
    if (!onSetDefault) return;
    
    setIsSettingDefault(true);
    await onSetDefault(null);
    setIsSettingDefault(false);
  };

  const handleUrlSubmit = async () => {
    setUrlError(null);
    
    // Validate URL format
    const validation = validateImageUrl(urlInput);
    if (!validation.valid) {
      setUrlError(t(validation.error as any) || validation.error);
      return;
    }

    setIsValidatingUrl(true);

    try {
      // Fetch image and convert to base64
      const base64Image = await fetchImageAsBase64(urlInput);

      // Analyze image using edge function
      const { data, error } = await supabase.functions.invoke('analyze-body-image', {
        body: { imageBase64: base64Image },
      });

      if (error) {
        throw new Error('analysis_failed');
      }

      // Check if it's a valid body image
      if (!data.isPerson) {
        setUrlError(t('url_not_person'));
        return;
      }

      if (!data.isFullBody) {
        setUrlError(t('url_not_fullbody'));
        return;
      }

      if (data.quality === 'poor') {
        setUrlError(t('url_poor_quality') + ': ' + (data.issues?.join(', ') || ''));
        return;
      }

      // Success - use the image
      onSelectFromHistory(base64Image);
      onOpenChange(false);
      toast.success(t('url_image_loaded'));
      
    } catch (error: any) {
      console.error('URL validation error:', error);
      if (error.message === 'fetch_failed') {
        setUrlError(t('url_fetch_failed'));
      } else if (error.message === 'not_image_content') {
        setUrlError(t('url_not_image'));
      } else if (error.message === 'file_too_large') {
        setUrlError(t('url_file_too_large'));
      } else {
        setUrlError(t('url_validation_failed'));
      }
    } finally {
      setIsValidatingUrl(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-lg font-display">
            {t('body_image_source_title')}
          </DialogTitle>
        </DialogHeader>

        <div className="px-4 pb-2 space-y-2">
          <Button
            variant="outline"
            className="w-full h-14 justify-start gap-4"
            onClick={handleUploadNew}
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Camera size={20} className="text-primary" />
            </div>
            <div className="text-left">
              <p className="font-medium">{t('body_image_upload_new')}</p>
              <p className="text-xs text-muted-foreground">{t('body_image_upload_new_desc')}</p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full h-14 justify-start gap-4"
            onClick={() => setShowUrlInput(!showUrlInput)}
          >
            <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center">
              <Link size={20} className="text-secondary-foreground" />
            </div>
            <div className="text-left">
              <p className="font-medium">{t('body_image_from_url')}</p>
              <p className="text-xs text-muted-foreground">{t('body_image_from_url_desc')}</p>
            </div>
          </Button>

          {showUrlInput && (
            <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
              <div className="relative">
                <Input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={urlInput}
                  onChange={(e) => {
                    setUrlInput(e.target.value);
                    setUrlError(null);
                  }}
                  className={cn(urlError && "border-destructive")}
                />
              </div>
              {urlError && (
                <div className="flex items-start gap-2 text-destructive text-xs">
                  <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                  <span>{urlError}</span>
                </div>
              )}
              <Button
                size="sm"
                className="w-full"
                onClick={handleUrlSubmit}
                disabled={isValidatingUrl || !urlInput.trim()}
              >
                {isValidatingUrl ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    {t('url_validating')}
                  </>
                ) : (
                  t('url_load_image')
                )}
              </Button>
            </div>
          )}
        </div>

        {user && (
          <div className="flex-1 flex flex-col min-h-0 px-4 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <History size={16} className="text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {t('body_image_from_history')}
              </span>
            </div>

            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-primary" />
              </div>
            ) : historyImages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                  <ImagePlus size={28} className="text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('body_image_no_history')}
                </p>
              </div>
            ) : (
              <>
                <ScrollArea className="flex-1">
                  <div className="grid grid-cols-3 gap-2">
                    {historyImages.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSelectImage(item.body_image_url)}
                        className={cn(
                          "aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all relative",
                          selectedImage === item.body_image_url
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-transparent hover:border-primary/50"
                        )}
                      >
                        <img
                          src={item.body_image_url}
                          alt="Body"
                          className="w-full h-full object-cover"
                        />
                        {item.body_image_url === defaultBodyImageUrl && (
                          <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <Star size={12} className="text-primary-foreground fill-current" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </ScrollArea>

                {selectedImage && (
                  <div className="pt-3 border-t border-border mt-3 space-y-2">
                    <Button
                      className="w-full"
                      onClick={handleConfirmSelection}
                    >
                      {t('body_image_use_selected')}
                    </Button>
                    {onSetDefault && selectedImage !== defaultBodyImageUrl && (
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={handleSetDefault}
                        disabled={isSettingDefault}
                      >
                        {isSettingDefault ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Star size={16} />
                        )}
                        {t('body_image_set_default')}
                      </Button>
                    )}
                    {onSetDefault && selectedImage === defaultBodyImageUrl && (
                      <div className="flex items-center justify-center gap-2 text-sm text-primary">
                        <Check size={16} />
                        {t('body_image_is_default')}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {!user && (
          <div className="px-4 pb-4 text-center text-sm text-muted-foreground">
            {t('body_image_login_hint')}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
