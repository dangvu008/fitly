import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Camera, History, Loader2, ImagePlus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

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
}

export const BodyImageSourceDialog = ({
  open,
  onOpenChange,
  onUploadNew,
  onSelectFromHistory,
}: BodyImageSourceDialogProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [historyImages, setHistoryImages] = useState<BodyImageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (open && user) {
      fetchHistoryImages();
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-lg font-display">
            {t('body_image_source_title')}
          </DialogTitle>
        </DialogHeader>

        <div className="px-4 pb-2">
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
                          "aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all",
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
                      </button>
                    ))}
                  </div>
                </ScrollArea>

                {selectedImage && (
                  <div className="pt-3 border-t border-border mt-3">
                    <Button
                      className="w-full"
                      onClick={handleConfirmSelection}
                    >
                      {t('body_image_use_selected')}
                    </Button>
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
