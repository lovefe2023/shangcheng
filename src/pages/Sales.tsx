import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Empty from '../components/Empty';
import { ListSkeleton } from '../components/Skeleton';
import { partnerApi } from '../lib/api';
import { IncomeStatus, IncomeStatusLabel } from '../types';

type RecordType = '全部' | '推荐奖励' | '销售提成' | '分红收益';

interface EarningRecord {
  id: string;
  type: 'referral_reward' | 'sales_commission' | 'dividend';
  amount: number;
  status: IncomeStatus;
  description?: string;
  created_at: string;
  order?: {
    id: string;
    order_no: string;
  };
  source_user?: {
    id: string;
    name: string;
    phone: string;
  };
}

const typeLabels: Record<string, RecordType> = {
  referral_reward: '推荐奖励',
  sales_commission: '销售提成',
  dividend: '分红收益'
};

const typeApiParams: Record<RecordType, string | undefined> = {
  '全部': undefined,
  '推荐奖励': 'referral_reward',
  '销售提成': 'sales_commission',
  '分红收益': 'dividend'
};

export default function Sales() {
  const [activeTab, setActiveTab] = useState<RecordType>('全部');
  const [selectedRecord, setSelectedRecord] = useState<EarningRecord | null>(null);
  const [records, setRecords] = useState<EarningRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // 统计数据
  const [stats, setStats] = useState({
    balance: 0,
    todayEarnings: 0,
    monthEarnings: 0
  });

  const tabs: RecordType[] = ['全部', '推荐奖励', '销售提成', '分红收益'];

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    setPage(1);
    setRecords([]);
    setHasMore(true);
    fetchRecords(1, true);
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const res = await partnerApi.getIncome({ page: 1, pageSize: 1 });
      if (res.success && res.data) {
        // 计算统计数据
        setStats({
          balance: res.data.balance || 0,
          todayEarnings: res.data.today_earnings || 0,
          monthEarnings: res.data.month_earnings || 0
        });
      }
    } catch (error) {
      console.error('获取收益统计失败:', error);
    }
  };

  const fetchRecords = async (pageNum: number = page, reset: boolean = false) => {
    setLoading(true);
    try {
      const res = await partnerApi.getIncome({
        page: pageNum,
        pageSize: 20,
        type: typeApiParams[activeTab]
      });

      if (res.success && res.data) {
        const newList = res.data.list || [];
        if (reset) {
          setRecords(newList);
        } else {
          setRecords(prev => [...prev, ...newList]);
        }
        setHasMore(newList.length >= 20);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('获取收益记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchRecords(page + 1);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const formatPrice = (price: number) => `¥${(price || 0).toFixed(2)}`;

  const getTypeLabel = (type: string): RecordType => {
    return typeLabels[type] || '全部';
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-40 flex items-center bg-primary text-white p-4 justify-between">
        <Link to="/profile" className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-white/10 transition-colors cursor-pointer">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h2 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center">收益中心</h2>
        <div className="flex w-10 items-center justify-end">
          <button className="flex size-10 cursor-pointer items-center justify-center rounded-full hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined">help_outline</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        <div className="bg-primary px-6 pt-4 pb-12 text-white relative">
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-white/80 text-sm mb-1">可提现收益 (元)</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">¥</span>
              <span className="text-5xl font-bold tracking-tight">{stats.balance.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
            </div>
            <Link to="/withdraw" className="mt-4 bg-white text-primary font-bold px-8 py-2 rounded-full shadow-lg shadow-black/10 active:scale-95 transition-transform block">
              立即提现
            </Link>
          </div>
        </div>

        <div className="mx-4 -mt-6 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 relative z-10">
          <div className="grid grid-cols-2 divide-x divide-slate-100 dark:divide-slate-800 py-4">
            <div className="flex flex-col items-center justify-center">
              <span className="text-slate-500 text-xs mb-1">今日预估收益</span>
              <span className="text-slate-900 dark:text-slate-100 font-bold text-lg">{formatPrice(stats.todayEarnings)}</span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <span className="text-slate-500 text-xs mb-1">本月累计收益</span>
              <span className="text-slate-900 dark:text-slate-100 font-bold text-lg">{formatPrice(stats.monthEarnings)}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 px-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
            <div className="px-4 py-3 border-b border-slate-50 dark:border-slate-800/50 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-l-4 border-primary pl-2">收益明细</h3>
            </div>

            {/* Filter Tabs */}
            <div className="flex overflow-x-auto hide-scrollbar border-b border-slate-100 dark:border-slate-800">
              {tabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 text-sm font-medium whitespace-nowrap relative ${
                    activeTab === tab
                      ? 'text-primary'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-t-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Records List */}
            {loading && records.length === 0 ? (
              <div className="p-4"><ListSkeleton count={5} /></div>
            ) : records.length === 0 ? (
              <Empty
                icon="receipt_long"
                title="暂无收益记录"
                description={`没有找到${activeTab === '全部' ? '' : activeTab}相关的收益记录`}
                className="py-12"
              />
            ) : (
              <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {records.map((record) => (
                  <div
                    key={record.id}
                    onClick={() => setSelectedRecord(record)}
                    className="p-4 flex justify-between items-center active:bg-slate-50 dark:active:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{getTypeLabel(record.type)}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-sm ${
                          record.status === IncomeStatus.SETTLED || record.status === IncomeStatus.COMPLETED
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                            : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                        }`}>
                          {IncomeStatusLabel[record.status] || record.status}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">{formatDate(record.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-emerald-500">
                        +{formatPrice(record.amount)}
                      </span>
                      <span className="material-symbols-outlined text-slate-300 text-sm">chevron_right</span>
                    </div>
                  </div>
                ))}

                {hasMore && (
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="w-full p-3 text-center text-sm text-slate-500"
                  >
                    {loading ? '加载中...' : '加载更多'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-lg">收益详情</h3>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-center mb-6">
                <div className="text-sm text-slate-500 mb-1">入账金额</div>
                <div className="text-3xl font-bold text-emerald-500">+{formatPrice(selectedRecord.amount)}</div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">收益类型</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{getTypeLabel(selectedRecord.type)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">当前状态</span>
                  <span className={`font-medium ${selectedRecord.status === IncomeStatus.SETTLED || selectedRecord.status === IncomeStatus.COMPLETED ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {IncomeStatusLabel[selectedRecord.status] || selectedRecord.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">入账时间</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{formatDate(selectedRecord.created_at)}</span>
                </div>
                {selectedRecord.order?.order_no && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">关联订单号</span>
                    <span className="font-mono text-slate-900 dark:text-slate-100">{selectedRecord.order.order_no}</span>
                  </div>
                )}
                {selectedRecord.source_user?.name && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">来源用户</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{selectedRecord.source_user.name}</span>
                  </div>
                )}
                {selectedRecord.description && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">备注说明</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100 text-right max-w-[150px]">{selectedRecord.description}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50">
              <button
                onClick={() => setSelectedRecord(null)}
                className="w-full py-2.5 bg-primary text-white rounded-xl font-medium active:scale-[0.98] transition-transform"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}