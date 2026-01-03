import { useState, useEffect } from 'react';
import { 
  Shirt, Plus, Trash2, Share2, FolderPlus, Edit2, 
  ImageOff, MoreVertical, Heart, Clock,
  Sparkles, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface ClothingItemData {
  name: string;
  imageUrl: string;
}

interface TryOnHistoryItem {
  id: string;
  body_image_url: string;
  result_image_url: string;
  clothing_items: ClothingItemData[];
  created_at: string;
  is_favorite?: boolean;
}

interface UserCollection {
  id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  items: TryOnHistoryItem[];
  created_at: string;
  updated_at: string;
}

interface WardrobePageProps {
  onNavigateToTryOn?: () => void;
}

const ITEMS_PER_PAGE = 12;

export const WardrobePage = ({ onNavigateToTryOn }: WardrobePageProps) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'outfits' | 'collections'>('outfits');
  const [history, setHistory] = useState<TryOnHistoryItem[]>([]);
  const [collections, setCollections] = useState<UserCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddToCollectionOpen, setIsAddToCollectionOpen] = useState(false);
  const [selectedOutfit, setSelectedOutfit] = useState<TryOnHistoryItem | null>(null);
  const [editingCollection, setEditingCollection] = useState<UserCollection | null>(null);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDesc, setNewCollectionDesc] = useState('');

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const fetchData = async (loadMore = false) => {
    if (!user) return;
    
    if (loadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setHistory([]);
      setHasMore(true);
    }
    
    const offset = loadMore ? history.length : 0;
    
    try {
      // Fetch try-on history with pagination and only needed columns
      const historyPromise = supabase
        .from('try_on_history')
        .select('id, result_image_url, clothing_items, created_at, is_favorite')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + ITEMS_PER_PAGE - 1);
      
      // Only fetch collections on initial load
      const collectionsPromise = !loadMore 
        ? supabase
            .from('user_collections')
            .select('id, name, description, cover_image_url, items, created_at, updated_at')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })
            .limit(20)
        : null;

      const [historyResult, collectionsResult] = await Promise.all([
        historyPromise,
        collectionsPromise
      ]);

      if (historyResult.error) {
        console.error('History error:', historyResult.error);
      } else {
        const newData = (historyResult.data || []).map((item) => ({
          id: item.id,
          body_image_url: '',
          result_image_url: item.result_image_url,
          clothing_items: (item.clothing_items || []) as unknown as ClothingItemData[],
          created_at: item.created_at,
          is_favorite: item.is_favorite,
        }));
        
        if (loadMore) {
          setHistory(prev => [...prev, ...newData]);
        } else {
          setHistory(newData);
          // Set favorite IDs
          const favIds = new Set(
            newData.filter(item => item.is_favorite).map(item => item.id)
          );
          setFavoriteIds(favIds);
        }
        
        // Check if there are more items
        setHasMore(newData.length === ITEMS_PER_PAGE);
      }

      if (collectionsResult && !collectionsResult.error) {
        const typedCollections = (collectionsResult.data || []).map((col) => ({
          id: col.id,
          name: col.name,
          description: col.description,
          cover_image_url: col.cover_image_url,
          items: (col.items || []) as unknown as TryOnHistoryItem[],
          created_at: col.created_at,
          updated_at: col.updated_at,
        }));
        setCollections(typedCollections);
      } else if (collectionsResult?.error) {
        console.error('Collections error:', collectionsResult.error);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchData(true);
    }
  };

  const handleCreateCollection = async () => {
    if (!user || !newCollectionName.trim()) return;

    const { data, error } = await supabase
      .from('user_collections')
      .insert([{
        user_id: user.id,
        name: newCollectionName.trim(),
        description: newCollectionDesc.trim() || null,
        items: [],
      }])
      .select()
      .single();

    if (error) {
      toast.error(t('wardrobe_cannot_create'));
      console.error(error);
    } else {
      const newCol: UserCollection = {
        ...data,
        items: [],
      };
      setCollections(prev => [newCol, ...prev]);
      toast.success(t('wardrobe_collection_created'));
      setIsCreateDialogOpen(false);
      setNewCollectionName('');
      setNewCollectionDesc('');
    }
  };

  const handleUpdateCollection = async () => {
    if (!editingCollection || !newCollectionName.trim()) return;

    const { error } = await supabase
      .from('user_collections')
      .update({
        name: newCollectionName.trim(),
        description: newCollectionDesc.trim() || null,
      })
      .eq('id', editingCollection.id);

    if (error) {
      toast.error(t('wardrobe_cannot_update'));
      console.error(error);
    } else {
      setCollections(prev => 
        prev.map(c => 
          c.id === editingCollection.id 
            ? { ...c, name: newCollectionName.trim(), description: newCollectionDesc.trim() || null }
            : c
        )
      );
      toast.success(t('wardrobe_collection_updated'));
      setIsEditDialogOpen(false);
      setEditingCollection(null);
      setNewCollectionName('');
      setNewCollectionDesc('');
    }
  };

  const handleDeleteCollection = async (collection: UserCollection) => {
    const { error } = await supabase
      .from('user_collections')
      .delete()
      .eq('id', collection.id);

    if (error) {
      toast.error(t('wardrobe_cannot_delete'));
      console.error(error);
    } else {
      setCollections(prev => prev.filter(c => c.id !== collection.id));
      toast.success(t('wardrobe_collection_deleted'));
    }
  };

  const handleAddToCollection = async (collection: UserCollection) => {
    if (!selectedOutfit) return;

    // Check if outfit already in collection
    const existingItems = collection.items || [];
    if (existingItems.some(item => item.id === selectedOutfit.id)) {
      toast.error(t('wardrobe_already_in'));
      return;
    }

    const updatedItems = [...existingItems, selectedOutfit];
    
    const { error } = await supabase
      .from('user_collections')
      .update({
        items: JSON.parse(JSON.stringify(updatedItems)),
        cover_image_url: collection.cover_image_url || selectedOutfit.result_image_url,
      })
      .eq('id', collection.id);

    if (error) {
      toast.error(t('wardrobe_cannot_add'));
      console.error(error);
    } else {
      setCollections(prev => 
        prev.map(c => 
          c.id === collection.id 
            ? { 
                ...c, 
                items: updatedItems,
                cover_image_url: c.cover_image_url || selectedOutfit.result_image_url 
              }
            : c
        )
      );
      toast.success(t('wardrobe_added_to').replace('{name}', collection.name));
      setIsAddToCollectionOpen(false);
      setSelectedOutfit(null);
    }
  };

  const handleRemoveFromCollection = async (collection: UserCollection, outfitId: string) => {
    const updatedItems = collection.items.filter(item => item.id !== outfitId);
    
    const { error } = await supabase
      .from('user_collections')
      .update({
        items: JSON.parse(JSON.stringify(updatedItems)),
      })
      .eq('id', collection.id);

    if (error) {
      toast.error(t('wardrobe_cannot_remove'));
      console.error(error);
    } else {
      setCollections(prev => 
        prev.map(c => 
          c.id === collection.id ? { ...c, items: updatedItems } : c
        )
      );
      toast.success(t('wardrobe_removed_from'));
    }
  };

  const openEditDialog = (collection: UserCollection) => {
    setEditingCollection(collection);
    setNewCollectionName(collection.name);
    setNewCollectionDesc(collection.description || '');
    setIsEditDialogOpen(true);
  };

  const formatDate = (dateStr: string) => {
    return formatDistanceToNow(new Date(dateStr), { locale: vi, addSuffix: true });
  };

  const toggleFavorite = async (outfitId: string) => {
    if (!user) return;
    
    const isFavorite = favoriteIds.has(outfitId);
    
    try {
      if (isFavorite) {
        await supabase
          .from('try_on_history')
          .update({ is_favorite: false })
          .eq('id', outfitId);
        setFavoriteIds(prev => {
          const next = new Set(prev);
          next.delete(outfitId);
          return next;
        });
      } else {
        await supabase
          .from('try_on_history')
          .update({ is_favorite: true })
          .eq('id', outfitId);
        setFavoriteIds(prev => new Set([...prev, outfitId]));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleDeleteOutfit = async (outfitId: string) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('try_on_history')
      .delete()
      .eq('id', outfitId);
    
    if (error) {
      toast.error('Không thể xóa outfit');
    } else {
      setHistory(prev => prev.filter(h => h.id !== outfitId));
      toast.success('Đã xóa outfit');
    }
  };

  // Not logged in
  if (!authLoading && !user) {
    return (
      <div className="pb-24 pt-16 px-4 max-w-lg mx-auto">
        <div className="text-center py-12">
          <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
            <Shirt size={32} className="text-muted-foreground" />
          </div>
          <h2 className="font-display font-bold text-lg text-foreground mb-2">
            {t('wardrobe_login_to_view')}
          </h2>
          <p className="text-muted-foreground text-sm mb-4">
            {t('wardrobe_login_required')}
          </p>
          <Button onClick={() => navigate('/auth')} className="gradient-primary">
            {t('login')}
          </Button>
        </div>
      </div>
    );
  }

  // Loading
  if (loading || authLoading) {
    return (
      <div className="pb-24 pt-16 px-4 max-w-lg mx-auto flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-24 h-24">
          <DotLottieReact
            src="https://lottie.host/0c5e8c0a-6af5-4b32-bdbd-25d0d04f7980/W8dWzCXoD9.lottie"
            loop
            autoplay
            style={{ width: '100%', height: '100%' }}
          />
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">👗 {t('loading')}...</p>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-16 px-4 max-w-lg mx-auto space-y-4">
      {/* Stats Bar */}
      <div className="flex items-center justify-between bg-card rounded-xl p-3 border border-border">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{history.length}</p>
            <p className="text-xs text-muted-foreground">Outfit</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{collections.length}</p>
            <p className="text-xs text-muted-foreground">Bộ sưu tập</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{favoriteIds.size}</p>
            <p className="text-xs text-muted-foreground">Yêu thích</p>
          </div>
        </div>
        {onNavigateToTryOn && (
          <Button size="sm" onClick={onNavigateToTryOn} className="gradient-primary">
            <Plus size={16} />
            Thử đồ
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-muted rounded-xl">
        <button
          onClick={() => setActiveTab('outfits')}
          className={cn(
            "flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2",
            activeTab === 'outfits'
              ? 'bg-card text-foreground shadow-soft'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Shirt size={16} />
          Outfit ({history.length})
        </button>
        <button
          onClick={() => setActiveTab('collections')}
          className={cn(
            "flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2",
            activeTab === 'collections'
              ? 'bg-card text-foreground shadow-soft'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <FolderPlus size={16} />
          Bộ sưu tập ({collections.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'outfits' ? (
        <section className="animate-slide-up">
          {history.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                <ImageOff size={32} className="text-muted-foreground" />
              </div>
              <h3 className="font-display font-bold text-lg text-foreground mb-2">
                {t('wardrobe_no_outfit')}
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                {t('history_try_and_save')}
              </p>
              {onNavigateToTryOn && (
                <Button onClick={onNavigateToTryOn} className="gradient-primary">
                  <Sparkles size={18} />
                  {t('wardrobe_try_now')}
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                {history.map((item, index) => (
                  <div
                    key={item.id}
                    className="bg-card rounded-2xl overflow-hidden shadow-soft border border-border animate-slide-up group relative"
                    style={{ animationDelay: `${Math.min(index, 5) * 0.05}s` }}
                  >
                    <div className="relative aspect-[3/4] bg-secondary">
                      <img
                        src={item.result_image_url}
                        alt="Outfit"
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                      
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      {/* Top actions */}
                      <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
                        {/* Clothing count badge */}
                        {item.clothing_items?.length > 0 && (
                          <div className="px-2 py-1 rounded-full bg-card/90 backdrop-blur-sm text-xs font-medium text-foreground">
                            {item.clothing_items.length} món
                          </div>
                        )}
                        
                        {/* Favorite button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(item.id);
                          }}
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                            favoriteIds.has(item.id) 
                              ? "bg-red-500 text-white" 
                              : "bg-card/90 backdrop-blur-sm text-foreground opacity-0 group-hover:opacity-100"
                          )}
                        >
                          <Heart size={14} className={cn(favoriteIds.has(item.id) && "fill-current")} />
                        </button>
                      </div>

                      {/* Bottom actions - visible on hover */}
                      <div className="absolute bottom-2 left-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setSelectedOutfit(item);
                            setIsAddToCollectionOpen(true);
                          }}
                          className="flex-1 py-1.5 rounded-lg bg-card/90 backdrop-blur-sm text-xs font-medium text-foreground flex items-center justify-center gap-1"
                        >
                          <FolderPlus size={12} />
                          Thêm vào
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="w-8 h-8 rounded-lg bg-card/90 backdrop-blur-sm flex items-center justify-center">
                              <MoreVertical size={14} className="text-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              navigator.clipboard.writeText(item.result_image_url);
                              toast.success('Đã sao chép link ảnh');
                            }}>
                              <Share2 size={14} className="mr-2" />
                              Chia sẻ
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDeleteOutfit(item.id)}
                            >
                              <Trash2 size={14} className="mr-2" />
                              Xóa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="p-3">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock size={12} />
                        {formatDate(item.created_at)}
                      </div>
                      {item.clothing_items?.length > 0 && (
                        <p className="text-xs text-foreground mt-1 truncate">
                          {item.clothing_items.map(c => c.name).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Skeleton loading items */}
                {loadingMore && Array.from({ length: 4 }).map((_, i) => (
                  <div key={`skeleton-${i}`} className="bg-card rounded-2xl overflow-hidden shadow-soft border border-border">
                    <div className="aspect-[3/4] bg-secondary animate-pulse" />
                    <div className="p-3 space-y-2">
                      <div className="h-3 bg-secondary rounded animate-pulse w-2/3" />
                      <div className="h-3 bg-secondary rounded animate-pulse w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Load more button */}
              {hasMore && !loadingMore && history.length > 0 && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    className="w-full max-w-xs"
                  >
                    Xem thêm
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      ) : (
        <section className="space-y-4 animate-slide-up">
          {/* Create collection button */}
          <Button
            variant="outline"
            className="w-full border-dashed border-2 h-12"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <FolderPlus size={18} />
            {t('wardrobe_create_collection')}
          </Button>

          {/* Collections list */}
          {collections.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">
                {t('wardrobe_no_collection')}
              </p>
            </div>
          ) : (
            collections.map((collection, index) => (
              <div
                key={collection.id}
                className="bg-card rounded-2xl overflow-hidden shadow-soft border border-border hover:border-primary/50 transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Collection header */}
                <div className="flex items-start gap-3 p-4">
                  {/* Cover image */}
                  <div className="w-16 h-16 rounded-xl bg-secondary overflow-hidden flex-shrink-0">
                    {collection.cover_image_url ? (
                      <img
                        src={collection.cover_image_url}
                        alt={collection.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Shirt size={24} className="text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {collection.name}
                    </h3>
                    {collection.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {collection.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {collection.items?.length || 0} {t('wardrobe_outfit')} • {formatDate(collection.created_at)}
                    </p>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="iconSm">
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(collection)}>
                        <Edit2 size={14} className="mr-2" />
                        {t('wardrobe_edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          toast.success(t('copied_link'));
                        }}
                      >
                        <Share2 size={14} className="mr-2" />
                        {t('share')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDeleteCollection(collection)}
                      >
                        <Trash2 size={14} className="mr-2" />
                        {t('delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Collection items preview */}
                {collection.items?.length > 0 ? (
                  <div className="px-4 pb-4">
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                      {collection.items.slice(0, 5).map((item) => (
                        <div
                          key={item.id}
                          className="relative flex-shrink-0 w-20 h-24 rounded-lg overflow-hidden bg-secondary group/item"
                        >
                          <img
                            src={item.result_image_url}
                            alt="Outfit"
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => handleRemoveFromCollection(collection, item.id)}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive/90 flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity"
                          >
                            <Trash2 size={10} className="text-destructive-foreground" />
                          </button>
                        </div>
                      ))}
                      {collection.items.length > 5 && (
                        <div className="flex-shrink-0 w-20 h-24 rounded-lg bg-secondary flex items-center justify-center">
                          <span className="text-sm text-muted-foreground">
                            +{collection.items.length - 5}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="px-4 pb-4">
                    <div className="flex items-center justify-center py-6 border border-dashed border-border rounded-xl">
                      <div className="text-center">
                        <Plus size={20} className="mx-auto text-muted-foreground/50 mb-1" />
                        <p className="text-xs text-muted-foreground">
                          {t('wardrobe_add_from_saved')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </section>
      )}

      {/* Create Collection Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('wardrobe_create_collection')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t('wardrobe_collection_name')}
              </label>
              <Input
                placeholder=""
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t('wardrobe_description')}
              </label>
              <Input
                placeholder=""
                value={newCollectionDesc}
                onChange={(e) => setNewCollectionDesc(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button 
              onClick={handleCreateCollection}
              disabled={!newCollectionName.trim()}
              className="gradient-primary"
            >
              {t('wardrobe_create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Collection Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('wardrobe_edit_collection')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t('wardrobe_collection_name')}
              </label>
              <Input
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t('wardrobe_description')}
              </label>
              <Input
                value={newCollectionDesc}
                onChange={(e) => setNewCollectionDesc(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button 
              onClick={handleUpdateCollection}
              disabled={!newCollectionName.trim()}
              className="gradient-primary"
            >
              {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add to Collection Dialog */}
      <Dialog open={isAddToCollectionOpen} onOpenChange={setIsAddToCollectionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('wardrobe_add_to_collection')}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2 max-h-[300px] overflow-y-auto">
            {collections.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground text-sm mb-3">
                  {t('wardrobe_no_collection')}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsAddToCollectionOpen(false);
                    setIsCreateDialogOpen(true);
                  }}
                >
                  <Plus size={14} className="mr-1" />
                  {t('wardrobe_create_collection')}
                </Button>
              </div>
            ) : (
              collections.map((collection) => (
                <button
                  key={collection.id}
                  onClick={() => handleAddToCollection(collection)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-left"
                >
                  <div className="w-12 h-12 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
                    {collection.cover_image_url ? (
                      <img
                        src={collection.cover_image_url}
                        alt={collection.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Shirt size={20} className="text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {collection.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {collection.items?.length || 0} {t('wardrobe_outfit')}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground" />
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
