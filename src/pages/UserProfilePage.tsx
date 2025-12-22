import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Grid3X3, Heart, Settings, Loader2, UserPlus, UserMinus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserProfile } from '@/hooks/useUserProfile';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export const UserProfilePage = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const { 
    profile, 
    outfits, 
    isFollowing, 
    isLoading, 
    isFollowLoading, 
    isOwnProfile,
    follow,
    unfollow,
  } = useUserProfile(userId);

  const handleViewOutfit = (outfitId: string) => {
    navigate(`/outfit/${outfitId}`);
  };

  const handleFollowToggle = async () => {
    if (isFollowing) {
      await unfollow();
    } else {
      await follow();
    }
  };

  if (isLoading) {
    return (
      <div className="pt-16 pb-24 max-w-lg mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-secondary rounded-full">
            <ArrowLeft size={20} />
          </button>
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex items-start gap-4 mb-6">
          <Skeleton className="w-20 h-20 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-24" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="pt-16 pb-24 max-w-lg mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-secondary rounded-full">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Người dùng</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground">Không tìm thấy người dùng</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 pb-24 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-secondary rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold">{profile.display_name || 'Người dùng'}</h1>
        </div>
        {isOwnProfile && (
          <Button variant="ghost" size="icon">
            <Settings size={20} />
          </Button>
        )}
      </div>

      {/* Profile Info */}
      <div className="px-4 mb-6">
        <div className="flex items-start gap-4">
          <Avatar className="w-20 h-20 ring-2 ring-primary/20">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-2xl">
              {profile.display_name?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex gap-6 mb-3">
              <div className="text-center">
                <p className="text-lg font-bold">{outfits.length}</p>
                <p className="text-xs text-muted-foreground">bài viết</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">{profile.followers_count}</p>
                <p className="text-xs text-muted-foreground">người theo dõi</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">{profile.following_count}</p>
                <p className="text-xs text-muted-foreground">đang theo dõi</p>
              </div>
            </div>

            {!isOwnProfile && (
              <Button
                variant={isFollowing ? 'outline' : 'default'}
                size="sm"
                className="w-full gap-2"
                onClick={handleFollowToggle}
                disabled={isFollowLoading}
              >
                {isFollowLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : isFollowing ? (
                  <>
                    <UserMinus size={16} />
                    Đang theo dõi
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    Theo dõi
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        <div className="mt-3">
          <p className="font-semibold text-sm">{profile.display_name || 'Người dùng'}</p>
          <p className="text-xs text-muted-foreground">
            Tham gia {formatDistanceToNow(new Date(profile.created_at), { locale: vi, addSuffix: true })}
          </p>
        </div>
      </div>

      {/* Tabs - Grid view */}
      <div className="border-t border-border">
        <div className="flex justify-center py-2 border-b border-border">
          <button className="flex items-center gap-1.5 px-4 py-2 text-foreground border-b-2 border-foreground">
            <Grid3X3 size={18} />
            <span className="text-xs font-semibold">BÀI VIẾT</span>
          </button>
        </div>

        {/* Outfits Grid */}
        {outfits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <Grid3X3 size={48} className="text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Chưa có bài viết</h3>
            <p className="text-muted-foreground text-sm">
              {isOwnProfile ? 'Chia sẻ outfit đầu tiên của bạn!' : 'Người dùng chưa chia sẻ outfit nào'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-0.5">
            {outfits.map((outfit) => (
              <button
                key={outfit.id}
                onClick={() => handleViewOutfit(outfit.id)}
                className="relative aspect-square overflow-hidden group"
              >
                <img
                  src={outfit.result_image_url}
                  alt={outfit.title}
                  className="w-full h-full object-cover"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <div className="flex items-center gap-1 text-background">
                    <Heart size={18} className="fill-current" />
                    <span className="font-semibold">{outfit.likes_count}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
