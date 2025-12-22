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
import { CompareProvider } from '@/contexts/CompareContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ClothingItem } from '@/types/clothing';
import { toast } from 'sonner';

const pageTitles: Record<string, string> = {
  home: 'Virtual Try-On',
  tryOn: 'Phòng thử đồ',
  compare: 'So sánh Outfit',
  favorites: 'Yêu thích',
  profile: 'Tài khoản',
  history: 'Lịch sử thử đồ',
  wardrobe: 'Tủ quần áo',
  closet: 'Tủ đồ của tôi',
};

const MainApp = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedItem, setSelectedItem] = useState<ClothingItem | undefined>();
  const [reuseBodyImage, setReuseBodyImage] = useState<string | undefined>();
  const [reuseClothingItems, setReuseClothingItems] = useState<ClothingItem[]>([]);

  const handleSelectItem = (item: ClothingItem) => {
    setSelectedItem(item);
    setReuseBodyImage(undefined);
    setReuseClothingItems([]);
    setActiveTab('tryOn');
    toast.success(`Đã chọn ${item.name} để thử`);
  };

  const handleShare = () => {
    toast.success('Đã sao chép link chia sẻ!');
  };

  const handleReuseHistory = (bodyImageUrl: string, clothingItems: ClothingItem[]) => {
    setReuseBodyImage(bodyImageUrl);
    setReuseClothingItems(clothingItems);
    setSelectedItem(undefined);
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
          />
        );
      case 'tryOn':
        return (
          <TryOnPage 
            initialItem={selectedItem} 
            reuseBodyImage={reuseBodyImage}
            reuseClothingItems={reuseClothingItems}
          />
        );
      case 'compare':
        return <ComparePage onBack={() => setActiveTab('home')} />;
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
      default:
        return (
          <HomePage 
            onNavigateToTryOn={() => setActiveTab('tryOn')}
            onNavigateToCompare={() => setActiveTab('compare')}
            onNavigateToHistory={() => setActiveTab('history')}
            onSelectItem={handleSelectItem}
          />
        );
    }
  };

  return (
    <div className="mobile-viewport bg-background">
      <Header
        title={pageTitles[activeTab] || 'Virtual Try-On'}
        showBack={activeTab !== 'home'}
        showShare={activeTab === 'tryOn' || activeTab === 'compare'}
        showNotification={activeTab === 'home'}
        onBack={() => setActiveTab('home')}
        onShare={handleShare}
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
          <Route path="/*" element={<MainApp />} />
        </Routes>
      </CompareProvider>
    </AuthProvider>
  );
};

export default Index;
