import { useState, useMemo } from 'react';
import { Search, TrendingUp, Shirt, Footprints, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/LanguageContext';
import { sampleClothing } from '@/data/sampleClothing';
import { ClothingItem } from '@/types/clothing';

interface SearchPageProps {
  onSelectItem?: (item: ClothingItem) => void;
}

const categories = [
  { id: 'all', labelKey: 'cat_all', icon: Sparkles },
  { id: 'top', labelKey: 'cat_top', icon: Shirt },
  { id: 'bottom', labelKey: 'cat_bottom', icon: Shirt },
  { id: 'dress', labelKey: 'cat_dress', icon: Shirt },
  { id: 'shoes', labelKey: 'cat_shoes', icon: Footprints },
  { id: 'accessory', labelKey: 'cat_accessory', icon: Sparkles },
];

export const SearchPage = ({ onSelectItem }: SearchPageProps) => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Filter items based on search and category
  const filteredItems = useMemo(() => {
    let items = sampleClothing;
    
    if (selectedCategory !== 'all') {
      items = items.filter(item => item.category === selectedCategory);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      );
    }
    
    return items;
  }, [searchQuery, selectedCategory]);

  // Trending items (top 6 by default)
  const trendingItems = useMemo(() => {
    return sampleClothing.slice(0, 6);
  }, []);

  return (
    <div className="flex flex-col h-full pb-20">
      {/* Search Input */}
      <div className="px-4 pt-4 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary/50 border-0 focus-visible:ring-1"
          />
        </div>
      </div>

      {/* Categories - Horizontal Scroll */}
      <div className="px-4 py-2">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  <Icon size={14} />
                  {t(cat.labelKey as any)}
                </button>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 px-4">
        {/* Trending Section - Show when no search query */}
        {!searchQuery.trim() && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={18} className="text-primary" />
              <h2 className="font-semibold text-foreground">{t('search_trending')}</h2>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {trendingItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSelectItem?.(item)}
                  className="aspect-square rounded-lg overflow-hidden bg-secondary/50 hover:ring-2 hover:ring-primary transition-all"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Results / All Items */}
        <div>
          <h2 className="font-semibold text-foreground mb-3">
            {searchQuery.trim() 
              ? `${filteredItems.length} ${t('search_categories').toLowerCase()}`
              : t('search_categories')
            }
          </h2>
          
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 pb-4">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSelectItem?.(item)}
                  className="flex flex-col rounded-lg overflow-hidden bg-secondary/30 hover:ring-2 hover:ring-primary transition-all"
                >
                  <div className="aspect-square">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium text-foreground truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {item.category}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Search size={48} className="mx-auto mb-2 opacity-50" />
              <p>No items found</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default SearchPage;
