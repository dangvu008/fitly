import { useState, useRef } from 'react';
import { Camera, Save, Share2, Sparkles, Loader2, X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CategorySidebar } from '@/components/clothing/CategorySidebar';
import { ClothingCard } from '@/components/clothing/ClothingCard';
import { TryOnCanvas } from '@/components/tryOn/TryOnCanvas';
import { TryOnToolbar } from '@/components/tryOn/TryOnToolbar';
import { sampleClothing } from '@/data/sampleClothing';
import { ClothingItem, ClothingCategory } from '@/types/clothing';
import { useAITryOn } from '@/hooks/useAITryOn';
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
  const [aiResultImage, setAiResultImage] = useState<string | null>(null);
  
  const { processVirtualTryOn, isProcessing, clearResult } = useAITryOn();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const clothingInputRef = useRef<HTMLInputElement>(null);

  const filteredClothing = activeCategory === 'all' 
    ? clothing 
    : clothing.filter(c => c.category === activeCategory);

  const handleAddBodyImage = () => {
    fileInputRef.current?.click();
  };

  const handleAddClothingFromDevice = () => {
    clothingInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBodyImage(event.target?.result as string);
        setAiResultImage(null);
        clearResult();
        toast.success('Đã tải ảnh thành công!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClothingFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newItem: ClothingItem = {
          id: Date.now().toString(),
          name: file.name.replace(/\.[^/.]+$/, ''),
          category: 'top',
          imageUrl: event.target?.result as string,
        };
        handleAddClothing(newItem);
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

  const handleAITryOn = async () => {
    if (!bodyImage) {
      toast.error('Vui lòng tải ảnh toàn thân trước');
      return;
    }

    if (overlays.length === 0) {
      toast.error('Vui lòng chọn ít nhất một món đồ để thử');
      return;
    }

    // Get the first clothing item for AI processing
    const clothingItem = overlays[0].item;
    
    // Convert clothing image URL to base64 if needed
    let clothingImageData = clothingItem.imageUrl;
    
    // If it's a URL (not base64), fetch and convert
    if (clothingItem.imageUrl.startsWith('http')) {
      try {
        const response = await fetch(clothingItem.imageUrl);
        const blob = await response.blob();
        clothingImageData = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error('Error converting image:', error);
        toast.error('Không thể tải hình ảnh quần áo');
        return;
      }
    }

    const result = await processVirtualTryOn(bodyImage, clothingImageData, clothingItem.name);
    
    if (result?.success && result.generatedImage) {
      setAiResultImage(result.generatedImage);
    }
  };

  const handleSave = () => {
    toast.success('Đã lưu vào bộ sưu tập!');
  };

  const handleShare = () => {
    toast.success('Đã sao chép link chia sẻ!');
  };

  const handleDownloadResult = () => {
    if (aiResultImage) {
      const link = document.createElement('a');
      link.href = aiResultImage;
      link.download = 'virtual-try-on-result.png';
      link.click();
      toast.success('Đã tải ảnh xuống!');
    }
  };

  const handleCloseResult = () => {
    setAiResultImage(null);
    clearResult();
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
      <input
        ref={clothingInputRef}
        type="file"
        accept="image/*"
        onChange={handleClothingFileChange}
        className="hidden"
      />

      {/* AI Result Modal */}
      {aiResultImage && (
        <div className="fixed inset-0 z-50 bg-foreground/80 backdrop-blur-sm flex items-center justify-center p-4 animate-scale-in">
          <div className="bg-card rounded-2xl shadow-medium max-w-sm w-full overflow-hidden">
            <div className="relative">
              <img 
                src={aiResultImage} 
                alt="AI Try-On Result" 
                className="w-full aspect-[3/4] object-cover"
              />
              <Button
                variant="ghost"
                size="iconSm"
                onClick={handleCloseResult}
                className="absolute top-2 right-2 bg-card/80 backdrop-blur-sm rounded-full"
              >
                <X size={18} />
              </Button>
            </div>
            <div className="p-4 space-y-3">
              <h3 className="font-display font-bold text-lg text-center">
                Kết quả thử đồ AI
              </h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleDownloadResult}
                >
                  <Download size={16} />
                  Tải xuống
                </Button>
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={handleSave}
                >
                  <Save size={16} />
                  Lưu
                </Button>
                <Button
                  variant="accent"
                  size="icon"
                  onClick={handleShare}
                >
                  <Share2 size={16} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex gap-2 px-2">
        {/* Left sidebar - Categories */}
        <div className="flex-shrink-0">
          <CategorySidebar
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            onAddClothing={handleAddClothingFromDevice}
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

        {/* AI Try-On Button */}
        <Button
          variant="default"
          className="w-full h-12 text-base"
          onClick={handleAITryOn}
          disabled={isProcessing || !bodyImage || overlays.length === 0}
        >
          {isProcessing ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Đang xử lý AI...
            </>
          ) : (
            <>
              <Sparkles size={20} />
              Thử đồ với AI
            </>
          )}
        </Button>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleAddBodyImage}
          >
            <Camera size={18} />
            {bodyImage ? 'Đổi ảnh' : 'Tải ảnh'}
          </Button>
          <Button
            variant="secondary"
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
