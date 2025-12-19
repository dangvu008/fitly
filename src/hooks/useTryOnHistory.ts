import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

export const useTryOnHistory = () => {
  const saveTryOnResult = async (
    userId: string,
    bodyImage: string,
    resultImage: string,
    clothingItems: ClothingItemData[]
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

      // Save to database
      const { error } = await supabase.from('try_on_history').insert([{
        user_id: userId,
        body_image_url: bodyImageUrl,
        result_image_url: resultImageUrl,
        clothing_items: JSON.parse(JSON.stringify(clothingItems)),
      }]);

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
