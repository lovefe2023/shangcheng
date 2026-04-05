import { useState, useEffect } from 'react';
import Empty from '../../components/Empty';
import { ListSkeleton } from '../../components/Skeleton';
import { useToast } from '../../components/Toast';
import { adminApi } from '../../lib/api';
import { PartnerLevel, PartnerLevelLabel } from '../../types';

interface IncomeRecord {
  id: string;
  type: 'referral_reward' | 'sales_commission' | 'dividend';
  amount: number;
  status: string;
  description?: string;
  created_at: string;
  user?: {
    id: string;
    name: string;
    phone: string;
  };
  source_user?: {
    id: string;
    name: string;
    phone: string;
  };
  order?: {
    id: string;
    order_no: string;
  };
}

interface LeaderboardItem {
  rank: number;
  id: string;
  name: string;
  phone: string;
  level: PartnerLevel;
  team_sales: number;
  personal_sales: number;
  total_earnings: number;
}

const incomeTypeLabels: Record<string, string> = {
  referral_reward: '推荐奖励',
  sales_commission: '销售提成',
  dividend: '分红收益'
};

export default function AdminDistribution() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('level-config');
  const [loading, setLoading] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settleType, setSettleType] = useState('partner_1');

  // Earnings records states
  const [earningsSearch, setEarningsSearch] = useState('');
  const [earningsType, setEarningsType] = useState('');
  const [earningsPage, setEarningsPage] = useState(1);
  const [earningsTotal, setEarningsTotal] = useState(0);
  const [earningsRecords, setEarningsRecords] = useState<IncomeRecord[]>([]);

  // Leaderboard states
  const [leaderboardType, setLeaderboardType] = useState('team');
  const [leaderboardPeriod, setLeaderboardPeriod] = useState('month');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardItem[]>([]);

  // Config states
  const [configLoading, setConfigLoading] = useState(false);
  const [distributionSettings, setDistributionSettings] = useState<Record<string, string>>({});

  // Level config states
  const [referralReward, setReferralReward] = useState('1000');
  const [salesCommissionRate, setSalesCommissionRate] = useState('20');
  const [oneStarDirectPartner, setOneStarDirectPartner] = useState('3');
  const [twoStarDirectOneStar, setTwoStarDirectOneStar] = useState('3');
  const [twoStarDirectPartner, setTwoStarDirectPartner] = useState('6');

  // Pool config states
  const [poolInjectAmount, setPoolInjectAmount] = useState('1000');
  const [poolPeriod, setPoolPeriod] = useState('monthly');
  const [poolAlgorithm, setPoolAlgorithm] = useState('average');

  const pageSize = 10;

  useEffect(() => {
    if (activeTab === 'earnings-records') {
      fetchEarningsRecords();
    } else if (activeTab === 'sales-leaderboard') {
      fetchLeaderboard();
    } else if (activeTab === 'level-config' || activeTab === 'pool-config') {
      fetchDistributionSettings();
    }
  }, [activeTab, earningsPage, earningsType, earningsSearch, leaderboardPeriod]);

  const fetchEarningsRecords = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getIncomeRecords({
        page: earningsPage,
        pageSize,
        type: earningsType || undefined,
        keyword: earningsSearch || undefined
      });

      if (res.success && res.data) {
        setEarningsRecords(res.data.list || []);
        setEarningsTotal(res.data.total || 0);
      }
    } catch (error) {
      console.error('Get earnings records error:', error);
      toast.error('获取收益记录失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getSalesLeaderboard({
        period: leaderboardPeriod,
        limit: 50
      });
      if (res.success && res.data) {
        setLeaderboardData(res.data);
      }
    } catch (error) {
      console.error('Get leaderboard error:', error);
      toast.error('获取排行榜失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchDistributionSettings = async () => {
    setConfigLoading(true);
    try {
      const res = await adminApi.getDistributionSettings();
      if (res.success && res.data) {
        setDistributionSettings(res.data);
        // 加载配置值到状态变量
        if (res.data.partner_referral_reward) setReferralReward(res.data.partner_referral_reward);
        if (res.data.partner_sales_commission_rate) setSalesCommissionRate(res.data.partner_sales_commission_rate);
        if (res.data.partner_one_star_direct) setOneStarDirectPartner(res.data.partner_one_star_direct);
        if (res.data.partner_two_star_direct_one) setTwoStarDirectOneStar(res.data.partner_two_star_direct_one);
        if (res.data.partner_two_star_direct) setTwoStarDirectPartner(res.data.partner_two_star_direct);
        if (res.data.partner_pool_inject_amount) setPoolInjectAmount(res.data.partner_pool_inject_amount);
        if (res.data.partner_pool_period) setPoolPeriod(res.data.partner_pool_period);
        if (res.data.partner_pool_algorithm) setPoolAlgorithm(res.data.partner_pool_algorithm);
      }
    } catch (error) {
      console.error('Get distribution settings error:', error);
      toast.error('获取配置失败');
    } finally {
      setConfigLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setConfigLoading(true);
    try {
      const settings = [
        { key: 'partner_referral_reward', value: referralReward },
        { key: 'partner_sales_commission_rate', value: salesCommissionRate },
        { key: 'partner_one_star_direct', value: oneStarDirectPartner },
        { key: 'partner_two_star_direct_one', value: twoStarDirectOneStar },
        { key: 'partner_two_star_direct', value: twoStarDirectPartner },
        { key: 'partner_pool_inject_amount', value: poolInjectAmount },
        { key: 'partner_pool_period', value: poolPeriod },
        { key: 'partner_pool_algorithm', value: poolAlgorithm },
      ];

      const res = await adminApi.updateDistributionSettings(settings);
      if (res.success) {
        toast.success('配置保存成功');
      } else {
        toast.error(res.error?.message || '保存失败');
      }
    } catch (error) {
      console.error('Save distribution settings error:', error);
      toast.error('保存失败');
    } finally {
      setConfigLoading(false);
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

  const earningsTotalPages = Math.ceil(earningsTotal / pageSize);

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">分销管理</h1>
        {(activeTab === 'earnings-records' || activeTab === 'sales-leaderboard') && (
          <button
            onClick={() => {
              if (activeTab === 'earnings-records') fetchEarningsRecords();
              else fetchLeaderboard();
            }}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            刷新数据
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
          <button
            onClick={() => setActiveTab('level-config')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'level-config' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
          >
            合伙人等级配置
          </button>
          <button
            onClick={() => setActiveTab('pool-config')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'pool-config' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
          >
            分红池配置
          </button>
          <button
            onClick={() => setActiveTab('earnings-records')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'earnings-records' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
          >
            收益记录
          </button>
          <button
            onClick={() => setActiveTab('sales-leaderboard')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'sales-leaderboard' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
          >
            销售龙虎榜
          </button>
        </div>

        {/* Tab Content: Level Config */}
        {activeTab === 'level-config' && (
          <div className="p-6 space-y-8">
            <div className="flex justify-end mb-4">
              <button
                onClick={handleSaveSettings}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                保存配置
              </button>
            </div>
            {/* 星级设置 */}
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">stars</span>
                星级合伙人晋升规则 (满足任一条件即可晋升)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 space-y-3">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 pb-2">一星合伙人</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">条件1：直推合伙人满</span>
                    <input
                      type="number"
                      value={oneStarDirectPartner}
                      onChange={(e) => setOneStarDirectPartner(e.target.value)}
                      className="w-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary"
                    />
                    <span className="text-sm text-slate-500">人</span>
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 space-y-3">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 pb-2">二星合伙人</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">条件1：直推一星满</span>
                    <input
                      type="number"
                      value={twoStarDirectOneStar}
                      onChange={(e) => setTwoStarDirectOneStar(e.target.value)}
                      className="w-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary"
                    />
                    <span className="text-sm text-slate-500">人</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">条件2：直推合伙人满</span>
                    <input
                      type="number"
                      value={twoStarDirectPartner}
                      onChange={(e) => setTwoStarDirectPartner(e.target.value)}
                      className="w-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary"
                    />
                    <span className="text-sm text-slate-500">人</span>
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-slate-200 dark:border-slate-700" />

            {/* 基础奖励设置 */}
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">payments</span>
                基础奖励设置
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">推荐奖励金额 (元/人)</label>
                  <input
                    type="number"
                    value={referralReward}
                    onChange={(e) => setReferralReward(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
                  />
                  <p className="text-xs text-slate-500 mt-1.5">每推荐一个新合伙人，推荐人可获得的固定奖励金额。</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">普通订单销售提成比例 (%)</label>
                  <input
                    type="number"
                    value={salesCommissionRate}
                    onChange={(e) => setSalesCommissionRate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
                  />
                  <p className="text-xs text-slate-500 mt-1.5">合伙人推广普通商品订单时，可获得的提成比例。</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={handleSaveSettings}
                className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
              >
                保存配置
              </button>
            </div>
          </div>
        )}

        {/* Tab Content: Pool Config */}
        {activeTab === 'pool-config' && (
          <div className="p-6 space-y-8">
            {/* 合伙人分红池 */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">account_balance</span>
                  合伙人分红池配置
                </h3>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-100 dark:border-slate-700/50 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">每次注入金额 (元)</label>
                    <input
                      type="number"
                      value={poolInjectAmount}
                      onChange={(e) => setPoolInjectAmount(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
                    />
                    <p className="text-xs text-slate-500 mt-1.5">新合伙人加入时，注入分红池的总金额，将平均分配至5个星级池。</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">分红周期</label>
                    <select
                      value={poolPeriod}
                      onChange={(e) => setPoolPeriod(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
                    >
                      <option value="monthly">每月</option>
                      <option value="weekly">每周</option>
                      <option value="custom">自定义</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">分配算法</label>
                  <select
                    value={poolAlgorithm}
                    onChange={(e) => setPoolAlgorithm(e.target.value)}
                    className="w-full md:w-1/2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
                  >
                    <option value="average">平均分配 (池内总金额 ÷ 达标人数)</option>
                    <option value="weight">权重分配 (预留)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 销售分红池 */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">storefront</span>
                  销售分红池配置
                </h3>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-100 dark:border-slate-700/50 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">订单注入比例 (%)</label>
                    <input type="number" defaultValue={30} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors" />
                    <p className="text-xs text-slate-500 mt-1.5">订单实付金额的该比例将注入销售分红池。</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">分红周期</label>
                    <select className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors">
                      <option value="monthly">每月</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={handleSaveSettings}
                className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
              >
                保存配置
              </button>
            </div>
          </div>
        )}

        {/* Tab Content: Earnings Records */}
        {activeTab === 'earnings-records' && (
          <div>
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-4 items-center">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
                  <input
                    type="text"
                    value={earningsSearch}
                    onChange={(e) => { setEarningsSearch(e.target.value); setEarningsPage(1); }}
                    placeholder="搜索用户昵称/手机号..."
                    className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-64"
                  />
                </div>
                <select
                  value={earningsType}
                  onChange={(e) => { setEarningsType(e.target.value); setEarningsPage(1); }}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm rounded-lg px-3 py-2 outline-none"
                >
                  <option value="">所有收益类型</option>
                  <option value="referral_reward">推荐奖励</option>
                  <option value="sales_commission">销售提成</option>
                  <option value="dividend">分红收益</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="p-4"><ListSkeleton count={5} /></div>
            ) : earningsRecords.length === 0 ? (
              <Empty
                icon="receipt_long"
                title="未找到收益记录"
                description="没有找到符合条件的收益记录"
                actionText="清除筛选"
                onAction={() => {
                  setEarningsType('');
                  setEarningsPage(1);
                }}
                className="py-10"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
                      <th className="p-4 font-medium">用户</th>
                      <th className="p-4 font-medium">收益类型</th>
                      <th className="p-4 font-medium">明细说明</th>
                      <th className="p-4 font-medium">时间</th>
                      <th className="p-4 font-medium text-right">金额</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {earningsRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                        <td className="p-4">
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{record.user?.name || '未知用户'}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{record.user?.phone || '-'}</p>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            record.type === 'referral_reward' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                            record.type === 'sales_commission' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                            'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400'
                          }`}>
                            {incomeTypeLabels[record.type] || record.type}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300 max-w-xs truncate">
                          {record.description || '-'}
                        </td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{formatDate(record.created_at)}</td>
                        <td className="p-4 text-sm font-medium text-emerald-600 dark:text-emerald-400 text-right">+{formatCurrency(record.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {earningsTotalPages > 1 && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-sm">
                <span className="text-slate-500">共 {earningsTotal} 条记录，当前 {earningsPage}/{earningsTotalPages} 页</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEarningsPage(p => Math.max(1, p - 1))}
                    disabled={earningsPage === 1}
                    className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
                  >
                    上一页
                  </button>
                  <button
                    onClick={() => setEarningsPage(p => Math.min(earningsTotalPages, p + 1))}
                    disabled={earningsPage === earningsTotalPages}
                    className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Sales Leaderboard */}
        {activeTab === 'sales-leaderboard' && (
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <select
                value={leaderboardType}
                onChange={(e) => setLeaderboardType(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm rounded-lg px-3 py-2 outline-none"
              >
                <option value="team">团队销售额排行</option>
                <option value="personal">个人直推销售额排行</option>
              </select>
              <select
                value={leaderboardPeriod}
                onChange={(e) => setLeaderboardPeriod(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm rounded-lg px-3 py-2 outline-none"
              >
                <option value="week">最近7天</option>
                <option value="month">最近30天</option>
                <option value="year">最近一年</option>
                <option value="all">全部时间</option>
              </select>
            </div>

            {loading ? (
              <div className="py-10 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : leaderboardData.length === 0 ? (
              <Empty
                icon="leaderboard"
                title="暂无排行数据"
                description="当前还没有合伙人销售数据"
                className="py-10"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
                      <th className="p-4 font-medium">排名</th>
                      <th className="p-4 font-medium">合伙人信息</th>
                      <th className="p-4 font-medium">等级</th>
                      <th className="p-4 font-medium">{leaderboardType === 'team' ? '团队销售额' : '个人销售额'}</th>
                      <th className="p-4 font-medium">累计收益</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {leaderboardData
                      .sort((a, b) => leaderboardType === 'team' ? b.team_sales - a.team_sales : b.personal_sales - a.personal_sales)
                      .map((item, index) => (
                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                          <td className="p-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                              index === 0 ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400' :
                              index === 1 ? 'bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-300' :
                              index === 2 ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400' :
                              'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                              {index + 1}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-slate-900 dark:text-white">{item.name}</span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">{item.phone}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary">
                              {PartnerLevelLabel[item.level] || item.level}
                            </span>
                          </td>
                          <td className="p-4 text-sm font-bold text-slate-900 dark:text-white">
                            {formatCurrency(leaderboardType === 'team' ? item.team_sales : item.personal_sales)}
                          </td>
                          <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                            {formatCurrency(item.total_earnings)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}