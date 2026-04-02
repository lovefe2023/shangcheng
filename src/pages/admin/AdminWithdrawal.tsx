import { useState, useEffect } from 'react';
import Empty from '../../components/Empty';
import { ListSkeleton } from '../../components/Skeleton';
import { useToast } from '../../components/Toast';
import { adminApi } from '../../lib/api';
import { WithdrawalStatus, WithdrawalStatusLabel } from '../../types';

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

export default function AdminWithdrawal() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('audit');
  const [loading, setLoading] = useState(true);

  const [showAuditModal, setShowAuditModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<WithdrawalRecord | null>(null);
  const [auditAction, setAuditAction] = useState<'pass' | 'reject'>('pass');
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Data
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchWithdrawals();
    }
  }, [activeTab, page, statusFilter]);

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getWithdrawals({
        page,
        pageSize,
        status: statusFilter || undefined,
        keyword: searchQuery || undefined
      });

      if (res.success && res.data) {
        setWithdrawals(res.data.list || []);
        setTotal(res.data.total || 0);
      }
    } catch (error) {
      console.error('Get withdrawals error:', error);
      toast.error('获取提现列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchWithdrawals();
  };

  const openAuditModal = (record: WithdrawalRecord, action: 'pass' | 'reject') => {
    setSelectedRecord(record);
    setAuditAction(action);
    setRejectReason('');
    setShowAuditModal(true);
  };

  const handleAuditConfirm = async () => {
    if (!selectedRecord) return;

    if (auditAction === 'reject' && !rejectReason.trim()) {
      toast.error('请输入拒绝原因');
      return;
    }

    setProcessing(true);
    try {
      const status = auditAction === 'pass' ? 'success' : 'rejected';
      const res = await adminApi.processWithdrawal(
        selectedRecord.id,
        status,
        auditAction === 'reject' ? rejectReason : undefined
      );

      if (res.success) {
        toast.success(auditAction === 'pass' ? '审核已通过并打款' : '审核已拒绝');
        setShowAuditModal(false);
        fetchWithdrawals();
      } else {
        toast.error('操作失败');
      }
    } catch (error) {
      toast.error('操作失败');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const formatCurrency = (value: number) => {
    return `¥${(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">提现管理</h1>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'audit' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
          >
            提现审核
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'rules' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
          >
            提现规则配置
          </button>
        </div>

        {/* Tab Content: Audit */}
        {activeTab === 'audit' && (
          <div>
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-4 items-center">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
                  <input
                    type="text"
                    placeholder="搜索申请人/手机号..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-64"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm rounded-lg px-3 py-2 outline-none"
                >
                  <option value="">所有状态</option>
                  <option value="pending">待审核</option>
                  <option value="success">审核通过</option>
                  <option value="rejected">审核拒绝</option>
                </select>
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium"
                >
                  搜索
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-4"><ListSkeleton count={5} /></div>
              ) : withdrawals.length === 0 ? (
                <Empty
                  icon="search_off"
                  title="未找到提现申请"
                  description="没有找到符合条件的提现申请，请尝试更改搜索条件"
                  actionText="清除筛选"
                  onAction={() => {
                    setSearchQuery('');
                    setStatusFilter('');
                    setPage(1);
                  }}
                  className="py-10"
                />
              ) : (
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
                      <th className="p-4 font-medium">申请单号</th>
                      <th className="p-4 font-medium">申请人</th>
                      <th className="p-4 font-medium text-right">申请金额</th>
                      <th className="p-4 font-medium">申请时间</th>
                      <th className="p-4 font-medium">状态</th>
                      <th className="p-4 font-medium text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {withdrawals.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                        <td className="p-4 text-sm text-slate-900 dark:text-white">{record.withdrawal_no}</td>
                        <td className="p-4">
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{record.user?.name || '未知用户'}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{record.user?.phone || '-'}</p>
                        </td>
                        <td className="p-4 text-sm font-bold text-primary text-right">{formatCurrency(record.amount)}</td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{formatDate(record.created_at)}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            record.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                            record.status === 'success' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                            'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                          }`}>
                            {WithdrawalStatusLabel[record.status] || record.status}
                          </span>
                          {record.reason && (
                            <p className="text-xs text-red-500 mt-1 max-w-[150px] truncate" title={record.reason}>{record.reason}</p>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {record.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-3">
                              <button
                                onClick={() => openAuditModal(record, 'pass')}
                                className="text-emerald-600 hover:text-emerald-700 text-sm font-medium hover:underline"
                              >
                                通过
                              </button>
                              <button
                                onClick={() => openAuditModal(record, 'reject')}
                                className="text-red-500 hover:text-red-600 text-sm font-medium hover:underline"
                              >
                                拒绝
                              </button>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

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
        )}

        {/* Tab Content: Rules */}
        {activeTab === 'rules' && (
          <div className="p-6 space-y-8">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">settings</span>
                基础提现规则
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-100 dark:border-slate-700/50">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">最低提现金额 (元)</label>
                  <input type="number" defaultValue={100} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors" />
                  <p className="text-xs text-slate-500 mt-1.5">用户发起提现的最低金额限制。</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-100 dark:border-slate-700/50">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">提现手续费比例 (%)</label>
                  <input type="number" defaultValue={0} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors" />
                  <p className="text-xs text-slate-500 mt-1.5">提现时扣除的手续费比例，0表示免手续费。</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-100 dark:border-slate-700/50">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">每日提现次数限制</label>
                  <input type="number" defaultValue={1} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors" />
                  <p className="text-xs text-slate-500 mt-1.5">每个用户每天最多可发起的提现次数。</p>
                </div>
              </div>
            </div>

            <hr className="border-slate-200 dark:border-slate-700" />

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">security</span>
                提现审核与打款
              </h3>
              <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">提现审核开关</label>
                    <p className="text-xs text-slate-500 mt-1">开启后，所有提现申请需人工审核；关闭后，系统将自动打款至用户账户。</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => toast.success('配置已保存（本地）')}
                className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
              >
                保存配置
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Audit Modal */}
      {showAuditModal && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {auditAction === 'pass' ? '确认通过提现申请' : '拒绝提现申请'}
              </h3>
              <button onClick={() => setShowAuditModal(false)} className="text-slate-400 hover:text-slate-500">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500">申请人</span>
                  <span className="font-medium text-slate-900 dark:text-white">{selectedRecord.user?.name || '未知用户'} ({selectedRecord.user?.phone || '-'})</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">申请金额</span>
                  <span className="font-bold text-primary">{formatCurrency(selectedRecord.amount)}</span>
                </div>
              </div>

              {auditAction === 'pass' ? (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  确认通过后，系统将标记该提现申请为已处理。请确保已完成线下打款操作。
                </p>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">拒绝原因 <span className="text-red-500">*</span></label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="请输入拒绝原因，用户端可见"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-sm outline-none focus:border-primary transition-colors resize-none h-24"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowAuditModal(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAuditConfirm}
                disabled={processing}
                className={`px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                  auditAction === 'pass' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {processing ? '处理中...' : (auditAction === 'pass' ? '确认通过' : '确认拒绝')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}