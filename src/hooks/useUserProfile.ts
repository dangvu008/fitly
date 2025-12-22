import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  followers_count: number;
  following_count: number;
  created_at: string;
}

interface SharedOutfit {
  id: string;
  title: string;
  result_image_url: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

export const useUserProfile = (userId?: string) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [outfits, setOutfits] = useState<SharedOutfit[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  const targetUserId = userId || user?.id;

  const fetchProfile = useCallback(async () => {
    if (!targetUserId) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      if (profileData) {
        setProfile({
          id: profileData.id,
          user_id: profileData.user_id,
          display_name: profileData.display_name,
          avatar_url: profileData.avatar_url,
          followers_count: (profileData as any).followers_count ?? 0,
          following_count: (profileData as any).following_count ?? 0,
          created_at: profileData.created_at,
        });
      }

      // Fetch user's outfits
      const { data: outfitsData, error: outfitsError } = await supabase
        .from('shared_outfits')
        .select('id, title, result_image_url, likes_count, comments_count, created_at')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (!outfitsError && outfitsData) {
        setOutfits(outfitsData);
      }

      // Check if current user is following this user
      if (user && user.id !== targetUserId) {
        const { data: followData } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId)
          .single();

        setIsFollowing(!!followData);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, [targetUserId, user]);

  const follow = useCallback(async () => {
    if (!user || !targetUserId || user.id === targetUserId) return false;

    setIsFollowLoading(true);
    try {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: user.id, following_id: targetUserId });

      if (error) throw error;

      setIsFollowing(true);
      setProfile(prev => prev ? {
        ...prev,
        followers_count: prev.followers_count + 1,
      } : null);
      
      toast.success('Đã theo dõi');
      return true;
    } catch (error) {
      console.error('Error following:', error);
      toast.error('Không thể theo dõi');
      return false;
    } finally {
      setIsFollowLoading(false);
    }
  }, [user, targetUserId]);

  const unfollow = useCallback(async () => {
    if (!user || !targetUserId) return false;

    setIsFollowLoading(true);
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);

      if (error) throw error;

      setIsFollowing(false);
      setProfile(prev => prev ? {
        ...prev,
        followers_count: Math.max(0, prev.followers_count - 1),
      } : null);
      
      toast.success('Đã bỏ theo dõi');
      return true;
    } catch (error) {
      console.error('Error unfollowing:', error);
      toast.error('Không thể bỏ theo dõi');
      return false;
    } finally {
      setIsFollowLoading(false);
    }
  }, [user, targetUserId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    outfits,
    isFollowing,
    isLoading,
    isFollowLoading,
    isOwnProfile: user?.id === targetUserId,
    follow,
    unfollow,
    refetch: fetchProfile,
  };
};
