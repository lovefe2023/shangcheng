import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Empty from '../../components/Empty';
import { adminApi } from '../../lib/api';

interface DashboardStats {
  today_revenue: number;
  today_partners: number;
  pending_withdrawals: number;
  pending_shipments: number;
}

interface DashboardCharts {
  daily_revenue: Record<string, number>;
  daily_partners: Record<string, number>;
  daily_orders: Record<string, number>;
}

interface PendingWithdrawal {
  id: string;
  withdrawal_no: string;
  amount: number;
  created_at: string;
  user?: {
    id: string;
    name: string;
    phone: string;
  };
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [charts, setCharts] = useState<DashboardCharts | null>(null);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<PendingWithdrawal[]>([]);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getDashboard();
      if (res.success && res.data) {
        setStats(res.data.stats);
        setCharts(res.data.charts);
        setPendingWithdrawals(res.data.pending_withdrawal_list || []);
      }
    } catch (error) {
      console.error('Get dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return `¥${(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
  };

  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    return `${days}天前`;
  };

  // 转换图表数据
  const salesData = charts?.daily_revenue
    ? Object.entries(charts.daily_revenue).map(([date, value]) => ({
        name: date.split('/').slice(1).join('/'),
        value
      }))
    : [];

  const partnersData = charts?.daily_partners
    ? Object.entries(charts.daily_partners).map(([date, value]) => ({
        name: date.split('/').slice(1).join('/'),
        value
      }))
    : [];

  const ordersData = charts?.daily_orders
    ? Object.entries(charts.daily_orders).map(([date, value]) => ({
        name: date.split('/').slice(1).join('/'),
        value
      }))
    : [];

  const statsCards = stats ? [
    { label: '今日交易额', value: formatCurrency(stats.today_revenue), icon: 'payments', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', link: '/admin/orders' },
    { label: '今日新增合伙人', value: String(stats.today_partners), icon: 'handshake', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10', link: '/admin/partners' },
    { label: '待处理提现', value: String(stats.pending_withdrawals), icon: 'account_balance_wallet', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10', link: '/admin/withdrawal' },
    { label: '待发货订单', value: String(stats.pending_shipments), icon: 'local_shipping', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', link: '/admin/orders' },
  ] : [];

  const quickActions = [
    { label: '新建秒杀活动', icon: 'flash_on', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', link: '/admin/marketing/flash-sale/create' },
    { label: '新建团购活动', icon: 'groups', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', link: '/admin/marketing/group-buy/create' },
    { label: '发放优惠券', icon: 'local_activity', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', link: '/admin/marketing/coupons/create' },
    { label: '查看提现', icon: 'payments', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10', link: '/admin/withdrawal' },
  ];

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">控制台概览</h1>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">控制台概览</h1>
        <div className="flex gap-2">
          <button
            onClick={fetchDashboard}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            刷新数据
          </button>
        </div>
      </div>

      {/* Core Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <div
            key={index}
            onClick={() => navigate(stat.link)}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 group-hover:text-primary transition-colors">{stat.label}</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</h3>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.bg}`}>
                <span className={`material-symbols-outlined ${stat.color}`}>{stat.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">近7天交易额</h3>
          <div className="h-64">
            {salesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`¥${value.toLocaleString()}`, '交易额']}
                  />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">暂无数据</div>
            )}
          </div>
        </div>

        {/* Partners Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">近7天合伙人增长</h3>
          <div className="h-64">
            {partnersData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={partnersData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`${value} 人`, '新增合伙人']}
                    cursor={{ fill: '#f1f5f9' }}
                  />
                  <Bar dataKey="value" fill="#a855f7" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">暂无数据</div>
            )}
          </div>
        </div>

        {/* Orders Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">近7天新增订单数</h3>
          <div className="h-64">
            {ordersData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ordersData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`${value} 单`, '新增订单']}
                  />
                  <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">暂无数据</div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: To-Do & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* To-Do List */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-orange-500">assignment_late</span>
            待办事项
          </h3>

          <div className="space-y-6 flex-1">
            {/* Pending Withdrawals */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">待审核提现 ({stats?.pending_withdrawals || 0})</h4>
                <button
                  onClick={() => navigate('/admin/withdrawal')}
                  className="text-primary text-sm hover:underline font-medium"
                >
                  查看全部
                </button>
              </div>
              <div className="space-y-3">
                {pendingWithdrawals.length > 0 ? (
                  pendingWithdrawals.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700/50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm font-medium text-slate-600 dark:text-slate-300">
                          {item.user?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {item.user?.name || '未知用户'}
                            <span className="text-xs text-slate-500 font-normal ml-1">{formatTimeAgo(item.created_at)}</span>
                          </p>
                          <p className="text-xs text-slate-500">单号: {item.withdrawal_no}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(item.amount)}</p>
                        <button
                          onClick={() => navigate('/admin/withdrawal')}
                          className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-md text-xs font-medium transition-colors"
                        >
                          去处理
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <Empty
                    icon="check_circle"
                    title="暂无待办事项"
                    description="所有提现申请已处理完毕"
                  />
                )}
              </div>
            </div>

            {/* Pending Shipments */}
            {stats && stats.pending_shipments > 0 && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
                      <span className="material-symbols-outlined">local_shipping</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">待发货订单</h4>
                      <p className="text-xs text-slate-500 mt-0.5">有 {stats.pending_shipments} 笔订单等待发货</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/admin/orders')}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                  >
                    去发货
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">bolt</span>
            快捷操作
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => navigate(action.link)}
                className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:shadow-md bg-slate-50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800 transition-all group"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${action.bg} group-hover:scale-110 transition-transform`}>
                  <span className={`material-symbols-outlined text-[24px] ${action.color}`}>{action.icon}</span>
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}