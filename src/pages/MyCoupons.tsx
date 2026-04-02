import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Empty from '../components/Empty';
import { ListSkeleton } from '../components/Skeleton';
import { useToast } from '../components/Toast';
import { marketingApi } from '../lib/api';

type CouponStatus = 'unused' | 'used' | 'expired';

interface UserCoupon {
  id: string;
  user_id: string;
  coupon_id: string;
  status: CouponStatus;
  created_at: string;
  used_at?: string;
  coupon: {
    id: string;
    name: string;
    type: string;
    discount_amount: number;
    min_amount: number;
    start_time: string;
    end_time: string;
  };
}

const statusLabels: Record<CouponStatus, string> = {
  unused: '未使用',
  used: '已使用',
  expired: '已过期'
};

export default function MyCoupons() {
  const navigate = useNavigate();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<CouponStatus>('unused');
  const [coupons, setCoupons] = useState<UserCoupon[]>([]);
  const [loading, setLoading] = useState(true);

  const tabs: CouponStatus[] = ['unused', 'used', 'expired'];

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await marketingApi.getMyCoupons();
      if (res.success && res.data) {
        setCoupons(res.data);
      }
    } catch (error) {
      console.error('获取优惠券失败:', error);
      toast.error('获取优惠券失败');
    } finally {
      setLoading(false);
    }
  };

  const formatThreshold = (minAmount: number) => {
    return minAmount > 0 ? `满${minAmount}元可用` : '无门槛';
  };

  const formatValidUntil = (endTime: string) => {
    const end = new Date(endTime);
    return `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')} ${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
  };

  const filteredCoupons = coupons.filter(coupon => coupon.status === activeTab);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-3 border-b border-slate-200/60 dark:border-slate-800/60">
        <button onClick={() => navigate(-1)} className="flex items-center justify-center p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-90">
          <span className="material-symbols-outlined text-slate-900 dark:text-slate-100">arrow_back</span>
        </button>
        <h1 className="flex-1 text-center text-lg font-bold leading-tight mr-8">我的优惠券</h1>
      </header>

      {/* Tabs */}
      <div className="flex bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-[53px] z-40">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-medium relative ${
              activeTab === tab
                ? 'text-primary'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {statusLabels[tab]}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      <main className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <ListSkeleton count={4} />
        ) : filteredCoupons.length > 0 ? (
          filteredCoupons.map(coupon => {
            const isInactive = coupon.status !== 'unused';
            const couponData = coupon.coupon;
            return (
              <div key={coupon.id} className={`flex bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm border ${isInactive ? 'border-slate-200 dark:border-slate-800 opacity-70' : 'border-primary/20'}`}>
                {/* Left side: Amount & Threshold */}
                <div className={`w-28 flex flex-col items-center justify-center p-3 border-r border-dashed ${isInactive ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400' : 'bg-primary/5 border-primary/20 text-primary'}`}>
                  <div className="flex items-baseline font-bold">
                    <span className="text-sm">¥</span>
                    <span className="text-3xl tracking-tighter">{couponData.discount_amount}</span>
                  </div>
                  <span className="text-[10px] mt-1 font-medium text-center leading-tight">{formatThreshold(couponData.min_amount)}</span>
                </div>

                {/* Right side: Details */}
                <div className="flex-1 p-3 flex flex-col justify-between relative">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-medium shrink-0 ${isInactive ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-primary/10 text-primary'}`}>
                        {couponData.type === 'discount' ? '立减' : '满减'}
                      </span>
                      <h3 className={`text-sm font-bold line-clamp-1 ${isInactive ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>
                        {couponData.name}
                      </h3>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5">
                      有效期至: {formatValidUntil(couponData.end_time)}
                    </p>
                  </div>

                  <div className="flex justify-end mt-2">
                    {coupon.status === 'unused' ? (
                      <button
                        onClick={() => navigate('/products')}
                        className="text-[11px] font-bold px-4 py-1.5 rounded-full transition-all bg-primary text-white active:scale-95 shadow-sm shadow-primary/20"
                      >
                        去使用
                      </button>
                    ) : (
                      <div className="absolute right-2 bottom-2 w-12 h-12 border-2 border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center rotate-[-15deg] opacity-60">
                        <span className="text-slate-300 dark:text-slate-600 font-bold text-xs">{statusLabels[coupon.status]}</span>
                      </div>
                    )}
                  </div>

                  {/* Decorative cutouts */}
                  <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-slate-50 dark:bg-slate-950 rounded-full"></div>
                  <div className="absolute -left-1.5 -bottom-1.5 w-3 h-3 bg-slate-50 dark:bg-slate-950 rounded-full"></div>
                </div>
              </div>
            );
          })
        ) : (
          <Empty
            icon="confirmation_number"
            title={`暂无${statusLabels[activeTab]}的优惠券`}
            description="去领券中心看看吧"
            actionText="去领券"
            actionLink="/coupons"
            className="mt-10"
          />
        )}
      </main>
    </div>
  );
}
