import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Empty from '../components/Empty';
import { ListSkeleton } from '../components/Skeleton';
import { partnerApi } from '../lib/api';
import { IncomeStatus, IncomeStatusLabel } from '../types';

interface TeamSaleRecord {
  id: string;
  member: {
    id: string;
    name: string;
    phone: string;
    avatar?: string;
  };
  order: {
    id: string;
    order_no: string;
  };
  product_name: string;
  product_image: string;
  amount: number;
  commission: number;
  status: IncomeStatus;
  created_at: string;
}

interface TeamStats {
  total_sales: number;
  month_sales: number;
  expected_commission: number;
}

export default function TeamSales() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');

  const [records, setRecords] = useState<TeamSaleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [stats, setStats] = useState<TeamStats>({
    total_sales: 0,
    month_sales: 0,
    expected_commission: 0
  });
  const [chartData, setChartData] = useState<{ name: string; sales: number }[]>([]);

  useEffect(() => {
    fetchTeamSales();
    fetchTeamStats();
  }, []);

  const fetchTeamSales = async (pageNum: number = 1, reset: boolean = false) => {
    if (pageNum === 1) setLoading(true);
    try {
      const res = await partnerApi.getTeam({ page: pageNum, pageSize: 20 });
      if (res.success && res.data) {
        const newList = res.data.sales || [];
        if (reset) {
          setRecords(newList);
        } else {
          setRecords(prev => [...prev, ...newList]);
        }
        setHasMore(newList.length >= 20);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('获取团队销售失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamStats = async () => {
    try {
      const res = await partnerApi.getTeam({ page: 1, pageSize: 1 });
      if (res.success && res.data) {
        setStats({
          total_sales: res.data.total_sales || 0,
          month_sales: res.data.month_sales || 0,
          expected_commission: res.data.expected_commission || 0
        });
        // 图表数据
        if (res.data.chart) {
          setChartData(Object.entries(res.data.chart).map(([date, value]) => ({
            name: date.split('/').slice(1).join('/'),
            sales: value as number
          })));
        }
      }
    } catch (error) {
      console.error('获取团队统计失败:', error);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchTeamSales(page + 1);
    }
  };

  const filteredAndSortedSales = useMemo(() => {
    let result = [...records];

    // Filter by name
    if (searchTerm) {
      result = result.filter(sale =>
        sale.member?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === 'date-asc') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortBy === 'amount-desc') {
        return b.amount - a.amount;
      } else if (sortBy === 'amount-asc') {
        return a.amount - b.amount;
      }
      return 0;
    });

    return result;
  }, [records, searchTerm, sortBy]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const formatPrice = (price: number) => `¥${(price || 0).toFixed(2)}`;

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen flex flex-col">
      {/* 顶部导航 */}
      <nav className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="material-symbols-outlined cursor-pointer text-slate-600 dark:text-slate-300">arrow_back</button>
          <h1 className="text-lg font-bold">推荐人员销售额</h1>
        </div>
        <div className="w-10"></div>
      </nav>

      <main className="max-w-md mx-auto pb-8 flex-1 w-full">
        {/* 统计卡片 */}
        <div className="p-4">
          <div className="bg-gradient-to-br from-primary to-blue-600 rounded-xl p-6 text-white shadow-lg shadow-primary/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <span className="material-symbols-outlined text-8xl -rotate-12">monitoring</span>
            </div>
            <div className="relative z-10">
              <p className="text-white/80 text-sm font-medium mb-1">团队总销售额 (元)</p>
              <p className="text-3xl font-bold tracking-tight">{formatPrice(stats.total_sales)}</p>
              <div className="mt-4 grid grid-cols-2 gap-4 border-t border-white/20 pt-4">
                <div>
                  <p className="text-white/70 text-xs mb-1">本月新增</p>
                  <p className="text-lg font-bold">{formatPrice(stats.month_sales)}</p>
                </div>
                <div>
                  <p className="text-white/70 text-xs mb-1">预计提成</p>
                  <p className="text-lg font-bold">{formatPrice(stats.expected_commission)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 销售趋势图表 */}
        <div className="px-4 mt-2 mb-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-lg font-bold mb-4">近7天销售趋势</h2>
            <div className="h-48 w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}
                      itemStyle={{ color: '#0f172a', fontSize: '14px', fontWeight: 'bold' }}
                      formatter={(value: number) => [`¥${value}`, '销售额']}
                    />
                    <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">暂无数据</div>
              )}
            </div>
          </div>
        </div>

        {/* 销售记录列表 */}
        <div className="px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">成员购买记录</h2>
          </div>

          {/* 筛选和排序控制区 */}
          <div className="mb-4 flex flex-col gap-3">
            {/* 搜索框 */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
              <input
                type="text"
                placeholder="搜索成员姓名..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary/50 transition-shadow"
              />
            </div>

            {/* 排序选项 */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
              <button
                onClick={() => setSortBy(sortBy === 'date-desc' ? 'date-asc' : 'date-desc')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${sortBy.startsWith('date') ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
              >
                时间排序
                <span className="material-symbols-outlined text-[14px]">
                  {sortBy === 'date-desc' ? 'arrow_downward' : sortBy === 'date-asc' ? 'arrow_upward' : 'swap_vert'}
                </span>
              </button>
              <button
                onClick={() => setSortBy(sortBy === 'amount-desc' ? 'amount-asc' : 'amount-desc')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${sortBy.startsWith('amount') ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
              >
                金额排序
                <span className="material-symbols-outlined text-[14px]">
                  {sortBy === 'amount-desc' ? 'arrow_downward' : sortBy === 'amount-asc' ? 'arrow_upward' : 'swap_vert'}
                </span>
              </button>
            </div>
          </div>

          {loading && records.length === 0 ? (
            <ListSkeleton count={4} />
          ) : filteredAndSortedSales.length === 0 ? (
            <Empty
              icon="search_off"
              title="未找到记录"
              description="没有找到匹配的销售记录"
              className="mt-4"
            />
          ) : (
            <div className="space-y-4">
              {filteredAndSortedSales.map((sale) => (
                <div key={sale.id} className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
                  {/* 成员信息 & 状态 */}
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-medium text-slate-600 dark:text-slate-300">
                        {sale.member?.name?.charAt(0) || '?'}
                      </div>
                      <span className="text-sm font-medium">{sale.member?.name || '未知用户'}</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      sale.status === IncomeStatus.COMPLETED || sale.status === IncomeStatus.SETTLED
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                    }`}>
                      {IncomeStatusLabel[sale.status] || sale.status}
                    </span>
                  </div>

                  {/* 商品信息 */}
                  <div className="flex gap-3">
                    <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                      {sale.product_image && (
                        <img src={sale.product_image} alt={sale.product_name} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <p className="text-sm font-bold line-clamp-2">{sale.product_name || '未知商品'}</p>
                      <div className="flex items-end justify-between mt-2">
                        <div>
                          <p className="text-xs text-slate-500 mb-0.5">订单金额: <span className="text-slate-900 dark:text-slate-100 font-semibold">{formatPrice(sale.amount)}</span></p>
                          <p className="text-xs text-primary font-medium">预估提成: {formatPrice(sale.commission)}</p>
                        </div>
                        <p className="text-[10px] text-slate-400">{formatDate(sale.created_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {hasMore && (
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="w-full mt-6 py-3 text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {loading ? '加载中...' : '加载更多记录'}
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}