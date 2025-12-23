import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

interface ClothingItemData {
  name: string;
  imageUrl: string;
}

// Convert base64 to blob
const base64ToBlob = (base64: string): Blob => {
  const parts = base64.split(';base64,');
  const contentType = parts[0].split(':')[1] || 'image/png';
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);
  
  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }
  
  return new Blob([uInt8Array], { type: contentType });
};

// Upload image to storage
const uploadImage = async (
  base64: string,
  userId: string,
  type: 'body' | 'result'
): Promise<string | null> => {
  try {
    const blob = base64ToBlob(base64);
    const fileName = `${userId}/${type}-${Date.now()}.png`;
    
    const { data, error } = await supabase.storage
      .from('try-on-images')
      .upload(fileName, blob, {
        contentType: 'image/png',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('try-on-images')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Upload error:', error);
    return null;
  }
};

export interface SaveTryOnOptions {
  userId: string;
  bodyImage: string;
  resultImage: string;
  clothingItems: ClothingItemData[];
  sourceOutfitId?: string | null;
}

/**
 * Prepares the try-on history record for database insertion.
 * This is a pure function that can be tested without database dependencies.
 * 
 * Requirements 4.2: Store result with reference to the original shared outfit
 */
export interface TryOnHistoryRecord {
  user_id: string;
  body_image_url: string;
  result_image_url: string;
  clothing_items: Json;
  source_outfit_id: string | null;
}

export function prepareTryOnHistoryRecord(
  userId: string,
  bodyImageUrl: string,
  resultImageUrl: string,
  clothingItems: ClothingItemData[],
  sourceOutfitId?: string | null
): TryOnHistoryRecord {
  return {
    user_id: userId,
    body_image_url: bodyImageUrl,
    result_image_url: resultImageUrl,
    clothing_items: JSON.parse(JSON.stringify(clothingItems)) as Json,
    source_outfit_id: sourceOutfitId || null,
  };
}

export const useTryOnHistory = () => {
  const saveTryOnResult = async (
    userId: string,
    bodyImage: string,
    resultImage: string,
    clothingItems: ClothingItemData[],
    sourceOutfitId?: string | null
  ): Promise<boolean> => {
    try {
      // Upload images to storage
      const [bodyImageUrl, resultImageUrl] = await Promise.all([
        uploadImage(bodyImage, userId, 'body'),
        uploadImage(resultImage, userId, 'result'),
      ]);

      if (!bodyImageUrl || !resultImageUrl) {
        toast.error('Không thể tải ảnh lên');
        return false;
      }

      // Save to database with optional source outfit reference
      // Requirements 4.2: Store result with reference to the original shared outfit
      const record = prepareTryOnHistoryRecord(
        userId,
        bodyImageUrl,
        resultImageUrl,
        clothingItems,
        sourceOutfitId
      );
      const { error } = await supabase.from('try_on_history').insert([record]);

      if (error) {
        console.error('Save error:', error);
        toast.error('Không thể lưu kết quả');
        return false;
      }

      toast.success('Đã lưu vào lịch sử!');
      return true;
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Có lỗi xảy ra');
      return false;
    }
  };

  return { saveTryOnResult };
};
