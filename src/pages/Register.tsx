import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../lib/api';
import { useToast } from '../components/Toast';

export default function Register() {
  const navigate = useNavigate();
  const toast = useToast();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
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

    if (password.length < 6) {
      toast.error('密码长度不能少于6位');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('两次输入的密码不一致');
      return;
    }

    if (!agreeTerms) {
      toast.error('请阅读并同意服务条款和隐私政策');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.register({
        phone,
        password,
        inviteCode: inviteCode || undefined
      });

      if (res.success) {
        // 保存登录状态
        if (res.data?.session) {
          localStorage.setItem('token', res.data.session.access_token);
          localStorage.setItem('refresh_token', res.data.session.refresh_token);
        }
        if (res.data?.user) {
          localStorage.setItem('user', JSON.stringify(res.data.user));
        }

        toast.success('注册成功');
        navigate('/');
      } else {
        toast.error(res.error?.message || '注册失败');
      }
    } catch (error: any) {
      toast.error(error.message || '注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-background-dark min-h-screen flex flex-col shadow-xl font-display text-slate-900 dark:text-slate-100">
      {/* Top App Bar */}
      <div className="flex items-center p-4 border-b border-slate-100 dark:border-slate-800">
        <button onClick={() => navigate(-1)} className="text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors">
          <span className="material-symbols-outlined block">arrow_back</span>
        </button>
        <h2 className="text-lg font-bold flex-1 text-center mr-10">创建账户</h2>
      </div>

      {/* Header Section */}
      <div className="px-6 pt-10 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">加入名酒商城</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">创建一个账户来发现独家优惠并开始您的品鉴之旅。</p>
      </div>

      {/* Registration Form */}
      <div className="px-6 flex-1">
        <form onSubmit={handleRegister} className="space-y-5">
          {/* Mobile Phone Number */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">手机号码</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                <span className="material-symbols-outlined text-xl">smartphone</span>
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-11 pr-4 h-14 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                placeholder="请输入您的手机号码"
                maxLength={11}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">设置密码</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                <span className="material-symbols-outlined text-xl">lock</span>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-12 h-14 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                placeholder="最少6位字符"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">确认密码</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                <span className="material-symbols-outlined text-xl">lock</span>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-11 pr-4 h-14 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                placeholder="请再次输入密码"
              />
            </div>
          </div>

          {/* Invitation Code (Optional) */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">邀请码 <span className="text-slate-400 font-normal font-display">(可选)</span></label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                <span className="material-symbols-outlined text-xl">redeem</span>
              </span>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="w-full pl-11 pr-4 h-14 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                placeholder="如果有请填写邀请码"
              />
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-start gap-3 pt-2">
            <input
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-1 rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
              id="terms"
              type="checkbox"
            />
            <label className="text-sm text-slate-500 dark:text-slate-400 cursor-pointer" htmlFor="terms">
              我同意 <Link to="#" className="text-primary hover:underline">服务条款</Link> 和 <Link to="#" className="text-primary hover:underline">隐私政策</Link>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-primary text-white font-bold rounded-lg shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98] mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '注册中...' : '立即注册'}
          </button>
        </form>
      </div>

      {/* Login Link */}
      <div className="p-8 text-center">
        <p className="text-slate-600 dark:text-slate-400">
          已有账户？
          <Link to="/login" className="text-primary font-bold hover:underline ml-1">去登录</Link>
        </p>
      </div>

      {/* Footer Decoration/Logo */}
      <div className="pb-10 flex justify-center opacity-20 grayscale">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-xl">wine_bar</span>
          </div>
          <span className="font-bold text-xl tracking-tight">LIQUOR MALL</span>
        </div>
      </div>
    </div>
  );
}