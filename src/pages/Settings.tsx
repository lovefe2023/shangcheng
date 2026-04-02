import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../lib/api';

interface User {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  status: string;
  is_partner: boolean;
  partner_level: string;
  invite_code: string;
  balance: number;
}

export default function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }

      // 从API获取最新用户信息
      const res = await authApi.getMe();
      if (res.success && res.data) {
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background-light dark:bg-background-dark">
      <header className="sticky top-0 z-50 flex items-center bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 h-14">
        <Link to="/profile" className="text-slate-900 dark:text-slate-100 flex items-center">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="flex-1 text-center text-lg font-bold leading-tight tracking-tight mr-6">设置</h1>
      </header>

      <main className="flex-1 overflow-y-auto pb-8">
        <div className="mt-4 px-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm">
            <Link to="/settings/profile" className="px-4 py-3 flex items-center justify-between border-b border-slate-50 dark:border-slate-800/50 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors cursor-pointer">
              <span className="text-slate-900 dark:text-slate-100 text-base">个人信息</span>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 font-medium overflow-hidden">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.charAt(0) || '?'
                  )}
                </div>
                <span className="material-symbols-outlined text-slate-400 text-xl">chevron_right</span>
              </div>
            </Link>
            <Link to="/settings/account" className="px-4 py-3 flex items-center justify-between border-b border-slate-50 dark:border-slate-800/50 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors cursor-pointer">
              <span className="text-slate-900 dark:text-slate-100 text-base">账号与安全</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-sm">密码/绑定/注销</span>
                <span className="material-symbols-outlined text-slate-400 text-xl">chevron_right</span>
              </div>
            </Link>
            <div className="px-4 py-3 flex items-center justify-between active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors cursor-pointer">
              <span className="text-slate-900 dark:text-slate-100 text-base">支付设置</span>
              <span className="material-symbols-outlined text-slate-400 text-xl">chevron_right</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="px-4 py-3 flex items-center justify-between border-b border-slate-50 dark:border-slate-800/50 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors cursor-pointer">
              <span className="text-slate-900 dark:text-slate-100 text-base">消息通知</span>
              <span className="material-symbols-outlined text-slate-400 text-xl">chevron_right</span>
            </div>
            <div className="px-4 py-3 flex items-center justify-between border-b border-slate-50 dark:border-slate-800/50 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors cursor-pointer">
              <span className="text-slate-900 dark:text-slate-100 text-base">隐私设置</span>
              <span className="material-symbols-outlined text-slate-400 text-xl">chevron_right</span>
            </div>
            <div className="px-4 py-3 flex items-center justify-between active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors cursor-pointer">
              <span className="text-slate-900 dark:text-slate-100 text-base">通用设置</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-sm">清除缓存/深色模式</span>
                <span className="material-symbols-outlined text-slate-400 text-xl">chevron_right</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="px-4 py-3 flex items-center justify-between border-b border-slate-50 dark:border-slate-800/50 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors cursor-pointer">
              <span className="text-slate-900 dark:text-slate-100 text-base">关于我们</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-sm">v1.0.0</span>
                <span className="material-symbols-outlined text-slate-400 text-xl">chevron_right</span>
              </div>
            </div>
            <div className="px-4 py-3 flex items-center justify-between active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors cursor-pointer">
              <span className="text-slate-900 dark:text-slate-100 text-base">帮助与客服</span>
              <span className="material-symbols-outlined text-slate-400 text-xl">chevron_right</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full mt-6 bg-white dark:bg-slate-900 text-red-500 font-bold text-base py-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors"
          >
            退出登录
          </button>
        </div>
      </main>
    </div>
  );
}