import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { productsApi } from '../lib/api';
import { ListSkeleton } from '../components/Skeleton';

interface Product {
  id: string;
  name: string;
  images: string[];
  price: number;
  original_price: number;
  sales: number;
  stock: number;
  tags: string[];
  description: string;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // 筛选状态
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setPage(1);
    setProducts([]);
    setHasMore(true);
    fetchProducts(1, true);
  }, [sortBy, sortOrder, category]);

  const fetchProducts = async (pageNum: number = page, reset: boolean = false) => {
    setLoading(true);
    try {
      const res = await productsApi.getList({
        page: pageNum,
        pageSize: 10,
        keyword: keyword || undefined,
        category: category || undefined,
        sortBy,
        sortOrder
      });

      if (res.success && res.data) {
        const newList = res.data.list || [];
        if (reset) {
          setProducts(newList);
        } else {
          setProducts(prev => [...prev, ...newList]);
        }
        setTotal(res.data.total || 0);
        setHasMore(newList.length >= 10);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('获取商品列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    setProducts([]);
    setHasMore(true);
    fetchProducts(1, true);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchProducts(page + 1);
    }
  };

  const handleSort = (type: string) => {
    if (type === 'sales') {
      setSortBy('sales');
      setSortOrder('desc');
    } else if (type === 'price') {
      if (sortBy === 'price') {
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
      } else {
        setSortBy('price');
        setSortOrder('asc');
      }
    } else {
      setSortBy('created_at');
      setSortOrder('desc');
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center p-4 justify-between gap-4">
          <Link to="/" className="text-slate-900 dark:text-slate-100 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div className="flex-1">
            <label className="flex flex-col w-full h-10">
              <div className="flex w-full flex-1 items-stretch rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="text-slate-500 flex items-center justify-center pl-4">
                  <span className="material-symbols-outlined text-[20px]">search</span>
                </div>
                <input
                  className="flex w-full min-w-0 flex-1 border-none bg-transparent focus:ring-0 text-sm placeholder:text-slate-400 outline-none"
                  placeholder="搜索心仪酒款"
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                {keyword && (
                  <button onClick={() => { setKeyword(''); }} className="px-2 text-slate-400 hover:text-slate-600">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                )}
              </div>
            </label>
          </div>
          <Link to="/cart" className="flex items-center justify-center">
            <span className="material-symbols-outlined text-slate-900 dark:text-slate-100">shopping_cart</span>
          </Link>
        </div>
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto hide-scrollbar">
          <button
            onClick={() => handleSort('default')}
            className={`flex h-9 shrink-0 items-center justify-center gap-x-1 rounded-lg px-3 text-sm font-semibold ${
              sortBy === 'created_at' ? 'bg-primary/10 text-primary' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            综合排序
            <span className="material-symbols-outlined text-[18px]">keyboard_arrow_down</span>
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex h-9 shrink-0 items-center justify-center gap-x-1 rounded-lg px-3 text-sm font-medium ${
              category ? 'bg-primary/10 text-primary' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            分类
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
          </button>
          <button
            onClick={() => handleSort('sales')}
            className={`flex h-9 shrink-0 items-center justify-center gap-x-1 rounded-lg px-3 text-sm font-medium ${
              sortBy === 'sales' ? 'bg-primary/10 text-primary' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            销量
          </button>
          <button
            onClick={() => handleSort('price')}
            className={`flex h-9 shrink-0 items-center justify-center gap-x-1 rounded-lg px-3 text-sm font-medium ${
              sortBy === 'price' ? 'bg-primary/10 text-primary' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            价格
            <span className={`material-symbols-outlined text-[18px] ${sortBy === 'price' && sortOrder === 'desc' ? 'rotate-180' : ''}`}>swap_vert</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 pb-24">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">全部商品 ({total})</h3>
        </div>

        {loading && products.length === 0 ? (
          <ListSkeleton count={5} />
        ) : products.length > 0 ? (
          <div className="flex flex-col gap-4">
            {products.map(product => (
              <Link to={`/product/${product.id}`} key={product.id} className="flex bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 p-2 gap-3">
                <div className="w-32 h-32 shrink-0 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden relative">
                  <img src={product.images?.[0]} alt={product.name} className="w-full h-full object-cover" />
                  {product.tags?.[0] && (
                    <div className="absolute top-1 left-1 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">
                      {product.tags[0]}
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-between flex-1 py-1">
                  <div>
                    <h4 className="text-slate-900 dark:text-slate-100 font-bold text-base leading-snug line-clamp-2">{product.name}</h4>
                    <p className="text-slate-500 text-xs mt-1 line-clamp-1">{product.description}</p>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-primary text-xs font-bold">¥</span>
                        <span className="text-primary text-xl font-bold">{product.price.toLocaleString()}</span>
                        {product.original_price > product.price && (
                          <span className="text-slate-400 text-xs line-through">¥{product.original_price}</span>
                        )}
                      </div>
                      <p className="text-slate-400 text-[11px]">月销 {product.sales.toLocaleString()}+</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {product.stock <= 10 && product.stock > 0 && (
                        <span className="text-xs text-red-500">仅剩{product.stock}件</span>
                      )}
                      <Link
                        to="/cart"
                        className="bg-primary text-white size-8 flex items-center justify-center rounded-full shadow-lg shadow-primary/30"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </Link>
            ))}

            {hasMore && (
              <button
                onClick={loadMore}
                disabled={loading}
                className="py-3 text-center text-sm text-slate-500 hover:text-primary"
              >
                {loading ? '加载中...' : '加载更多'}
              </button>
            )}

            {!hasMore && products.length > 0 && (
              <div className="py-8 text-center">
                <p className="text-slate-400 text-sm">到底啦，看看别的吧 ~</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <span className="material-symbols-outlined text-5xl mb-3">search_off</span>
            <p className="text-sm">未找到相关商品</p>
          </div>
        )}
      </main>
    </div>
  );
}
