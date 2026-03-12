import React from 'react';
import { X, Share2, Sparkles, Camera, Search, Wand2, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface AIResultModalProps {
  resultImage: string;
  onClose: () => void;
  onSavePrivate: () => void;
  onShareToPublic: () => void;
  onEdit: () => void;
  onRetry: () => void;
  onChangePhoto: () => void;
  onFindSimilar: () => void;
  onShare: () => void;
}

export const AIResultModal: React.FC<AIResultModalProps> = ({
  resultImage,
  onClose,
  onSavePrivate,
  onShareToPublic,
  onEdit,
  onRetry,
  onChangePhoto,
  onFindSimilar,
  onShare,
}) => {
  const { t } = useLanguage();

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
      {/* Modal Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-border">
        <button onClick={onClose} className="text-foreground press-effect">
          <X size={24} />
        </button>
        <span className="font-semibold text-foreground">{t('tryon_result_title')}</span>
        <div className="w-6" />
      </div>

      {/* Result Image - Single image only */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        {resultImage ? (
          <img 
            src={resultImage} 
            alt="AI Try-On Result" 
            className="max-w-full max-h-full object-contain rounded-xl"
            onError={(e) => {
              console.error('Failed to load result image. Length:', resultImage.length, 'Starts with:', resultImage.substring(0, 50));
              // Try to fix common base64 issues
              const target = e.target as HTMLImageElement;
              if (!resultImage.startsWith('data:')) {
                target.src = `data:image/png;base64,${resultImage}`;
              }
            }}
            onLoad={() => {
              console.log('Result image loaded successfully. Length:', resultImage.length);
            }}
          />
        ) : (
          <div className="text-center text-muted-foreground">
            <p>Không thể hiển thị ảnh kết quả</p>
          </div>
        )}
      </div>

      {/* Action Bar - Reorganized */}
      <div className="border-t border-border p-4 space-y-3 safe-bottom">
        {/* Primary actions row */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onSavePrivate}
          >
            <Bookmark size={18} />
            Lưu riêng
          </Button>
          <Button
            variant="instagram"
            className="flex-1"
            onClick={onShareToPublic}
          >
            <Share2 size={18} />
            Đăng lên
          </Button>
        </div>
        
        {/* Secondary actions row */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onEdit}
          >
            <Wand2 size={18} />
            Chỉnh sửa
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={onRetry}
          >
            <Sparkles size={18} />
            Thử lại
          </Button>
        </div>
        
        {/* Tertiary actions row */}
        <div className="flex gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-muted-foreground"
            onClick={onChangePhoto}
          >
            <Camera size={16} />
            Đổi ảnh
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-muted-foreground"
            onClick={onFindSimilar}
          >
            <Search size={16} />
            Tìm đồ tương tự
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-muted-foreground"
            onClick={onShare}
          >
            <Share2 size={16} />
            Chia sẻ
          </Button>
        </div>
      </div>
    </div>
  );
};
