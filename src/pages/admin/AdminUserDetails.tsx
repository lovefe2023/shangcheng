import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Empty from '../../components/Empty';
import { ListSkeleton } from '../../components/Skeleton';
import { useToast } from '../../components/Toast';
import { adminApi } from '../../lib/api';
import { UserStatus, UserStatusLabel, PartnerLevel, PartnerLevelLabel, OrderStatus, OrderStatusLabel, IncomeStatus, IncomeStatusLabel } from '../../types';

// API 错误处理
interface ApiError {
  code?: string;
  message?: string;
}

const handleApiError = (
  error: any,
  toast: ReturnType<typeof useToast>,
  navigate: ReturnType<typeof useNavigate>,
  defaultMessage: string = '操作失败'
): boolean => {
  const apiError = error?.error as ApiError | undefined;
  const errorCode = apiError?.code || error?.code;
  const errorMessage = apiError?.message || error?.message;

  if (errorCode === 'UNAUTHORIZED' || errorCode === 'INVALID_TOKEN' || errorCode === 'TOKEN_EXPIRED') {
    toast.error('登录已过期，请重新登录');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login?redirect=/admin/users');
    return true;
  }

  if (errorCode === 'FORBIDDEN' || errorCode === 'ADMIN_REQUIRED') {
    toast.error('您没有权限执行此操作');
    navigate('/');
    return true;
  }

  toast.error(errorMessage || defaultMessage);
  return false;
};

interface User {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  status: UserStatus;
  is_partner: boolean;
  partner_level: PartnerLevel;
  invite_code: string;
  balance: number;
  total_income: number;
  gender?: string;
  birthday?: string;
  email?: string;
  created_at: string;
  updated_at?: string;
  referrer?: { id: string; name: string; phone: string } | null;
  team_size: number;
  order_summary: {
    total: number;
    totalAmount: number;
    completed: number;
    pending: number;
  };
}

interface Order {
  id: string;
  order_no: string;
  status: OrderStatus;
  paid_amount: number;
  total_amount: number;
  created_at: string;
  items: { product_name: string; quantity: number; price: number }[];
}

interface IncomeRecord {
  id: string;
  type: string;
  amount: number;
  source_user?: string;
  status: IncomeStatus;
  created_at: string;
}

interface Address {
  id: string;
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  is_default: boolean;
}

interface CellarItem {
  id: string;
  quantity: number;
  vintage?: string;
  notes?: string;
  created_at: string;
  product?: {
    id: string;
    name: string;
    images: string[];
    price: number;
  };
}

interface TeamMember {
  id: string;
  name: string;
  phone: string;
  partner_level: PartnerLevel;
  created_at: string;
  team_size: number;
}

