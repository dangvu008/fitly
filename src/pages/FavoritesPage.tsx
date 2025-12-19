import { useState } from 'react';
import { Heart, Plus, Trash2, Share2, FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClothingCard } from '@/components/clothing/ClothingCard';
import { sampleClothing, sampleCollections } from '@/data/sampleClothing';
import { ClothingItem, Collection } from '@/types/clothing';
import { toast } from 'sonner';

interface FavoritesPageProps {
  onSelectItem: (item: ClothingItem) => void;
}

export const FavoritesPage = ({ onSelectItem }: FavoritesPageProps) => {
  const [clothing, setClothing] = useState(sampleClothing);
  const [collections, setCollections] = useState(sampleCollections);
  const [activeTab, setActiveTab] = useState<'items' | 'collections'>('items');

  const favoriteItems = clothing.filter(c => c.isFavorite);

  const toggleFavorite = (item: ClothingItem) => {
    setClothing(prev =>
      prev.map(c =>
        c.id === item.id ? { ...c, isFavorite: !c.isFavorite } : c
      )
    );
    toast.success(item.isFavorite ? 'Đã bỏ yêu thích' : 'Đã thêm vào yêu thích');
  };

  const handleCreateCollection = () => {
    const newCollection: Collection = {
      id: Date.now().toString(),
      name: `Bộ sưu tập ${collections.length + 1}`,
      items: [],
      createdAt: new Date(),
    };
    setCollections(prev => [...prev, newCollection]);
    toast.success('Đã tạo bộ sưu tập mới!');
  };

  const handleDeleteCollection = (id: string) => {
    setCollections(prev => prev.filter(c => c.id !== id));
    toast.success('Đã xóa bộ sưu tập');
  };

  const handleShareCollection = () => {
    toast.success('Đã sao chép link chia sẻ!');
  };

  return (
    <div className="pb-24 pt-16 px-4 space-y-6 max-w-md mx-auto">
      {/* Header */}
      <section className="text-center animate-slide-up">
        <div className="w-16 h-16 rounded-2xl gradient-accent mx-auto flex items-center justify-center mb-4">
          <Heart size={32} className="text-accent-foreground fill-accent-foreground" />
        </div>
        <h2 className="font-display font-bold text-2xl text-foreground mb-2">
          Yêu thích của bạn
        </h2>
        <p className="text-muted-foreground text-sm">
          {favoriteItems.length} món • {collections.length} bộ sưu tập
        </p>
      </section>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-muted rounded-xl">
        <button
          onClick={() => setActiveTab('items')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all duration-300 ${
            activeTab === 'items'
              ? 'bg-card text-foreground shadow-soft'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Món đồ ({favoriteItems.length})
        </button>
        <button
          onClick={() => setActiveTab('collections')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all duration-300 ${
            activeTab === 'collections'
              ? 'bg-card text-foreground shadow-soft'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Bộ sưu tập ({collections.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'items' ? (
        <section className="animate-slide-up">
          {favoriteItems.length === 0 ? (
            <div className="text-center py-12">
              <Heart size={48} className="mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Chưa có món đồ yêu thích</p>
              <p className="text-sm text-muted-foreground mt-1">
                Nhấn vào trái tim để thêm
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {favoriteItems.map((item) => (
                <ClothingCard
                  key={item.id}
                  item={item}
                  size="lg"
                  onSelect={() => onSelectItem(item)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="space-y-4 animate-slide-up">
          {/* Create collection button */}
          <Button
            variant="outline"
            className="w-full border-dashed border-2"
            onClick={handleCreateCollection}
          >
            <FolderPlus size={18} />
            Tạo bộ sưu tập mới
          </Button>

          {/* Collections list */}
          {collections.map((collection, index) => (
            <div
              key={collection.id}
              className="bg-card rounded-2xl p-4 shadow-soft border border-border hover:border-primary/50 transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-foreground">{collection.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {collection.items.length} món • {new Date(collection.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="iconSm"
                    onClick={handleShareCollection}
                  >
                    <Share2 size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="iconSm"
                    onClick={() => handleDeleteCollection(collection.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>

              {collection.items.length > 0 ? (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {collection.items.map((item) => (
                    <ClothingCard
                      key={item.id}
                      item={item}
                      size="sm"
                      onSelect={() => onSelectItem(item)}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-6 border border-dashed border-border rounded-xl">
                  <div className="text-center">
                    <Plus size={24} className="mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-xs text-muted-foreground">Thêm món đồ</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
};
