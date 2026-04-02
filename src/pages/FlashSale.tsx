import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Empty from '../components/Empty';
import { ListSkeleton } from '../components/Skeleton';
import { marketingApi } from '../lib/api';

interface FlashSaleProduct {
  id: string;
  product_id: string;
  flash_price: number;
  stock: number;
  sold_count: number;
  start_time: string;
  end_time: string;
  status: string;
  product: {
    id: string;
    name: string;
    images: string[];
    original_price: number;
    price: number;
  };
}

export default function FlashSale() {
  const navigate = useNavigate();

  const [products, setProducts] = useState<FlashSaleProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    fetchFlashSales();
  }, []);

  useEffect(() => {
    if (products.length === 0) return;

    const getEndTime = () => {
      const ongoingSale = products.find(p => p.status === 'ongoing');
      if (ongoingSale) {
        return new Date(ongoingSale.end_time);
      }
      const now = new Date();
      now.setHours(23, 59, 59, 999);
      return now;
    };

    const timer = setInterval(() => {
      const end = getEndTime();
      const now = new Date();
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        clearInterval(timer);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, [products]);

  const fetchFlashSales = async () => {
    setLoading(true);
    try {
      const res = await marketingApi.getFlashSales('ongoing');
      if (res.success && res.data) {
        setProducts(res.data);
      }
    } catch (error) {
      console.error('获取秒杀商品失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: number) => time.toString().padStart(2, '0');
  const formatPrice = (price: number) => `¥${price.toFixed(2)}`;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="shrink-0 sticky top-0 z-50 flex items-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-3 border-b border-slate-200/60 dark:border-slate-800/60">
        <button onClick={() => navigate(-1)} className="flex items-center justify-center p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-90">
          <span className="material-symbols-outlined text-slate-900 dark:text-slate-100">arrow_back</span>
        </button>
        <h1 className="flex-1 text-center text-lg font-bold leading-tight mr-8">限时秒杀</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        {/* Banner */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-6 text-white mb-6 shadow-lg shadow-red-500/20 flex flex-col items-center justify-center text-center">
          <h2 className="text-2xl font-black italic tracking-wider mb-2">限时秒杀狂欢</h2>
          <p className="text-white/90 text-sm mb-4">精选好物，限时低价，手慢无！</p>
          <div className="flex items-center gap-2 text-lg font-mono bg-black/20 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10">
            <span>距结束</span>
            <span className="bg-white text-red-600 px-2 py-0.5 rounded font-bold">{formatTime(timeLeft.hours)}</span>
            <span className="font-bold">:</span>
            <span className="bg-white text-red-600 px-2 py-0.5 rounded font-bold">{formatTime(timeLeft.minutes)}</span>
            <span className="font-bold">:</span>
            <span className="bg-white text-red-600 px-2 py-0.5 rounded font-bold">{formatTime(timeLeft.seconds)}</span>
          </div>
        </div>

        {/* Product List */}
        {loading ? (
          <div className="space-y-4 pb-20"><ListSkeleton count={4} /></div>
        ) : products.length === 0 ? (
          <Empty
            icon="flash_on"
            title="暂无秒杀活动"
            description="当前没有进行中的秒杀活动，请稍后再来"
            className="py-10"
          />
        ) : (
          <div className="space-y-4 pb-20">
            {products.map(item => {
              const progress = item.stock > 0 ? Math.min((item.sold_count / (item.sold_count + item.stock)) * 100, 100) : 100;
              return (
                <Link to={`/product/${item.product_id}`} key={item.id} className="flex bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800 p-3 gap-4 relative">
                  <div className="w-28 h-28 shrink-0 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden relative">
                    <img src={item.product?.images?.[0] || '/placeholder.jpg'} alt={item.product?.name} className="w-full h-full object-cover" />
                    <div className="absolute top-0 left-0 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-br-lg z-10">
                      秒杀
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <h3 className="text-slate-900 dark:text-slate-100 font-medium text-sm line-clamp-2">{item.product?.name}</h3>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-red-500 font-bold text-lg">{formatPrice(item.flash_price)}</span>
                        <span className="text-slate-400 text-xs line-through">{formatPrice(item.product?.original_price || item.product?.price)}</span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>已抢 {item.sold_count} 件</span>
                        <span>库存 {item.stock} 件</span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/product/${item.product_id}`);
                    }}
                    className="self-center px-4 py-2 bg-red-500 text-white rounded-full text-xs font-bold shadow-sm shadow-red-500/30"
                  >
                    立即抢
                  </button>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}