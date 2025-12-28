import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { HomePage } from './HomePage';
import { TryOnPage } from './TryOnPage';
import { ComparePage } from './ComparePage';
import { FavoritesPage } from './FavoritesPage';
import { ProfilePage } from './ProfilePage';
import { HistoryPage } from './HistoryPage';
import { WardrobePage } from './WardrobePage';
import { ClosetPage } from './ClosetPage';
import { AuthPage } from './AuthPage';
import { SharedOutfitDetailPage } from './SharedOutfitDetailPage';
import { SavedOutfitsPage } from './SavedOutfitsPage';
import { UserProfilePage } from './UserProfilePage';
import CommunityFeedPage from './CommunityFeedPage';
import { CompareProvider } from '@/contexts/CompareContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ClothingItem } from '@/types/clothing';
import { toast } from 'sonner';

const MainApp = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedItem, setSelectedItem] = useState<ClothingItem | undefined>();
  const [reuseBodyImage, setReuseBodyImage] = useState<string | undefined>();
  const [reuseClothingItems, setReuseClothingItems] = useState<ClothingItem[]>([]);
  const [historyResult, setHistoryResult] = useState<{
    resultImageUrl: string;
    bodyImageUrl: string;
    clothingItems: Array<{ name: string; imageUrl: string }>;
  } | undefined>();

  const handleSelectItem = (item: ClothingItem) => {
    setSelectedItem(item);
    setReuseBodyImage(undefined);
    setReuseClothingItems([]);
    setHistoryResult(undefined);
    setActiveTab('tryOn');
    toast.success(`Đã chọn ${item.name} để thử`);
  };

  const handleReuseHistory = (bodyImageUrl: string, clothingItems: ClothingItem[]) => {
    setReuseBodyImage(bodyImageUrl);
    setReuseClothingItems(clothingItems);
    setSelectedItem(undefined);
    setHistoryResult(undefined);
  };

  const handleViewHistoryResult = (item: {
    id: string;
    result_image_url: string;
    body_image_url: string;
    created_at: string;
    clothing_items: Array<{ name: string; imageUrl: string }>;
  }) => {
    setHistoryResult({
      resultImageUrl: item.result_image_url,
      bodyImageUrl: item.body_image_url,
      clothingItems: item.clothing_items,
    });
    setSelectedItem(undefined);
    setReuseBodyImage(undefined);
    setReuseClothingItems([]);
    setActiveTab('tryOn');
  };

  const renderPage = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomePage 
            onNavigateToTryOn={() => setActiveTab('tryOn')}
            onNavigateToCompare={() => setActiveTab('compare')}
            onNavigateToHistory={() => setActiveTab('history')}
            onSelectItem={handleSelectItem}
            onViewHistoryResult={handleViewHistoryResult}
          />
        );
      case 'tryOn':
        return (
          <TryOnPage 
            initialItem={selectedItem} 
            reuseBodyImage={reuseBodyImage}
            reuseClothingItems={reuseClothingItems}
            historyResult={historyResult}
          />
        );
      case 'compare':
        return <ComparePage />;
      case 'favorites':
        return <FavoritesPage onSelectItem={handleSelectItem} />;
      case 'profile':
        return <ProfilePage onNavigateToHistory={() => setActiveTab('history')} />;
      case 'history':
        return (
          <HistoryPage 
            onNavigateToCompare={() => setActiveTab('compare')} 
            onNavigateToTryOn={() => setActiveTab('tryOn')}
            onReuseHistory={handleReuseHistory}
          />
        );
      case 'wardrobe':
        return <WardrobePage onNavigateToTryOn={() => setActiveTab('tryOn')} />;
      case 'closet':
        return <ClosetPage onNavigateToTryOn={() => setActiveTab('tryOn')} />;
      case 'saved':
        return <SavedOutfitsPage onNavigateBack={() => setActiveTab('home')} />;
      case 'community':
        return <CommunityFeedPage />;
      default:
        return (
          <HomePage 
            onNavigateToTryOn={() => setActiveTab('tryOn')}
            onNavigateToCompare={() => setActiveTab('compare')}
            onNavigateToHistory={() => setActiveTab('history')}
            onSelectItem={handleSelectItem}
            onViewHistoryResult={handleViewHistoryResult}
          />
        );
    }
  };

  return (
    <div className="mobile-viewport bg-background">
      <Header
        title="TryOn"
        showNotification={activeTab === 'home'}
        onAvatarClick={() => setActiveTab('profile')}
        onSavedClick={() => setActiveTab('saved')}
      />

      <main className="min-h-screen">
        {renderPage()}
      </main>

      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

const Index = () => {
  return (
    <AuthProvider>
      <CompareProvider>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/outfit/:id" element={<SharedOutfitDetailPage />} />
          <Route path="/user/:userId" element={<UserProfilePage />} />
          <Route path="/community" element={<CommunityFeedPage />} />
          <Route path="/*" element={<MainApp />} />
        </Routes>
      </CompareProvider>
    </AuthProvider>
  );
};

export default Index;
