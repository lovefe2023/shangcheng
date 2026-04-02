import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Empty from '../components/Empty';

interface CellarItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  vintage: string;
  quantity: number;
  purchase_price: number;
  purchase_date: string;
  note: string;
}

interface CellarStats {
  total_quantity: number;
  total_value: number;
  distinct_products: number;
}

export default function MyCellar() {
  const [cellarItems, setCellarItems] = useState<CellarItem[]>([]);
  const [stats, setStats] = useState<CellarStats>({ total_quantity: 0, total_value: 0, distinct_products: 0 });
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'created_at' | 'quantity' | 'purchase_date'>('created_at');

  useEffect(() => {
    fetchCellarItems();
    fetchStats();
  }, [sortBy]);

  const fetchCellarItems = async () => {
    try {
      const res = await fetch(`/api/cellar?sort=${sortBy}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setCellarItems(data.data.list || []);
      }
    } catch (error) {
      console.error('获取酒窖列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/cellar/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('获取酒窖统计失败:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const toggleSort = () => {
    if (sortBy === 'created_at') {
      setSortBy('quantity');
    } else if (sortBy === 'quantity') {
      setSortBy('purchase_date');
    } else {
      setSortBy('created_at');
    }
  };

  const getSortLabel = () => {
    switch (sortBy) {
      case 'quantity': return '按数量';
      case 'purchase_date': return '按购买时间';
      default: return '按添加时间';
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <header className="shrink-0 sticky top-0 z-10 flex items-center bg-white dark:bg-slate-900 p-4 border-b border-slate-200 dark:border-slate-800 justify-between">
        <Link to="/profile" className="text-slate-900 dark:text-slate-100 flex size-10 shrink-0 items-center justify-start">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-tight flex-1 text-center">我的酒窖</h1>
        <div className="flex w-10 items-center justify-end">
          <span className="material-symbols-outlined">search</span>
        </div>
      </header>

      {/* Stats Summary */}
      <div className="shrink-0 bg-white dark:bg-slate-900 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <span className="text-xs text-slate-500">藏酒数量</span>
              <p className="font-bold text-primary">{stats.total_quantity} 瓶</p>
            </div>
            <div className="text-center">
              <span className="text-xs text-slate-500">藏酒种类</span>
              <p className="font-bold text-slate-700 dark:text-slate-300">{stats.distinct_products} 种</p>
            </div>
            <div className="text-center">
              <span className="text-xs text-slate-500">总价值</span>
              <p className="font-bold text-slate-700 dark:text-slate-300">¥{stats.total_value.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sort Toggle */}
      <div className="shrink-0 flex justify-between items-center px-4 py-3 bg-slate-50 dark:bg-slate-950">
        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300">藏酒列表</h2>
        <button onClick={toggleSort} className="flex items-center gap-1 text-xs text-slate-500">
          <span>{getSortLabel()}</span>
          <span className="material-symbols-outlined text-[14px]">swap_vert</span>
        </button>
      </div>

      <main className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
          </div>
        ) : cellarItems.length > 0 ? (
          <div className="flex flex-col gap-3">
            {cellarItems.map(item => (
              <Link
                to={`/product/${item.product_id}`}
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-xl p-3 flex gap-4 shadow-sm border border-slate-100 dark:border-slate-800"
              >
                <div className="w-20 h-24 shrink-0 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src={item.product_image || 'https://images.unsplash.com/photo-1568213816046-0ee1c42bd559?w=400&q=80'}
                    alt={item.product_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">
                      {item.product_name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      {item.vintage && (
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded">
                          年份: {item.vintage}
                        </span>
                      )}
                      {item.purchase_date && (
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded">
                          入库: {formatDate(item.purchase_date)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-end justify-between mt-2">
                    <div className="text-primary font-bold">¥{item.purchase_price?.toLocaleString()}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      数量: <span className="font-bold text-slate-700 dark:text-slate-300">{item.quantity}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <Empty
            icon="wine_bar"
            title="酒窖空空如也"
            description="您还没有任何藏酒，快去挑选一些心仪的美酒吧"
            actionText="去逛逛"
            actionLink="/"
            className="mt-10"
          />
        )}
      </main>
    </div>
  );
}
