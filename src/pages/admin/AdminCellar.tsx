import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Empty from '../../components/Empty';
import { ListSkeleton } from '../../components/Skeleton';
import { useToast } from '../../components/Toast';
import { adminApi } from '../../lib/api';

interface CellarItem {
  id: string;
  user_id: string;
  product_id: string;
  product_name: string;
  vintage: string;
  quantity: number;
  purchase_price: number;
  purchase_date: string;
  note: string;
  created_at: string;
  user?: {
    id: string;
    name: string;
    phone: string;
  };
  product?: {
    id: string;
    name: string;
    images: string[];
  };
}

interface CellarStats {
  total_quantity: number;
  total_value: number;
  distinct_products: number;
}

export default function AdminCellar() {
  const navigate = useNavigate();
  const toast = useToast();

  // Data states
  const [items, setItems] = useState<CellarItem[]>([]);
  const [stats, setStats] = useState<CellarStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    fetchCellarItems();
  }, [page]);

  const fetchCellarItems = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getCellarItems({
        page,
        pageSize,
        keyword: searchQuery || undefined,
        user_id: userIdFilter || undefined
      });

      if (res.success && res.data) {
        setItems(res.data.list || []);
        setTotal(res.data.total || 0);
        setStats(res.data.stats);
      } else {
        toast.error('获取酒窖数据失败');
      }
    } catch (error) {
      console.error('Get cellar items error:', error);
      toast.error('获取酒窖数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchCellarItems();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条酒窖记录吗？')) return;

    try {
      const res = await adminApi.deleteCellarItem(id);
      if (res.success) {
        toast.success('删除成功');
        fetchCellarItems();
      } else {
        toast.error('删除失败');
      }
    } catch (error) {
      toast.error('删除失败');
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const formatCurrency = (value: number) => {
    return `¥${(value || 0).toLocaleString()}`;
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">酒窖管理</h1>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 text-primary rounded-full p-3">
                <span className="material-symbols-outlined">inventory_2</span>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">总藏酒数量</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total_quantity} 瓶</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-4">
              <div className="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-full p-3">
                <span className="material-symbols-outlined">payments</span>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">总藏酒价值</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(stats.total_value)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 rounded-full p-3">
                <span className="material-symbols-outlined">category</span>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">藏酒种类</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.distinct_products} 种</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
              <input
                type="text"
                placeholder="搜索商品名称..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-primary w-64"
              />
            </div>
            <input
              type="text"
              placeholder="用户ID筛选"
              value={userIdFilter}
              onChange={(e) => setUserIdFilter(e.target.value)}
              className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-primary w-48"
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium"
            >
              搜索
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-4"><ListSkeleton count={5} /></div>
          ) : items.length === 0 ? (
            <Empty
              icon="liquor"
              title="暂无酒窖记录"
              description="没有找到酒窖数据"
              className="py-10"
            />
          ) : (
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
                  <th className="p-4 font-medium">商品信息</th>
                  <th className="p-4 font-medium">所属用户</th>
                  <th className="p-4 font-medium">年份</th>
                  <th className="p-4 font-medium">数量</th>
                  <th className="p-4 font-medium">购入价</th>
                  <th className="p-4 font-medium">购入日期</th>
                  <th className="p-4 font-medium">添加时间</th>
                  <th className="p-4 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {item.product?.images?.[0] && (
                          <img src={item.product.images[0]} alt="" className="w-10 h-10 rounded object-cover" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {item.product?.name || item.product_name || '-'}
                          </p>
                          <p className="text-xs text-slate-400">{item.product_id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="text-sm text-slate-900 dark:text-white">{item.user?.name || '-'}</p>
                        <p className="text-xs text-slate-400">{item.user?.phone || '-'}</p>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                      {item.vintage || '-'}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-1 rounded text-sm font-medium bg-primary/10 text-primary">
                        {item.quantity} 瓶
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-900 dark:text-white font-medium">
                      {formatCurrency(item.purchase_price)}
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                      {formatDate(item.purchase_date)}
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/admin/users/${item.user_id}`)}
                          className="text-primary text-sm font-medium hover:underline"
                        >
                          查看用户
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-500 text-sm font-medium hover:underline"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-sm">
            <span className="text-slate-500">共 {total} 条记录，当前 {page}/{totalPages} 页</span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
              >
                上一页
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}