export default function AdminUserDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('basic');

  // 各模块数据
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [orderFilter, setOrderFilter] = useState('');

  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>([]);
  const [incomeLoading, setIncomeLoading] = useState(false);
  const [incomeTotal, setIncomeTotal] = useState(0);
  const [incomeFilter, setIncomeFilter] = useState('');

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);

  const [cellarItems, setCellarItems] = useState<CellarItem[]>([]);
  const [cellarLoading, setCellarLoading] = useState(false);

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  // 加载用户基本信息
  useEffect(() => {
    if (id) {
      fetchUser();
    }
  }, [id]);

  // 根据标签页加载数据
  useEffect(() => {
    if (!user || !id) return;

    switch (activeTab) {
      case 'orders':
        fetchOrders();
        break;
      case 'income':
        fetchIncome();
        break;
      case 'addresses':
        fetchAddresses();
        break;
      case 'cellar':
        fetchCellar();
        break;
      case 'network':
        fetchTeam();
        break;
    }
  }, [activeTab, id, orderFilter, incomeFilter]);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getUser(id!);
      if (res.success && res.data) {
        setUser(res.data);
      } else {
        handleApiError(res, toast, navigate, '获取用户信息失败');
      }
    } catch (error) {
      handleApiError(error, toast, navigate, '获取用户信息失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await adminApi.getUserOrders(id!, {
        pageSize: 20,
        status: orderFilter || undefined
      });
      if (res.success && res.data) {
        setOrders(res.data.list || []);
        setOrdersTotal(res.data.total || 0);
      }
    } catch (error) {
      console.error('Get orders error:', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchIncome = async () => {
    setIncomeLoading(true);
    try {
      const res = await adminApi.getUserIncome(id!, {
        pageSize: 20,
        type: incomeFilter || undefined
      });
      if (res.success && res.data) {
        setIncomeRecords(res.data.list || []);
        setIncomeTotal(res.data.total || 0);
      }
    } catch (error) {
      console.error('Get income error:', error);
    } finally {
      setIncomeLoading(false);
    }
  };

  const fetchAddresses = async () => {
    setAddressesLoading(true);
    try {
      const res = await adminApi.getUserAddresses(id!);
      if (res.success && res.data) {
        setAddresses(res.data || []);
      }
    } catch (error) {
      console.error('Get addresses error:', error);
    } finally {
      setAddressesLoading(false);
    }
  };

  const fetchCellar = async () => {
    setCellarLoading(true);
    try {
      const res = await adminApi.getUserCellar(id!);
      if (res.success && res.data) {
        setCellarItems(res.data || []);
      }
    } catch (error) {
      console.error('Get cellar error:', error);
    } finally {
      setCellarLoading(false);
    }
  };

  const fetchTeam = async () => {
    setTeamLoading(true);
    try {
      const res = await adminApi.getUserTeam(id!);
      if (res.success && res.data) {
        setTeamMembers(res.data.direct || []);
      }
    } catch (error) {
      console.error('Get team error:', error);
    } finally {
      setTeamLoading(false);
    }
  };

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const formatCurrency = (amount: number) => {
    return `¥${(amount || 0).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto pb-12">
        <div className="p-8 text-center text-slate-500">加载中...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto pb-12">
        <Empty
          icon="person_off"
          title="用户不存在"
          description="未找到该用户信息"
          actionText="返回列表"
          onAction={() => navigate('/admin/users')}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/users')}
            className="p-2 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">用户详情</h1>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
            user.status === UserStatus.ACTIVE ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
            'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
          }`}>
            {UserStatusLabel[user.status]}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6 overflow-x-auto">
        {[
          { key: 'basic', label: '基本信息' },
          { key: 'income', label: '收益统计' },
          { key: 'network', label: '关系图谱' },
          { key: 'orders', label: '订单记录' },
          { key: 'addresses', label: '收货地址' },
          { key: 'cellar', label: '我的酒窖' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content: Basic Info */}
      {activeTab === 'basic' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">基本信息</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 text-xl font-medium">
                {user.name?.charAt(0) || '?'}
              </div>
              <div>
                <p className="text-lg font-medium text-slate-900 dark:text-white">{user.name || '未设置昵称'}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">ID: {user.id.slice(0, 8)}...</p>
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">身份角色</p>
              <p className="text-sm font-medium">
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                  user.is_partner ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                  'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                }`}>
                  {user.is_partner ? PartnerLevelLabel[user.partner_level] : '普通用户'}
                </span>
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">手机号码</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{user.phone}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">推荐人</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {user.referrer ? `${user.referrer.name} (${user.referrer.phone})` : '系统'}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">邀请码</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{user.invite_code}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">团队人数</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{user.team_size} 人</p>
            </div>

            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">注册时间</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{formatDate(user.created_at)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">累计消费</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{formatCurrency(user.order_summary.totalAmount)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Income Stats */}
      {activeTab === 'income' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">累计总收益</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(user.total_income)}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">当前可提现余额</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(user.balance)}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">已提现总额</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(user.total_income - user.balance)}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">收益明细</h2>
              <select
                value={incomeFilter}
                onChange={(e) => setIncomeFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm rounded-lg px-3 py-2 outline-none"
              >
                <option value="">全部类型</option>
                <option value="direct">直推奖励</option>
                <option value="indirect">间推奖励</option>
                <option value="team">团队分红</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              {incomeLoading ? (
                <div className="p-4"><ListSkeleton count={5} /></div>
              ) : incomeRecords.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
                      <th className="p-4 font-medium">流水号</th>
                      <th className="p-4 font-medium">收益类型</th>
                      <th className="p-4 font-medium">收益金额</th>
                      <th className="p-4 font-medium">来源用户</th>
                      <th className="p-4 font-medium">入账时间</th>
                      <th className="p-4 font-medium">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {incomeRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                        <td className="p-4 text-sm font-medium text-slate-900 dark:text-white">{record.id.slice(0, 8)}...</td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{record.type}</td>
                        <td className="p-4 text-sm font-bold text-emerald-600 dark:text-emerald-400">+{formatCurrency(record.amount)}</td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{record.source_user || '-'}</td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{formatDate(record.created_at)}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            record.status === IncomeStatus.CREDITED ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                            'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                          }`}>
                            {IncomeStatusLabel[record.status] || record.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-4">
                  <Empty icon="receipt_long" title="暂无收益记录" description="该用户还没有收益记录" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Network Graph */}
      {activeTab === 'network' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">团队关系图谱</h2>
            <p className="text-sm text-slate-500 mt-1">直接推荐: {teamMembers.length} 人</p>
          </div>
          <div className="p-6">
            {teamLoading ? (
              <ListSkeleton count={3} />
            ) : teamMembers.length > 0 ? (
              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 font-medium">
                      {member.name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{member.name || '未设置'}</p>
                      <p className="text-xs text-slate-500">{member.phone}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        member.partner_level !== PartnerLevel.NONE ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {PartnerLevelLabel[member.partner_level]}
                      </span>
                      <p className="text-xs text-slate-500 mt-1">团队: {member.team_size} 人</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty icon="groups" title="暂无团队成员" description="该用户还没有推荐任何成员" />
            )}
          </div>
        </div>
      )}

      {/* Tab Content: Orders */}
      {activeTab === 'orders' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">订单记录</h2>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500">累计消费: {formatCurrency(user.order_summary.totalAmount)}</span>
              <select
                value={orderFilter}
                onChange={(e) => setOrderFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm rounded-lg px-3 py-2 outline-none"
              >
                <option value="">全部状态</option>
                <option value={OrderStatus.COMPLETED}>{OrderStatusLabel[OrderStatus.COMPLETED]}</option>
                <option value={OrderStatus.SHIPPED}>{OrderStatusLabel[OrderStatus.SHIPPED]}</option>
                <option value={OrderStatus.PENDING_SHIPMENT}>{OrderStatusLabel[OrderStatus.PENDING_SHIPMENT]}</option>
                <option value={OrderStatus.PENDING_PAYMENT}>{OrderStatusLabel[OrderStatus.PENDING_PAYMENT]}</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            {ordersLoading ? (
              <div className="p-4"><ListSkeleton count={5} /></div>
            ) : orders.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
                    <th className="p-4 font-medium">订单编号</th>
                    <th className="p-4 font-medium">商品信息</th>
                    <th className="p-4 font-medium">订单金额</th>
                    <th className="p-4 font-medium">下单时间</th>
                    <th className="p-4 font-medium">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="p-4 text-sm font-medium text-slate-900 dark:text-white">{order.order_no}</td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                        {order.items.map(i => i.product_name).join(', ') || '-'}
                      </td>
                      <td className="p-4 text-sm font-bold text-primary">{formatCurrency(order.paid_amount)}</td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{formatDate(order.created_at)}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          order.status === OrderStatus.COMPLETED ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                          order.status === OrderStatus.SHIPPED ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                          'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                        }`}>
                          {OrderStatusLabel[order.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-4">
                <Empty icon="shopping_bag" title="暂无订单记录" description="该用户还没有下单" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content: Cellar */}
      {activeTab === 'cellar' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">我的酒窖</h2>
          </div>
          <div className="overflow-x-auto">
            {cellarLoading ? (
              <div className="p-4"><ListSkeleton count={3} /></div>
            ) : cellarItems.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
                    <th className="p-4 font-medium">商品信息</th>
                    <th className="p-4 font-medium">年份</th>
                    <th className="p-4 font-medium">入库时间</th>
                    <th className="p-4 font-medium">数量</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {cellarItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.product?.images?.[0] || ''}
                            alt={item.product?.name}
                            className="w-10 h-10 rounded object-cover border border-slate-200 dark:border-slate-700"
                          />
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white text-sm">{item.product?.name}</p>
                            <p className="text-xs text-slate-500">{formatCurrency(item.product?.price || 0)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{item.vintage || '-'}</td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{formatDate(item.created_at)}</td>
                      <td className="p-4 text-sm font-bold text-slate-900 dark:text-white">{item.quantity} 瓶</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-4">
                <Empty icon="wine_bar" title="暂无藏酒记录" description="该用户的酒窖中还没有任何藏酒" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content: Addresses */}
      {activeTab === 'addresses' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">收货地址</h2>
          </div>
          <div className="p-6">
            {addressesLoading ? (
              <ListSkeleton count={2} />
            ) : addresses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div key={addr.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-5 relative group hover:border-primary/50 transition-colors">
                    {addr.is_default && (
                      <span className="absolute top-5 right-5 bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded font-medium">默认地址</span>
                    )}
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-slate-900 dark:text-white text-base">{addr.name}</span>
                      <span className="text-slate-500 dark:text-slate-400 text-sm">{addr.phone}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed pr-12">
                      {addr.province} {addr.city} {addr.district} {addr.detail}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <Empty icon="location_on" title="暂无收货地址" description="该用户还没有添加任何收货地址" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}