import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { partnerApi } from '../lib/api';

interface UserProfile {
  id: string;
  name: string;
  phone: string;
  avatar: string | null;
  invite_code: string;
  is_partner: boolean;
  partner_level: string;
}

export default function PartnerInvite() {
  const navigate = useNavigate();
  const posterRef = useRef<HTMLDivElement>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await partnerApi.getProfile();
      if (res.success && res.data) {
        setProfile(res.data);
      } else {
        setError(res.error?.message || '加载失败');
        if (res.error?.code === 'UNAUTHORIZED') {
          navigate('/login');
        }
      }
    } catch (err) {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  // 生成二维码 URL
  const getQrCodeUrl = () => {
    const inviteCode = profile?.invite_code || '';
    const inviteLink = `${window.location.origin}/register?invite=${inviteCode}`;
    // 使用在线二维码 API
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(inviteLink)}`;
  };

  // 获取邀请链接
  const getInviteLink = () => {
    const inviteCode = profile?.invite_code || '';
    return `${window.location.origin}/register?invite=${inviteCode}`;
  };

  // 保存图片海报
  const handleSavePoster = async () => {
    if (!profile?.invite_code) return;

    setSaving(true);
    try {
      // 创建 canvas 生成海报
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas not supported');
      }

      canvas.width = 800;
      canvas.height = 1200;

      // 绘制背景
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, 800, 1200);

      // 绘制渐变
      const gradient = ctx.createLinearGradient(0, 0, 800, 1200);
      gradient.addColorStop(0, '#dc2626');
      gradient.addColorStop(1, '#991b1b');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 800, 600);

      // 绘制标题
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('名酒商城合伙人', 400, 150);

      ctx.font = '32px sans-serif';
      ctx.fillText('邀请您加入', 400, 220);

      // 绘制邀请码
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('专属邀请码', 400, 350);
      ctx.font = 'bold 64px sans-serif';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(profile.invite_code, 400, 430);

      // 绘制二维码提示
      ctx.fillStyle = '#ffffff';
      ctx.font = '28px sans-serif';
      ctx.fillText('扫码注册成为合伙人', 400, 750);

      // 下载二维码图片并绘制
      const qrImg = new Image();
      qrImg.crossOrigin = 'anonymous';
      qrImg.src = getQrCodeUrl();

      qrImg.onload = () => {
        ctx.drawImage(qrImg, 300, 800, 200, 200);

        // 绘制底部提示
        ctx.fillStyle = '#9ca3af';
        ctx.font = '24px sans-serif';
        ctx.fillText('长按保存图片', 400, 1100);

        // 转换为图片并下载
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `合伙人邀请码_${profile.invite_code}.png`;
            a.click();
            URL.revokeObjectURL(url);
          }
        });
      };

      qrImg.onerror = () => {
        // 二维码加载失败，仍然生成不含二维码的海报
        ctx.fillStyle = '#9ca3af';
        ctx.font = '24px sans-serif';
        ctx.fillText(`邀请码: ${profile.invite_code}`, 400, 900);

        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `合伙人邀请码_${profile.invite_code}.png`;
            a.click();
            URL.revokeObjectURL(url);
          }
        });
      };
    } catch (err) {
      console.error('Save poster error:', err);
      // 备用方案：复制邀请链接
      try {
        await navigator.clipboard.writeText(getInviteLink());
        alert('邀请链接已复制到剪贴板！');
      } catch {
        alert('保存失败，请手动截图保存');
      }
    } finally {
      setSaving(false);
    }
  };

  // 复制邀请链接
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getInviteLink());
      alert('邀请链接已复制！');
    } catch {
      alert('复制失败');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 relative">
        <header className="shrink-0 sticky top-0 z-50 flex items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 border-b border-slate-100 dark:border-slate-800">
          <Link to="/profile" className="text-slate-900 dark:text-slate-100 flex size-10 shrink-0 items-center justify-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h2 className="text-lg font-bold flex-1 text-center pr-10">诚邀合伙人</h2>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 relative">
        <header className="shrink-0 sticky top-0 z-50 flex items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 border-b border-slate-100 dark:border-slate-800">
          <Link to="/profile" className="text-slate-900 dark:text-slate-100 flex size-10 shrink-0 items-center justify-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h2 className="text-lg font-bold flex-1 text-center pr-10">诚邀合伙人</h2>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <span className="material-symbols-outlined text-4xl text-slate-400">error</span>
          <p className="text-slate-500">{error}</p>
          <button
            onClick={loadProfile}
            className="px-4 py-2 bg-primary text-white rounded-lg"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 relative">
      <header className="shrink-0 sticky top-0 z-50 flex items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 border-b border-slate-100 dark:border-slate-800">
        <Link to="/profile" className="text-slate-900 dark:text-slate-100 flex size-10 shrink-0 items-center justify-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h2 className="text-lg font-bold flex-1 text-center pr-10">诚邀合伙人</h2>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        <div className="px-4 py-6 @container">
          <div className="flex flex-col overflow-hidden rounded-xl shadow-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
            <div className="w-full bg-center bg-no-repeat aspect-[3/4] bg-cover relative" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800")' }}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div className="text-white">
                  <p className="text-sm font-medium opacity-80">您的专属码</p>
                  <p className="text-lg font-bold">{profile?.invite_code || '未分配'}</p>
                </div>
                <div className="size-32 bg-white p-2 rounded-lg shadow-xl">
                  <div className="w-full h-full bg-slate-100 rounded flex items-center justify-center overflow-hidden">
                    {profile?.invite_code ? (
                      <img
                        src={getQrCodeUrl()}
                        alt="邀请二维码"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="material-symbols-outlined text-slate-400 text-6xl">qr_code_2</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex w-full flex-col gap-3 p-4">
              <div className="flex flex-col gap-1">
                <p className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight">邀请好友 加入我们</p>
                <p className="text-slate-500 dark:text-slate-400 text-sm">每成功邀请一位好友，立得 50 元佣金</p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleCopyLink}
                  className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg h-11 px-4 font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <span className="material-symbols-outlined text-lg">link</span>
                  复制链接
                </button>
                <button
                  onClick={handleSavePoster}
                  disabled={saving}
                  className="flex-1 bg-primary text-white rounded-lg h-11 px-4 font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-lg">{saving ? 'progress_activity' : 'image'}</span>
                  {saving ? '生成中...' : '保存海报'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 mb-8">
          <h3 className="text-slate-900 dark:text-slate-100 text-base font-bold mb-4">项目介绍</h3>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-sm">rocket_launch</span>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">丰厚回报</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">提供行业领先的提成方案，每一笔订单都能为您带来可观的收益分红。</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-sm">support_agent</span>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">专属培训</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">提供全方位的运营支持与专业培训课程，助力合伙人快速成长并开展业务。</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-sm">verified_user</span>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">品质保障</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">所有产品经过严格筛选，确保每一位受邀客户都能获得优质的购物体验。</p>
              </div>
            </div>
          </div>
        </div>

        {/* 邀请链接显示 */}
        <div className="px-4 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">您的专属邀请链接</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={getInviteLink()}
                readOnly
                className="flex-1 bg-slate-50 dark:bg-slate-900 rounded-lg px-3 py-2 text-sm text-slate-600 dark:text-slate-300 truncate"
              />
              <button
                onClick={handleCopyLink}
                className="shrink-0 bg-primary/10 text-primary px-3 py-2 rounded-lg text-sm font-medium"
              >
                复制
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}