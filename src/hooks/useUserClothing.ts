import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ClothingItem, ClothingCategory } from '@/types/clothing';

export const useUserClothing = () => {
  const { user } = useAuth();
  const [userClothing, setUserClothing] = useState<ClothingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

      const items: ClothingItem[] = (data || []).map(record => ({
        id: record.id,
        name: record.name,
        category: record.category as ClothingCategory,
        imageUrl: record.image_url,
        color: record.color || undefined,
        gender: record.gender as 'male' | 'female' | 'unisex' | 'unknown' | undefined,
        style: record.style || undefined,
        pattern: record.pattern || undefined,
        tags: record.tags || [],
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
    updates: { name?: string; tags?: string[]; category?: ClothingCategory; gender?: string; shopUrl?: string }
  ): Promise<boolean> => {
    if (!user) return false;

    setIsSaving(true);
    try {
      const updateData: Record<string, unknown> = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.tags !== undefined) updateData.tags = updates.tags;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.gender !== undefined) updateData.gender = updates.gender;
      if (updates.shopUrl !== undefined) updateData.shop_url = updates.shopUrl;

      const { error } = await supabase
        .from('user_clothing')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setUserClothing(prev => prev.map(item => 
        item.id === id 
          ? { 
              ...item, 
              name: updates.name ?? item.name, 
              tags: updates.tags ?? item.tags,
              category: updates.category ?? item.category,
              gender: (updates.gender as 'male' | 'female' | 'unisex' | 'unknown' | undefined) ?? item.gender,
              shopUrl: updates.shopUrl ?? item.shopUrl
            }
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

  return {
    userClothing,
    isLoading,
    isSaving,
    saveClothingItem,
    updateClothingItem,
    deleteClothingItem,
    refetch: fetchUserClothing,
  };
};
