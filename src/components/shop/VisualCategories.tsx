/**
 * VisualCategories - Horizontal scrollable category buttons with icons
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */

import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ShopCategory, SHOP_CATEGORY_CONFIG } from '@/types/shop';
import { useLanguage } from '@/contexts/LanguageContext';

interface VisualCategoriesProps {
  selectedCategory: ShopCategory;
  onCategoryChange: (category: ShopCategory) => void;
  className?: string;
}

const CATEGORY_ORDER: ShopCategory[] = [
  'all',
  'dresses',
  'tops',
  'pants',
  'outerwear',
  'shoes',
  'accessories',
];

export function VisualCategories({
  selectedCategory,
  onCategoryChange,
  className,
}: VisualCategoriesProps) {
  const { language } = useLanguage();

  return (
    <div className={cn('py-3', className)}>
      <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-2">
        Visual Categories
      </h3>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 px-4">
          {CATEGORY_ORDER.map((categoryId) => {
            const config = SHOP_CATEGORY_CONFIG[categoryId];
            const isSelected = selectedCategory === categoryId;
            const label = language === 'vi' ? config.labelVi : config.label;

            return (
              <button
                key={categoryId}
                onClick={() => onCategoryChange(categoryId)}
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                  'border shadow-sm whitespace-nowrap',
                  isSelected
                    ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white border-transparent'
                    : 'bg-card text-foreground border-border hover:bg-muted'
                )}
              >
                <span className="text-sm">{config.icon}</span>
                <span>{label}</span>
              </button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>
    </div>
  );
}
