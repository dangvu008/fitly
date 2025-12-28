import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, History, Loader2, ImagePlus, Star, Check, Link, AlertCircle, Image } from 'lucide-react';
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

interface TryOnResultRecord {
  id: string;
  result_image_url: string;
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

// Normalize URL for comparison (remove query params, fragments)
const normalizeImageUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    return parsed.origin + parsed.pathname;
  } catch {
    return url;
  }
};

// Validate URL format and safety
const validateImageUrl = (url: string): { valid: boolean; error?: string } => {
  if (!url.trim()) {
    return { valid: false, error: 'url_required' };
  }

  try {
    const parsed = new URL(url);
    
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'url_invalid_protocol' };
    }

    if (BLOCKED_DOMAINS.some(domain => parsed.hostname.includes(domain))) {
      return { valid: false, error: 'url_blocked_domain' };
    }

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
  const [tryOnResults, setTryOnResults] = useState<TryOnResultRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSettingDefault, setIsSettingDefault] = useState(false);
  const [uploadTab, setUploadTab] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [isValidatingUrl, setIsValidatingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [historyTab, setHistoryTab] = useState<'body' | 'result'>('body');

  useEffect(() => {
    if (open && user) {
      fetchHistoryImages();
    }
    if (!open) {
      setUploadTab('upload');
      setUrlInput('');
      setUrlError(null);
      setSelectedImage(null);
    }
  }, [open, user]);

  const fetchHistoryImages = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('try_on_history')
        .select('id, body_image_url, result_image_url, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Deduplicate body images using normalized URLs
      const seenBodyUrls = new Set<string>();
      const uniqueBodyImages: BodyImageRecord[] = [];
      
      // Deduplicate result images using normalized URLs  
      const seenResultUrls = new Set<string>();
      const uniqueResults: TryOnResultRecord[] = [];

      data?.forEach((item) => {
        // Process body images
        const normalizedBodyUrl = normalizeImageUrl(item.body_image_url);
        if (!seenBodyUrls.has(normalizedBodyUrl)) {
          seenBodyUrls.add(normalizedBodyUrl);
          uniqueBodyImages.push({
            id: item.id,
            body_image_url: item.body_image_url,
            created_at: item.created_at,
          });
        }

        // Process result images
        const normalizedResultUrl = normalizeImageUrl(item.result_image_url);
        if (!seenResultUrls.has(normalizedResultUrl)) {
          seenResultUrls.add(normalizedResultUrl);
          uniqueResults.push({
            id: item.id + '-result',
            result_image_url: item.result_image_url,
            body_image_url: item.body_image_url,
            created_at: item.created_at,
          });
        }
      });

      setHistoryImages(uniqueBodyImages);
      setTryOnResults(uniqueResults);
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

  const handleUrlSubmit = async () => {
    setUrlError(null);
    
    const validation = validateImageUrl(urlInput);
    if (!validation.valid) {
      setUrlError(t(validation.error as any) || validation.error);
      return;
    }

    setIsValidatingUrl(true);

    try {
      const base64Image = await fetchImageAsBase64(urlInput);

      const { data, error } = await supabase.functions.invoke('analyze-body-image', {
        body: { imageBase64: base64Image },
      });

      if (error) {
        throw new Error('analysis_failed');
      }

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

        {/* Upload Tabs: Upload File / URL */}
        <div className="px-4 pb-3">
          <Tabs value={uploadTab} onValueChange={(v) => setUploadTab(v as 'upload' | 'url')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload" className="gap-2">
                <Camera size={16} />
                {t('tab_upload_file')}
              </TabsTrigger>
              <TabsTrigger value="url" className="gap-2">
                <Link size={16} />
                {t('tab_enter_url')}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="mt-3">
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
            </TabsContent>
            
            <TabsContent value="url" className="mt-3 space-y-3">
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
            </TabsContent>
          </Tabs>
        </div>

        {/* History Section */}
        {user && (
          <div className="flex-1 flex flex-col min-h-0 px-4 pb-4">
            <Tabs value={historyTab} onValueChange={(v) => setHistoryTab(v as 'body' | 'result')}>
              <TabsList className="grid w-full grid-cols-2 mb-3">
                <TabsTrigger value="body" className="gap-2 text-xs">
                  <History size={14} />
                  {t('body_image_from_history')}
                </TabsTrigger>
                <TabsTrigger value="result" className="gap-2 text-xs">
                  <Image size={14} />
                  {t('tryon_result_history')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="body" className="flex-1 min-h-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={24} className="animate-spin text-primary" />
                  </div>
                ) : historyImages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                      <ImagePlus size={28} className="text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t('body_image_no_history')}
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-48">
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
                )}
              </TabsContent>

              <TabsContent value="result" className="flex-1 min-h-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={24} className="animate-spin text-primary" />
                  </div>
                ) : tryOnResults.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                      <Image size={28} className="text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t('no_tryon_result_history')}
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-48">
                    <div className="grid grid-cols-3 gap-2">
                      {tryOnResults.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleSelectImage(item.result_image_url)}
                          className={cn(
                            "aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all relative",
                            selectedImage === item.result_image_url
                              ? "border-primary ring-2 ring-primary/20"
                              : "border-transparent hover:border-primary/50"
                          )}
                        >
                          <img
                            src={item.result_image_url}
                            alt="Try-on result"
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>
            </Tabs>

            {selectedImage && (
              <div className="pt-3 border-t border-border mt-3 space-y-2">
                <Button
                  className="w-full"
                  onClick={handleConfirmSelection}
                >
                  {t('body_image_use_selected')}
                </Button>
                {onSetDefault && historyTab === 'body' && selectedImage !== defaultBodyImageUrl && (
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
                {onSetDefault && historyTab === 'body' && selectedImage === defaultBodyImageUrl && (
                  <div className="flex items-center justify-center gap-2 text-sm text-primary">
                    <Check size={16} />
                    {t('body_image_is_default')}
                  </div>
                )}
              </div>
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
