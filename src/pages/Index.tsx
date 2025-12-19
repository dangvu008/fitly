import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { HomePage } from './HomePage';
import { TryOnPage } from './TryOnPage';
import { SuggestPage } from './SuggestPage';
import { FavoritesPage } from './FavoritesPage';
import { ProfilePage } from './ProfilePage';
import { ClothingItem } from '@/types/clothing';
import { toast } from 'sonner';

const pageTitles: Record<string, string> = {
  home: 'Virtual Try-On',
  tryOn: 'Phòng thử đồ',
  suggest: 'Gợi ý',
  favorites: 'Yêu thích',
  profile: 'Tài khoản',
};

const Index = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedItem, setSelectedItem] = useState<ClothingItem | undefined>();

  const handleNavigateToTryOn = () => {
    setActiveTab('tryOn');
  };

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
      case 'home':
        return (
          <HomePage
            onNavigateToTryOn={handleNavigateToTryOn}
            onSelectItem={handleSelectItem}
          />
        );
      case 'tryOn':
        return <TryOnPage initialItem={selectedItem} />;
      case 'suggest':
        return <SuggestPage onSelectItem={handleSelectItem} />;
      case 'favorites':
        return <FavoritesPage onSelectItem={handleSelectItem} />;
      case 'profile':
        return <ProfilePage />;
      default:
        return null;
    }
  };

  return (
    <div className="mobile-viewport bg-background">
      <Header
        title={pageTitles[activeTab]}
        showBack={activeTab !== 'home'}
        showShare={activeTab === 'tryOn'}
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

export default Index;
