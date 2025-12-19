import { ClothingItem } from '@/types/clothing';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectedClothingListProps {
  items: ClothingItem[];
  onRemove: (id: string) => void;
}

export const SelectedClothingList = ({ items, onRemove }: SelectedClothingListProps) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        Chọn quần áo để thử đồ với AI
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground font-medium">Đã chọn ({items.length})</p>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden",
              "ring-2 ring-primary shadow-glow animate-scale-in"
            )}
          >
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => onRemove(item.id)}
              className="absolute top-1 right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:scale-110 transition-transform"
            >
              <X size={12} />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/80 to-transparent p-1">
              <p className="text-[10px] text-background truncate font-medium">
                {item.name}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
