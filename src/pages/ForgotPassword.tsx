import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../lib/api';
import { useToast } from '../components/Toast';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const toast = useToast();

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [step, setStep] = useState<'phone' | 'reset'>('phone');

  // 发送验证码
  const handleSendCode = async () => {
    if (!phone.trim()) {
      toast.error('请输入手机号码');
      return;
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      toast.error('请输入正确的手机号码');
      return;
    }

    setSendingCode(true);
    try {
      const res = await authApi.forgotPassword(phone);
      if (res.success) {
        toast.success('验证码已发送');
        setStep('reset');
        // 开始倒计时
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        // 开发环境显示验证码
        if (res._dev_code) {
          console.log('验证码:', res._dev_code);
          toast.info(`验证码: ${res._dev_code}`);
        }
      } else {
        toast.error(res.error?.message || '发送失败');
      }
    } catch (error) {
      toast.error('发送验证码失败');
    } finally {
      setSendingCode(false);
    }
  };

  // 重置密码
  const handleResetPassword = async () => {
    if (!code.trim()) {
      toast.error('请输入验证码');
      return;
    }

    if (!newPassword.trim()) {
      toast.error('请输入新密码');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('密码至少需要6位字符');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.resetPassword({ phone, code, newPassword });
      if (res.success) {
        toast.success('密码重置成功');
        navigate('/login');
      } else {
        toast.error(res.error?.message || '重置失败');
      }
    } catch (error) {
      toast.error('重置密码失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center bg-white dark:bg-slate-900 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
        <button onClick={() => navigate(-1)} className="flex items-center justify-center p-1.5">
          <span className="material-symbols-outlined text-slate-900 dark:text-slate-100">arrow_back</span>
        </button>
        <h1 className="flex-1 text-center text-lg font-bold text-slate-900 dark:text-slate-100 mr-10">
          忘记密码
        </h1>
      </header>

      <main className="flex-1 px-4 py-6">
        {step === 'phone' ? (
          /* 步骤1：输入手机号 */
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-primary text-3xl">lock_reset</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">重置密码</h2>
              <p className="text-slate-500 mt-2">请输入注册时使用的手机号</p>
            </div>

            <label className="block">
              <p className="text-slate-900 dark:text-slate-100 text-sm font-medium mb-2">手机号码</p>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-14 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="请输入手机号"
                maxLength={11}
              />
            </label>

            <button
              onClick={handleSendCode}
              disabled={sendingCode || !phone}
              className="w-full h-14 bg-primary text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendingCode ? '发送中...' : '获取验证码'}
            </button>
          </div>
        ) : (
          /* 步骤2：验证并重置密码 */
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-primary text-3xl">vpn_key</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">设置新密码</h2>
              <p className="text-slate-500 mt-2">验证码已发送至 {phone}</p>
            </div>

            <label className="block">
              <p className="text-slate-900 dark:text-slate-100 text-sm font-medium mb-2">验证码</p>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="flex-1 h-14 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="请输入6位验证码"
                  maxLength={6}
                />
                <button
                  onClick={handleSendCode}
                  disabled={countdown > 0 || sendingCode}
                  className="h-14 px-4 bg-slate-100 dark:bg-slate-800 text-primary font-medium rounded-lg disabled:text-slate-400 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {countdown > 0 ? `${countdown}s` : '重新发送'}
                </button>
              </div>
            </label>

            <label className="block">
              <p className="text-slate-900 dark:text-slate-100 text-sm font-medium mb-2">新密码</p>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full h-14 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="请输入新密码（至少6位）"
              />
            </label>

            <label className="block">
              <p className="text-slate-900 dark:text-slate-100 text-sm font-medium mb-2">确认密码</p>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-14 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="请再次输入新密码"
              />
            </label>

            <button
              onClick={handleResetPassword}
              disabled={loading || !code || !newPassword || !confirmPassword}
              className="w-full h-14 bg-primary text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '重置中...' : '确认重置'}
            </button>
          </div>
        )}

        {/* 底部链接 */}
        <div className="mt-8 text-center">
          <Link to="/login" className="text-primary font-medium">
            返回登录
          </Link>
        </div>
      </main>
    </div>
  );
}