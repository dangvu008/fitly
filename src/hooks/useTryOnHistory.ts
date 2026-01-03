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

// Upload image to temp folder (will be auto-deleted after 24h if not saved)
const uploadImageToTemp = async (
  base64: string,
  userId: string,
  type: 'body' | 'result'
): Promise<string | null> => {
  try {
    const blob = base64ToBlob(base64);
    const fileName = `temp/${userId}/${type}-${Date.now()}.png`;
    
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

// Move image from temp to saved folder (permanent storage)
const moveImageToSaved = async (
  tempUrl: string,
  userId: string,
  type: 'body' | 'result'
): Promise<string | null> => {
  try {
    // Extract path from URL
    const urlParts = tempUrl.split('/try-on-images/');
    if (urlParts.length < 2) return tempUrl; // Already in saved or invalid URL
    
    const tempPath = urlParts[1];
    if (!tempPath.startsWith('temp/')) return tempUrl; // Already in saved
    
    // Download the file
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('try-on-images')
      .download(tempPath);
    
    if (downloadError || !fileData) {
      console.error('Download error:', downloadError);
      return tempUrl; // Keep temp URL if download fails
    }
    
    // Upload to saved folder
    const savedPath = `saved/${userId}/${type}-${Date.now()}.png`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('try-on-images')
      .upload(savedPath, fileData, {
        contentType: 'image/png',
        upsert: false,
      });
    
    if (uploadError) {
      console.error('Upload to saved error:', uploadError);
      return tempUrl; // Keep temp URL if upload fails
    }
    
    // Delete temp file
    await supabase.storage
      .from('try-on-images')
      .remove([tempPath]);
    
    // Get public URL for saved file
    const { data: urlData } = supabase.storage
      .from('try-on-images')
      .getPublicUrl(uploadData.path);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('Move to saved error:', error);
    return tempUrl;
  }
};

export interface SaveTryOnOptions {
  userId: string;
  bodyImage: string;
  resultImage: string;
  clothingItems: ClothingItemData[];
}

/**
 * Prepares the try-on history record for database insertion.
 * This is a pure function that can be tested without database dependencies.
 */
export interface TryOnHistoryRecord {
  user_id: string;
  body_image_url: string;
  result_image_url: string;
  clothing_items: Json;
}

export function prepareTryOnHistoryRecord(
  userId: string,
  bodyImageUrl: string,
  resultImageUrl: string,
  clothingItems: ClothingItemData[]
): TryOnHistoryRecord {
  return {
    user_id: userId,
    body_image_url: bodyImageUrl,
    result_image_url: resultImageUrl,
    clothing_items: JSON.parse(JSON.stringify(clothingItems)) as Json,
  };
}

export const useTryOnHistory = () => {
  // Save try-on result to TEMP storage (auto-deleted after 24h)
  const saveTryOnResultToTemp = async (
    userId: string,
    bodyImage: string,
    resultImage: string,
    clothingItems: ClothingItemData[]
  ): Promise<{ bodyImageUrl: string; resultImageUrl: string } | null> => {
    try {
      // Upload images to TEMP folder
      const [bodyImageUrl, resultImageUrl] = await Promise.all([
        uploadImageToTemp(bodyImage, userId, 'body'),
        uploadImageToTemp(resultImage, userId, 'result'),
      ]);

      if (!bodyImageUrl || !resultImageUrl) {
        toast.error('Không thể tải ảnh lên');
        return null;
      }

      return { bodyImageUrl, resultImageUrl };
    } catch (error) {
      console.error('Save to temp error:', error);
      return null;
    }
  };

  // Move from temp to saved and save to database (permanent)
  const saveTryOnResult = async (
    userId: string,
    bodyImage: string,
    resultImage: string,
    clothingItems: ClothingItemData[]
  ): Promise<boolean> => {
    try {
      console.log('saveTryOnResult called with:', {
        userId,
        bodyImageLength: bodyImage?.length,
        resultImageLength: resultImage?.length,
        clothingItemsCount: clothingItems?.length,
      });

      // Check if images are already URLs (from temp) or base64
      const isBodyUrl = bodyImage.startsWith('http');
      const isResultUrl = resultImage.startsWith('http');

      console.log('Image types:', { isBodyUrl, isResultUrl });

      let bodyImageUrl: string | null;
      let resultImageUrl: string | null;

      if (isBodyUrl && isResultUrl) {
        // Move from temp to saved
        [bodyImageUrl, resultImageUrl] = await Promise.all([
          moveImageToSaved(bodyImage, userId, 'body'),
          moveImageToSaved(resultImage, userId, 'result'),
        ]);
      } else {
        // Upload directly to saved folder (legacy flow)
        const uploadToSaved = async (base64: string, type: 'body' | 'result') => {
          const blob = base64ToBlob(base64);
          const fileName = `saved/${userId}/${type}-${Date.now()}.png`;
          
          const { data, error } = await supabase.storage
            .from('try-on-images')
            .upload(fileName, blob, { contentType: 'image/png', upsert: false });

          if (error) return null;
          
          const { data: urlData } = supabase.storage
            .from('try-on-images')
            .getPublicUrl(data.path);
          
          return urlData.publicUrl;
        };

        [bodyImageUrl, resultImageUrl] = await Promise.all([
          uploadToSaved(bodyImage, 'body'),
          uploadToSaved(resultImage, 'result'),
        ]);
      }

      if (!bodyImageUrl || !resultImageUrl) {
        console.error('Failed to get image URLs:', { bodyImageUrl, resultImageUrl });
        toast.error('Không thể tải ảnh lên');
        return false;
      }

      console.log('Image URLs ready:', { bodyImageUrl, resultImageUrl });

      // Save to database
      const record = prepareTryOnHistoryRecord(
        userId,
        bodyImageUrl,
        resultImageUrl,
        clothingItems
      );
      
      console.log('Inserting record:', record);
      
      const { data, error } = await supabase.from('try_on_history').insert([record]).select().single();

      if (error) {
        console.error('Save error:', error);
        toast.error(`Không thể lưu kết quả: ${error.message}`);
        return false;
      }

      console.log('Saved successfully:', data);
      toast.success('Đã lưu vào lịch sử!');
      return true;
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Có lỗi xảy ra');
      return false;
    }
  };

  return { saveTryOnResult, saveTryOnResultToTemp };
};
