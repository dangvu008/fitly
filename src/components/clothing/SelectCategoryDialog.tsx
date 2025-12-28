import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Shirt, RectangleVertical, Footprints, Watch } from 'lucide-react';
import { ClothingCategory } from '@/types/clothing';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { DressIcon } from './icons/DressIcon';

interface SelectCategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (category: ClothingCategory) => void;
  imageUrl?: string;
}

const categoryOptions: { id: ClothingCategory; icon: React.ElementType; labelKey: string }[] = [
  { id: 'top', icon: Shirt, labelKey: 'slot_top' },
  { id: 'bottom', icon: RectangleVertical, labelKey: 'slot_bottom' },
  { id: 'dress', icon: DressIcon, labelKey: 'slot_dress' },
  { id: 'shoes', icon: Footprints, labelKey: 'slot_shoes' },
  { id: 'accessory', icon: Watch, labelKey: 'slot_accessory' },
];

export const SelectCategoryDialog = ({ 
  isOpen, 
  onClose, 
  onSelect,
  imageUrl
}: SelectCategoryDialogProps) => {
  const { t } = useLanguage();

  const handleSelect = (category: ClothingCategory) => {
    onSelect(category);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-2">
          <DialogTitle className="text-lg">
            Chọn loại quần áo
          </DialogTitle>
          <DialogDescription className="text-center text-sm">
            AI không thể tự động nhận diện loại quần áo. Vui lòng chọn loại phù hợp.
          </DialogDescription>
        </DialogHeader>

        {/* Preview image */}
        {imageUrl && (
          <div className="flex justify-center mb-2">
            <img 
              src={imageUrl} 
              alt="Clothing preview" 
              className="w-24 h-24 object-cover rounded-xl border border-border"
            />
          </div>
        )}

        {/* Category options */}
        <div className="grid grid-cols-3 gap-3">
          {categoryOptions.map((option) => {
            const IconComponent = option.icon;
            return (
              <button
                key={option.id}
                onClick={() => handleSelect(option.id)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border border-border",
                  "hover:border-primary hover:bg-primary/5 transition-all duration-200",
                  "active:scale-95"
                )}
              >
                <IconComponent size={28} className="text-primary" strokeWidth={1.5} />
                <span className="text-sm font-medium text-foreground">
                  {t(option.labelKey as any)}
                </span>
              </button>
            );
          })}
        </div>

        <Button variant="outline" onClick={onClose} className="w-full mt-2">
          Hủy
        </Button>
      </DialogContent>
    </Dialog>
  );
};
