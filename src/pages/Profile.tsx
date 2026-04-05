import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authApi, partnerApi, ordersApi } from '../lib/api';
import { UserStatus, PartnerLevel, PartnerLevelLabel } from '../types';
import { useToast } from '../components/Toast';

interface UserProfile {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  status: UserStatus;
  is_partner: boolean;
  partner_level?: PartnerLevel;
  balance: number;
  invite_code?: string;
}

interface OrderStats {
  pending_payment: number;
  pending_shipment: number;
  shipped: number;
  to_review: number;
}

export default function Profile() {
  const toast = useToast();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [orderStats, setOrderStats] = useState<OrderStats>({
    pending_payment: 0,
    pending_shipment: 0,
    shipped: 0,
    to_review: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // 获取用户信息
      const userRes = await authApi.getMe();
      if (userRes.success && userRes.data) {
        setUser(userRes.data);
      } else if (userRes.error?.code === 'UNAUTHORIZED') {
        // 未登录，跳转登录页
        window.location.href = '/login';
        return;
      }

      // 获取订单统计
      const statsRes = await ordersApi.getStats();
      if (statsRes.success && statsRes.data) {
        setOrderStats({
          pending_payment: statsRes.data.pending_payment || 0,
          pending_shipment: statsRes.data.pending_shipment || 0,
          shipped: statsRes.data.shipped || 0,
          to_review: statsRes.data.to_review || 0
        });
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      toast.error('加载失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const formatBalance = (balance: number) => {
    return `¥${(balance || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark pb-24">
      <div className="flex items-center bg-white dark:bg-slate-900 p-4 justify-between sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
        <div className="flex size-10 shrink-0 items-center justify-center">
          <Link to="/" className="material-symbols-outlined text-slate-600 dark:text-slate-400">arrow_back_ios</Link>
        </div>
        <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">个人中心</h2>
        <div className="flex w-10 items-center justify-end">
          <Link to="/settings" className="flex items-center justify-center bg-transparent text-slate-900 dark:text-slate-100 p-0">
            <span className="material-symbols-outlined">settings</span>
          </Link>
        </div>
      </div>

      {user?.status === UserStatus.FROZEN && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 text-sm flex items-start gap-2 border-b border-red-100 dark:border-red-900/30">
          <span className="material-symbols-outlined text-base mt-0.5">block</span>
          <div className="flex-1">
            <p className="font-bold">账号已冻结</p>
            <p className="text-xs mt-0.5 opacity-90">您的账号当前处于冻结状态，部分功能已受限。如有疑问请联系客服。</p>
          </div>
        </div>
      )}

      {/* 用户信息 */}
      <div className="p-6 pb-8 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            {user?.avatar ? (
              <div
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-20 w-20 border-2 border-primary/20"
                style={{ backgroundImage: `url('${user.avatar}')` }}
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-2xl font-medium text-slate-600 dark:text-slate-300 border-2 border-primary/20">
                {user?.name?.charAt(0) || '?'}
              </div>
            )}
            {user?.is_partner && user.partner_level && (
              <div className="absolute -bottom-1 -right-1 bg-primary text-white text-[10px] px-2 py-0.5 rounded-full font-bold border-2 border-white dark:border-slate-900">
                {PartnerLevelLabel[user.partner_level]}
              </div>
            )}
          </div>
          <div className="flex flex-col justify-center flex-1">
            <p className="text-slate-900 dark:text-slate-100 text-xl font-bold leading-tight">
              {user?.name || '未设置昵称'}
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              {user?.phone || ''}
            </p>
            {user?.is_partner && (
              <div className="flex items-center mt-1 gap-1">
                <span className="material-symbols-outlined text-amber-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                <p className="text-primary text-sm font-semibold">
                  {user.partner_level ? PartnerLevelLabel[user.partner_level] : '合伙人'}
                </p>
              </div>
            )}
            {user?.balance !== undefined && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-slate-500">余额:</span>
                <span className="text-sm font-bold text-primary">{formatBalance(user.balance)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 合伙人专属卡片 */}
      {user?.is_partner && (
        <div className="px-4 mb-2 -mt-6 relative z-10">
          <Link to="/privileges" className="block bg-gradient-to-r from-slate-900 to-slate-800 dark:from-black dark:to-slate-900 rounded-xl p-4 shadow-lg border border-slate-700/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-500/20 to-transparent rounded-full blur-2xl -mr-10 -mt-10"></div>
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white shadow-inner">
                  <span className="material-symbols-outlined">workspace_premium</span>
                </div>
                <div>
                  <h3 className="text-yellow-500 font-bold text-base">专属权益</h3>
                  <p className="text-slate-400 text-xs mt-0.5">查看合伙人等级与专属权益</p>
                </div>
              </div>
              <div className="bg-white/10 rounded-full p-1.5 text-yellow-500 backdrop-blur-md group-hover:bg-white/20 transition-colors flex items-center justify-center">
                <span className="material-symbols-outlined text-sm">arrow_forward_ios</span>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* 我的订单 */}
      <div className="bg-white dark:bg-slate-900 p-4 mb-2">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-slate-900 dark:text-slate-100 text-base font-bold">我的订单</h3>
          <Link to="/orders" className="text-slate-400 text-xs flex items-center gap-1">查看全部 <span className="material-symbols-outlined text-sm">chevron_right</span></Link>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <Link to="/orders?status=pending_payment" className="flex flex-col items-center gap-2">
            <div className="relative text-slate-700 dark:text-slate-300 p-2 rounded-xl bg-primary/5">
              <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
              {orderStats.pending_payment > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">{orderStats.pending_payment}</span>
              )}
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-xs">待付款</p>
          </Link>
          <Link to="/orders?status=pending_shipment" className="flex flex-col items-center gap-2">
            <div className="relative text-slate-700 dark:text-slate-300 p-2 rounded-xl bg-primary/5">
              <span className="material-symbols-outlined text-2xl">local_shipping</span>
              {orderStats.pending_shipment > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">{orderStats.pending_shipment}</span>
              )}
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-xs">待发货</p>
          </Link>
          <Link to="/orders?status=shipped" className="flex flex-col items-center gap-2">
            <div className="relative text-slate-700 dark:text-slate-300 p-2 rounded-xl bg-primary/5">
              <span className="material-symbols-outlined text-2xl">package_2</span>
              {orderStats.shipped > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">{orderStats.shipped}</span>
              )}
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-xs">待收货</p>
          </Link>
          <Link to="/orders?tab=review" className="flex flex-col items-center gap-2">
            <div className="relative text-slate-700 dark:text-slate-300 p-2 rounded-xl bg-primary/5">
              <span className="material-symbols-outlined text-2xl">rate_review</span>
              {orderStats.to_review > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">{orderStats.to_review}</span>
              )}
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-xs">待评价</p>
          </Link>
        </div>
      </div>

      {/* 功能菜单 */}
      <div className="bg-white dark:bg-slate-900 px-4 py-2">
        <div className="flex flex-col">
          <Link to="/team" className="flex items-center justify-between py-4 border-b border-slate-50 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-500 text-xl">group</span>
              </div>
              <span className="text-slate-800 dark:text-slate-200 font-medium">我的推荐</span>
            </div>
            <span className="material-symbols-outlined text-slate-300">chevron_right</span>
          </Link>
          <Link to="/sales" className="flex items-center justify-between py-4 border-b border-slate-50 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-emerald-500 text-xl">payments</span>
              </div>
              <span className="text-slate-800 dark:text-slate-200 font-medium">我的收益</span>
            </div>
            <span className="material-symbols-outlined text-slate-300">chevron_right</span>
          </Link>
          <Link to="/my-coupons" className="flex items-center justify-between py-4 border-b border-slate-50 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-amber-500 text-xl">confirmation_number</span>
              </div>
              <span className="text-slate-800 dark:text-slate-200 font-medium">我的优惠券</span>
            </div>
            <span className="material-symbols-outlined text-slate-300">chevron_right</span>
          </Link>
          <Link to="/my-cellar" className="flex items-center justify-between py-4 border-b border-slate-50 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-purple-500 text-xl">liquor</span>
              </div>
              <span className="text-slate-800 dark:text-slate-200 font-medium">我的酒窖</span>
            </div>
            <span className="material-symbols-outlined text-slate-300">chevron_right</span>
          </Link>
          <Link to="/addresses" className="flex items-center justify-between py-4 border-b border-slate-50 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-orange-500 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
              </div>
              <span className="text-slate-800 dark:text-slate-200 font-medium">收货地址</span>
            </div>
            <span className="material-symbols-outlined text-slate-300">chevron_right</span>
          </Link>
          <Link to="/partner/invite" className="flex items-center justify-between py-4 border-b border-slate-50 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-500 text-xl">redeem</span>
              </div>
              <span className="text-slate-800 dark:text-slate-200 font-medium">邀请码</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-sm">{user?.invite_code || ''}</span>
              <span className="material-symbols-outlined text-slate-300">chevron_right</span>
            </div>
          </Link>
          <Link to="/settings" className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-slate-500 text-xl">tune</span>
              </div>
              <span className="text-slate-800 dark:text-slate-200 font-medium">设置</span>
            </div>
            <span className="material-symbols-outlined text-slate-300">chevron_right</span>
          </Link>
        </div>
      </div>
    </div>
  );
}