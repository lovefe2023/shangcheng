import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface PartnerPackage {
  id: string;
  name: string;
  description: string;
  images: string[];
  price: number;
  original_price: number;
  includes: Array<{ product_id: string; quantity: number }>;
  benefits: string[];
  stock: number;
  sales: number;
  includes_details?: Array<{
    product_id: string;
    quantity: number;
    product_name: string;
    product_image: string;
    product_price: number;
  }>;
}

export default function PartnerPackage() {
  const navigate = useNavigate();
  const [packages, setPackages] = useState<PartnerPackage[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [benefitsExpanded, setBenefitsExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const res = await fetch('/api/partner-packages');
      const data = await res.json();
      if (data.success) {
        setPackages(data.data || []);
        if (data.data && data.data.length > 0) {
          setSelectedPackageId(data.data[0].id);
        }
      }
    } catch (error) {
      console.error('获取礼包列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedPackage = packages.find(p => p.id === selectedPackageId);

  const handleBuy = () => {
    if (!selectedPackage) return;
    // 检查登录状态后跳转到结算页
    navigate(`/checkout?package_id=${selectedPackage.id}`);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
        <header className="sticky top-0 z-50 flex items-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-3 border-b border-slate-200/60 dark:border-slate-800/60">
          <button onClick={() => navigate(-1)} className="flex items-center justify-center p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-90">
            <span className="material-symbols-outlined text-slate-900 dark:text-slate-100">arrow_back</span>
          </button>
          <h1 className="flex-1 text-center text-lg font-bold leading-tight mr-8">合伙人礼包</h1>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
        </div>
      </div>
    );
  }

  if (!selectedPackage) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
        <header className="sticky top-0 z-50 flex items-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-3 border-b border-slate-200/60 dark:border-slate-800/60">
          <button onClick={() => navigate(-1)} className="flex items-center justify-center p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-90">
            <span className="material-symbols-outlined text-slate-900 dark:text-slate-100">arrow_back</span>
          </button>
          <h1 className="flex-1 text-center text-lg font-bold leading-tight mr-8">合伙人礼包</h1>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
          <span className="material-symbols-outlined text-5xl mb-3">redeem</span>
          <p className="text-sm">暂无可购买的礼包</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-3 border-b border-slate-200/60 dark:border-slate-800/60">
        <button onClick={() => navigate(-1)} className="flex items-center justify-center p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-90">
          <span className="material-symbols-outlined text-slate-900 dark:text-slate-100">arrow_back</span>
        </button>
        <h1 className="flex-1 text-center text-lg font-bold leading-tight mr-8">合伙人礼包</h1>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        {/* Product Image */}
        <div className="w-full aspect-square bg-white dark:bg-slate-900 relative">
          <img
            src={selectedPackage.images?.[0] || 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d'}
            alt={selectedPackage.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-gradient-to-r from-amber-200 to-yellow-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-sm">
                合伙人专属
              </span>
            </div>
            <h2 className="text-xl font-bold leading-tight drop-shadow-md">
              {selectedPackage.name}
            </h2>
          </div>
        </div>

        {/* Price & Summary */}
        <div className="bg-white dark:bg-slate-900 px-4 py-4 mb-2">
          <div className="flex items-end justify-between mb-2">
            <div className="flex items-baseline text-red-600 dark:text-red-500 font-bold">
              <span className="text-sm mr-1">¥</span>
              <span className="text-3xl tracking-tight leading-none">{selectedPackage.price}</span>
              <span className="text-xs text-slate-400 font-normal line-through ml-2">¥{selectedPackage.original_price}</span>
            </div>
            <span className="text-xs text-slate-500">已售 {selectedPackage.sales.toLocaleString()}+</span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-snug">
            {selectedPackage.description}
          </p>

          <div className="mt-4 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-amber-500">verified</span>
              <span>正品保障</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-amber-500">local_shipping</span>
              <span>顺丰包邮</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-amber-500">workspace_premium</span>
              <span>升级合伙人</span>
            </div>
          </div>
        </div>

        {/* Package Selection */}
        <div className="bg-white dark:bg-slate-900 px-4 py-4 mb-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">选择套餐</h3>
          <div className="flex flex-col gap-3">
            {packages.map(pkg => (
              <button
                key={pkg.id}
                onClick={() => setSelectedPackageId(pkg.id)}
                className={`flex items-center p-3 rounded-xl border-2 text-left transition-all ${
                  selectedPackageId === pkg.id
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/10'
                    : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}
              >
                <img src={pkg.images?.[0]} alt={pkg.name} className="w-12 h-12 rounded-lg object-cover mr-3" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{pkg.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{pkg.description}</div>
                </div>
                <div className="ml-3 text-right shrink-0">
                  <div className="text-sm font-bold text-red-600 dark:text-red-500">¥{pkg.price}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-white dark:bg-slate-900 px-4 py-4 mb-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500">stars</span>
              合伙人专属权益
            </h3>
            <button
              onClick={() => setBenefitsExpanded(!benefitsExpanded)}
              className="text-xs text-slate-500 flex items-center"
            >
              {benefitsExpanded ? '收起' : '查看完整权益'}
              <span className={`material-symbols-outlined text-[16px] transition-transform ${benefitsExpanded ? 'rotate-180' : ''}`}>
                expand_more
              </span>
            </button>
          </div>

          <div className="space-y-4">
            {(benefitsExpanded ? selectedPackage.benefits : selectedPackage.benefits?.slice(0, 2) || []).map((benefit, index) => (
              <div key={index} className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 shrink-0">
                  <span className="material-symbols-outlined">
                    {index === 0 ? 'payments' : index === 1 ? 'pie_chart' : index === 2 ? 'local_mall' : 'support_agent'}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{benefit}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {index === 0 && '直推合伙人可获得丰厚现金奖励，团队裂变收益无上限。'}
                    {index === 1 && '参与平台整体利润分红，每月按贡献值自动结算至余额。'}
                    {index === 2 && '商城全场商品享受合伙人专属内部拿货价，最高可省50%。'}
                    {index === 3 && '配备专属大客户经理，7x24小时优先响应售后及业务咨询。'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="h-6"></div>
      </main>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-3 pb-safe z-50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-amber-600 dark:text-amber-500 font-medium bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded">
            提示：购买成功后自动成为合伙人，可享受权益
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500">合计实付</span>
            <div className="flex items-baseline text-red-600 dark:text-red-500 font-bold">
              <span className="text-sm">¥</span>
              <span className="text-2xl tracking-tight leading-none">{selectedPackage.price}</span>
            </div>
          </div>
          <button
            onClick={handleBuy}
            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 rounded-full shadow-lg shadow-amber-500/30 active:scale-[0.98] transition-all text-center"
          >
            立即购买 ￥{selectedPackage.price}起
          </button>
        </div>
      </div>
    </div>
  );
}
