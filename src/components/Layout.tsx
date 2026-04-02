import { useState, useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isFrozen, setIsFrozen] = useState(false);

  useEffect(() => {
    // Mock check for frozen status
    const status = localStorage.getItem('userStatus');
    if (status === 'frozen' && location.pathname !== '/login') {
      setIsFrozen(true);
    } else {
      setIsFrozen(false);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('userStatus');
    setIsFrozen(false);
    navigate('/login');
  };

  const navItems = [
    { path: '/', icon: 'home', label: '首页' },
    { path: '/category', icon: 'category', label: '商品分类' },
    { path: '/cart', icon: 'shopping_cart', label: '购物车' },
    { path: '/partner', icon: 'handshake', label: '合伙人中心' },
    { path: '/profile', icon: 'person', label: '我的' },
  ];

  // Hide bottom nav on certain pages
  const hideNavPaths = ['/order/', '/settings', '/team', '/member/', '/checkout', '/payment', '/addresses', '/login', '/register', '/withdraw', '/coupons', '/my-coupons', '/group-buy', '/partner-package', '/category-list', '/faq/', '/partner/new-today', '/leaderboard', '/my-cellar'];
  const showNav = !hideNavPaths.some(path => location.pathname.startsWith(path));

  if (isFrozen) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center max-w-md mx-auto bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-display shadow-xl px-6 text-center">
        <span className="material-symbols-outlined text-6xl text-red-500 mb-4">block</span>
        <h1 className="text-2xl font-bold mb-2">账号已冻结</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">您的账号因违反平台规定已被冻结，无法进行任何操作。如有疑问请联系客服。</p>
        <button 
          onClick={handleLogout}
          className="w-full py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/30"
        >
          退出登录
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col max-w-md mx-auto bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display shadow-xl">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </div>

      {showNav && (
        <nav className="shrink-0 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 pb-safe z-50">
          <div className="flex h-[60px]">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex flex-1 flex-col items-center justify-center gap-1 transition-colors",
                    isActive ? "text-primary" : "text-slate-400 dark:text-slate-500 hover:text-primary"
                  )}
                >
                  <span
                    className="material-symbols-outlined text-[24px]"
                    style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {item.icon}
                  </span>
                  <span className={cn("text-[10px]", isActive ? "font-bold" : "font-medium")}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
