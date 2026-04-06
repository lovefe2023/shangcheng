import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { authApi } from '../lib/api';
import { useToast } from '../components/Toast';

export default function Login() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // 表单验证
    if (!phone.trim()) {
      toast.error('请输入手机号码');
      return;
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      toast.error('请输入正确的手机号码');
      return;
    }

    if (!password.trim()) {
      toast.error('请输入密码');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.login({ phone, password });
      if (res.success) {
        // 保存登录状态
        if (res.data?.session) {
          localStorage.setItem('token', res.data.session.access_token);
          localStorage.setItem('refresh_token', res.data.session.refresh_token);
        }
        if (res.data?.user) {
          localStorage.setItem('user', JSON.stringify(res.data.user));
        }
        toast.success('登录成功');
        // 支持重定向
        const redirect = searchParams.get('redirect') || '/';
        navigate(redirect);
      } else {
        toast.error(res.error?.message || '登录失败');
      }
    } catch (error: any) {
      toast.error(error.message || '登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full max-w-md mx-auto flex-col bg-background-light dark:bg-background-dark group/design-root overflow-x-hidden">
      {/* Top App Bar */}
      <div className="flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between">
        <button onClick={() => navigate(-1)} className="text-slate-900 dark:text-slate-100 flex size-12 shrink-0 items-center cursor-pointer">
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </button>
        <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">登录</h2>
      </div>

      {/* Hero Image - Partner Recruitment Banner */}
      <div className="px-4 pt-4">
        <Link to="/partner/recruit/details" className="block relative rounded-2xl overflow-hidden shadow-lg shadow-primary/20 group cursor-pointer aspect-[21/9]">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-red-700 to-red-900"></div>

          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl translate-y-1/2 -translate-x-1/2"></div>
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>

          <div className="relative z-10 h-full flex flex-col justify-center px-6 py-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-white/90 text-sm">workspace_premium</span>
              <span className="text-white/90 text-xs font-bold tracking-wider uppercase">合伙人招募计划</span>
            </div>
            <h3 className="text-white text-xl font-black leading-tight mb-2">
              加入我们<br/>开启财富之旅
            </h3>
            <div className="flex items-center gap-1 text-white/80 text-xs font-medium">
              <span>最高享 25% 佣金</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </div>
          </div>

          {/* Right side illustration/icon */}
          <div className="absolute right-4 bottom-0 h-full flex items-center justify-center opacity-90 group-hover:scale-110 transition-transform duration-500">
            <span className="material-symbols-outlined text-white/20 text-8xl -rotate-12">payments</span>
          </div>
        </Link>
      </div>

      {/* Hero Section */}
      <div className="px-4 pt-8 pb-4">
        <h1 className="text-slate-900 dark:text-slate-100 tracking-light text-[32px] font-bold leading-tight text-left">欢迎来到名酒商城</h1>
        <p className="text-slate-600 dark:text-slate-400 text-base font-normal leading-normal mt-2">请输入您的手机号登录账号</p>
      </div>

      {/* Form Section */}
      <form onSubmit={handleLogin} className="flex flex-col gap-6 px-4 py-6 w-full">
        {/* Mobile Input */}
        <label className="flex flex-col w-full">
          <p className="text-slate-900 dark:text-slate-100 text-base font-medium leading-normal pb-2">手机号码</p>
          <div className="relative">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="form-input flex w-full rounded-lg text-slate-900 dark:text-slate-100 focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 h-14 placeholder:text-slate-400 p-[15px] text-base font-normal"
              placeholder="请输入您的手机号"
              maxLength={11}
            />
          </div>
        </label>

        {/* Password Input */}
        <label className="flex flex-col w-full">
          <div className="flex justify-between items-center pb-2">
            <p className="text-slate-900 dark:text-slate-100 text-base font-medium leading-normal">密码</p>
          </div>
          <div className="relative flex w-full items-stretch rounded-lg group">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input flex w-full min-w-0 flex-1 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 h-14 placeholder:text-slate-400 p-[15px] pr-12 text-base font-normal"
              placeholder="请输入密码"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600"
            >
              <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
            </button>
          </div>
        </label>

        {/* Actions */}
        <div className="flex flex-col gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-14 rounded-xl transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '登录中...' : '立即登录'}
          </button>
          <div className="flex justify-between items-center px-1">
            <Link to="/forgot-password" className="text-slate-500 dark:text-slate-400 text-sm hover:text-primary transition-colors">忘记密码？</Link>
            <div className="flex gap-1 text-sm">
              <span className="text-slate-500 dark:text-slate-400">新用户？</span>
              <Link to="/register" className="text-primary font-bold hover:underline">立即注册</Link>
            </div>
          </div>
        </div>
      </form>

      {/* Footer Decoration */}
      <div className="mt-auto pb-8 flex justify-center">
        <div className="w-32 h-1 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
      </div>
    </div>
  );
}