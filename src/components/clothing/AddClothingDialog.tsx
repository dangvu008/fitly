import { useState, useRef } from 'react';
import { X, Upload, Link2, ImagePlus, Check, Loader2, ArrowLeft, Shield, AlertTriangle, FileWarning } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ClothingItem, ClothingCategory } from '@/types/clothing';
import { useClothingValidation } from '@/hooks/useClothingValidation';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { FunLoading, FunProgressBar } from '@/components/ui/fun-loading';
import { ClothingDetailsForm } from './ClothingDetailsForm';
import { cn } from '@/lib/utils';

interface AddClothingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddClothing: (item: ClothingItem) => void;
  onSaveToCollection?: (item: ClothingItem) => void;
  targetCategory?: ClothingCategory | null;
}

// File validation constants
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png', 
  'image/gif',
  'image/webp',
  'image/bmp'
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MIN_FILE_SIZE = 1024; // 1KB minimum to avoid empty/corrupt files

// Magic bytes signatures for image files
const IMAGE_SIGNATURES: Record<string, number[][]> = {
  jpeg: [[0xFF, 0xD8, 0xFF]],
  png: [[0x89, 0x50, 0x4E, 0x47]],
  gif: [[0x47, 0x49, 0x46, 0x38]],
  webp: [[0x52, 0x49, 0x46, 0x46]], // RIFF header
  bmp: [[0x42, 0x4D]],
};

// Blocked domains for URL validation
const BLOCKED_DOMAINS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '192.168.',
  '10.0.',
  '172.16.',
];

// Suspicious file patterns
const SUSPICIOUS_PATTERNS = [
  /\.exe$/i,
  /\.bat$/i,
  /\.cmd$/i,
  /\.ps1$/i,
  /\.vbs$/i,
  /\.js$/i,
  /\.php$/i,
  /\.asp$/i,
  /\.svg$/i, // SVG can contain scripts
];

// Validate file magic bytes
const validateMagicBytes = (buffer: ArrayBuffer): boolean => {
  const bytes = new Uint8Array(buffer);
  
  for (const [, signatures] of Object.entries(IMAGE_SIGNATURES)) {
    for (const signature of signatures) {
      let matches = true;
      for (let i = 0; i < signature.length; i++) {
        if (bytes[i] !== signature[i]) {
          matches = false;
          break;
        }
      }
      if (matches) return true;
    }
  }
  return false;
};

// Validate file extension
const validateExtension = (filename: string): { valid: boolean; error?: string } => {
  const ext = filename.toLowerCase().split('.').pop();
  if (!ext) {
    return { valid: false, error: 'file_no_extension' };
  }
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: 'file_invalid_extension' };
  }
  if (SUSPICIOUS_PATTERNS.some(pattern => pattern.test(filename))) {
    return { valid: false, error: 'file_suspicious' };
  }
  return { valid: true };
};

// Validate MIME type
const validateMimeType = (mimeType: string): { valid: boolean; error?: string } => {
  if (!mimeType || !ALLOWED_MIME_TYPES.includes(mimeType)) {
    return { valid: false, error: 'file_invalid_type' };
  }
  return { valid: true };
};

// Validate file size
const validateFileSize = (size: number): { valid: boolean; error?: string } => {
  if (size < MIN_FILE_SIZE) {
    return { valid: false, error: 'file_too_small' };
  }
  if (size > MAX_FILE_SIZE) {
    return { valid: false, error: 'file_too_large' };
  }
  return { valid: true };
};

// Validate URL security
const validateUrlSecurity = (url: string): { valid: boolean; error?: string } => {
  try {
    const parsed = new URL(url);
    
    // Must be http or https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'url_invalid_protocol' };
    }
    
    // Check blocked domains
    if (BLOCKED_DOMAINS.some(domain => parsed.hostname.includes(domain))) {
      return { valid: false, error: 'url_blocked_domain' };
    }
    
    // Check for suspicious patterns in path
    if (SUSPICIOUS_PATTERNS.some(pattern => pattern.test(parsed.pathname))) {
      return { valid: false, error: 'url_suspicious_file' };
    }
    
    // Check extension if present
    const pathname = parsed.pathname.toLowerCase();
    if (pathname.includes('.')) {
      const ext = pathname.split('.').pop();
      if (ext && !ALLOWED_EXTENSIONS.includes(ext)) {
        return { valid: false, error: 'url_invalid_extension' };
      }
    }
    
    return { valid: true };
  } catch {
    return { valid: false, error: 'url_invalid_format' };
  }
};

