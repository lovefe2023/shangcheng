import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Empty from '../components/Empty';
import { ListSkeleton } from '../components/Skeleton';
import { marketingApi } from '../lib/api';

interface GroupBuyProduct {
  id: string;
  product_id: string;
  group_price: number;
  target_count: number;
  current_count: number;
  stock: number;
  status: string;
  product: {
    id: string;
    name: string;
    images: string[];
    original_price: number;
    price: number;
  };
}

export default function GroupBuy() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'hot' | 'mine'>('hot');

  const [products, setProducts] = useState<GroupBuyProduct[]>([]);
  const [myGroups, setMyGroups] = useState<GroupBuyProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeTab === 'hot') {
      fetchGroupBuys();
    } else {
      fetchMyGroups();
    }
  }, [activeTab]);

  const fetchGroupBuys = async () => {
    setLoading(true);
    try {
      const res = await marketingApi.getGroupBuys('ongoing');
      if (res.success && res.data) {
        setProducts(res.data);
      }
    } catch (error) {
      console.error('获取团购商品失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyGroups = async () => {
    setLoading(true);
    try {
      // 获取我参与的团购
      const res = await marketingApi.getGroupBuys();
      if (res.success && res.data) {
        setMyGroups(res.data.filter((item: GroupBuyProduct) => item.current_count > 0));
      }
    } catch (error) {
      console.error('获取我的团购失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => `¥${price.toFixed(2)}`;

  const getProgress = (item: GroupBuyProduct) => {
    return Math.min((item.current_count / item.target_count) * 100, 100);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-3 border-b border-slate-200/60 dark:border-slate-800/60">
        <button onClick={() => navigate(-1)} className="flex items-center justify-center p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-90">
          <span className="material-symbols-outlined text-slate-900 dark:text-slate-100">arrow_back</span>
        </button>
        <h1 className="flex-1 text-center text-lg font-bold leading-tight mr-8">组团免单</h1>
      </header>

      <main className="flex-1 overflow-y-auto pb-safe">
        {/* Rules Banner */}
        <div className="px-4 pt-4 pb-2">
          <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-4 text-white shadow-lg shadow-red-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3"></div>

            <h2 className="text-lg font-black mb-2 flex items-center gap-2 relative z-10">
              <span className="material-symbols-outlined">groups</span>
              参团返利规则
            </h2>
            <ol className="text-sm text-white/90 space-y-1.5 relative z-10">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                <span>选择心仪商品发起或参与拼团</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                <span>邀请好友参团，达到目标人数即可成团</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold shrink-0">3</span>
                <span>成团后全员享团购价，团长额外奖励</span>
              </li>
            </ol>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 pt-3">
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('hot')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'hot'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              热门拼团
            </button>
            <button
              onClick={() => setActiveTab('mine')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'mine'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              我的拼团
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {loading ? (
            <ListSkeleton count={4} />
          ) : activeTab === 'hot' ? (
            products.length === 0 ? (
              <Empty
                icon="group_off"
                title="暂无拼团活动"
                description="当前没有进行中的拼团活动"
                className="py-10"
              />
            ) : (
              <div className="space-y-4">
                {products.map(item => (
                  <Link
                    to={`/group-buy/${item.id}`}
                    key={item.id}
                    className="block bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800"
                  >
                    <div className="flex p-3 gap-4">
                      <div className="w-24 h-24 shrink-0 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden">
                        <img src={item.product?.images?.[0] || '/placeholder.jpg'} alt={item.product?.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <h3 className="text-slate-900 dark:text-slate-100 font-medium text-sm line-clamp-2">{item.product?.name}</h3>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-red-500 font-bold">{formatPrice(item.group_price)}</span>
                          <span className="text-slate-400 text-xs line-through">{formatPrice(item.product?.original_price || item.product?.price)}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-red-500 rounded-full"
                              style={{ width: `${getProgress(item)}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500 whitespace-nowrap">
                            {item.current_count}/{item.target_count}人
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="px-3 pb-3 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(`/group-buy/${item.id}/share`);
                        }}
                        className="flex-1 py-2 border border-red-500 text-red-500 rounded-lg text-sm font-medium"
                      >
                        发起拼团
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(`/product/${item.product_id}`);
                        }}
                        className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-medium"
                      >
                        立即参团
                      </button>
                    </div>
                  </Link>
                ))}
              </div>
            )
          ) : (
            myGroups.length === 0 ? (
              <Empty
                icon="shopping_bag"
                title="暂无拼团记录"
                description="您还没有参与任何拼团活动"
                actionText="去拼团"
                onAction={() => setActiveTab('hot')}
                className="py-10"
              />
            ) : (
              <div className="space-y-4">
                {myGroups.map(item => (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800"
                  >
                    <div className="flex gap-3">
                      <div className="w-16 h-16 shrink-0 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                        <img src={item.product?.images?.[0] || '/placeholder.jpg'} alt={item.product?.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-slate-900 dark:text-slate-100 font-medium text-sm line-clamp-1">{item.product?.name}</h3>
                        <p className="text-red-500 font-bold text-sm mt-1">{formatPrice(item.group_price)}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-1 rounded ${
                          item.current_count >= item.target_count
                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                            : 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
                        }`}>
                          {item.current_count >= item.target_count ? '拼团成功' : '拼团中'}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full"
                          style={{ width: `${getProgress(item)}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500">
                        {item.current_count}/{item.target_count}人
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </main>
    </div>
  );
}