import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface DefaultBodyImageState {
  imageUrl: string | null;
  updatedAt: string | null;
}

/**
 * Hook for managing user's default body image for One-Tap Try-On Flow.
 * 
 * Provides functionality to:
 * - Fetch the current default body image from user profile
 * - Save/update a new default body image
 * - Clear the default body image
 * 
 * @see Requirements 1.4, 1.5 from one-tap-tryon-flow spec
 */
export function useDefaultBodyImage() {
  const { user } = useAuth();
  const [defaultBodyImage, setDefaultBodyImage] = useState<DefaultBodyImageState>({
    imageUrl: null,
    updatedAt: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch default body image from user profile
  const fetchDefaultBodyImage = useCallback(async () => {
    if (!user?.id) {
      setDefaultBodyImage({ imageUrl: null, updatedAt: null });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('default_body_image_url, default_body_image_updated_at')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      setDefaultBodyImage({
        imageUrl: data?.default_body_image_url ?? null,
        updatedAt: data?.default_body_image_updated_at ?? null,
      });
    } catch (err) {
      console.error('[useDefaultBodyImage] Error fetching default body image:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch default body image'));
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Save or update default body image
  const saveDefaultBodyImage = useCallback(async (imageUrl: string): Promise<boolean> => {
    if (!user?.id) {
      toast.error('Vui lòng đăng nhập để lưu ảnh mặc định');
      return false;
    }

    if (!imageUrl || imageUrl.trim() === '') {
      toast.error('URL ảnh không hợp lệ');
      return false;
    }

    setIsSaving(true);
    setError(null);

    try {
      const now = new Date().toISOString();
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          default_body_image_url: imageUrl,
          default_body_image_updated_at: now,
        })
        .eq('user_id', user.id);

      if (updateError) {
        throw updateError;
      }

      setDefaultBodyImage({
        imageUrl,
        updatedAt: now,
      });

      toast.success('Đã lưu ảnh mặc định');
      return true;
    } catch (err) {
      console.error('[useDefaultBodyImage] Error saving default body image:', err);
      setError(err instanceof Error ? err : new Error('Failed to save default body image'));
      toast.error('Không thể lưu ảnh mặc định');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [user?.id]);

  // Clear default body image
  const clearDefaultBodyImage = useCallback(async (): Promise<boolean> => {
    if (!user?.id) {
      toast.error('Vui lòng đăng nhập');
      return false;
    }

    setIsSaving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          default_body_image_url: null,
          default_body_image_updated_at: null,
        })
        .eq('user_id', user.id);

      if (updateError) {
        throw updateError;
      }

      setDefaultBodyImage({
        imageUrl: null,
        updatedAt: null,
      });

      toast.success('Đã xóa ảnh mặc định');
      return true;
    } catch (err) {
      console.error('[useDefaultBodyImage] Error clearing default body image:', err);
      setError(err instanceof Error ? err : new Error('Failed to clear default body image'));
      toast.error('Không thể xóa ảnh mặc định');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [user?.id]);

  // Fetch on mount and when user changes
  useEffect(() => {
    fetchDefaultBodyImage();
  }, [fetchDefaultBodyImage]);

  return {
    // State
    defaultBodyImage: defaultBodyImage.imageUrl,
    defaultBodyImageUpdatedAt: defaultBodyImage.updatedAt,
    hasDefaultBodyImage: !!defaultBodyImage.imageUrl,
    isLoading,
    isSaving,
    error,

    // Actions
    saveDefaultBodyImage,
    clearDefaultBodyImage,
    refetch: fetchDefaultBodyImage,
  };
}
