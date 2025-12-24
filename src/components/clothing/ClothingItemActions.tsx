import { Heart, EyeOff, Eye, Trash2, MoreVertical, Edit } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ClothingItem } from '@/types/clothing';
import { cn } from '@/lib/utils';

interface ClothingItemActionsProps {
  item: ClothingItem;
  onToggleFavorite?: (id: string) => Promise<boolean>;
  onToggleHidden?: (id: string) => Promise<boolean>;
  onDelete?: (id: string) => Promise<boolean>;
  onEdit?: (item: ClothingItem) => void;
  showHiddenOption?: boolean;
}

export const ClothingItemActions = ({
  item,
  onToggleFavorite,
  onToggleHidden,
  onDelete,
  onEdit,
  showHiddenOption = true,
}: ClothingItemActionsProps) => {
  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await onToggleFavorite?.(item.id);
  };

  const handleHidden = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await onToggleHidden?.(item.id);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Bạn có chắc muốn xóa món đồ này?')) {
      await onDelete?.(item.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(item);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 bg-black/40 hover:bg-black/60 text-white rounded-full"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical size={14} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {onToggleFavorite && (
          <DropdownMenuItem onClick={handleFavorite} className="gap-2">
            <Heart
              size={16}
              className={cn(item.isFavorite && 'fill-red-500 text-red-500')}
            />
            {item.isFavorite ? 'Bỏ yêu thích' : 'Thêm yêu thích'}
          </DropdownMenuItem>
        )}
        
        {onEdit && (
          <DropdownMenuItem onClick={handleEdit} className="gap-2">
            <Edit size={16} />
            Chỉnh sửa
          </DropdownMenuItem>
        )}
        
        {showHiddenOption && onToggleHidden && (
          <DropdownMenuItem onClick={handleHidden} className="gap-2">
            {item.isHidden ? (
              <>
                <Eye size={16} />
                Hiện lại
              </>
            ) : (
              <>
                <EyeOff size={16} />
                Ẩn đi
              </>
            )}
          </DropdownMenuItem>
        )}
        
        {onDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              className="gap-2 text-destructive focus:text-destructive"
            >
              <Trash2 size={16} />
              Xóa
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
