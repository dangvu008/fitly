import { ReactNode } from 'react';
import { Header } from './Header';
import { MobileNav } from './MobileNav';

interface MainLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  showHeader?: boolean;
  onAvatarClick?: () => void;
}

export const MainLayout = ({ 
  children, 
  activeTab, 
  onTabChange,
  showHeader = true,
  onAvatarClick
}: MainLayoutProps) => {
  return (
    <div className="mobile-viewport bg-background">
      {showHeader && (
        <Header
          title="TryOn"
          onAvatarClick={onAvatarClick}
        />
      )}

      <main className="min-h-screen">
        {children}
      </main>

      <MobileNav activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
};
