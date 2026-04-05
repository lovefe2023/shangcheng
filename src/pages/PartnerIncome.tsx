import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { partnerApi } from '../lib/api';
import { IncomeTypeLabel, IncomeStatusLabel, IncomeType, IncomeStatus } from '../types';

interface IncomeRecord {
  id: string;
  type: string;
  amount: number;
  status: string;
  description: string;
  created_at: string;
  source_user?: {
    id: string;
    name: string;
    phone: string;
  };
}

export default function PartnerIncome() {
  const [records, setRecords] = useState<IncomeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    loadRecords();
  }, [typeFilter, page]);

  const loadRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await partnerApi.getIncome({ page, pageSize, type: typeFilter || undefined });
      if (res.success && res.data) {
        setRecords(res.data.list || []);
        setTotal(res.data.total || 0);
      } else {
        setError(res.error?.message || '加载失败');
      }
    } catch (err) {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const typeKey = type as IncomeType;
    return IncomeTypeLabel[typeKey] || type;
  };

  const getStatusInfo = (status: string) => {
    const statusKey = status as IncomeStatus;
    const text = IncomeStatusLabel[statusKey] || status;
    const colorMap: Record<string, string> = {
      'pending': 'text-yellow-500 bg-yellow-50',
      'settled': 'text-green-500 bg-green-50',
      'completed': 'text-blue-500 bg-blue-50'
    };
    return { text, colorClass: colorMap[status] || 'text-gray-500 bg-gray-50' };
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
      <header className="shrink-0 sticky top-0 z-50 flex items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 border-b border-slate-100 dark:border-slate-800">
        <Link to="/partner" className="text-slate-900 dark:text-slate-100 flex size-10 shrink-0 items-center justify-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h2 className="text-lg font-bold flex-1 text-center pr-10">收益明细</h2>
      </header>

      {/* 筛选标签 */}
      <div className="bg-white dark:bg-slate-900 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => { setTypeFilter(''); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
              typeFilter === '' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            全部
          </button>
          <button
            onClick={() => { setTypeFilter('referral_reward'); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
              typeFilter === 'referral_reward' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            推荐奖励
          </button>
          <button
            onClick={() => { setTypeFilter('sales_commission'); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
              typeFilter === 'sales_commission' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            销售提成
          </button>
          <button
            onClick={() => { setTypeFilter('dividend'); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
              typeFilter === 'dividend' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            销售分红
          </button>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto pb-24">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <span className="material-symbols-outlined text-4xl text-slate-400">error</span>
            <p className="text-slate-500">{error}</p>
            <button onClick={loadRecords} className="px-4 py-2 bg-primary text-white rounded-lg">
              重新加载
            </button>
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="material-symbols-outlined text-4xl text-slate-400">receipt_long</span>
            <p className="text-slate-500 mt-2">暂无收益记录</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {records.map((record) => {
              const statusInfo = getStatusInfo(record.status);
              return (
                <div key={record.id} className="bg-white dark:bg-slate-900 px-4 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          {getTypeLabel(record.type)}
                        </p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusInfo.colorClass}`}>
                          {statusInfo.text}
                        </span>
                      </div>
                      {record.description && (
                        <p className="text-xs text-slate-500 mt-1">{record.description}</p>
                      )}
                      {record.source_user && (
                        <p className="text-xs text-slate-400 mt-1">
                          来源: {record.source_user.name || record.source_user.phone}
                        </p>
                      )}
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(record.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-500">+¥{record.amount.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 分页 */}
        {total > pageSize && (
          <div className="flex items-center justify-center gap-4 py-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm disabled:opacity-50"
            >
              上一页
            </button>
            <span className="text-sm text-slate-500">
              {page} / {Math.ceil(total / pageSize)}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= Math.ceil(total / pageSize)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        )}
      </main>
    </div>
  );
}