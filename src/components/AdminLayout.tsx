import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { authApi } from '../lib/api';

export default function AdminLayout() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setChecking(false);
      return;
    }

    try {
      const res = await authApi.getMe();
      if (res.success && res.data) {
        // 使用后端返回的 role 字段判断管理员权限
        // 后端会在 middleware 中根据 ADMIN_PHONES 设置 role
        if (res.data.role === 'admin') {
          setIsLoggedIn(true);
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleLogin = () => {
    navigate('/login?redirect=/admin');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('session');
    navigate('/login');
  };

  // Loading state
  if (checking) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500">加载中...</span>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!isLoggedIn) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-6 p-8 bg-white dark:bg-slate-800 rounded-xl shadow-lg">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-primary">admin_panel_settings</span>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">需要管理员登录</h2>
            <p className="text-slate-500 dark:text-slate-400">请先登录管理员账号以访问后台管理系统</p>
          </div>
          <button
            onClick={handleLogin}
            className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            前往登录
          </button>
        </div>
      </div>
    );
  }

  const navItems = [
    { path: '/admin', icon: 'dashboard', label: '控制台', exact: true },
    { path: '/admin/products', icon: 'inventory_2', label: '商品管理' },
    { path: '/admin/orders', icon: 'receipt_long', label: '订单管理' },
    { path: '/admin/users', icon: 'group', label: '用户管理' },
    { path: '/admin/partners', icon: 'handshake', label: '合伙人管理' },
    { path: '/admin/finance', icon: 'account_balance_wallet', label: '财务管理' },
    { path: '/admin/distribution', icon: 'account_tree', label: '分销管理' },
    { path: '/admin/withdrawal', icon: 'payments', label: '提现管理' },
    { path: '/admin/marketing', icon: 'campaign', label: '营销活动' },
    { path: '/admin/cellar', icon: 'liquor', label: '酒窖管理' },
    { path: '/admin/leaderboard', icon: 'leaderboard', label: '排行榜配置' },
    { path: '/admin/content', icon: 'article', label: '内容管理' },
    { path: '/admin/settings', icon: 'settings', label: '系统设置' },
  ];

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center mr-3">
            <span className="material-symbols-outlined text-white text-xl">wine_bar</span>
          </div>
          <span className="font-bold text-lg tracking-tight">名酒商城后台</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                }`
              }
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span className="text-sm">退出登录</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center text-slate-500 dark:text-slate-400">
            <span className="material-symbols-outlined cursor-pointer hover:text-primary transition-colors">menu</span>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-500 hover:text-primary transition-colors">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-2 cursor-pointer">
              <img src="https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff" alt="Admin" className="w-8 h-8 rounded-full" />
              <span className="text-sm font-medium">超级管理员</span>
              <span className="material-symbols-outlined text-sm text-slate-400">expand_more</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}