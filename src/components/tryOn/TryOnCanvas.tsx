import { useState, useRef } from 'react';
import { ClothingItem } from '@/types/clothing';
import { cn } from '@/lib/utils';
import { Move, Camera, ImagePlus } from 'lucide-react';

interface ClothingOverlay {
  item: ClothingItem;
  position: { x: number; y: number };
  scale: number;
  rotation: number;
  opacity: number;
}

interface TryOnCanvasProps {
  bodyImageUrl?: string;
  overlays: ClothingOverlay[];
  selectedOverlayIndex: number | null;
  onOverlayUpdate: (index: number, updates: Partial<ClothingOverlay>) => void;
  onOverlaySelect: (index: number | null) => void;
  onBodyImageChange?: (imageUrl: string) => void;
}

export const TryOnCanvas = ({
  bodyImageUrl,
  overlays,
  selectedOverlayIndex,
  onOverlayUpdate,
  onOverlaySelect,
  onBodyImageChange,
}: TryOnCanvasProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onBodyImageChange) {
      const imageUrl = URL.createObjectURL(file);
      onBodyImageChange(imageUrl);
    }
    // Reset input để có thể chọn lại cùng file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragStart = (e: React.TouchEvent | React.MouseEvent, index: number) => {
    e.preventDefault();
    setIsDragging(true);
    onOverlaySelect(index);
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setDragStart({
      x: clientX - overlays[index].position.x,
      y: clientY - overlays[index].position.y,
    });
  };

  const handleDragMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging || selectedOverlayIndex === null) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    onOverlayUpdate(selectedOverlayIndex, {
      position: {
        x: clientX - dragStart.x,
        y: clientY - dragStart.y,
      },
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      ref={canvasRef}
      className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden gradient-fashion shadow-medium"
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
      onTouchMove={handleDragMove}
      onTouchEnd={handleDragEnd}
      onClick={() => onOverlaySelect(null)}
    >
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
          <div className="w-32 h-48 border-2 border-dashed border-muted-foreground/30 rounded-2xl flex items-center justify-center mb-4 relative">
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

      {/* Clothing overlays */}
      {overlays.map((overlay, index) => (
        <div
          key={overlay.item.id + index}
          className={cn(
            "absolute cursor-move transition-shadow duration-200",
            selectedOverlayIndex === index && "ring-2 ring-primary ring-offset-2 rounded-lg"
          )}
          style={{
            left: overlay.position.x,
            top: overlay.position.y,
            transform: `scale(${overlay.scale}) rotate(${overlay.rotation}deg)`,
            opacity: overlay.opacity,
          }}
          onMouseDown={(e) => handleDragStart(e, index)}
          onTouchStart={(e) => handleDragStart(e, index)}
          onClick={(e) => {
            e.stopPropagation();
            onOverlaySelect(index);
          }}
        >
          <img
            src={overlay.item.imageUrl}
            alt={overlay.item.name}
            className="w-32 h-32 object-contain pointer-events-none"
            draggable={false}
          />
          {selectedOverlayIndex === index && (
            <div className="absolute -top-3 -right-3 gradient-primary rounded-full p-1.5 shadow-glow">
              <Move size={12} className="text-primary-foreground" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
