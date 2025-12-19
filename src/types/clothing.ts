export type ClothingCategory = 'all' | 'top' | 'bottom' | 'dress' | 'shoes' | 'accessory';

export interface ClothingItem {
  id: string;
  name: string;
  category: ClothingCategory;
  imageUrl: string;
  shopUrl?: string;
  shopName?: string;
  price?: string;
  isFavorite?: boolean;
}

export interface Collection {
  id: string;
  name: string;
  items: ClothingItem[];
  coverImage?: string;
  createdAt: Date;
}

export interface TryOnSession {
  id: string;
  bodyImageUrl: string;
  clothingItems: {
    item: ClothingItem;
    position: { x: number; y: number };
    scale: number;
    rotation: number;
    opacity: number;
  }[];
  createdAt: Date;
}
