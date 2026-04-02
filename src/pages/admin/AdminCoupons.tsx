import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Empty from '../../components/Empty';
import { ListSkeleton } from '../../components/Skeleton';
import { useToast } from '../../components/Toast';
import { marketingApi } from '../../lib/api';
import { CouponStatus, CouponStatusLabel } from '../../types';

interface Coupon {
  id: string;
  name: string;
  type: string;
  discount_amount: number;
  min_amount: number;
  total_count: number;
  used_count: number;
  start_time: string;
  end_time: string;
  status: CouponStatus;
  created_at: string;
}

const CouponTypeLabels: Record<string, string> = {
  discount: '折扣券',
  full_reduction: '满减券',
};

export default function AdminCoupons() {
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    fetchCoupons();
  }, [page, statusFilter]);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await marketingApi.getCoupons();
      if (res.success && res.data) {
        let couponList = res.data as Coupon[];

        // Apply filters
        if (searchQuery) {
          couponList = couponList.filter(c => c.name.includes(searchQuery));
        }
        if (typeFilter) {
          couponList = couponList.filter(c => c.type === typeFilter);
        }
        if (statusFilter) {
          couponList = couponList.filter(c => c.status === statusFilter);
        }

        setTotal(couponList.length);
        // Simple pagination
        const start = (page - 1) * pageSize;
        setCoupons(couponList.slice(start, start + pageSize));
      } else {
        toast.error('获取优惠券列表失败');
      }
    } catch (error) {
      console.error('Get coupons error:', error);
      toast.error('获取优惠券列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchCoupons();
  };

  // Calculate claimed count (total - remaining)
  const getClaimedCount = (coupon: Coupon) => {
    // This would need a separate field from backend
    // For now, estimate based on used_count
    return coupon.used_count * 3; // Rough estimate
  };

  const formatValidity = (coupon: Coupon) => {
    if (coupon.start_time && coupon.end_time) {
      const start = new Date(coupon.start_time).toLocaleDateString('zh-CN');
      const end = new Date(coupon.end_time).toLocaleDateString('zh-CN');
      return `${start} 至 ${end}`;
    }
    return '永久有效';
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/marketing')}
            className="p-2 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">优惠券管理</h1>
        </div>
        <button
          onClick={() => navigate('/admin/marketing/coupons/create')}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          创建优惠券
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4 items-center">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
              <input
                type="text"
                placeholder="搜索优惠券名称..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-64"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm rounded-lg px-3 py-2 outline-none"
            >
              <option value="">所有类型</option>
              <option value="full_reduction">满减券</option>
              <option value="discount">折扣券</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm rounded-lg px-3 py-2 outline-none"
            >
              <option value="">所有状态</option>
              <option value={CouponStatus.DISTRIBUTING}>发放中</option>
              <option value={CouponStatus.ENDED}>已结束</option>
            </select>
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              搜索
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <ListSkeleton count={5} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
                  <th className="p-4 font-medium">优惠券名称</th>
                  <th className="p-4 font-medium">类型</th>
                  <th className="p-4 font-medium">面额/折扣</th>
                  <th className="p-4 font-medium">使用门槛</th>
                  <th className="p-4 font-medium">发放总量</th>
                  <th className="p-4 font-medium">已使用</th>
                  <th className="p-4 font-medium">有效期</th>
                  <th className="p-4 font-medium">状态</th>
                  <th className="p-4 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {coupons.length > 0 ? (
                  coupons.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="p-4 text-sm font-medium text-slate-900 dark:text-white">{item.name}</td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          item.type === 'full_reduction' ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' :
                          'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400'
                        }`}>
                          {CouponTypeLabels[item.type] || item.type}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-bold text-primary">
                        {item.type === 'full_reduction' ? `满${item.min_amount}减${item.discount_amount}` : `${item.discount_amount}折`}
                      </td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                        {item.min_amount > 0 ? `满${item.min_amount}元可用` : '无门槛'}
                      </td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{item.total_count}</td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden w-20">
                            <div
                              className="h-full bg-emerald-500"
                              style={{ width: `${Math.min((item.used_count / item.total_count) * 100, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs">{item.used_count}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{formatValidity(item)}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          item.status === CouponStatus.DISTRIBUTING ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                          'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                        }`}>
                          {CouponStatusLabel[item.status] || item.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => navigate(`/admin/marketing/coupons/records/${item.id}`)}
                            className="text-primary text-sm font-medium hover:underline"
                          >
                            发放记录
                          </button>
                          <button className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-sm font-medium hover:underline">编辑</button>
                          {item.status === CouponStatus.DISTRIBUTING && (
                            <button className="text-red-500 hover:text-red-600 text-sm font-medium hover:underline">停发</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="p-0">
                      <Empty
                        icon="confirmation_number"
                        title="暂无优惠券"
                        description="没有找到符合条件的优惠券，请尝试更改搜索条件"
                        actionText="清除筛选"
                        onAction={() => {
                          setSearchQuery('');
                          setTypeFilter('');
                          setStatusFilter('');
                          setPage(1);
                        }}
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-sm">
            <span className="text-slate-500">共 {total} 条记录，当前 {page}/{totalPages} 页</span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
              >
                上一页
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(page - 2 + i, totalPages - 4 + i));
                return (
                  <button
                    key={i}
                    onClick={() => setPage(pageNum)}
                    className={`px-3 py-1.5 border rounded ${page === pageNum ? 'border-primary bg-primary text-white' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
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