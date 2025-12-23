import { useState } from 'react';
import { Search, Sparkles, ShoppingCart, ExternalLink, Loader2, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface DetectedItem {
  name: string;
  category: string;
  color?: string;
  style?: string;
  confidence: number;
  searchQuery: string;
}

interface ShoppingLink {
  platform: string;
  url: string;
  icon: string;
  country?: string;
}

interface OutfitAnalyzerProps {
  imageUrl: string;
  existingItems?: Array<{ name: string; imageUrl: string; category?: string }>;
  onItemsDetected?: (items: DetectedItem[]) => void;
}

// Shopping platforms by language/country
const SHOPPING_PLATFORMS_BY_LANGUAGE: Record<string, ShoppingLink[]> = {
  // Vietnamese - Vietnam
  vi: [
    { platform: 'Shopee', url: 'https://shopee.vn/search?keyword=', icon: '🛒', country: 'VN' },
    { platform: 'Lazada', url: 'https://www.lazada.vn/catalog/?q=', icon: '🛍️', country: 'VN' },
    { platform: 'Tiki', url: 'https://tiki.vn/search?q=', icon: '📦', country: 'VN' },
    { platform: 'Sendo', url: 'https://www.sendo.vn/tim-kiem?q=', icon: '🏪', country: 'VN' },
  ],
  // English - International/US
  en: [
    { platform: 'Amazon', url: 'https://www.amazon.com/s?k=', icon: '📦', country: 'US' },
    { platform: 'ASOS', url: 'https://www.asos.com/search/?q=', icon: '👗', country: 'UK' },
    { platform: 'Zara', url: 'https://www.zara.com/us/en/search?searchTerm=', icon: '🏷️', country: 'ES' },
    { platform: 'H&M', url: 'https://www2.hm.com/en_us/search-results.html?q=', icon: '👕', country: 'SE' },
    { platform: 'Shein', url: 'https://us.shein.com/pdsearch/', icon: '🛒', country: 'CN' },
  ],
  // Chinese - China
  zh: [
    { platform: '淘宝 Taobao', url: 'https://s.taobao.com/search?q=', icon: '🛒', country: 'CN' },
    { platform: '天猫 Tmall', url: 'https://list.tmall.com/search_product.htm?q=', icon: '🏪', country: 'CN' },
    { platform: '京东 JD', url: 'https://search.jd.com/Search?keyword=', icon: '📦', country: 'CN' },
    { platform: '拼多多 Pinduoduo', url: 'https://mobile.yangkeduo.com/search_result.html?search_key=', icon: '🎁', country: 'CN' },
  ],
  // Korean - South Korea
  ko: [
    { platform: 'Coupang', url: 'https://www.coupang.com/np/search?q=', icon: '🚀', country: 'KR' },
    { platform: 'Gmarket', url: 'https://browse.gmarket.co.kr/search?keyword=', icon: '🛒', country: 'KR' },
    { platform: 'Musinsa', url: 'https://www.musinsa.com/search/musinsa/goods?q=', icon: '👕', country: 'KR' },
    { platform: '11번가', url: 'https://search.11st.co.kr/Search.tmall?kwd=', icon: '🏪', country: 'KR' },
  ],
  // Japanese - Japan
  ja: [
    { platform: 'Amazon JP', url: 'https://www.amazon.co.jp/s?k=', icon: '📦', country: 'JP' },
    { platform: '楽天 Rakuten', url: 'https://search.rakuten.co.jp/search/mall/', icon: '🛒', country: 'JP' },
    { platform: 'ZOZOTOWN', url: 'https://zozo.jp/search/?p_keyv=', icon: '👗', country: 'JP' },
    { platform: 'Uniqlo', url: 'https://www.uniqlo.com/jp/ja/search?q=', icon: '👕', country: 'JP' },
  ],
  // Thai - Thailand
  th: [
    { platform: 'Shopee TH', url: 'https://shopee.co.th/search?keyword=', icon: '🛒', country: 'TH' },
    { platform: 'Lazada TH', url: 'https://www.lazada.co.th/catalog/?q=', icon: '🛍️', country: 'TH' },
    { platform: 'Central', url: 'https://www.central.co.th/th/search?q=', icon: '🏬', country: 'TH' },
    { platform: 'JD Central', url: 'https://www.jd.co.th/search?keywords=', icon: '📦', country: 'TH' },
  ],
};

// Global fashion brands (shown for all languages)
const GLOBAL_FASHION_BRANDS: ShoppingLink[] = [
  { platform: 'Zara', url: 'https://www.zara.com/ww/en/search?searchTerm=', icon: '🏷️' },
  { platform: 'H&M', url: 'https://www2.hm.com/en_us/search-results.html?q=', icon: '👕' },
  { platform: 'Uniqlo', url: 'https://www.uniqlo.com/us/en/search?q=', icon: '🧥' },
  { platform: 'Google Shopping', url: 'https://www.google.com/search?tbm=shop&q=', icon: '🔍' },
];

export const OutfitAnalyzer = ({ imageUrl, existingItems = [], onItemsDetected }: OutfitAnalyzerProps) => {
  const { language } = useLanguage();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<DetectedItem | null>(null);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [showGlobalBrands, setShowGlobalBrands] = useState(false);

  // Get shopping platforms based on current language
  const getShoppingPlatforms = (): ShoppingLink[] => {
    return SHOPPING_PLATFORMS_BY_LANGUAGE[language] || SHOPPING_PLATFORMS_BY_LANGUAGE['en'];
  };

  const analyzeOutfit = async () => {
    setIsAnalyzing(true);
    setDetectedItems([]);
    setAnalysisComplete(false);

    try {
      // Call AI to analyze the outfit image
      const { data, error } = await supabase.functions.invoke('analyze-outfit-items', {
        body: { imageUrl }
      });

      if (error) throw error;

      if (data?.items && Array.isArray(data.items)) {
        const items: DetectedItem[] = data.items.map((item: any) => ({
          name: item.name || 'Không xác định',
          category: item.category || 'other',
          color: item.color,
          style: item.style,
          confidence: item.confidence || 0.8,
          searchQuery: buildSearchQuery(item),
        }));

        setDetectedItems(items);
        onItemsDetected?.(items);
        toast.success(`Đã phát hiện ${items.length} món đồ trong outfit!`);
      } else {
        // Fallback: use existing items if AI fails
        if (existingItems.length > 0) {
          const fallbackItems: DetectedItem[] = existingItems.map(item => ({
            name: item.name,
            category: item.category || 'other',
            confidence: 1,
            searchQuery: item.name,
          }));
          setDetectedItems(fallbackItems);
          toast.info('Sử dụng thông tin có sẵn từ outfit');
        } else {
          toast.error('Không thể phân tích outfit');
        }
      }
    } catch (error) {
      console.error('Error analyzing outfit:', error);
      
      // Fallback to existing items
      if (existingItems.length > 0) {
        const fallbackItems: DetectedItem[] = existingItems.map(item => ({
          name: item.name,
          category: item.category || 'other',
          confidence: 1,
          searchQuery: item.name,
        }));
        setDetectedItems(fallbackItems);
        toast.info('Sử dụng thông tin có sẵn từ outfit');
      } else {
        toast.error('Không thể phân tích outfit');
      }
    } finally {
      setIsAnalyzing(false);
      setAnalysisComplete(true);
    }
  };

  const buildSearchQuery = (item: any): string => {
    const parts = [];
    if (item.color) parts.push(item.color);
    if (item.name) parts.push(item.name);
    if (item.style) parts.push(item.style);
    return parts.join(' ') || item.name || 'quần áo';
  };

  const openShoppingLink = (platform: ShoppingLink, query: string) => {
    const encodedQuery = encodeURIComponent(query);
    window.open(`${platform.url}${encodedQuery}`, '_blank', 'noopener,noreferrer');
  };

  const getCategoryEmoji = (category: string): string => {
    const emojiMap: Record<string, string> = {
      top: '👕',
      bottom: '👖',
      dress: '👗',
      shoes: '👟',
      accessory: '👜',
      outerwear: '🧥',
      hat: '🎩',
      bag: '👜',
      jewelry: '💍',
      other: '✨',
    };
    return emojiMap[category.toLowerCase()] || '✨';
  };

  return (
    <div className="space-y-4">
      {/* Analyze Button */}
      {!analysisComplete && (
        <Button
          onClick={analyzeOutfit}
          disabled={isAnalyzing}
          variant="instagram"
          className="w-full h-12"
        >
          {isAnalyzing ? (
            <>
              <Loader2 size={18} className="animate-spin mr-2" />
              Đang phân tích...
            </>
          ) : (
            <>
              <Wand2 size={18} className="mr-2" />
              Phân tích & Tìm mua món đồ
            </>
          )}
        </Button>
      )}

      {/* Loading Animation */}
      {isAnalyzing && (
        <div className="bg-card rounded-xl p-6 border border-border text-center space-y-4">
          <div className="w-20 h-20 mx-auto">
            <DotLottieReact
              src="https://lottie.host/d10e8b97-a4d3-4f9e-b0f8-7e9cdef05ec8/5EF3wJWe17.lottie"
              loop
              autoplay
              style={{ width: '100%', height: '100%' }}
            />
          </div>
          <div>
            <p className="font-medium text-foreground">🔍 AI đang phân tích outfit...</p>
            <p className="text-sm text-muted-foreground mt-1">Đang nhận diện các món đồ trong ảnh</p>
          </div>
        </div>
      )}

      {/* Detected Items */}
      {detectedItems.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            <h3 className="font-semibold text-sm">
              Phát hiện {detectedItems.length} món đồ
            </h3>
          </div>

          {detectedItems.map((item, index) => (
            <div
              key={index}
              className="bg-card rounded-xl border border-border p-4 space-y-3"
            >
              {/* Item Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{getCategoryEmoji(item.category)}</span>
                  <div>
                    <h4 className="font-medium text-foreground">{item.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {item.category}
                      </Badge>
                      {item.color && (
                        <Badge variant="outline" className="text-xs">
                          {item.color}
                        </Badge>
                      )}
                      {item.style && (
                        <Badge variant="outline" className="text-xs">
                          {item.style}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Badge 
                  variant={item.confidence > 0.8 ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {Math.round(item.confidence * 100)}%
                </Badge>
              </div>

              {/* Shopping Links - Local Platforms */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <ShoppingCart size={12} />
                  Tìm mua tại {getShoppingPlatforms()[0]?.country || 'địa phương'}:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {getShoppingPlatforms().map((platform) => (
                    <Button
                      key={platform.platform}
                      variant="outline"
                      size="sm"
                      className="h-9 text-xs justify-start"
                      onClick={() => openShoppingLink(platform, item.searchQuery)}
                    >
                      <span className="mr-1.5">{platform.icon}</span>
                      <span className="truncate">{platform.platform}</span>
                      <ExternalLink size={10} className="ml-auto flex-shrink-0" />
                    </Button>
                  ))}
                </div>
              </div>

              {/* Global Fashion Brands */}
              <div className="space-y-2">
                <button
                  onClick={() => setShowGlobalBrands(!showGlobalBrands)}
                  className="text-xs text-primary flex items-center gap-1 hover:underline"
                >
                  🌍 {showGlobalBrands ? 'Ẩn' : 'Xem'} thương hiệu quốc tế
                </button>
                {showGlobalBrands && (
                  <div className="grid grid-cols-2 gap-2">
                    {GLOBAL_FASHION_BRANDS.map((platform) => (
                      <Button
                        key={platform.platform}
                        variant="secondary"
                        size="sm"
                        className="h-9 text-xs justify-start"
                        onClick={() => openShoppingLink(platform, item.searchQuery)}
                      >
                        <span className="mr-1.5">{platform.icon}</span>
                        <span className="truncate">{platform.platform}</span>
                        <ExternalLink size={10} className="ml-auto flex-shrink-0" />
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              {/* Custom Search */}
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">
                  Từ khóa tìm kiếm: <span className="text-foreground">{item.searchQuery}</span>
                </p>
              </div>
            </div>
          ))}

          {/* Re-analyze Button */}
          <Button
            onClick={analyzeOutfit}
            variant="outline"
            className="w-full"
            disabled={isAnalyzing}
          >
            <Search size={16} className="mr-2" />
            Phân tích lại
          </Button>
        </div>
      )}
    </div>
  );
};
