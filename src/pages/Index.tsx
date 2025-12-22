import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { TryOnPage } from './TryOnPage';
import { ComparePage } from './ComparePage';
import { FavoritesPage } from './FavoritesPage';
import { ProfilePage } from './ProfilePage';
import { HistoryPage } from './HistoryPage';
import { WardrobePage } from './WardrobePage';
import { AuthPage } from './AuthPage';
import { CompareProvider } from '@/contexts/CompareContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ClothingItem } from '@/types/clothing';
import { toast } from 'sonner';

const pageTitles: Record<string, string> = {
  tryOn: 'Phòng thử đồ',
  compare: 'So sánh Outfit',
  favorites: 'Yêu thích',
  profile: 'Tài khoản',
  history: 'Lịch sử thử đồ',
  wardrobe: 'Tủ quần áo',
};

const MainApp = () => {
  const [activeTab, setActiveTab] = useState('tryOn');
  const [selectedItem, setSelectedItem] = useState<ClothingItem | undefined>();

  const handleSelectItem = (item: ClothingItem) => {
    setSelectedItem(item);
    setActiveTab('tryOn');
    toast.success(`Đã chọn ${item.name} để thử`);
  };

  const handleShare = () => {
    toast.success('Đã sao chép link chia sẻ!');
  };

  const renderPage = () => {
    switch (activeTab) {
      case 'tryOn':
        return <TryOnPage initialItem={selectedItem} />;
      case 'compare':
        return <ComparePage onBack={() => setActiveTab('tryOn')} />;
      case 'favorites':
        return <FavoritesPage onSelectItem={handleSelectItem} />;
      case 'profile':
        return <ProfilePage onNavigateToHistory={() => setActiveTab('history')} />;
      case 'history':
        return <HistoryPage />;
      case 'wardrobe':
        return <WardrobePage onNavigateToTryOn={() => setActiveTab('tryOn')} />;
      default:
        return <TryOnPage initialItem={selectedItem} />;
    }
  };

  return (
    <div className="mobile-viewport bg-background">
      <Header
        title={pageTitles[activeTab] || 'Phòng thử đồ'}
        showBack={activeTab !== 'tryOn'}
        showShare={activeTab === 'tryOn' || activeTab === 'compare'}
        showNotification={false}
        onBack={() => setActiveTab('tryOn')}
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
