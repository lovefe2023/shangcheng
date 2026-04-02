import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { marketingApi } from '../lib/api';
import { useToast } from '../components/Toast';
import { ListSkeleton } from '../components/Skeleton';

interface Coupon {
  id: string;
  name: string;
  type: string;
  discount_amount: number;
  min_amount: number;
  start_time: string;
  end_time: string;
  total_count: number;
  used_count: number;
}

export default function Coupons() {
  const navigate = useNavigate();
  const toast = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [claimedIds, setClaimedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await marketingApi.getCoupons();
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

  const handleClaim = async (id: string) => {
    if (claimedIds.includes(id) || claimingId) return;

    setClaimingId(id);
    try {
      const res = await marketingApi.claimCoupon(id);
      if (res.success) {
        setClaimedIds([...claimedIds, id]);
        toast.success('领取成功');
      } else {
        toast.error(res.error?.message || '领取失败');
      }
    } catch (error) {
      toast.error('领取失败');
    } finally {
      setClaimingId(null);
    }
  };

  const formatThreshold = (minAmount: number) => {
    return minAmount > 0 ? `满${minAmount}元可用` : '无门槛';
  };

  const formatValidUntil = (startTime: string, endTime: string) => {
    const end = new Date(endTime);
    return `${end.getMonth() + 1}-${end.getDate()}到期`;
  };

  // 按类型分组
  const groupedCoupons = coupons.reduce((acc, coupon) => {
    const type = coupon.type === 'discount' ? 'discount' : 'full_reduction';
    if (!acc[type]) acc[type] = [];
    acc[type].push(coupon);
    return acc;
  }, {} as Record<string, Coupon[]>);

  const groupInfo: Record<string, { title: string; subtitle: string }> = {
    discount: { title: '立减券', subtitle: '直接抵扣，无门槛限制' },
    full_reduction: { title: '满减券', subtitle: '满足条件即可使用' }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-3 border-b border-slate-200/60 dark:border-slate-800/60">
        <button onClick={() => navigate(-1)} className="flex items-center justify-center p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-90">
          <span className="material-symbols-outlined text-slate-900 dark:text-slate-100">arrow_back</span>
        </button>
        <h1 className="flex-1 text-center text-lg font-bold leading-tight mr-8">领券中心</h1>
      </header>

      <main className="flex-1 overflow-y-auto pb-safe">
        {/* Top Banner */}
        <div className="px-4 pt-4 pb-2">
          <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-r from-red-600 to-rose-500 p-6 shadow-lg shadow-red-500/20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm backdrop-blur-sm">官方补贴</span>
              </div>
              <h1 className="text-3xl font-black text-white mb-1 tracking-tight drop-shadow-sm">
                优惠福利
              </h1>
              <div className="flex items-baseline gap-1 mt-3">
                <span className="text-red-100 text-sm">海量优惠券等你来领</span>
              </div>
            </div>
            <span className="absolute -bottom-4 -right-2 text-8xl opacity-20 rotate-12">
              🧧
            </span>
          </div>
        </div>

        {/* Coupon Groups */}
        <div className="px-4 py-4 space-y-6">
          {loading ? (
            <ListSkeleton count={4} />
          ) : coupons.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <span className="material-symbols-outlined text-5xl mb-3 block">confirmation_number</span>
              <p>暂无可领取的优惠券</p>
            </div>
          ) : (
            Object.entries(groupedCoupons).map(([type, typeCoupons]) => (
              <section key={type}>
                <div className="mb-3">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span className="w-1 h-4 bg-primary rounded-full"></span>
                    {groupInfo[type]?.title || '优惠券'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-3">{groupInfo[type]?.subtitle || ''}</p>
                </div>

                <div className="space-y-3">
                  {typeCoupons.map(coupon => {
                    const isClaimed = claimedIds.includes(coupon.id);
                    const isExhausted = coupon.used_count >= coupon.total_count;
                    const isDisabled = isClaimed || isExhausted;

                    return (
                      <div key={coupon.id} className={`flex bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm border ${isDisabled ? 'border-slate-200 dark:border-slate-800 opacity-70' : 'border-primary/20'}`}>
                        {/* Left side: Amount & Threshold */}
                        <div className={`w-28 flex flex-col items-center justify-center p-3 border-r border-dashed ${isDisabled ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400' : 'bg-primary/5 border-primary/20 text-primary'}`}>
                          <div className="flex items-baseline font-bold">
                            <span className="text-sm">¥</span>
                            <span className="text-3xl tracking-tighter">{coupon.discount_amount}</span>
                          </div>
                          <span className="text-[10px] mt-1 font-medium text-center leading-tight">
                            {formatThreshold(coupon.min_amount)}
                          </span>
                        </div>

                        {/* Right side: Details & Action */}
                        <div className="flex-1 p-3 flex flex-col justify-between relative">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-medium shrink-0 ${isDisabled ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-primary/10 text-primary'}`}>
                                {coupon.type === 'discount' ? '立减' : '满减'}
                              </span>
                              <h3 className={`text-sm font-bold line-clamp-1 ${isDisabled ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>
                                {coupon.name}
                              </h3>
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5">
                              有效期: {formatValidUntil(coupon.start_time, coupon.end_time)}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">
                              剩余 {coupon.total_count - coupon.used_count} 张
                            </p>
                          </div>

                          <div className="flex justify-end mt-2">
                            <button
                              onClick={() => handleClaim(coupon.id)}
                              disabled={isDisabled || claimingId === coupon.id}
                              className={`text-[11px] font-bold px-4 py-1.5 rounded-full transition-all ${
                                isDisabled
                                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                                  : 'bg-primary text-white active:scale-95 shadow-sm shadow-primary/20'
                              }`}
                            >
                              {isExhausted ? '已抢光' : isClaimed ? '已领取' : claimingId === coupon.id ? '领取中...' : '立即领取'}
                            </button>
                          </div>

                          {/* Decorative cutouts */}
                          <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-slate-50 dark:bg-slate-950 rounded-full"></div>
                          <div className="absolute -left-1.5 -bottom-1.5 w-3 h-3 bg-slate-50 dark:bg-slate-950 rounded-full"></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
