import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

export interface DetectedItem {
  name: string;
  category: string;
  color?: string;
  style?: string;
  confidence: number;
  imageUrl?: string;
}

// Fashion/clothing related labels from various models
const CLOTHING_LABELS: Record<string, { category: string; nameVi: string }> = {
  // Common clothing items
  'shirt': { category: 'top', nameVi: 'Áo sơ mi' },
  't-shirt': { category: 'top', nameVi: 'Áo thun' },
  'blouse': { category: 'top', nameVi: 'Áo blouse' },
  'sweater': { category: 'top', nameVi: 'Áo len' },
  'jacket': { category: 'outerwear', nameVi: 'Áo khoác' },
  'coat': { category: 'outerwear', nameVi: 'Áo khoác dài' },
  'hoodie': { category: 'top', nameVi: 'Áo hoodie' },
  'vest': { category: 'top', nameVi: 'Áo vest' },
  'cardigan': { category: 'top', nameVi: 'Áo cardigan' },
  'tank top': { category: 'top', nameVi: 'Áo ba lỗ' },
  'polo': { category: 'top', nameVi: 'Áo polo' },
  
  // Bottoms
  'pants': { category: 'bottom', nameVi: 'Quần dài' },
  'jeans': { category: 'bottom', nameVi: 'Quần jean' },
  'trousers': { category: 'bottom', nameVi: 'Quần tây' },
  'shorts': { category: 'bottom', nameVi: 'Quần short' },
  'skirt': { category: 'bottom', nameVi: 'Chân váy' },
  'leggings': { category: 'bottom', nameVi: 'Quần legging' },
  
  // Dresses
  'dress': { category: 'dress', nameVi: 'Váy đầm' },
  'gown': { category: 'dress', nameVi: 'Váy dạ hội' },
  'jumpsuit': { category: 'dress', nameVi: 'Jumpsuit' },
  'romper': { category: 'dress', nameVi: 'Romper' },
  
  // Footwear
  'shoe': { category: 'shoes', nameVi: 'Giày' },
  'shoes': { category: 'shoes', nameVi: 'Giày' },
  'sneaker': { category: 'shoes', nameVi: 'Giày sneaker' },
  'sneakers': { category: 'shoes', nameVi: 'Giày sneaker' },
  'boot': { category: 'shoes', nameVi: 'Giày boot' },
  'boots': { category: 'shoes', nameVi: 'Giày boot' },
  'sandal': { category: 'shoes', nameVi: 'Dép sandal' },
  'sandals': { category: 'shoes', nameVi: 'Dép sandal' },
  'heel': { category: 'shoes', nameVi: 'Giày cao gót' },
  'heels': { category: 'shoes', nameVi: 'Giày cao gót' },
  'loafer': { category: 'shoes', nameVi: 'Giày lười' },
  'slipper': { category: 'shoes', nameVi: 'Dép' },
  
  // Accessories
  'hat': { category: 'accessory', nameVi: 'Mũ' },
  'cap': { category: 'accessory', nameVi: 'Mũ lưỡi trai' },
  'bag': { category: 'accessory', nameVi: 'Túi xách' },
  'handbag': { category: 'accessory', nameVi: 'Túi xách tay' },
  'backpack': { category: 'accessory', nameVi: 'Ba lô' },
  'purse': { category: 'accessory', nameVi: 'Ví' },
  'belt': { category: 'accessory', nameVi: 'Thắt lưng' },
  'tie': { category: 'accessory', nameVi: 'Cà vạt' },
  'scarf': { category: 'accessory', nameVi: 'Khăn quàng' },
  'glasses': { category: 'accessory', nameVi: 'Kính' },
  'sunglasses': { category: 'accessory', nameVi: 'Kính râm' },
  'watch': { category: 'accessory', nameVi: 'Đồng hồ' },
  'necklace': { category: 'accessory', nameVi: 'Dây chuyền' },
  'bracelet': { category: 'accessory', nameVi: 'Vòng tay' },
  'earring': { category: 'accessory', nameVi: 'Bông tai' },
  'ring': { category: 'accessory', nameVi: 'Nhẫn' },
  
  // Generic
  'clothing': { category: 'top', nameVi: 'Quần áo' },
  'apparel': { category: 'top', nameVi: 'Trang phục' },
  'garment': { category: 'top', nameVi: 'Quần áo' },
  'outfit': { category: 'dress', nameVi: 'Bộ trang phục' },
  'suit': { category: 'outerwear', nameVi: 'Bộ vest' },
  'uniform': { category: 'top', nameVi: 'Đồng phục' },
};

