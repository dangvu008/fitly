import { useRef } from 'react';
import { Camera, ImagePlus } from 'lucide-react';

interface TryOnCanvasProps {
  bodyImageUrl?: string;
  onBodyImageChange?: (imageUrl: string) => void;
}

export const TryOnCanvas = ({
  bodyImageUrl,
  onBodyImageChange,
}: TryOnCanvasProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onBodyImageChange) {
      const imageUrl = URL.createObjectURL(file);
      onBodyImageChange(imageUrl);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden gradient-fashion shadow-medium">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Body image */}
      {bodyImageUrl ? (
        <img
          src={bodyImageUrl}
          alt="Your photo"
          className="absolute inset-0 w-full h-full object-contain cursor-pointer"
          onClick={handleUploadClick}
        />
      ) : (
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground cursor-pointer hover:bg-muted/20 transition-colors"
          onClick={handleUploadClick}
        >
          <div className="w-32 h-48 border-2 border-dashed border-muted-foreground/30 rounded-2xl flex items-center justify-center mb-4">
            <svg viewBox="0 0 100 150" className="w-20 h-28 text-muted-foreground/30">
              <circle cx="50" cy="25" r="20" fill="currentColor" />
              <path d="M25 55 L50 50 L75 55 L80 120 L60 130 L50 125 L40 130 L20 120 Z" fill="currentColor" />
            </svg>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Camera size={20} className="text-primary" />
            <ImagePlus size={20} className="text-primary" />
          </div>
          <p className="text-sm font-medium">Chạm để tải ảnh toàn thân</p>
          <p className="text-xs text-muted-foreground mt-1">Chụp ảnh hoặc chọn từ thư viện</p>
        </div>
      )}
    </div>
  );
};