// Comprehensive file validation
const validateFile = async (file: File): Promise<{ valid: boolean; errors: string[] }> => {
  const errors: string[] = [];
  
  // Extension check
  const extResult = validateExtension(file.name);
  if (!extResult.valid && extResult.error) {
    errors.push(extResult.error);
  }
  
  // MIME type check
  const mimeResult = validateMimeType(file.type);
  if (!mimeResult.valid && mimeResult.error) {
    errors.push(mimeResult.error);
  }
  
  // Size check
  const sizeResult = validateFileSize(file.size);
  if (!sizeResult.valid && sizeResult.error) {
    errors.push(sizeResult.error);
  }
  
  // Magic bytes check - read first 10 bytes
  try {
    const buffer = await file.slice(0, 10).arrayBuffer();
    if (!validateMagicBytes(buffer)) {
      errors.push('file_invalid_signature');
    }
  } catch {
    errors.push('file_read_error');
  }
  
  return { valid: errors.length === 0, errors };
};

export const AddClothingDialog = ({ 
  isOpen, 
  onClose, 
  onAddClothing,
  onSaveToCollection,
  targetCategory
}: AddClothingDialogProps) => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [imageUrl, setImageUrl] = useState('');
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [securityStatus, setSecurityStatus] = useState<'idle' | 'checking' | 'safe' | 'warning'>('idle');
  const [securityMessage, setSecurityMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for review mode
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [detectedItem, setDetectedItem] = useState<ClothingItem | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string>('');
  
  const { 
    validateAndProcessClothing, 
    isValidating,
    progress,
    mapToAppCategory,
    issueTranslationMap
  } = useClothingValidation();

  // Background removal is disabled - AI try-on model has good recognition capability
  const removeBackground = false;

  const handleClose = () => {
    setImageUrl('');
    setPreviewImage(null);
    setIsLoadingUrl(false);
    setShowReviewForm(false);
    setDetectedItem(null);
    setOriginalImageUrl('');
    setSecurityStatus('idle');
    setSecurityMessage('');
    onClose();
  };

  const processClothingImage = async (imageDataUrl: string, sourceName: string) => {
    const result = await validateAndProcessClothing(imageDataUrl, { 
      removeBackground, 
      language 
    });
    
    if (!result.isValid) {
      const errorMessages = result.errors.map(err => {
        const translationKey = issueTranslationMap[err];
        if (translationKey && t(translationKey as any) !== translationKey) {
          return t(translationKey as any);
        }
        return err;
      });
      
      toast.error(
        <div className="space-y-2">
          <p className="font-medium">{t('msg_not_clothing')}</p>
          <ul className="text-sm list-disc pl-4 space-y-1">
            {errorMessages.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        </div>
      );
      return;
    }
    
    const aiCategory = result.analysis?.category || 'top';
    const appCategory = targetCategory && targetCategory !== 'all' && targetCategory !== 'unknown' 
      ? targetCategory 
      : mapToAppCategory(aiCategory);
    
    const newItem: ClothingItem = {
      id: Date.now().toString(),
      name: result.analysis?.subcategory || sourceName,
      category: appCategory,
      imageUrl: result.processedImageUrl || imageDataUrl,
      color: result.analysis?.color,
      gender: result.analysis?.gender,
      style: result.analysis?.style,
      pattern: result.analysis?.pattern,
    };
    
    // Show review form instead of immediately saving
    setOriginalImageUrl(result.processedImageUrl || imageDataUrl);
    setDetectedItem(newItem);
    setShowReviewForm(true);
    setSecurityStatus('safe');
    setSecurityMessage(t('file_security_passed'));
  };

  const handleSaveClothing = (item: ClothingItem) => {
    onAddClothing(item);
    
    if (onSaveToCollection) {
      onSaveToCollection(item);
    }
    
    const categoryLabel = t(`msg_clothing_category_${item.category}` as any) || item.category;
    toast.success(`${t('msg_clothing_detected')} ${categoryLabel}`);
    
    handleClose();
  };

  const handleBackToUpload = () => {
    setShowReviewForm(false);
    setDetectedItem(null);
    setOriginalImageUrl('');
    setPreviewImage(null);
    setSecurityStatus('idle');
    setSecurityMessage('');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSecurityStatus('checking');
    setSecurityMessage(t('file_security_checking'));
    
    // Comprehensive file validation
    const validation = await validateFile(file);
    
    if (!validation.valid) {
      setSecurityStatus('warning');
      const errorMessages = validation.errors.map(err => t(err as any) || err);
      setSecurityMessage(errorMessages.join(', '));
      toast.error(
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileWarning size={16} className="text-destructive" />
            <p className="font-medium">{t('file_validation_failed')}</p>
          </div>
          <ul className="text-sm list-disc pl-4 space-y-1">
            {errorMessages.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        </div>
      );
      e.target.value = '';
      return;
    }
    
    setSecurityStatus('safe');
    setSecurityMessage(t('file_security_passed'));
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageDataUrl = event.target?.result as string;
      setPreviewImage(imageDataUrl);
      await processClothingImage(imageDataUrl, file.name.replace(/\.[^/.]+$/, ''));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleUrlSubmit = async () => {
    if (!imageUrl.trim()) {
      toast.error(t('add_clothing_url_required'));
      return;
    }

    // Security validation for URL
    setSecurityStatus('checking');
    setSecurityMessage(t('url_security_checking'));
    
    const urlValidation = validateUrlSecurity(imageUrl);
    if (!urlValidation.valid) {
      setSecurityStatus('warning');
      const errorMsg = t(urlValidation.error as any) || urlValidation.error;
      setSecurityMessage(errorMsg || '');
      toast.error(
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-destructive" />
          <span>{errorMsg}</span>
        </div>
      );
      return;
    }

    setIsLoadingUrl(true);
    
    try {
      const response = await fetch(imageUrl, {
        headers: {
          'Accept': 'image/*',
        },
      });
      
      if (!response.ok) {
        throw new Error('Cannot load image');
      }
      
      // Validate content type from response
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.startsWith('image/')) {
        setSecurityStatus('warning');
        setSecurityMessage(t('url_not_image'));
        toast.error(t('url_not_image'));
        return;
      }
      
      // Validate MIME type
      const mimeCheck = validateMimeType(contentType);
      if (!mimeCheck.valid) {
        setSecurityStatus('warning');
        setSecurityMessage(t(mimeCheck.error as any) || 'Invalid image type');
        toast.error(t(mimeCheck.error as any) || 'Invalid image type');
        return;
      }
      
      const blob = await response.blob();
      
      // Validate file size
      const sizeCheck = validateFileSize(blob.size);
      if (!sizeCheck.valid) {
        setSecurityStatus('warning');
        setSecurityMessage(t(sizeCheck.error as any) || 'Invalid file size');
        toast.error(t(sizeCheck.error as any) || 'Invalid file size');
        return;
      }
      
      // Validate magic bytes
      const buffer = await blob.slice(0, 10).arrayBuffer();
      if (!validateMagicBytes(buffer)) {
        setSecurityStatus('warning');
        setSecurityMessage(t('file_invalid_signature'));
        toast.error(t('file_invalid_signature'));
        return;
      }
      
      setSecurityStatus('safe');
      setSecurityMessage(t('url_security_passed'));
      
      const reader = new FileReader();
      reader.onload = async (event) => {
        const imageDataUrl = event.target?.result as string;
        setPreviewImage(imageDataUrl);
        await processClothingImage(imageDataUrl, t('add_clothing_from_url'));
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Error loading image from URL:', error);
      setSecurityStatus('warning');
      setSecurityMessage(t('add_clothing_url_error'));
      toast.error(t('add_clothing_url_error'));
    } finally {
      setIsLoadingUrl(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-foreground/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-card rounded-2xl w-full max-w-sm shadow-medium overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
          {showReviewForm ? (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="iconSm" onClick={handleBackToUpload}>
                <ArrowLeft size={18} />
              </Button>
              <h3 className="font-display font-bold text-lg text-foreground">
                {t('clothing_form_review_title')}
              </h3>
            </div>
          ) : (
            <h3 className="font-display font-bold text-lg text-foreground">
              {targetCategory && targetCategory !== 'all' && targetCategory !== 'unknown'
                ? t('add_clothing_add_category').replace('{category}', t(`slot_${targetCategory}` as any))
                : t('add_clothing_title')}
            </h3>
          )}
          <Button variant="ghost" size="iconSm" onClick={handleClose}>
            <X size={18} />
          </Button>
        </div>

        {/* Loading State */}
        {isValidating && progress && (
          <div className="absolute inset-0 z-20 bg-card/95 flex items-center justify-center rounded-2xl">
            <div className="text-center space-y-4 p-6">
              <FunLoading 
                type="clothing" 
                size="lg" 
                message={
                  progress.stage === 'checking_size' ? t('add_clothing_checking_size') :
                  progress.stage === 'analyzing' ? t('add_clothing_detecting') :
                  progress.stage === 'removing_background' ? t('add_clothing_removing_bg') :
                  progress.stage === 'complete' ? t('add_clothing_complete') : t('add_clothing_analyzing')
                }
                showEmoji={true}
              />
              <div className="w-48 mx-auto">
                <FunProgressBar progress={progress.progress} />
              </div>
            </div>
          </div>
        )}

        <div className="p-4">
          {/* Review Form */}
          {showReviewForm && detectedItem ? (
            <ClothingDetailsForm
              item={detectedItem}
              imageUrl={originalImageUrl}
              onSave={handleSaveClothing}
              onCancel={handleBackToUpload}
            />
          ) : (
            /* Upload/URL Tabs */
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'upload' | 'url')}>
              <TabsList className="w-full grid grid-cols-2 mb-4">
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload size={14} />
                  {t('add_clothing_upload_tab')}
                </TabsTrigger>
                <TabsTrigger value="url" className="flex items-center gap-2">
                  <Link2 size={14} />
                  {t('add_clothing_url_tab')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp,image/bmp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-[4/3] rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/30 hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-3 group"
                >
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ImagePlus size={28} className="text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-foreground">{t('add_clothing_select_device')}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t('add_clothing_supported')}</p>
                  </div>
                </button>

                {/* Security Status */}
                {securityStatus !== 'idle' && (
                  <div className={cn(
                    "flex items-center gap-2 p-3 rounded-lg text-sm",
                    securityStatus === 'checking' && "bg-muted/50 text-muted-foreground",
                    securityStatus === 'safe' && "bg-green-500/10 text-green-600 dark:text-green-400",
                    securityStatus === 'warning' && "bg-destructive/10 text-destructive"
                  )}>
                    {securityStatus === 'checking' && <Loader2 size={16} className="animate-spin" />}
                    {securityStatus === 'safe' && <Shield size={16} />}
                    {securityStatus === 'warning' && <AlertTriangle size={16} />}
                    <span>{securityMessage}</span>
                  </div>
                )}

                <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg">
                  <Shield size={16} className="text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    {t('file_security_note')}
                  </p>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  {t('add_clothing_ai_detect')}
                </p>
              </TabsContent>

              <TabsContent value="url" className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">{t('add_clothing_url_label')}</label>
                    <Input
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={imageUrl}
                      onChange={(e) => {
                        setImageUrl(e.target.value);
                        setSecurityStatus('idle');
                        setSecurityMessage('');
                      }}
                      className="h-11"
                    />
                  </div>

                  <div className="aspect-[4/3] rounded-xl border border-border bg-muted/30 overflow-hidden flex items-center justify-center">
                    {previewImage ? (
                      <img src={previewImage} alt="Preview" className="w-full h-full object-contain" />
                    ) : (
                      <div className="text-center p-4">
                        <Link2 size={32} className="mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">{t('add_clothing_url_placeholder')}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Security Status */}
                {securityStatus !== 'idle' && (
                  <div className={cn(
                    "flex items-center gap-2 p-3 rounded-lg text-sm",
                    securityStatus === 'checking' && "bg-muted/50 text-muted-foreground",
                    securityStatus === 'safe' && "bg-green-500/10 text-green-600 dark:text-green-400",
                    securityStatus === 'warning' && "bg-destructive/10 text-destructive"
                  )}>
                    {securityStatus === 'checking' && <Loader2 size={16} className="animate-spin" />}
                    {securityStatus === 'safe' && <Shield size={16} />}
                    {securityStatus === 'warning' && <AlertTriangle size={16} />}
                    <span>{securityMessage}</span>
                  </div>
                )}

                <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg">
                  <Shield size={16} className="text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    {t('url_security_note')}
                  </p>
                </div>

                <Button onClick={handleUrlSubmit} disabled={!imageUrl.trim() || isLoadingUrl || isValidating} className="w-full h-11">
                  {isLoadingUrl ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {t('add_clothing_loading')}
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      {t('add_clothing_add_btn')}
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">{t('add_clothing_url_hint')}</p>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
};
