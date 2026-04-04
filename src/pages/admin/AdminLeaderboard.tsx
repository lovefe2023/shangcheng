import { useState, useEffect, useRef } from 'react';
import { useToast } from '../../components/Toast';
import { ListSkeleton } from '../../components/Skeleton';
import { adminApi } from '../../lib/api';

// 导出类型供API使用
export interface RankReward {
  rank_start: number;
  rank_end: number;
  reward: string;
  reward_type: 'cash' | 'coupon' | 'points';
  reward_value: number;
}

export interface PeriodWeights {
  week: { enabled: boolean; label: string; weight: number };
  month: { enabled: boolean; label: string; weight: number };
  year: { enabled: boolean; label: string; weight: number };
}

export interface DisplaySettings {
  show_real_name: boolean;
  show_sales_amount: boolean;
  show_income_amount: boolean;
  top_count: number;
  update_frequency: 'hourly' | 'daily' | 'realtime';
}

export interface LeaderboardSettings {
  sales_rewards: RankReward[];
  income_rewards: RankReward[];
  period_weights: PeriodWeights;
  display_settings: DisplaySettings;
}

// 验证常量
const MAX_REWARD_VALUE = 1000000;
const MAX_RANK = 10000;
const MAX_REWARD_NAME_LENGTH = 100;

const defaultSettings: LeaderboardSettings = {
  sales_rewards: [
    { rank_start: 1, rank_end: 1, reward: '月度销售冠军', reward_type: 'cash', reward_value: 1000 },
    { rank_start: 2, rank_end: 2, reward: '月度销售亚军', reward_type: 'cash', reward_value: 500 },
    { rank_start: 3, rank_end: 3, reward: '月度销售季军', reward_type: 'cash', reward_value: 300 },
    { rank_start: 4, rank_end: 10, reward: '月度销售前十', reward_type: 'coupon', reward_value: 100 },
    { rank_start: 11, rank_end: 50, reward: '月度销售前五十', reward_type: 'points', reward_value: 50 },
  ],
  income_rewards: [
    { rank_start: 1, rank_end: 1, reward: '月度收益冠军', reward_type: 'cash', reward_value: 800 },
    { rank_start: 2, rank_end: 2, reward: '月度收益亚军', reward_type: 'cash', reward_value: 400 },
    { rank_start: 3, rank_end: 3, reward: '月度收益季军', reward_type: 'cash', reward_value: 200 },
    { rank_start: 4, rank_end: 10, reward: '月度收益前十', reward_type: 'coupon', reward_value: 80 },
  ],
  period_weights: {
    week: { enabled: true, label: '周榜', weight: 0.3 },
    month: { enabled: true, label: '月榜', weight: 1.0 },
    year: { enabled: true, label: '年榜', weight: 3.0 },
  },
  display_settings: {
    show_real_name: false,
    show_sales_amount: true,
    show_income_amount: true,
    top_count: 10,
    update_frequency: 'daily',
  }
};

// 检查排名范围是否重叠
const checkRankOverlap = (rewards: RankReward[]): string | null => {
  for (let i = 0; i < rewards.length; i++) {
    for (let j = i + 1; j < rewards.length; j++) {
      const a = rewards[i];
      const b = rewards[j];
      // 检查范围重叠: [a.start, a.end] 与 [b.start, b.end]
      if (a.rank_start <= b.rank_end && b.rank_start <= a.rank_end) {
        return `排名范围重叠: 第${a.rank_start}-${a.rank_end}名 与 第${b.rank_start}-${b.rank_end}名`;
      }
    }
  }
  return null;
};

// 验证奖励数据
const validateRewards = (rewards: RankReward[]): string | null => {
  for (let i = 0; i < rewards.length; i++) {
    const r = rewards[i];
    if (r.rank_start < 1 || r.rank_start > MAX_RANK) {
      return `第${i + 1}档: 排名起始值无效(1-${MAX_RANK})`;
    }
    if (r.rank_end < r.rank_start || r.rank_end > MAX_RANK) {
      return `第${i + 1}档: 排名结束值无效`;
    }
    if (!r.reward || r.reward.length > MAX_REWARD_NAME_LENGTH) {
      return `第${i + 1}档: 奖励名称无效(最多${MAX_REWARD_NAME_LENGTH}字符)`;
    }
    if (r.reward_value < 0 || r.reward_value > MAX_REWARD_VALUE) {
      return `第${i + 1}档: 奖励值无效(0-${MAX_REWARD_VALUE})`;
    }
  }
  return checkRankOverlap(rewards);
};

// 计算总奖励金额
const calculateTotalReward = (rewards: RankReward[]): number => {
  return rewards.reduce((total, r) => {
    // 计算该档位覆盖的人数
    const count = r.rank_end - r.rank_start + 1;
    return total + r.reward_value * count;
  }, 0);
};

