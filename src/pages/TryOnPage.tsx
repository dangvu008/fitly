import { useState, useRef } from 'react';
import { Camera, Save, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CategorySidebar } from '@/components/clothing/CategorySidebar';
import { ClothingCard } from '@/components/clothing/ClothingCard';
import { TryOnCanvas } from '@/components/tryOn/TryOnCanvas';
import { TryOnToolbar } from '@/components/tryOn/TryOnToolbar';
import { sampleClothing } from '@/data/sampleClothing';
import { ClothingItem, ClothingCategory } from '@/types/clothing';
import { toast } from 'sonner';

interface ClothingOverlay {
  item: ClothingItem;
  position: { x: number; y: number };
  scale: number;
  rotation: number;
  opacity: number;
}

interface TryOnPageProps {
  initialItem?: ClothingItem;
}

export const TryOnPage = ({ initialItem }: TryOnPageProps) => {
  const [bodyImage, setBodyImage] = useState<string | undefined>();
  const [overlays, setOverlays] = useState<ClothingOverlay[]>(() => 
    initialItem 
      ? [{ item: initialItem, position: { x: 100, y: 100 }, scale: 1, rotation: 0, opacity: 0.85 }]
      : []
  );
  const [selectedOverlayIndex, setSelectedOverlayIndex] = useState<number | null>(
    initialItem ? 0 : null
  );
  const [activeCategory, setActiveCategory] = useState<ClothingCategory>('top');
  const [clothing] = useState(sampleClothing);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredClothing = activeCategory === 'all' 
    ? clothing 
    : clothing.filter(c => c.category === activeCategory);

  const handleAddBodyImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBodyImage(event.target?.result as string);
        toast.success('Đã tải ảnh thành công!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddClothing = (item: ClothingItem) => {
    const newOverlay: ClothingOverlay = {
      item,
      position: { x: 80 + overlays.length * 20, y: 80 + overlays.length * 20 },
      scale: 1,
      rotation: 0,
      opacity: 0.85,
    };
    setOverlays(prev => [...prev, newOverlay]);
    setSelectedOverlayIndex(overlays.length);
    toast.success(`Đã thêm ${item.name}`);
  };

  const handleOverlayUpdate = (index: number, updates: Partial<ClothingOverlay>) => {
    setOverlays(prev =>
      prev.map((overlay, i) =>
        i === index ? { ...overlay, ...updates } : overlay
      )
    );
  };

  const selectedOverlay = selectedOverlayIndex !== null ? overlays[selectedOverlayIndex] : null;

  const handleOpacityChange = (opacity: number) => {
    if (selectedOverlayIndex !== null) {
      handleOverlayUpdate(selectedOverlayIndex, { opacity });
    }
  };

  const handleRotate = () => {
    if (selectedOverlayIndex !== null) {
      const current = overlays[selectedOverlayIndex].rotation;
      handleOverlayUpdate(selectedOverlayIndex, { rotation: (current + 15) % 360 });
    }
  };

  const handleFlip = () => {
    if (selectedOverlayIndex !== null) {
      const current = overlays[selectedOverlayIndex].scale;
      handleOverlayUpdate(selectedOverlayIndex, { scale: current * -1 });
    }
  };

  const handleResize = () => {
    if (selectedOverlayIndex !== null) {
      const current = Math.abs(overlays[selectedOverlayIndex].scale);
      const newScale = current >= 1.5 ? 0.5 : current + 0.25;
      const sign = overlays[selectedOverlayIndex].scale >= 0 ? 1 : -1;
      handleOverlayUpdate(selectedOverlayIndex, { scale: newScale * sign });
    }
  };

  const handleDelete = () => {
    if (selectedOverlayIndex !== null) {
      setOverlays(prev => prev.filter((_, i) => i !== selectedOverlayIndex));
      setSelectedOverlayIndex(null);
      toast.success('Đã xóa');
    }
  };

  const handleLayer = () => {
    if (selectedOverlayIndex !== null && selectedOverlayIndex < overlays.length - 1) {
      setOverlays(prev => {
        const newArr = [...prev];
        [newArr[selectedOverlayIndex], newArr[selectedOverlayIndex + 1]] = 
        [newArr[selectedOverlayIndex + 1], newArr[selectedOverlayIndex]];
        return newArr;
      });
      setSelectedOverlayIndex(selectedOverlayIndex + 1);
    }
  };

  const handleSave = () => {
    toast.success('Đã lưu vào bộ sưu tập!');
  };

  const handleShare = () => {
    toast.success('Đã sao chép link chia sẻ!');
  };

  return (
    <div className="pb-24 pt-16 max-w-md mx-auto">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Main content */}
      <div className="flex gap-2 px-2">
        {/* Left sidebar - Categories */}
        <div className="flex-shrink-0">
          <CategorySidebar
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            onAddClothing={handleAddBodyImage}
          />
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 min-w-0">
          <TryOnCanvas
            bodyImageUrl={bodyImage}
            overlays={overlays}
            selectedOverlayIndex={selectedOverlayIndex}
            onOverlayUpdate={handleOverlayUpdate}
            onOverlaySelect={setSelectedOverlayIndex}
          />
        </div>

        {/* Right sidebar - Clothing items */}
        <div className="flex-shrink-0 w-20 space-y-2 overflow-y-auto max-h-[400px] pr-1">
          {filteredClothing.map((item) => (
            <ClothingCard
              key={item.id}
              item={item}
              size="sm"
              onSelect={handleAddClothing}
            />
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-4 mt-4 space-y-4">
        <TryOnToolbar
          opacity={selectedOverlay?.opacity ?? 0.85}
          onOpacityChange={handleOpacityChange}
          onResize={handleResize}
          onRotate={handleRotate}
          onFlip={handleFlip}
          onDelete={handleDelete}
          onLayer={handleLayer}
          disabled={selectedOverlayIndex === null}
        />

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleAddBodyImage}
          >
            <Camera size={18} />
            Đổi ảnh
          </Button>
          <Button
            variant="default"
            className="flex-1"
            onClick={handleSave}
          >
            <Save size={18} />
            Lưu
          </Button>
          <Button
            variant="accent"
            size="icon"
            onClick={handleShare}
          >
            <Share2 size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
};
