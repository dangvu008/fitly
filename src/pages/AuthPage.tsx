import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MobileNav } from '@/components/layout/MobileNav';
import { Mail, Lock, User } from 'lucide-react';
import { toast } from 'sonner';
import logoImage from '@/assets/logo.png';

const emailSchema = z.string().email('Email không hợp lệ');
const passwordSchema = z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự');

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isOAuthLoading, setIsOAuthLoading] = useState<string | null>(null);
  
  const { signIn, signUp, signInWithOAuth, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Email hoặc mật khẩu không đúng');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Đăng nhập thành công!');
          navigate('/');
        }
      } else {
        const { error } = await signUp(email, password, displayName);
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('Email đã được đăng ký');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Đăng ký thành công!');
          navigate('/');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'facebook') => {
    setIsOAuthLoading(provider);
    try {
      const { error } = await signInWithOAuth(provider);
      if (error) {
        toast.error(`Đăng nhập bằng ${provider === 'google' ? 'Google' : 'Facebook'} thất bại`);
      }
    } finally {
      setIsOAuthLoading(null);
    }
  };

  const handleTabChange = (tab: string) => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="mobile-viewport bg-background pb-20">
      {/* Content */}
      <div className="flex flex-col items-center justify-center min-h-screen px-6 py-8">
        {/* Logo - Instagram style */}
        <div className="mb-10 text-center animate-fade-in">
          <img 
            src={logoImage} 
            alt="TryOn Logo" 
            className="w-20 h-20 mx-auto mb-4 object-contain"
          />
          <h1 className="font-display font-bold text-3xl text-foreground tracking-tight">
            TryOn
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            {isLogin ? 'Đăng nhập để tiếp tục' : 'Tạo tài khoản mới'}
          </p>
        </div>

        {/* Form - Instagram style */}
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-3 animate-fade-in">
          {!isLogin && (
            <div className="relative">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground z-10" />
              <Input
                id="displayName"
                type="text"
                placeholder="Tên hiển thị"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="pl-11 h-12"
              />
            </div>
          )}

          <div className="space-y-1">
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground z-10" />
              <Input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                className={`pl-11 h-12 ${errors.email ? 'ring-2 ring-destructive' : ''}`}
              />
            </div>
            {errors.email && (
              <p className="text-destructive text-xs pl-4">{errors.email}</p>
            )}
          </div>

          <div className="space-y-1">
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground z-10" />
              <Input
                id="password"
                type="password"
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                className={`pl-11 h-12 ${errors.password ? 'ring-2 ring-destructive' : ''}`}
              />
            </div>
            {errors.password && (
              <p className="text-destructive text-xs pl-4">{errors.password}</p>
            )}
          </div>

          <Button
            type="submit"
            variant="instagram"
            className="w-full h-12 text-base mt-4"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              isLogin ? 'Đăng nhập' : 'Đăng ký'
            )}
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-4 py-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-medium">HOẶC</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* OAuth Buttons - Instagram style */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 gap-3 font-medium"
              onClick={() => handleOAuthLogin('google')}
              disabled={isOAuthLoading !== null}
            >
              {isOAuthLoading === 'google' ? (
                <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Tiếp tục với Google
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 gap-3 font-medium"
              onClick={() => handleOAuthLogin('facebook')}
              disabled={isOAuthLoading !== null}
            >
              {isOAuthLoading === 'facebook' ? (
                <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Tiếp tục với Facebook
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Toggle - Instagram style */}
        <div className="mt-8 py-4 border-t border-border w-full max-w-sm text-center">
          <p className="text-sm text-foreground">
            {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
              }}
              className="text-primary font-semibold ml-1.5 hover:opacity-80"
            >
              {isLogin ? 'Đăng ký' : 'Đăng nhập'}
            </button>
          </p>
        </div>
      </div>

      {/* Bottom Navigation */}
      <MobileNav activeTab="profile" onTabChange={handleTabChange} />
    </div>
  );
};
