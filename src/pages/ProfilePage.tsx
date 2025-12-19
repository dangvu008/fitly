import { User, Settings, Camera, ShoppingBag, History, HelpCircle, LogOut, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const ProfilePage = () => {
  const menuItems = [
    { icon: History, label: 'Lịch sử thử đồ', badge: '12' },
    { icon: ShoppingBag, label: 'Đơn hàng của tôi' },
    { icon: Settings, label: 'Cài đặt' },
    { icon: HelpCircle, label: 'Trợ giúp & Hỗ trợ' },
  ];

  const handleMenuClick = (label: string) => {
    toast.info(`Đang phát triển: ${label}`);
  };

  return (
    <div className="pb-24 pt-16 px-4 space-y-6 max-w-md mx-auto">
      {/* Profile header */}
      <section className="text-center animate-slide-up">
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-full gradient-primary flex items-center justify-center shadow-glow">
            <User size={40} className="text-primary-foreground" />
          </div>
          <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-card border-2 border-primary flex items-center justify-center shadow-soft hover:scale-110 transition-transform">
            <Camera size={14} className="text-primary" />
          </button>
        </div>
        <h2 className="font-display font-bold text-xl text-foreground mt-4">
          Người dùng
        </h2>
        <p className="text-muted-foreground text-sm">
          Thành viên từ tháng 12, 2024
        </p>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-3 gap-3 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="bg-card rounded-2xl p-4 text-center shadow-soft border border-border">
          <p className="font-display font-bold text-2xl text-primary">12</p>
          <p className="text-xs text-muted-foreground">Lần thử</p>
        </div>
        <div className="bg-card rounded-2xl p-4 text-center shadow-soft border border-border">
          <p className="font-display font-bold text-2xl text-accent">8</p>
          <p className="text-xs text-muted-foreground">Yêu thích</p>
        </div>
        <div className="bg-card rounded-2xl p-4 text-center shadow-soft border border-border">
          <p className="font-display font-bold text-2xl text-foreground">2</p>
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
