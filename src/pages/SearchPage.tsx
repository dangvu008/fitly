/**
 * SearchPage - Search & Shop page with affiliate monetization
 * Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 3.1, 4.1
 */

import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Heart, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GemsCounter } from '@/components/monetization/GemsCounter';
import { GemsPurchaseDialog } from '@/components/monetization/GemsPurchaseDialog';
import { ShopSearchInput } from '@/components/shop/ShopSearchInput';
import { VisualCategories } from '@/components/shop/VisualCategories';
import { CuratedCollections } from '@/components/shop/CuratedCollections';
import { ShopProductCard } from '@/components/shop/ShopProductCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { ShopCategory, ShopProduct } from '@/types/shop';
import { getAllShopProducts, filterProductsByCategory } from '@/data/curatedCollections';
import { useAffiliateTracking } from '@/hooks/useAffiliateTracking';
import { toast } from 'sonner';

interface SearchPageProps {
  onSelectItem?: (item: any) => void;
}

export const SearchPage = ({ onSelectItem }: SearchPageProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { trackAndOpen } = useAffiliateTracking();

  const [selectedCategory, setSelectedCategory] = useState<ShopCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showGemsPurchase, setShowGemsPurchase] = useState(false);

  // Get all products for search results
  const allProducts = useMemo(() => getAllShopProducts(), []);

  // Filter products based on search query and category
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    let results = allProducts.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.brand?.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
    );

    // Apply category filter
    if (selectedCategory !== 'all') {
      results = filterProductsByCategory(results, selectedCategory);
    }

    return results;
  }, [searchQuery, selectedCategory, allProducts]);

  // Handle keyword search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setIsSearching(true);
    // Simulate search delay
    setTimeout(() => setIsSearching(false), 500);
  }, []);

  // Handle URL paste (visual search)
  const handleUrlDetected = useCallback((url: string) => {
    toast.info('Visual search coming soon!');
    console.log('URL detected:', url);
    // TODO: Implement visual search with the URL
  }, []);

  // Handle Try On button click
  const handleTryOn = useCallback(
    (product: ShopProduct) => {
      // Navigate to try-on page with product image
      navigate('/try-on', {
        state: {
          initialItem: {
            id: product.id,
            name: product.name,
            imageUrl: product.imageUrl,
            category: product.category,
          },
        },
      });
    },
    [navigate]
  );

  // Handle Buy button click with affiliate tracking
  const handleBuy = useCallback((product: ShopProduct) => {
    // Track click and open URL
    trackAndOpen({
      productId: product.id,
      affiliateUrl: product.affiliateUrl,
      source: searchQuery ? 'search' : 'collection',
    });
  }, [searchQuery, trackAndOpen]);

  // Handle saved items click
  const handleSavedClick = useCallback(() => {
    navigate('/saved');
  }, [navigate]);

  // Handle avatar click
  const handleAvatarClick = useCallback(() => {
    if (user) {
      navigate('/profile');
    } else {
      toast.info('Vui lòng đăng nhập');
    }
  }, [user, navigate]);

  const isShowingSearchResults = searchQuery.trim().length > 0;

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      {/* Header - Requirements 1.1, 1.2, 1.3, 1.4 */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className="text-lg font-bold text-foreground">SEARCH & SHOP</h1>
          <div className="flex items-center gap-3">
            <GemsCounter onPurchaseClick={() => setShowGemsPurchase(true)} />
            <button
              onClick={handleSavedClick}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <Heart size={20} className="text-foreground" />
            </button>
            <button onClick={handleAvatarClick}>
              <Avatar className="w-8 h-8 ring-2 ring-primary/20">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-xs">
                  {profile?.display_name?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </button>
          </div>
        </div>
      </div>

      {/* Search Input - Requirements 2.1 */}
      <div className="pt-3">
        <ShopSearchInput
          onSearch={handleSearch}
          onUrlDetected={handleUrlDetected}
          isLoading={isSearching}
        />
      </div>

      {/* Visual Categories - Requirements 3.1 */}
      <VisualCategories
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Content */}
      <ScrollArea className="flex-1">
        {isSearching ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : isShowingSearchResults ? (
          /* Search Results */
          <div className="px-4 pb-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              {searchResults.length} kết quả cho "{searchQuery}"
            </h3>
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {searchResults.map((product) => (
                  <ShopProductCard
                    key={product.id}
                    product={product}
                    onTryOn={handleTryOn}
                    onBuy={handleBuy}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Search size={48} className="mx-auto mb-2 opacity-50" />
                <p>Không tìm thấy sản phẩm</p>
                <p className="text-sm mt-1">Thử từ khóa khác?</p>
              </div>
            )}
          </div>
        ) : (
          /* Curated Collections - Requirements 4.1 */
          <CuratedCollections
            selectedCategory={selectedCategory}
            onTryOn={handleTryOn}
            onBuy={handleBuy}
          />
        )}
      </ScrollArea>

      {/* Gems Purchase Dialog */}
      <GemsPurchaseDialog
        isOpen={showGemsPurchase}
        onClose={() => setShowGemsPurchase(false)}
      />
    </div>
  );
};

export default SearchPage;
