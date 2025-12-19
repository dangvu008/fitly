import { User, Settings, Camera, ShoppingBag, History, HelpCircle, LogOut, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  display_name: string | null;
  avatar_url: string | null;
}

interface ProfilePageProps {
  onNavigateToHistory?: () => void;
}

export const ProfilePage = ({ onNavigateToHistory }: ProfilePageProps) => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [historyCount, setHistoryCount] = useState(0);
  const [collectionsCount, setCollectionsCount] = useState(0);

  useEffect(() => {
    if (user) {
      // Fetch profile
      supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setProfile(data);
        });

      // Fetch history count
      supabase
        .from('try_on_history')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .then(({ count }) => {
          setHistoryCount(count || 0);
        });

      // Fetch collections count
      supabase
        .from('user_collections')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .then(({ count }) => {
          setCollectionsCount(count || 0);
        });
    }
  }, [user]);

  const menuItems = [
    { icon: History, label: 'Lịch sử thử đồ', badge: historyCount > 0 ? historyCount.toString() : undefined },
    { icon: ShoppingBag, label: 'Đơn hàng của tôi' },
    { icon: Settings, label: 'Cài đặt' },
    { icon: HelpCircle, label: 'Trợ giúp & Hỗ trợ' },
  ];

  const handleMenuClick = (label: string) => {
    if (label === 'Lịch sử thử đồ' && onNavigateToHistory) {
      onNavigateToHistory();
    } else {
      toast.info(`Đang phát triển: ${label}`);
    }
  };

  const handleLogout = async () => {
    await signOut();
    toast.success('Đã đăng xuất');
  };

  const handleLogin = () => {
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="pb-24 pt-16 px-4 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Not logged in state
  if (!user) {
    return (
      <div className="pb-24 pt-16 px-4 space-y-6 max-w-md mx-auto">
        <section className="text-center animate-slide-up">
          <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center mx-auto shadow-soft">
            <User size={40} className="text-muted-foreground" />
          </div>
          <h2 className="font-display font-bold text-xl text-foreground mt-4">
            Chưa đăng nhập
          </h2>
          <p className="text-muted-foreground text-sm mt-2">
            Đăng nhập để lưu lịch sử thử đồ và bộ sưu tập của bạn
          </p>
        </section>

        <section className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <Button
            onClick={handleLogin}
            className="w-full gradient-primary text-primary-foreground font-semibold py-6"
          >
            Đăng nhập / Đăng ký
          </Button>
        </section>

        <section className="text-center text-xs text-muted-foreground animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <p>Phiên bản 1.0.0</p>
          <p className="mt-1">© 2024 Virtual Try-On</p>
        </section>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-16 px-4 space-y-6 max-w-md mx-auto">
      {/* Profile header */}
      <section className="text-center animate-slide-up">
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-full gradient-primary flex items-center justify-center shadow-glow">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
            ) : (
              <User size={40} className="text-primary-foreground" />
            )}
          </div>
          <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-card border-2 border-primary flex items-center justify-center shadow-soft hover:scale-110 transition-transform">
            <Camera size={14} className="text-primary" />
          </button>
        </div>
        <h2 className="font-display font-bold text-xl text-foreground mt-4">
          {profile?.display_name || user.email?.split('@')[0] || 'Người dùng'}
        </h2>
        <p className="text-muted-foreground text-sm">
          {user.email}
        </p>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-3 gap-3 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="bg-card rounded-2xl p-4 text-center shadow-soft border border-border">
          <p className="font-display font-bold text-2xl text-primary">{historyCount}</p>
          <p className="text-xs text-muted-foreground">Lần thử</p>
        </div>
        <div className="bg-card rounded-2xl p-4 text-center shadow-soft border border-border">
          <p className="font-display font-bold text-2xl text-accent">0</p>
          <p className="text-xs text-muted-foreground">Yêu thích</p>
        </div>
        <div className="bg-card rounded-2xl p-4 text-center shadow-soft border border-border">
          <p className="font-display font-bold text-2xl text-foreground">{collectionsCount}</p>
          <p className="text-xs text-muted-foreground">Bộ sưu tập</p>
        </div>
      </section>

      {/* Menu items */}
      <section className="space-y-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              onClick={() => handleMenuClick(item.label)}
              className="w-full flex items-center gap-4 p-4 bg-card rounded-2xl shadow-soft border border-border hover:border-primary/50 transition-all duration-300 group"
            >
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center group-hover:gradient-primary transition-all duration-300">
                <Icon size={20} className="text-muted-foreground group-hover:text-primary-foreground transition-colors" />
              </div>
              <span className="flex-1 text-left font-medium text-foreground">{item.label}</span>
              {item.badge && (
                <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {item.badge}
                </span>
              )}
              <ChevronRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          );
        })}
      </section>

      {/* Logout */}
      <section className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground"
        >
          <LogOut size={18} />
          Đăng xuất
        </Button>
      </section>

      {/* App info */}
      <section className="text-center text-xs text-muted-foreground animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <p>Phiên bản 1.0.0</p>
        <p className="mt-1">© 2024 Virtual Try-On</p>
      </section>
    </div>
  );
};
