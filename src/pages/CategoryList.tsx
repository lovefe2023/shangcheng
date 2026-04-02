import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Empty from '../components/Empty';
import { ListSkeleton } from '../components/Skeleton';
import { productsApi } from '../lib/api';

interface Product {
  id: string;
  name: string;
  images: string[];
  price: number;
  original_price: number;
  sales: number;
  tags: string[];
  stock: number;
}

export default function CategoryList() {
  const navigate = useNavigate();
  const { type } = useParams<{ type: string }>();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const [sortBy, setSortBy] = useState<'comprehensive' | 'sales' | 'price' | 'new'>('comprehensive');
  const [priceOrder, setPriceOrder] = useState<'asc' | 'desc'>('asc');

  // Map route param to category
  const getCategoryInfo = () => {
    switch (type) {
      case 'health': return { title: '养生套餐', category: 'health' };
      case 'gifts': return { title: '远方厚礼', category: 'gifts' };
      case 'help': return { title: '消费帮扶', category: 'help' };
      case 'points': return { title: '积分商城', category: 'points' };
      default: return { title: '商品列表', category: '' };
    }
  };

  useEffect(() => {
    setPage(1);
    setProducts([]);
    setHasMore(true);
    fetchProducts(1, true);
  }, [type, sortBy, priceOrder]);

  const fetchProducts = async (pageNum: number = page, reset: boolean = false) => {
    setLoading(true);
    try {
      const categoryInfo = getCategoryInfo();

      // 构建排序参数
      let sortField = 'created_at';
      let sortOrder: 'asc' | 'desc' = 'desc';

      if (sortBy === 'sales') {
        sortField = 'sales';
        sortOrder = 'desc';
      } else if (sortBy === 'price') {
        sortField = 'price';
        sortOrder = priceOrder;
      } else if (sortBy === 'new') {
        sortField = 'created_at';
        sortOrder = 'desc';
      }

      const res = await productsApi.getList({
        page: pageNum,
        pageSize: 10,
        category: categoryInfo.category || undefined,
        sortBy: sortField,
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

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchProducts(page + 1);
    }
  };

  const handleSortChange = (newSort: 'comprehensive' | 'sales' | 'price' | 'new') => {
    if (newSort === 'price' && sortBy === 'price') {
      setPriceOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSort);
    }
  };

  const formatPrice = (price: number) => `¥${price.toFixed(2)}`;

  const categoryInfo = getCategoryInfo();

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="shrink-0 sticky top-0 z-50 flex items-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-3 border-b border-slate-200/60 dark:border-slate-800/60">
        <button onClick={() => navigate(-1)} className="flex items-center justify-center p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-90">
          <span className="material-symbols-outlined text-slate-900 dark:text-slate-100">arrow_back</span>
        </button>
        <h1 className="flex-1 text-center text-lg font-bold leading-tight mr-8">{categoryInfo.title}</h1>
      </header>

      {/* Sort Bar */}
      <div className="shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2">
        <div className="flex gap-6">
          {[
            { key: 'comprehensive', label: '综合' },
            { key: 'sales', label: '销量' },
            { key: 'price', label: '价格' },
            { key: 'new', label: '新品' }
          ].map(item => (
            <button
              key={item.key}
              onClick={() => handleSortChange(item.key as any)}
              className={`text-sm font-medium flex items-center gap-1 ${
                sortBy === item.key
                  ? 'text-primary'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {item.label}
              {item.key === 'price' && sortBy === 'price' && (
                <span className="material-symbols-outlined text-[16px]">
                  {priceOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Product List */}
      <main className="flex-1 overflow-y-auto p-4">
        {loading && products.length === 0 ? (
          <ListSkeleton count={6} />
        ) : products.length === 0 ? (
          <Empty
            icon="inventory_2"
            title="暂无商品"
            description="该分类下暂时没有商品"
            className="py-10"
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {products.map(product => (
                <Link
                  to={`/product/${product.id}`}
                  key={product.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800"
                >
                  <div className="aspect-square bg-slate-100 dark:bg-slate-800 relative">
                    <img
                      src={product.images?.[0] || '/placeholder.jpg'}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    {product.tags?.[0] && (
                      <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded font-bold">
                        {product.tags[0]}
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-slate-900 dark:text-slate-100 text-sm font-medium line-clamp-2 min-h-[40px]">
                      {product.name}
                    </h3>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-red-500 font-bold">{formatPrice(product.price)}</span>
                      {product.original_price > product.price && (
                        <span className="text-slate-400 text-xs line-through">
                          {formatPrice(product.original_price)}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-xs mt-1">已售 {product.sales || 0}</p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="mt-4 text-center">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="text-sm text-slate-500 dark:text-slate-400 py-2"
                >
                  {loading ? '加载中...' : '加载更多'}
                </button>
              </div>
            )}

            <p className="text-center text-xs text-slate-400 mt-4 pb-4">
              共 {total} 件商品
            </p>
          </>
        )}
      </main>
    </div>
  );
}