import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Empty from '../../components/Empty';
import { ListSkeleton } from '../../components/Skeleton';
import { useToast } from '../../components/Toast';
import { adminApi } from '../../lib/api';
import { WithdrawalStatus, WithdrawalStatusLabel } from '../../types';

interface FinanceStats {
  total_revenue: number;
  total_commission: number;
  pending_withdrawal: number;
  withdrawn_amount: number;
}

interface Transaction {
  id: string;
  order_id: string;
  order_no: string;
  type: string;
  amount: number;
  payment_method: string;
  status: string;
  created_at: string;
}

interface WithdrawalRecord {
  id: string;
  withdrawal_no: string;
  amount: number;
  status: WithdrawalStatus;
  reason?: string;
  created_at: string;
  processed_at?: string;
  user?: {
    id: string;
    name: string;
    phone: string;
    avatar?: string;
  };
}

export default function AdminFinance() {
  const navigate = useNavigate();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('withdrawals');
  const [loading, setLoading] = useState(true);

  // Filter states
  const [withdrawalStatus, setWithdrawalStatus] = useState('');
  const [withdrawalSearch, setWithdrawalSearch] = useState('');
  const [withdrawalPage, setWithdrawalPage] = useState(1);

  const [transactionType, setTransactionType] = useState('');
  const [transactionDate, setTransactionDate] = useState('');
  const [transactionSearch, setTransactionSearch] = useState('');
  const [transactionPage, setTransactionPage] = useState(1);

  // Data
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);
  const [withdrawalsTotal, setWithdrawalsTotal] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsTotal, setTransactionsTotal] = useState(0);

  const pageSize = 10;

  useEffect(() => {
    fetchFinanceStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'withdrawals') {
      fetchWithdrawals();
    } else {
      fetchTransactions();
    }
  }, [activeTab, withdrawalPage, withdrawalStatus, transactionPage, transactionType, transactionDate]);

  const fetchFinanceStats = async () => {
    try {
      const res = await adminApi.getFinanceStats();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (error) {
      console.error('Get finance stats error:', error);
    }
  };

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getWithdrawals({
        page: withdrawalPage,
        pageSize,
        status: withdrawalStatus || undefined,
        keyword: withdrawalSearch || undefined
      });

      if (res.success && res.data) {
        setWithdrawals(res.data.list || []);
        setWithdrawalsTotal(res.data.total || 0);
      }
    } catch (error) {
      console.error('Get withdrawals error:', error);
      toast.error('获取提现列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getTransactions({
        page: transactionPage,
        pageSize,
        type: transactionType || undefined,
        start_date: transactionDate || undefined,
        keyword: transactionSearch || undefined
      });

      if (res.success && res.data) {
        setTransactions(res.data.list || []);
        setTransactionsTotal(res.data.total || 0);
      }
    } catch (error) {
      console.error('Get transactions error:', error);
      toast.error('获取交易流水失败');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawalSearch = () => {
    setWithdrawalPage(1);
    fetchWithdrawals();
  };

  const handleTransactionSearch = () => {
    setTransactionPage(1);
    fetchTransactions();
  };

  const handleApproveWithdrawal = async (id: string) => {
    try {
      const res = await adminApi.processWithdrawal(id, 'success');
      if (res.success) {
        toast.success('提现申请已通过');
        fetchWithdrawals();
        fetchFinanceStats();
      } else {
        toast.error('操作失败');
      }
    } catch (error) {
      toast.error('操作失败');
    }
  };

  const handleRejectWithdrawal = async (id: string) => {
    const reason = prompt('请输入拒绝原因（可选）');
    try {
      const res = await adminApi.processWithdrawal(id, 'rejected', reason || undefined);
      if (res.success) {
        toast.success('提现申请已拒绝');
        fetchWithdrawals();
        fetchFinanceStats();
      } else {
        toast.error('操作失败');
      }
    } catch (error) {
      toast.error('操作失败');
    }
  };

  const formatCurrency = (value: number) => {
    return `¥${(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const withdrawalTotalPages = Math.ceil(withdrawalsTotal / pageSize);
  const transactionTotalPages = Math.ceil(transactionsTotal / pageSize);

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">财务管理</h1>
        <div className="flex gap-3">
          <button
            onClick={() => {
              fetchFinanceStats();
              fetchWithdrawals();
              fetchTransactions();
            }}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            刷新数据
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-500 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">account_balance</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">平台总收入</p>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(stats?.total_revenue || 0)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-500 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">savings</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">累计产生佣金</p>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(stats?.total_commission || 0)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-500 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">pending_actions</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">待审核提现</p>
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-500">{formatCurrency(stats?.pending_withdrawal || 0)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-500 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">payments</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">已打款金额</p>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(stats?.withdrawn_amount || 0)}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'withdrawals' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
          >
            提现审核
            {withdrawals.filter(w => w.status === WithdrawalStatus.PENDING).length > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                {withdrawals.filter(w => w.status === WithdrawalStatus.PENDING).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'transactions' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
          >
            交易流水
          </button>
        </div>

        {/* Tab Content: Withdrawals */}
        {activeTab === 'withdrawals' && (
          <div className="overflow-x-auto">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex gap-4 bg-slate-50 dark:bg-slate-900/50">
              <select
                value={withdrawalStatus}
                onChange={(e) => { setWithdrawalStatus(e.target.value); setWithdrawalPage(1); }}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm rounded-lg px-3 py-2 outline-none"
              >
                <option value="">全部状态</option>
                <option value={WithdrawalStatus.PENDING}>{WithdrawalStatusLabel[WithdrawalStatus.PENDING]}</option>
                <option value={WithdrawalStatus.SUCCESS}>{WithdrawalStatusLabel[WithdrawalStatus.SUCCESS]}</option>
                <option value={WithdrawalStatus.REJECTED}>{WithdrawalStatusLabel[WithdrawalStatus.REJECTED]}</option>
              </select>
              <input
                type="text"
                placeholder="搜索用户姓名/手机号/提现单号"
                value={withdrawalSearch}
                onChange={(e) => setWithdrawalSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleWithdrawalSearch()}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm rounded-lg px-3 py-2 outline-none w-64"
              />
              <button
                onClick={handleWithdrawalSearch}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium"
              >
                搜索
              </button>
            </div>

            {loading ? (
              <div className="p-4"><ListSkeleton count={5} /></div>
            ) : withdrawals.length === 0 ? (
              <Empty
                icon="account_balance_wallet"
                title="未找到提现记录"
                description="没有找到符合条件的提现记录，请尝试更改搜索条件"
                actionText="清除筛选"
                onAction={() => {
                  setWithdrawalSearch('');
                  setWithdrawalStatus('');
                  setWithdrawalPage(1);
                }}
                className="py-10"
              />
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
                    <th className="p-4 font-medium">提现单号</th>
                    <th className="p-4 font-medium">申请人</th>
                    <th className="p-4 font-medium">提现金额</th>
                    <th className="p-4 font-medium">申请时间</th>
                    <th className="p-4 font-medium">状态</th>
                    <th className="p-4 font-medium text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {withdrawals.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="p-4 text-sm font-medium text-slate-900 dark:text-white">{item.withdrawal_no}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 font-medium">
                            {item.user?.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{item.user?.name || '未知用户'}</p>
                            <p className="text-xs text-slate-500">{item.user?.phone || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm font-bold text-primary">{formatCurrency(item.amount)}</td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{formatDate(item.created_at)}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          item.status === WithdrawalStatus.PENDING ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                          item.status === WithdrawalStatus.SUCCESS ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                          'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                        }`}>
                          {WithdrawalStatusLabel[item.status]}
                        </span>
                        {item.reason && <p className="text-xs text-red-500 mt-1">{item.reason}</p>}
                      </td>
                      <td className="p-4 text-right">
                        {item.status === WithdrawalStatus.PENDING ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApproveWithdrawal(item.id)}
                              className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-500 dark:hover:text-emerald-400 text-sm font-medium hover:underline"
                            >
                              打款
                            </button>
                            <span className="text-slate-300 dark:text-slate-600">|</span>
                            <button
                              onClick={() => handleRejectWithdrawal(item.id)}
                              className="text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 text-sm font-medium hover:underline"
                            >
                              拒绝
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => navigate(`/admin/users/${item.user?.id}`)}
                            className="text-primary text-sm font-medium hover:underline"
                          >
                            查看用户
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {withdrawalTotalPages > 1 && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-sm">
                <span className="text-slate-500">共 {withdrawalsTotal} 条记录，当前 {withdrawalPage}/{withdrawalTotalPages} 页</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setWithdrawalPage(p => Math.max(1, p - 1))}
                    disabled={withdrawalPage === 1}
                    className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
                  >
                    上一页
                  </button>
                  <button
                    onClick={() => setWithdrawalPage(p => Math.min(withdrawalTotalPages, p + 1))}
                    disabled={withdrawalPage === withdrawalTotalPages}
                    className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Transactions */}
        {activeTab === 'transactions' && (
          <div className="overflow-x-auto">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex gap-4 bg-slate-50 dark:bg-slate-900/50">
              <select
                value={transactionType}
                onChange={(e) => { setTransactionType(e.target.value); setTransactionPage(1); }}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm rounded-lg px-3 py-2 outline-none"
              >
                <option value="">全部类型</option>
                <option value="income">收入</option>
                <option value="expense">支出</option>
              </select>
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => { setTransactionDate(e.target.value); setTransactionPage(1); }}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm rounded-lg px-3 py-2 outline-none text-slate-500"
              />
              <input
                type="text"
                placeholder="搜索流水号/订单号"
                value={transactionSearch}
                onChange={(e) => setTransactionSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTransactionSearch()}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm rounded-lg px-3 py-2 outline-none w-64"
              />
              <button
                onClick={handleTransactionSearch}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium"
              >
                搜索
              </button>
            </div>

            {loading ? (
              <div className="p-4"><ListSkeleton count={5} /></div>
            ) : transactions.length === 0 ? (
              <Empty
                icon="receipt_long"
                title="未找到资金流水"
                description="没有找到符合条件的资金流水，请尝试更改搜索条件"
                actionText="清除筛选"
                onAction={() => {
                  setTransactionSearch('');
                  setTransactionType('');
                  setTransactionDate('');
                  setTransactionPage(1);
                }}
                className="py-10"
              />
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
                    <th className="p-4 font-medium">流水号</th>
                    <th className="p-4 font-medium">关联订单</th>
                    <th className="p-4 font-medium">交易类型</th>
                    <th className="p-4 font-medium">交易金额</th>
                    <th className="p-4 font-medium">支付方式</th>
                    <th className="p-4 font-medium">交易时间</th>
                    <th className="p-4 font-medium text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {transactions.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="p-4 text-sm font-medium text-slate-900 dark:text-white">{item.id}</td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{item.order_no}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          item.amount > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                          'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                        }`}>
                          {item.type}
                        </span>
                      </td>
                      <td className={`p-4 text-sm font-bold ${item.amount > 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>
                        {item.amount > 0 ? '+' : ''}{formatCurrency(item.amount)}
                      </td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{item.payment_method}</td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{formatDate(item.created_at)}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => navigate(`/admin/orders/${item.order_id}`)}
                          className="text-primary text-sm font-medium hover:underline"
                        >
                          查看订单
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {transactionTotalPages > 1 && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-sm">
                <span className="text-slate-500">共 {transactionsTotal} 条记录，当前 {transactionPage}/{transactionTotalPages} 页</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setTransactionPage(p => Math.max(1, p - 1))}
                    disabled={transactionPage === 1}
                    className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
                  >
                    上一页
                  </button>
                  <button
                    onClick={() => setTransactionPage(p => Math.min(transactionTotalPages, p + 1))}
                    disabled={transactionPage === transactionTotalPages}
                    className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}