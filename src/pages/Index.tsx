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
import { SearchPage } from './SearchPage';
import CommunityFeedPage from './CommunityFeedPage';
import { CompareProvider } from '@/contexts/CompareContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { GemsPurchaseDialog } from '@/components/monetization/GemsPurchaseDialog';
import { ClothingItem } from '@/types/clothing';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Navigation tab type for the new navigation structure
 * Requirements: 1.1 - Home, Search, FAB, Community, Wardrobe
 */
type NavigationTab = 'home' | 'search' | 'community' | 'wardrobe' | 'profile' | 'history' | 'favorites' | 'closet' | 'saved' | 'compare';

const MainApp = () => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('home');
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [isGemsPurchaseOpen, setIsGemsPurchaseOpen] = useState(false);
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
    setIsStudioOpen(true); // Open studio overlay instead of switching tab
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
    setIsStudioOpen(true); // Open studio overlay
  };

  /**
   * Open Studio overlay - FAB action
   * Requirements: 4.4 - FAB opens Studio without changing active tab
   */
  const handleOpenStudio = () => {
    setIsStudioOpen(true);
  };

  /**
   * Close Studio overlay
   * Requirements: 8.4 - Closing Studio doesn't change active tab
   */
  const handleCloseStudio = () => {
    setIsStudioOpen(false);
    setSelectedItem(undefined);
    setReuseBodyImage(undefined);
    setReuseClothingItems([]);
    setHistoryResult(undefined);
  };

  /**
   * Handle Gems button click - open purchase dialog
   * Requirements: 7.4 - Show gems balance and purchase options
   */
  const handleGemsClick = () => {
    setIsGemsPurchaseOpen(true);
  };

  const renderPage = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomePage 
            onNavigateToTryOn={handleOpenStudio}
            onNavigateToCompare={() => setActiveTab('compare')}
            onNavigateToHistory={() => setActiveTab('history')}
            onSelectItem={handleSelectItem}
            onViewHistoryResult={handleViewHistoryResult}
          />
        );
      case 'search':
        return (
          <SearchPage 
            onSelectItem={handleSelectItem}
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
            onNavigateToTryOn={handleOpenStudio}
            onReuseHistory={handleReuseHistory}
          />
        );
      case 'wardrobe':
        return <WardrobePage onNavigateToTryOn={handleOpenStudio} />;
      case 'closet':
        return <ClosetPage onNavigateToTryOn={handleOpenStudio} />;
      case 'saved':
        return <SavedOutfitsPage onNavigateBack={() => setActiveTab('home')} />;
      case 'community':
        return <CommunityFeedPage />;
      default:
        return (
          <HomePage 
            onNavigateToTryOn={handleOpenStudio}
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
      {/* Header - hidden when Studio is open */}
      {!isStudioOpen && (
        <Header
          title="TryOn"
          showNotification={activeTab === 'home'}
          showGems={true}
          onAvatarClick={() => setActiveTab('profile')}
          onSavedClick={() => setActiveTab('saved')}
          onGemsClick={handleGemsClick}
        />
      )}

      <main className="min-h-screen">
        {renderPage()}
      </main>

      {/* Bottom Navigation - hidden when Studio is open */}
      {!isStudioOpen && (
        <MobileNav 
          activeTab={activeTab} 
          onTabChange={(tab) => setActiveTab(tab as NavigationTab)}
          onOpenStudio={handleOpenStudio}
        />
      )}

      {/* Studio Overlay - Full screen TryOnPage */}
      {isStudioOpen && (
        <div className="fixed inset-0 z-50 bg-background">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-10 bg-background/80 backdrop-blur-sm"
            onClick={handleCloseStudio}
          >
            <X size={24} />
          </Button>
          
          <TryOnPage 
            initialItem={selectedItem} 
            reuseBodyImage={reuseBodyImage}
            reuseClothingItems={reuseClothingItems}
            historyResult={historyResult}
          />
        </div>
      )}

      {/* Gems Purchase Dialog */}
      <GemsPurchaseDialog
        isOpen={isGemsPurchaseOpen}
        onClose={() => setIsGemsPurchaseOpen(false)}
      />
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
