import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ClothingItem, ClothingCategory } from '@/types/clothing';

interface UserClothingRecord {
  id: string;
  user_id: string;
  name: string;
  category: string;
  image_url: string;
  color: string | null;
  gender: string | null;
  style: string | null;
  pattern: string | null;
  tags: string[] | null;
  is_favorite: boolean | null;
  is_hidden: boolean | null;
  created_at: string;
}

export const useUserClothing = () => {
  const { user } = useAuth();
  const [userClothing, setUserClothing] = useState<ClothingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showHidden, setShowHidden] = useState(false);

  const fetchUserClothing = useCallback(async () => {
    if (!user) {
      setUserClothing([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_clothing')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const items: ClothingItem[] = (data as UserClothingRecord[]).map(record => ({
        id: record.id,
        name: record.name,
        category: record.category as ClothingCategory,
        imageUrl: record.image_url,
        color: record.color || undefined,
        gender: record.gender as 'male' | 'female' | 'unisex' | 'unknown' | undefined,
        style: record.style || undefined,
        pattern: record.pattern || undefined,
        tags: record.tags || [],
        isFavorite: record.is_favorite || false,
        isHidden: record.is_hidden || false,
      }));

      setUserClothing(items);
    } catch (error) {
      console.error('Error fetching user clothing:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUserClothing();
  }, [fetchUserClothing]);

  const saveClothingItem = useCallback(async (item: ClothingItem): Promise<boolean> => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để lưu quần áo');
      return false;
    }

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('user_clothing')
        .insert({
          user_id: user.id,
          name: item.name,
          category: item.category,
          image_url: item.imageUrl,
          color: item.color || null,
          gender: item.gender || null,
          style: item.style || null,
          pattern: item.pattern || null,
          tags: item.tags || [],
        })
        .select()
        .single();

      if (error) throw error;

      const newItem: ClothingItem = {
        id: data.id,
        name: data.name,
        category: data.category as ClothingCategory,
        imageUrl: data.image_url,
        color: data.color || undefined,
        gender: data.gender as 'male' | 'female' | 'unisex' | 'unknown' | undefined,
        style: data.style || undefined,
        pattern: data.pattern || undefined,
        tags: data.tags || [],
      };

      setUserClothing(prev => [newItem, ...prev]);
      toast.success('Đã lưu vào bộ sưu tập quần áo!');
      return true;
    } catch (error) {
      console.error('Error saving clothing:', error);
      toast.error('Không thể lưu quần áo');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [user]);

  const updateClothingItem = useCallback(async (
    id: string, 
    updates: { name?: string; tags?: string[] }
  ): Promise<boolean> => {
    if (!user) return false;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('user_clothing')
        .update({
          name: updates.name,
          tags: updates.tags,
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setUserClothing(prev => prev.map(item => 
        item.id === id 
          ? { ...item, name: updates.name ?? item.name, tags: updates.tags ?? item.tags }
          : item
      ));
      return true;
    } catch (error) {
      console.error('Error updating clothing:', error);
      toast.error('Không thể cập nhật quần áo');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [user]);

  const deleteClothingItem = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_clothing')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setUserClothing(prev => prev.filter(item => item.id !== id));
      toast.success('Đã xóa quần áo');
      return true;
    } catch (error) {
      console.error('Error deleting clothing:', error);
      toast.error('Không thể xóa quần áo');
      return false;
    }
  }, [user]);

  // Toggle favorite status for a clothing item
  const toggleFavorite = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;

    const item = userClothing.find(i => i.id === id);
    if (!item) return false;

    const newFavoriteStatus = !item.isFavorite;

    try {
      const { error } = await supabase
        .from('user_clothing')
        .update({ is_favorite: newFavoriteStatus })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setUserClothing(prev => prev.map(i => 
        i.id === id ? { ...i, isFavorite: newFavoriteStatus } : i
      ));
      
      toast.success(newFavoriteStatus ? 'Đã thêm vào yêu thích' : 'Đã bỏ khỏi yêu thích');
      return true;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Không thể cập nhật');
      return false;
    }
  }, [user, userClothing]);

  // Toggle hidden status for a clothing item
  const toggleHidden = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;

    const item = userClothing.find(i => i.id === id);
    if (!item) return false;

    const newHiddenStatus = !(item as any).isHidden;

    try {
      const { error } = await supabase
        .from('user_clothing')
        .update({ is_hidden: newHiddenStatus })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setUserClothing(prev => prev.map(i => 
        i.id === id ? { ...i, isHidden: newHiddenStatus } : i
      ));
      
      toast.success(newHiddenStatus ? 'Đã ẩn quần áo' : 'Đã hiện quần áo');
      return true;
    } catch (error) {
      console.error('Error toggling hidden:', error);
      toast.error('Không thể cập nhật');
      return false;
    }
  }, [user, userClothing]);

  // Filter clothing based on showHidden state
  const visibleClothing = showHidden 
    ? userClothing 
    : userClothing.filter(item => !(item as any).isHidden);

  // Get only favorite items
  const favoriteClothing = userClothing.filter(item => item.isFavorite);

  return {
    userClothing: visibleClothing,
    allClothing: userClothing,
    favoriteClothing,
    isLoading,
    isSaving,
    showHidden,
    setShowHidden,
    saveClothingItem,
    updateClothingItem,
    deleteClothingItem,
    toggleFavorite,
    toggleHidden,
    refetch: fetchUserClothing,
  };
};
