import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { HomePage } from './HomePage';
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
import { TryOnDialogProvider, useTryOnDialog } from '@/contexts/TryOnDialogContext';
import { GemsPurchaseDialog } from '@/components/monetization/GemsPurchaseDialog';
import { ClipboardLinkToast } from '@/components/smartPaste/ClipboardLinkToast';
import { CrawlErrorToast } from '@/components/smartPaste/CrawlErrorToast';
import { GemGate } from '@/components/tryOn/GemGate';
import { useSmartPaste } from '@/hooks/useSmartPaste';
import { ClothingItem } from '@/types/clothing';
import { toast } from 'sonner';

/**
 * Navigation tab type for the new navigation structure
 * Requirements: 1.1 - Home, Search, FAB, Community, Wardrobe
 */
type NavigationTab = 'home' | 'search' | 'community' | 'wardrobe' | 'profile' | 'history' | 'favorites' | 'closet' | 'saved' | 'compare';

const MainApp = () => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('home');
  const [isGemsPurchaseOpen, setIsGemsPurchaseOpen] = useState(false);
  
  // Use TryOnDialog hook for opening try-on popup
  const { openDialog: openTryOnDialog } = useTryOnDialog();

  // Smart Paste hook for clipboard detection
  const {
    detectedLink,
    isCrawling,
    crawlError,
    dismissLink,
    handleTryFromLink,
    retryCrawl,
    clearCrawlError,
    // Gem gate state and actions (REQ-11.1, REQ-11.2)
    showGemGate,
    gemBalance,
    gemCost,
    closeGemGate,
    onGemGateProceed,
    onWatchAd,
  } = useSmartPaste();

  const handleSelectItem = (item: ClothingItem) => {
    openTryOnDialog({ initialItem: item });
    toast.success(`Đã chọn ${item.name} để thử`);
  };

  const handleViewHistoryResult = (item: {
    id: string;
    result_image_url: string;
    body_image_url: string;
    created_at: string;
    clothing_items: Array<{ name: string; imageUrl: string }>;
  }) => {
    openTryOnDialog({
      historyResult: {
        resultImageUrl: item.result_image_url,
        bodyImageUrl: item.body_image_url,
        clothingItems: item.clothing_items,
      },
    });
  };

  /**
   * Open TryOn dialog - FAB action
   * Requirements: 4.4 - FAB opens TryOn dialog without changing active tab
   */
  const handleOpenTryOn = () => {
    openTryOnDialog();
  };

  /**
   * Quick Try - Open TryOn dialog with garment URL for Smart Paste flow
   * Requirements: REQ-8.1, REQ-8.2
   */
  const handleQuickTry = (garmentUrl: string, garmentId?: string, autoStart = false) => {
    openTryOnDialog({
      initialGarmentUrl: garmentUrl,
      initialGarmentId: garmentId,
      autoStart,
    });
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
            onNavigateToTryOn={handleOpenTryOn}
            onNavigateToCompare={() => setActiveTab('compare')}
            onNavigateToHistory={() => setActiveTab('history')}
            onSelectItem={handleSelectItem}
            onViewHistoryResult={handleViewHistoryResult}
            onQuickTry={handleQuickTry}
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
        return <ProfilePage onNavigateToHistory={() => setActiveTab('history')} onNavigateToSaved={() => setActiveTab('saved')} />;
      case 'history':
        return (
          <HistoryPage 
            onNavigateToCompare={() => setActiveTab('compare')} 
          />
        );
      case 'wardrobe':
        return <WardrobePage onNavigateToTryOn={handleOpenTryOn} />;
      case 'closet':
        return <ClosetPage onNavigateToTryOn={handleOpenTryOn} />;
      case 'saved':
        return <SavedOutfitsPage onNavigateBack={() => setActiveTab('home')} />;
      case 'community':
        return <CommunityFeedPage />;
      default:
        return (
          <HomePage 
            onNavigateToTryOn={handleOpenTryOn}
            onNavigateToCompare={() => setActiveTab('compare')}
            onNavigateToHistory={() => setActiveTab('history')}
            onSelectItem={handleSelectItem}
            onViewHistoryResult={handleViewHistoryResult}
            onQuickTry={handleQuickTry}
          />
        );
    }
  };

  return (
    <div className="mobile-viewport bg-background">
      {/* Header */}
      <Header
        title="TryOn"
        showNotification={activeTab === 'home'}
        showLanguageSwitcher={true}
        showGems={true}
        onAvatarClick={() => setActiveTab('profile')}
        onSavedClick={() => setActiveTab('saved')}
        onGemsClick={handleGemsClick}
      />

      <main className="min-h-screen">
        {renderPage()}
      </main>

      {/* Bottom Navigation */}
      <MobileNav 
        activeTab={activeTab} 
        onTabChange={(tab) => setActiveTab(tab as NavigationTab)}
        onOpenStudio={handleOpenTryOn}
      />

      {/* Gems Purchase Dialog */}
      <GemsPurchaseDialog
        isOpen={isGemsPurchaseOpen}
        onClose={() => setIsGemsPurchaseOpen(false)}
      />

      {/* Smart Paste - Clipboard Link Toast */}
      {detectedLink && !crawlError && (
        <ClipboardLinkToast
          detectedLink={detectedLink}
          isLoading={isCrawling}
          onTryNow={() => {
            handleTryFromLink(
              detectedLink, 
              (garmentUrl, garmentId) => {
                handleQuickTry(garmentUrl, garmentId, true);
              },
              (error) => {
                // Error will be shown via CrawlErrorToast
                console.log('[Index] Crawl error:', error);
              }
            );
          }}
          onDismiss={dismissLink}
        />
      )}

      {/* Smart Paste - Crawl Error Toast with Retry and Manual Upload */}
      {crawlError && (
        <CrawlErrorToast
          error={crawlError}
          isRetrying={isCrawling}
          onRetry={async () => {
            const product = await retryCrawl();
            if (product?.imageUrl) {
              handleQuickTry(product.imageUrl, undefined, true);
            }
          }}
          onManualUpload={() => {
            clearCrawlError();
            // Open TryOnDialog for manual upload
            openTryOnDialog();
          }}
          onDismiss={clearCrawlError}
        />
      )}

      {/* Smart Paste - Gem Gate Dialog (REQ-11.1, REQ-11.2) */}
      <GemGate
        isOpen={showGemGate}
        requiredGems={gemCost}
        balance={gemBalance}
        onSufficientGems={onGemGateProceed}
        onWatchAd={onWatchAd}
        onPurchase={() => {
          closeGemGate();
          setIsGemsPurchaseOpen(true);
        }}
        onClose={closeGemGate}
      />
    </div>
  );
};

const Index = () => {
  return (
    <AuthProvider>
      <CompareProvider>
        <TryOnDialogProvider>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/outfit/:id" element={<SharedOutfitDetailPage />} />
            <Route path="/user/:userId" element={<UserProfilePage />} />
            <Route path="/community" element={<CommunityFeedPage />} />
            <Route path="/*" element={<MainApp />} />
          </Routes>
        </TryOnDialogProvider>
      </CompareProvider>
    </AuthProvider>
  );
};

export default Index;
