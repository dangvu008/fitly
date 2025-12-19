import { ImagePlus, Shirt, Square, Footprints, Glasses, Crown, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClothingCategory } from '@/types/clothing';
import { cn } from '@/lib/utils';

interface CategorySidebarProps {
  activeCategory: ClothingCategory;
  onCategoryChange: (category: ClothingCategory) => void;
  onAddClothing: () => void;
}

const categories: { id: ClothingCategory; icon: React.ElementType; label: string }[] = [
  { id: 'top', icon: Shirt, label: 'Áo' },
  { id: 'bottom', icon: Square, label: 'Quần' },
  { id: 'dress', icon: Crown, label: 'Váy' },
  { id: 'shoes', icon: Footprints, label: 'Giày' },
  { id: 'accessory', icon: Glasses, label: 'Phụ kiện' },
  { id: 'all', icon: MoreHorizontal, label: 'Khác' },
];

export const CategorySidebar = ({ 
  activeCategory, 
  onCategoryChange, 
  onAddClothing 
}: CategorySidebarProps) => {
  return (
    <div className="flex flex-col gap-2 py-2">
      {/* Add clothing button */}
      <Button
        variant="outline"
        size="category"
        onClick={onAddClothing}
        className="border-dashed border-2 border-primary text-primary hover:gradient-primary hover:text-primary-foreground"
      >
        <ImagePlus size={20} />
        <span className="text-[10px]">Thêm đồ</span>
      </Button>
      
      {/* Category buttons */}
      {categories.map((cat) => {
        const Icon = cat.icon;
        const isActive = activeCategory === cat.id;
        
        return (
          <Button
            key={cat.id}
            variant={isActive ? "categoryActive" : "category"}
            size="category"
            onClick={() => onCategoryChange(cat.id)}
            className={cn(
              isActive && "scale-105"
            )}
          >
            <Icon size={20} />
            <span className="text-[10px]">{cat.label}</span>
          </Button>
        );
      })}
    </div>
  );
};
