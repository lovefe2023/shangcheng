import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { marketingApi, productsApi } from '../lib/api';
import { ProductCardSkeleton } from '../components/Skeleton';

interface Banner {
  id: string;
  title: string;
  image_url: string;
  link_url: string;
}

interface FlashSale {
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
  };
}

interface Product {
  id: string;
  name: string;
  images: string[];
  price: number;
  original_price: number;
  tags: string[];
  stock: number;
}

export default function Home() {
  const navigate = useNavigate();

  // 数据状态
  const [banners, setBanners] = useState<Banner[]>([]);
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentBanner, setCurrentBanner] = useState(0);

  // 倒计时状态
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    fetchHomeData();
  }, []);

  useEffect(() => {
    // 轮播图自动切换
    const bannerTimer = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % Math.max(banners.length, 1));
    }, 5000);
    return () => clearInterval(bannerTimer);
  }, [banners.length]);

  // 秒杀倒计时
  useEffect(() => {
    if (flashSales.length === 0) return;

    const getEndTime = () => {
      const now = new Date();
      // 找到最近结束的秒杀活动
      const ongoingSale = flashSales.find(s => s.status === 'ongoing');
      if (ongoingSale) {
        return new Date(ongoingSale.end_time);
      }
      // 默认到当天24点
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      return endOfDay;
    };

    const timer = setInterval(() => {
      const endTime = getEndTime();
      const now = new Date();
      const diff = endTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, [flashSales]);

  const fetchHomeData = async () => {
    setLoading(true);
    try {
      const [bannersRes, flashSalesRes, productsRes] = await Promise.all([
        marketingApi.getBanners(),
        marketingApi.getFlashSales('ongoing'),
        productsApi.getList({ pageSize: 4, sortBy: 'sales', sortOrder: 'desc' })
      ]);

      if (bannersRes.success) setBanners(bannersRes.data || []);
      if (flashSalesRes.success) setFlashSales(flashSalesRes.data || []);
      if (productsRes.success) setProducts(productsRes.data?.list || []);
    } catch (error) {
      console.error('获取首页数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: number) => time.toString().padStart(2, '0');

  const currentBannerData = banners[currentBanner];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center p-4 justify-between gap-3">
          <div className="flex-1" onClick={() => navigate('/category')}>
            <div className="flex items-center h-10 w-full bg-slate-100 dark:bg-slate-800 rounded-full pl-4 pr-1 gap-2 cursor-text">
              <span className="material-symbols-outlined text-slate-500 text-xl">search</span>
              <div className="text-sm w-full text-slate-500">搜索美酒佳酿...</div>
              <button className="bg-primary text-white text-xs font-bold h-8 px-5 rounded-full whitespace-nowrap">搜索</button>
            </div>
          </div>
        </div>
      </header>

      {/* Banner */}
      <div className="px-4 py-4 bg-white dark:bg-slate-950">
        {loading ? (
          <div className="w-full aspect-[21/9] rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
        ) : banners.length > 0 ? (
          <Link to={currentBannerData?.link_url || '/products'} className="block relative w-full aspect-[21/9] rounded-xl overflow-hidden shadow-sm group">
            <div className="absolute inset-0 bg-cover bg-center transition-all duration-500" style={{ backgroundImage: `url('${currentBannerData?.image_url}')` }}></div>
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent flex flex-col justify-center px-6">
              <span className="text-primary font-bold text-xs tracking-wider uppercase mb-1">{currentBannerData?.title || '名酒特惠'}</span>
              <h2 className="text-white text-xl font-bold leading-tight">精选好酒 限时优惠</h2>
              <button className="mt-3 w-fit bg-primary text-white text-xs font-bold py-2 px-4 rounded-lg">立即选购</button>
            </div>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {banners.map((_, i) => (
                <span key={i} className={`size-1.5 rounded-full transition-all ${i === currentBanner ? 'bg-white' : 'bg-white/40'}`} />
              ))}
            </div>
          </Link>
        ) : (
          <Link to="/products" className="block relative w-full aspect-[21/9] rounded-xl overflow-hidden shadow-sm bg-gradient-to-r from-primary to-amber-500">
            <div className="absolute inset-0 flex flex-col justify-center px-6">
              <span className="text-white/80 font-bold text-xs tracking-wider uppercase mb-1">名酒品鉴季</span>
              <h2 className="text-white text-xl font-bold leading-tight">精选好酒 限时优惠</h2>
              <button className="mt-3 w-fit bg-white text-primary text-xs font-bold py-2 px-4 rounded-lg">立即选购</button>
            </div>
          </Link>
        )}
      </div>

      {/* 1st Layer Buttons */}
      <div className="grid gap-4 px-4 py-4 grid-cols-5 bg-white dark:bg-slate-950">
        <Link to="/coupons" className="flex flex-col items-center gap-2">
          <div className="size-12 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-500">
            <span className="material-symbols-outlined text-2xl">local_activity</span>
          </div>
          <span className="text-xs font-semibold">新人优享</span>
        </Link>
        <Link to="/group-buy" className="flex flex-col items-center gap-2">
          <div className="size-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-500">
            <span className="material-symbols-outlined text-2xl">groups</span>
          </div>
          <span className="text-xs font-semibold">组团免单</span>
        </Link>
        <Link to="/partner-package" className="flex flex-col items-center gap-2">
          <div className="size-12 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-500">
            <span className="material-symbols-outlined text-2xl">redeem</span>
          </div>
          <span className="text-xs font-semibold">合伙礼包</span>
        </Link>
        <Link to="/sales" className="flex flex-col items-center gap-2">
          <div className="size-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-500">
            <span className="material-symbols-outlined text-2xl">payments</span>
          </div>
          <span className="text-xs font-semibold">收益明细</span>
        </Link>
        <Link to="/notifications" className="flex flex-col items-center gap-2">
          <div className="size-12 rounded-2xl bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-500">
            <span className="material-symbols-outlined text-2xl">campaign</span>
          </div>
          <span className="text-xs font-semibold">公告中心</span>
        </Link>
      </div>

      {/* 2nd Layer Buttons */}
      <div className="grid grid-cols-4 gap-2 px-4 py-2 bg-white dark:bg-slate-950 mb-2">
        <Link to="/products?category=养生酒" className="flex flex-col items-center gap-1.5">
          <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
            <span className="material-symbols-outlined text-xl">spa</span>
          </div>
          <span className="text-[11px] text-slate-600 dark:text-slate-400">养生套餐</span>
        </Link>
        <Link to="/products?sortBy=price&sortOrder=desc" className="flex flex-col items-center gap-1.5">
          <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
            <span className="material-symbols-outlined text-xl">card_giftcard</span>
          </div>
          <span className="text-[11px] text-slate-600 dark:text-slate-400">远方厚礼</span>
        </Link>
        <Link to="/flash-sale" className="flex flex-col items-center gap-1.5">
          <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
            <span className="material-symbols-outlined text-xl">volunteer_activism</span>
          </div>
          <span className="text-[11px] text-slate-600 dark:text-slate-400">限时特惠</span>
        </Link>
        <Link to="/coupons" className="flex flex-col items-center gap-1.5">
          <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
            <span className="material-symbols-outlined text-xl">stars</span>
          </div>
          <span className="text-[11px] text-slate-600 dark:text-slate-400">领券中心</span>
        </Link>
      </div>

      {/* 1. 限时秒杀 Flash Sale */}
      <section className="bg-white dark:bg-slate-950 px-4 py-4 mb-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold">限时秒杀</h3>
            <div className="flex items-center gap-1 text-xs font-mono">
              <span className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-1.5 py-0.5 rounded">{formatTime(timeLeft.hours)}</span>
              <span className="font-bold">:</span>
              <span className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-1.5 py-0.5 rounded">{formatTime(timeLeft.minutes)}</span>
              <span className="font-bold">:</span>
              <span className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-1.5 py-0.5 rounded">{formatTime(timeLeft.seconds)}</span>
            </div>
          </div>
          <Link to="/flash-sale" className="text-slate-500 text-xs flex items-center">
            更多 <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          </Link>
        </div>

        {loading ? (
          <div className="flex gap-3 overflow-x-auto hide-scrollbar">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-[120px] shrink-0">
                <div className="w-[120px] h-[120px] bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
              </div>
            ))}
          </div>
        ) : flashSales.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto hide-scrollbar">
            {flashSales.slice(0, 4).map(sale => (
              <Link to={`/product/${sale.product_id}`} key={sale.id} className="w-[120px] shrink-0 flex flex-col items-center text-center">
                <div className="w-[120px] h-[120px] bg-slate-50 dark:bg-slate-800/50 rounded-lg mb-2 flex items-center justify-center overflow-hidden relative">
                  <img src={sale.product?.images?.[0]} alt={sale.product?.name} className="w-[80px] h-[80px] object-cover rounded-md shadow-sm" />
                  <span className="absolute top-1 left-1 bg-red-500 text-white text-[10px] px-1 rounded">秒杀</span>
                </div>
                <h4 className="text-xs font-medium line-clamp-1 mb-1 w-full">{sale.product?.name}</h4>
                <div className="flex flex-col items-center w-full gap-0.5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-primary font-bold text-sm">¥{sale.flash_price}</span>
                    <span className="text-[10px] text-slate-400 line-through">¥{sale.product?.original_price}</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                    <div
                      className="bg-primary h-1.5 rounded-full"
                      style={{ width: `${Math.min((sale.sold_count / sale.stock) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500">已抢{sale.sold_count}件</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 text-sm">
            暂无秒杀活动
          </div>
        )}
      </section>

      {/* 2. 今日主推专区 Today's Top Picks */}
      <section className="px-4 py-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">今日主推专区</h3>
          <Link to="/products" className="text-slate-500 text-xs flex items-center">
            更多 <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          </Link>
        </div>

        {loading ? (
          <ProductCardSkeleton count={4} />
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {products.map(product => (
              <Link to={`/product/${product.id}`} key={product.id} className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="aspect-square bg-slate-100 dark:bg-slate-800 relative">
                  <img src={product.images?.[0]} alt={product.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-3">
                  <h4 className="text-sm font-medium line-clamp-2 mb-2">{product.name}</h4>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {product.tags?.slice(0, 2).map(tag => (
                      <span key={tag} className="text-[10px] border border-primary text-primary px-1 rounded-sm">{tag}</span>
                    ))}
                  </div>
                  <div className="flex items-end justify-between">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-primary font-bold text-sm">¥{product.price}</span>
                        {product.original_price > product.price && (
                          <span className="text-[10px] text-slate-400 line-through">¥{product.original_price}</span>
                        )}
                      </div>
                      {product.original_price > product.price && (
                        <span className="text-[9px] text-primary bg-primary/10 px-1 rounded-sm border border-primary/20 w-fit">
                          省¥{product.original_price - product.price}
                        </span>
                      )}
                    </div>
                    <span className="material-symbols-outlined text-slate-400 text-sm mb-1">add_shopping_cart</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 text-sm">
            暂无推荐商品
          </div>
        )}
      </section>
    </div>
  );
}
