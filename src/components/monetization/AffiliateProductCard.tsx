import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export interface AffiliateProduct {
  id: string;
  name: string;
  imageUrl: string;
  price: string;
  currency: string;
  shopUrl: string;
  platform: 'amazon' | 'shopee' | 'lazada' | 'zalora' | 'other';
}

interface AffiliateProductCardProps {
  product: AffiliateProduct;
  source?: string;
  tryOnResultId?: string;
  className?: string;
}

const PLATFORM_COLORS: Record<string, string> = {
  amazon: 'bg-orange-500',
  shopee: 'bg-orange-600',
  lazada: 'bg-purple-600',
  zalora: 'bg-black',
  other: 'bg-gray-600',
};

const PLATFORM_NAMES: Record<string, string> = {
  amazon: 'Amazon',
  shopee: 'Shopee',
  lazada: 'Lazada',
  zalora: 'Zalora',
  other: 'Shop',
};

export function AffiliateProductCard({
  product,
  source = 'search',
  tryOnResultId,
  className,
}: AffiliateProductCardProps) {
  const { t } = useLanguage();
  const { user } = useAuth();

  const handleShopNow = async () => {
    // Track the click
    try {
      await supabase.from('affiliate_clicks').insert({
        user_id: user?.id || null,
        product_id: product.id,
        product_name: product.name,
        platform: product.platform,
        affiliate_url: product.shopUrl,
        source,
        try_on_result_id: tryOnResultId,
      });
    } catch (error) {
      console.error('Failed to track affiliate click:', error);
    }

    // Open the affiliate link
    window.open(product.shopUrl, '_blank', 'noopener,noreferrer');
  };

  const platformLabel = t(`affiliate_on_${product.platform}`) || 
    `on ${PLATFORM_NAMES[product.platform]}`;

  return (
    <div className={cn(
      'flex flex-col bg-card rounded-lg border overflow-hidden',
      className
    )}>
      {/* Product Image */}
      <div className="aspect-square relative overflow-hidden bg-muted">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className={cn(
          'absolute top-2 right-2 px-2 py-0.5 rounded text-xs text-white font-medium',
          PLATFORM_COLORS[product.platform]
        )}>
          {PLATFORM_NAMES[product.platform]}
        </div>
      </div>

      {/* Product Info */}
      <div className="p-3 flex-1 flex flex-col">
        <h3 className="font-medium text-sm line-clamp-2 mb-1">
          {product.name}
        </h3>
        <div className="text-lg font-bold text-primary mb-2">
          {product.currency} {product.price}
        </div>
        
        <Button
          size="sm"
          className="w-full mt-auto"
          onClick={handleShopNow}
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          {t('affiliate_shop_now') || 'Shop Now'}
        </Button>
        <span className="text-xs text-muted-foreground text-center mt-1">
          {platformLabel}
        </span>
      </div>
    </div>
  );
}
