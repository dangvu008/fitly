import React from 'react';
import { X, Search } from 'lucide-react';
import { ClothingCard } from '@/components/clothing/ClothingCard';
import { ClothingItem, ClothingCategory } from '@/types/clothing';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';

interface ClothingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeCategory: ClothingCategory;
  clothingSource: 'sample' | 'saved';
  onClothingSourceChange: (source: 'sample' | 'saved') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: 'name' | 'date' | 'color';
  onSortChange: (sort: 'name' | 'date' | 'color') => void;
  clothing: ClothingItem[];
  selectedItems: ClothingItem[];
  userClothingCount: number;
  isLoggedIn: boolean;
  onSelectItem: (item: ClothingItem) => void;
  onEditItem?: (item: ClothingItem) => void;
  onDeleteItem?: (id: string) => Promise<boolean>;
  categories: { id: ClothingCategory; label: string }[];
}

export const ClothingPanel: React.FC<ClothingPanelProps> = ({
  isOpen,
  onClose,
  activeCategory,
  clothingSource,
  onClothingSourceChange,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  clothing,
  selectedItems,
  userClothingCount,
  isLoggedIn,
  onSelectItem,
  onEditItem,
  onDeleteItem,
  categories,
}) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  const categoryLabel = categories.find(c => c.id === activeCategory)?.label || t('clothing_sample');

  return (
    <div className="fixed inset-0 z-40 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="absolute inset-x-0 bottom-0 bg-card border-t border-border rounded-t-2xl max-h-[60vh] flex flex-col animate-slide-in-up safe-bottom">
        {/* Handle */}
        <div className="flex justify-center py-2">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>
        
        {/* Panel Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">
              {categoryLabel}
            </span>
            {isLoggedIn && (
              <Tabs value={clothingSource} onValueChange={(v) => onClothingSourceChange(v as 'sample' | 'saved')}>
                <TabsList className="h-7 p-0.5">
                  <TabsTrigger value="sample" className="text-xs h-6 px-2">
                    {t('clothing_sample')}
                  </TabsTrigger>
                  <TabsTrigger value="saved" className="text-xs h-6 px-2">
                    {t('clothing_saved')} ({userClothingCount})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Search Bar + Sort */}
        <div className="px-4 py-3 flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('search_clothing')}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          {clothingSource === 'saved' && (
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as 'name' | 'date' | 'color')}
              className="h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="date">{t('sort_by_date')}</option>
              <option value="name">{t('sort_by_name')}</option>
              <option value="color">{t('sort_by_color')}</option>
            </select>
          )}
        </div>
        
        {/* Clothing Grid */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {clothing.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                {clothingSource === 'saved' ? t('no_saved_clothing') : t('no_clothing')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {clothing.map((item) => (
                <ClothingCard
                  key={item.id}
                  item={item}
                  size="md"
                  onSelect={(item) => {
                    onSelectItem(item);
                    onClose();
                  }}
                  isSelected={selectedItems.some(i => i.id === item.id)}
                  showActions={clothingSource === 'saved'}
                  onEdit={clothingSource === 'saved' ? onEditItem : undefined}
                  onDelete={clothingSource === 'saved' ? onDeleteItem : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