// Color detection keywords
const COLOR_KEYWORDS: Record<string, string> = {
  'red': 'đỏ',
  'blue': 'xanh dương',
  'green': 'xanh lá',
  'yellow': 'vàng',
  'orange': 'cam',
  'purple': 'tím',
  'pink': 'hồng',
  'black': 'đen',
  'white': 'trắng',
  'gray': 'xám',
  'grey': 'xám',
  'brown': 'nâu',
  'beige': 'be',
  'navy': 'xanh navy',
  'cream': 'kem',
  'gold': 'vàng gold',
  'silver': 'bạc',
};

let classifier: any = null;
let isInitializing = false;
let initPromise: Promise<void> | null = null;

/**
 * Initialize the image classifier for outfit analysis
 * Uses a lightweight model that runs in the browser
 */
export const initOutfitAnalyzer = async (
  onProgress?: (progress: number) => void
): Promise<void> => {
  if (isInitializing && initPromise) {
    return initPromise;
  }

  if (classifier) {
    onProgress?.(100);
    return;
  }

  isInitializing = true;
  onProgress?.(10);

  initPromise = (async () => {
    try {
      // Use a general image classification model
      // This is free and runs entirely in the browser
      console.log('Loading outfit analyzer model...');
      classifier = await pipeline(
        'image-classification',
        'Xenova/vit-base-patch16-224',
        { device: 'webgpu' }
      );
      console.log('Outfit analyzer loaded with WebGPU');
      onProgress?.(100);
    } catch (error) {
      console.warn('WebGPU not available, falling back to CPU:', error);
      try {
        classifier = await pipeline(
          'image-classification',
          'Xenova/vit-base-patch16-224'
        );
        console.log('Outfit analyzer loaded with CPU');
        onProgress?.(100);
      } catch (cpuError) {
        console.error('Failed to load outfit analyzer:', cpuError);
        isInitializing = false;
        initPromise = null;
        throw new Error('Không thể khởi tạo bộ phân tích outfit');
      }
    }
    isInitializing = false;
  })();

  return initPromise;
};

/**
 * Analyze an outfit image and detect clothing items
 * This runs entirely in the browser - no API costs!
 */
export const analyzeOutfitImage = async (
  imageUrl: string,
  onProgress?: (progress: number) => void
): Promise<DetectedItem[]> => {
  try {
    onProgress?.(5);

    // Initialize if needed
    if (!classifier) {
      await initOutfitAnalyzer((p) => onProgress?.(5 + p * 0.4));
    }

    if (!classifier) {
      console.warn('Classifier not available, using heuristic analysis');
      return getHeuristicAnalysis();
    }

    onProgress?.(50);

    // Run classification
    const results = await classifier(imageUrl, { topk: 10 });
    
    onProgress?.(80);

    // Process results to extract clothing items
    const detectedItems: DetectedItem[] = [];
    const seenCategories = new Set<string>();

    for (const result of results) {
      const label = result.label.toLowerCase();
      const score = result.score;

      // Check if this label matches any clothing item
      for (const [keyword, info] of Object.entries(CLOTHING_LABELS)) {
        if (label.includes(keyword) && !seenCategories.has(info.category)) {
          // Extract color if present in label
          let color: string | undefined;
          for (const [colorEn, colorVi] of Object.entries(COLOR_KEYWORDS)) {
            if (label.includes(colorEn)) {
              color = colorVi;
              break;
            }
          }

          detectedItems.push({
            name: info.nameVi,
            category: info.category,
            color,
            confidence: score,
            imageUrl, // Use outfit image as reference
          });
          
          seenCategories.add(info.category);
          break;
        }
      }
    }

    onProgress?.(100);

    // If no clothing detected, return heuristic analysis
    if (detectedItems.length === 0) {
      return getHeuristicAnalysis();
    }

    return detectedItems;
  } catch (error) {
    console.error('Error analyzing outfit:', error);
    return getHeuristicAnalysis();
  }
};

/**
 * Heuristic analysis when AI model fails or doesn't detect clothing
 * Returns common outfit items as a fallback
 */
function getHeuristicAnalysis(): DetectedItem[] {
  return [
    {
      name: 'Áo',
      category: 'top',
      confidence: 0.6,
    },
    {
      name: 'Quần/Váy',
      category: 'bottom',
      confidence: 0.6,
    },
    {
      name: 'Giày',
      category: 'shoes',
      confidence: 0.5,
    },
  ];
}

/**
 * Reset the analyzer (useful for error recovery)
 */
export const resetOutfitAnalyzer = () => {
  classifier = null;
  isInitializing = false;
  initPromise = null;
};
