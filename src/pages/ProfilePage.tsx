import { User, Settings, Camera, ShoppingBag, History, HelpCircle, LogOut, ChevronRight, Heart, MessageCircle, Mail, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SettingsDialog } from '@/components/settings/SettingsDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Profile {
  display_name: string | null;
  avatar_url: string | null;
}

interface ProfilePageProps {
  onNavigateToHistory?: () => void;
  onNavigateToSaved?: () => void;
}

export const ProfilePage = ({ onNavigateToHistory, onNavigateToSaved }: ProfilePageProps) => {
  const { user, signOut, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [historyCount, setHistoryCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [collectionsCount, setCollectionsCount] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

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

      // Fetch favorites count (saved_outfits)
      supabase
        .from('saved_outfits')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .then(({ count }) => {
          setFavoritesCount(count || 0);
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

  // Handle avatar upload
  const handleAvatarClick = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Hình ảnh quá lớn. Tối đa 5MB.');
      return;
    }

    setIsUploadingAvatar(true);

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('user-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-images')
        .getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        });

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : { display_name: null, avatar_url: publicUrl });
      toast.success('Đã cập nhật ảnh đại diện');
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast.error('Không thể cập nhật ảnh đại diện');
    } finally {
      setIsUploadingAvatar(false);
      // Reset input
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  const menuItems = [
    { icon: History, label: t('profile_try_on_history'), key: 'history', badge: historyCount > 0 ? historyCount.toString() : undefined },
    { icon: Heart, label: t('profile_favorites'), key: 'favorites', badge: favoritesCount > 0 ? favoritesCount.toString() : undefined },
    { icon: ShoppingBag, label: t('profile_my_orders'), key: 'orders' },
    { icon: Settings, label: t('profile_settings'), key: 'settings' },
    { icon: HelpCircle, label: t('profile_help_support'), key: 'help' },
  ];

  const handleMenuClick = (key: string) => {
    switch (key) {
      case 'history':
        if (onNavigateToHistory) {
          onNavigateToHistory();
        }
        break;
      case 'favorites':
        if (onNavigateToSaved) {
          onNavigateToSaved();
        }
        break;
      case 'orders':
        setOrdersOpen(true);
        break;
      case 'settings':
        setSettingsOpen(true);
        break;
      case 'help':
        setHelpOpen(true);
        break;
      default:
        toast.info(`${t('profile_developing')} ${menuItems.find(m => m.key === key)?.label}`);
    }
  };

  const handleLogout = async () => {
    await signOut();
    toast.success(t('profile_logged_out'));
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
      <div className="pb-24 pt-16 px-4 space-y-6 max-w-lg mx-auto">
        <section className="text-center animate-slide-up">
          <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center mx-auto shadow-soft">
            <User size={40} className="text-muted-foreground" />
          </div>
          <h2 className="font-display font-bold text-xl text-foreground mt-4">
            {t('profile_not_logged_in')}
          </h2>
          <p className="text-muted-foreground text-sm mt-2">
            {t('profile_login_to_save')}
          </p>
        </section>

        <section className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <Button
            onClick={handleLogin}
            className="w-full gradient-primary text-primary-foreground font-semibold py-6"
          >
            {t('profile_login_signup')}
          </Button>
        </section>

        <section className="text-center text-xs text-muted-foreground animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <p>{t('profile_version')} 1.0.0</p>
          <p className="mt-1">© 2024 Virtual Try-On</p>
        </section>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-16 px-4 space-y-6 max-w-lg mx-auto">
      {/* Profile header */}
      <section className="text-center animate-slide-up">
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-full gradient-primary flex items-center justify-center shadow-glow overflow-hidden">
            {isUploadingAvatar ? (
              <Loader2 size={32} className="text-primary-foreground animate-spin" />
            ) : profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
            ) : (
              <User size={40} className="text-primary-foreground" />
            )}
          </div>
          <button 
            onClick={handleAvatarClick}
            disabled={isUploadingAvatar}
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-card border-2 border-primary flex items-center justify-center shadow-soft hover:scale-110 transition-transform disabled:opacity-50"
          >
            <Camera size={14} className="text-primary" />
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>
        <h2 className="font-display font-bold text-xl text-foreground mt-4">
          {profile?.display_name || user.email?.split('@')[0] || t('user')}
        </h2>
        <p className="text-muted-foreground text-sm">
          {user.email}
        </p>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-3 gap-3 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="bg-card rounded-2xl p-4 text-center shadow-soft border border-border">
          <p className="font-display font-bold text-2xl text-primary">{historyCount}</p>
          <p className="text-xs text-muted-foreground">{t('profile_tries')}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 text-center shadow-soft border border-border">
          <p className="font-display font-bold text-2xl text-accent">{favoritesCount}</p>
          <p className="text-xs text-muted-foreground">{t('profile_favorites')}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 text-center shadow-soft border border-border">
          <p className="font-display font-bold text-2xl text-foreground">{collectionsCount}</p>
          <p className="text-xs text-muted-foreground">{t('profile_collections')}</p>
        </div>
      </section>

      {/* Menu items */}
      <section className="space-y-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              onClick={() => handleMenuClick(item.key)}
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
          {t('logout')}
        </Button>
      </section>

      {/* App info */}
      <section className="text-center text-xs text-muted-foreground animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <p>{t('profile_version')} 1.0.0</p>
        <p className="mt-1">© 2024 Virtual Try-On</p>
      </section>

      {/* Settings Dialog */}
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />

      {/* Help & Support Dialog */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              {t('profile_help_support')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Bạn cần hỗ trợ? Liên hệ với chúng tôi qua các kênh sau:
            </p>
            
            <div className="space-y-3">
              <a
                href="mailto:support@tryon.app"
                className="flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail size={18} className="text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-xs text-muted-foreground">support@tryon.app</p>
                </div>
                <ExternalLink size={16} className="text-muted-foreground" />
              </a>

              <a
                href="https://m.me/tryonapp"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <MessageCircle size={18} className="text-blue-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Messenger</p>
                  <p className="text-xs text-muted-foreground">Chat trực tiếp</p>
                </div>
                <ExternalLink size={16} className="text-muted-foreground" />
              </a>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                Thời gian hỗ trợ: 9:00 - 18:00 (Thứ 2 - Thứ 6)
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* My Orders Dialog */}
      <Dialog open={ordersOpen} onOpenChange={setOrdersOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              {t('profile_my_orders')}
            </DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
              <ShoppingBag size={28} className="text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground mb-2">Chưa có đơn hàng</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Bạn chưa có đơn hàng nào. Khám phá các sản phẩm và mua sắm ngay!
            </p>
            <Button
              variant="instagram"
              onClick={() => {
                setOrdersOpen(false);
              }}
            >
              Khám phá ngay
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};