export default function AdminLeaderboard() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'sales' | 'income'>('sales');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // 防重复提交锁
  const saveLockRef = useRef(false);

  const [salesRewards, setSalesRewards] = useState<RankReward[]>(defaultSettings.sales_rewards);
  const [incomeRewards, setIncomeRewards] = useState<RankReward[]>(defaultSettings.income_rewards);
  const [periodWeights, setPeriodWeights] = useState<PeriodWeights>(defaultSettings.period_weights);
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>(defaultSettings.display_settings);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getLeaderboardSettings();
      if (res.success && res.data) {
        if (res.data.sales_rewards) setSalesRewards(res.data.sales_rewards);
        if (res.data.income_rewards) setIncomeRewards(res.data.income_rewards);
        if (res.data.period_weights) setPeriodWeights(res.data.period_weights);
        if (res.data.display_settings) setDisplaySettings(res.data.display_settings);
      }
    } catch (error) {
      console.error('Get leaderboard settings error:', error);
      toast.error('获取排行榜配置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClick = () => {
    // 前端验证
    const salesErr = validateRewards(salesRewards);
    if (salesErr) {
      toast.error(`销售榜配置错误: ${salesErr}`);
      return;
    }

    const incomeErr = validateRewards(incomeRewards);
    if (incomeErr) {
      toast.error(`收益榜配置错误: ${incomeErr}`);
      return;
    }

    // 显示确认对话框
    setShowConfirmDialog(true);
  };

  const handleConfirmSave = async () => {
    // 防重复提交检查
    if (saveLockRef.current) {
      toast.info('正在保存中，请稍候...');
      return;
    }

    saveLockRef.current = true;
    setSaving(true);
    setShowConfirmDialog(false);

    try {
      const res = await adminApi.updateLeaderboardSettings({
        sales_rewards: salesRewards,
        income_rewards: incomeRewards,
        period_weights: periodWeights,
        display_settings: displaySettings
      });
      if (res.success) {
        toast.success('排行榜配置保存成功');
        // 保存成功后刷新数据
        await fetchSettings();
      } else {
        toast.error(res.error?.message || '保存失败');
      }
    } catch (error) {
      console.error('Save leaderboard settings error:', error);
      toast.error('保存失败，请重试');
    } finally {
      setSaving(false);
      saveLockRef.current = false;
    }
  };

  const currentRewards = activeTab === 'sales' ? salesRewards : incomeRewards;
  const setCurrentRewards = activeTab === 'sales' ? setSalesRewards : setIncomeRewards;

  const addReward = () => {
    if (currentRewards.length >= 50) {
      toast.error('最多支持50个奖励档位');
      return;
    }
    const lastReward = currentRewards[currentRewards.length - 1];
    const newStart = lastReward ? Math.min(lastReward.rank_end + 1, MAX_RANK) : 1;
    setCurrentRewards([...currentRewards, {
      rank_start: newStart,
      rank_end: newStart,
      reward: '',
      reward_type: 'cash',
      reward_value: 0
    }]);
  };

  const updateReward = (index: number, field: keyof RankReward, value: any) => {
    const updated = [...currentRewards];

    // 数值验证
    if (field === 'rank_start') {
      let num = parseInt(value) || 1;
      if (num < 1) num = 1;
      if (num > MAX_RANK) num = MAX_RANK;
      updated[index] = { ...updated[index], rank_start: num };
    } else if (field === 'rank_end') {
      let num = parseInt(value) || updated[index].rank_start;
      if (num < updated[index].rank_start) num = updated[index].rank_start;
      if (num > MAX_RANK) num = MAX_RANK;
      updated[index] = { ...updated[index], rank_end: num };
    } else if (field === 'reward_value') {
      let num = parseFloat(value) || 0;
      if (num < 0) num = 0;
      if (num > MAX_REWARD_VALUE) num = MAX_REWARD_VALUE;
      updated[index] = { ...updated[index], reward_value: num };
    } else if (field === 'reward') {
      // 限制长度
      const str = String(value).slice(0, MAX_REWARD_NAME_LENGTH);
      updated[index] = { ...updated[index], reward: str };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }

    setCurrentRewards(updated);
  };

  const removeReward = (index: number) => {
    setCurrentRewards(currentRewards.filter((_, i) => i !== index));
  };

  const getRewardTypeLabel = (type: string) => {
    switch (type) {
      case 'cash': return '现金奖励';
      case 'coupon': return '优惠券';
      case 'points': return '积分';
      default: return type;
    }
  };

  // 计算预览数据
  const totalSalesReward = calculateTotalReward(salesRewards);
  const totalIncomeReward = calculateTotalReward(incomeRewards);
  const maxSalesRank = salesRewards.length > 0 ? Math.max(...salesRewards.map(r => r.rank_end)) : 0;
  const maxIncomeRank = incomeRewards.length > 0 ? Math.max(...incomeRewards.map(r => r.rank_end)) : 0;

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto pb-12">
        <ListSkeleton count={5} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">排行榜配置</h1>
        <button
          onClick={handleSaveClick}
          disabled={saving}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? '保存中...' : '保存配置'}
        </button>
      </div>

      {/* 确认对话框 */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">确认保存配置</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              排行榜配置修改将影响合伙人奖励计算，请确认以下变更：
            </p>
            <div className="space-y-2 mb-4 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">销售榜档位:</span>
                <span className="font-medium">{salesRewards.length} 个</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">收益榜档位:</span>
                <span className="font-medium">{incomeRewards.length} 个</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">销售榜总预算:</span>
                <span className="font-medium text-red-500">¥{totalSalesReward.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">收益榜总预算:</span>
                <span className="font-medium text-red-500">¥{totalIncomeReward.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                取消
              </button>
              <button
                onClick={handleConfirmSave}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90"
              >
                确认保存
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* 奖励配置 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">奖励配置</h2>
                <p className="text-sm text-slate-500 mt-1">设置不同排名的奖励内容</p>
              </div>
              <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('sales')}
                  className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                    activeTab === 'sales' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  销售榜
                </button>
                <button
                  onClick={() => setActiveTab('income')}
                  className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                    activeTab === 'income' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  收益榜
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {currentRewards.map((reward, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <div className="flex items-center gap-2 w-32">
                    <input
                      type="number"
                      min="1"
                      max={MAX_RANK}
                      value={reward.rank_start}
                      onChange={(e) => updateReward(index, 'rank_start', e.target.value)}
                      className="w-16 px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm text-center focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                    <span className="text-slate-400">-</span>
                    <input
                      type="number"
                      min={reward.rank_start}
                      max={MAX_RANK}
                      value={reward.rank_end}
                      onChange={(e) => updateReward(index, 'rank_end', e.target.value)}
                      className="w-16 px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm text-center focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                    <span className="text-slate-500 text-sm">名</span>
                  </div>

                  <input
                    type="text"
                    value={reward.reward}
                    onChange={(e) => updateReward(index, 'reward', e.target.value)}
                    placeholder="奖励名称"
                    maxLength={MAX_REWARD_NAME_LENGTH}
                    className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />

                  <select
                    value={reward.reward_type}
                    onChange={(e) => updateReward(index, 'reward_type', e.target.value)}
                    className="w-28 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="cash">现金奖励</option>
                    <option value="coupon">优惠券</option>
                    <option value="points">积分</option>
                  </select>

                  <div className="flex items-center gap-1">
                    <span className="text-slate-500 text-sm">¥</span>
                    <input
                      type="number"
                      min="0"
                      max={MAX_REWARD_VALUE}
                      value={reward.reward_value}
                      onChange={(e) => updateReward(index, 'reward_value', e.target.value)}
                      className="w-24 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>

                  <button
                    onClick={() => removeReward(index)}
                    className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                    title="删除此档位"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
              ))}

              <button
                onClick={addReward}
                disabled={currentRewards.length >= 50}
                className="flex items-center gap-2 text-primary text-sm font-medium hover:underline disabled:text-slate-400 disabled:no-underline disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                添加奖励档位 ({currentRewards.length}/50)
              </button>
            </div>
          </div>
        </div>

        {/* 周期权重配置 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">周期权重配置</h2>
            <p className="text-sm text-slate-500 mt-1">设置不同时间周期的统计权重</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-3 gap-6">
              {(Object.entries(periodWeights) as [keyof PeriodWeights, PeriodWeights[keyof PeriodWeights]][]).map(([key, config]) => (
                <div key={key} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-slate-900 dark:text-white">{config.label}</span>
                    <label className="flex items-center cursor-pointer">
                      <div
                        onClick={() => setPeriodWeights(prev => ({
                          ...prev,
                          [key]: { ...prev[key], enabled: !prev[key].enabled }
                        }))}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${config.enabled ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
                      >
                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${config.enabled ? 'translate-x-5' : 'translate-x-1'}`} />
                      </div>
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">权重倍数:</span>
                    <input
                      type="number"
                      min="0.1"
                      max="100"
                      step="0.1"
                      value={config.weight}
                      onChange={(e) => {
                        let val = parseFloat(e.target.value) || 1;
                        if (val < 0.1) val = 0.1;
                        if (val > 100) val = 100;
                        setPeriodWeights(prev => ({
                          ...prev,
                          [key]: { ...prev[key], weight: val }
                        }));
                      }}
                      disabled={!config.enabled}
                      className="w-20 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm disabled:opacity-50 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 显示配置 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">显示配置</h2>
            <p className="text-sm text-slate-500 mt-1">设置排行榜前端显示规则</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">显示真实姓名</p>
                <p className="text-sm text-slate-500">关闭后将对姓名进行脱敏处理</p>
              </div>
              <label className="flex items-center cursor-pointer">
                <div
                  onClick={() => setDisplaySettings(prev => ({ ...prev, show_real_name: !prev.show_real_name }))}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${displaySettings.show_real_name ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${displaySettings.show_real_name ? 'translate-x-5' : 'translate-x-1'}`} />
                </div>
              </label>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">显示销售金额</p>
                <p className="text-sm text-slate-500">在销售榜中显示具体销售额</p>
              </div>
              <label className="flex items-center cursor-pointer">
                <div
                  onClick={() => setDisplaySettings(prev => ({ ...prev, show_sales_amount: !prev.show_sales_amount }))}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${displaySettings.show_sales_amount ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${displaySettings.show_sales_amount ? 'translate-x-5' : 'translate-x-1'}`} />
                </div>
              </label>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">显示收益金额</p>
                <p className="text-sm text-slate-500">在收益榜中显示具体收益额</p>
              </div>
              <label className="flex items-center cursor-pointer">
                <div
                  onClick={() => setDisplaySettings(prev => ({ ...prev, show_income_amount: !prev.show_income_amount }))}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${displaySettings.show_income_amount ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${displaySettings.show_income_amount ? 'translate-x-5' : 'translate-x-1'}`} />
                </div>
              </label>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">榜单显示人数</p>
                <p className="text-sm text-slate-500">排行榜展示的用户数量</p>
              </div>
              <select
                value={displaySettings.top_count}
                onChange={(e) => setDisplaySettings(prev => ({ ...prev, top_count: parseInt(e.target.value) }))}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value={10}>前 10 名</option>
                <option value={20}>前 20 名</option>
                <option value={50}>前 50 名</option>
                <option value={100}>前 100 名</option>
              </select>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">更新频率</p>
                <p className="text-sm text-slate-500">排行榜数据刷新频率</p>
              </div>
              <select
                value={displaySettings.update_frequency}
                onChange={(e) => setDisplaySettings(prev => ({ ...prev, update_frequency: e.target.value as any }))}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="realtime">实时更新</option>
                <option value="hourly">每小时更新</option>
                <option value="daily">每日更新</option>
              </select>
            </div>
          </div>
        </div>

        {/* 预览 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">配置预览</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-center">
                <span className="material-symbols-outlined text-4xl text-primary mb-2">emoji_events</span>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{salesRewards.length}</p>
                <p className="text-sm text-slate-500">销售榜档位</p>
                <p className="text-xs text-slate-400 mt-1">覆盖第1-{maxSalesRank}名</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-center">
                <span className="material-symbols-outlined text-4xl text-emerald-500 mb-2">payments</span>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{incomeRewards.length}</p>
                <p className="text-sm text-slate-500">收益榜档位</p>
                <p className="text-xs text-slate-400 mt-1">覆盖第1-{maxIncomeRank}名</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-center">
                <span className="material-symbols-outlined text-4xl text-red-500 mb-2">account_balance_wallet</span>
                <p className="text-2xl font-bold text-red-500">¥{totalSalesReward.toLocaleString()}</p>
                <p className="text-sm text-slate-500">销售榜总预算</p>
                <p className="text-xs text-slate-400 mt-1">按满员计算</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-center">
                <span className="material-symbols-outlined text-4xl text-orange-500 mb-2">savings</span>
                <p className="text-2xl font-bold text-orange-500">¥{totalIncomeReward.toLocaleString()}</p>
                <p className="text-sm text-slate-500">收益榜总预算</p>
                <p className="text-xs text-slate-400 mt-1">按满员计算</p>
              </div>
            </div>

            {/* 启用周期汇总 */}
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-blue-500">leaderboard</span>
                <span className="font-medium text-blue-900 dark:text-blue-100">启用的排行榜周期</span>
              </div>
              <div className="flex gap-2">
                {(Object.entries(periodWeights) as [keyof PeriodWeights, PeriodWeights[keyof PeriodWeights]][])
                  .filter(([_, c]) => c.enabled)
                  .map(([key, config]) => (
                    <span key={key} className="px-3 py-1 bg-blue-100 dark:bg-blue-800 rounded-full text-sm text-blue-800 dark:text-blue-200">
                      {config.label} (权重 {config.weight}x)
                    </span>
                  ))}
                {(Object.values(periodWeights) as PeriodWeights[keyof PeriodWeights][]).every(c => !c.enabled) && (
                  <span className="text-sm text-slate-500">未启用任何周期</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}