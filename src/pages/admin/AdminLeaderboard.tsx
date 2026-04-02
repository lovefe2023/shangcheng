import { useState, useEffect } from 'react';
import { useToast } from '../../components/Toast';
import { ListSkeleton } from '../../components/Skeleton';
import { adminApi } from '../../lib/api';

interface RankReward {
  rank_start: number;
  rank_end: number;
  reward: string;
  reward_type: 'cash' | 'coupon' | 'points';
  reward_value: number;
}

interface PeriodWeights {
  week: { enabled: boolean; label: string; weight: number };
  month: { enabled: boolean; label: string; weight: number };
  year: { enabled: boolean; label: string; weight: number };
}

interface DisplaySettings {
  show_real_name: boolean;
  show_sales_amount: boolean;
  show_income_amount: boolean;
  top_count: number;
  update_frequency: 'hourly' | 'daily' | 'realtime';
}

interface LeaderboardSettings {
  sales_rewards: RankReward[];
  income_rewards: RankReward[];
  period_weights: PeriodWeights;
  display_settings: DisplaySettings;
}

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

export default function AdminLeaderboard() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'sales' | 'income'>('sales');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await adminApi.updateLeaderboardSettings({
        sales_rewards: salesRewards,
        income_rewards: incomeRewards,
        period_weights: periodWeights,
        display_settings: displaySettings
      });
      if (res.success) {
        toast.success('排行榜配置保存成功');
      } else {
        toast.error('保存失败');
      }
    } catch (error) {
      console.error('Save leaderboard settings error:', error);
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const currentRewards = activeTab === 'sales' ? salesRewards : incomeRewards;
  const setCurrentRewards = activeTab === 'sales' ? setSalesRewards : setIncomeRewards;

  const addReward = () => {
    const lastReward = currentRewards[currentRewards.length - 1];
    const newStart = lastReward ? lastReward.rank_end + 1 : 1;
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
    updated[index] = { ...updated[index], [field]: value };
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
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
        >
          {saving ? '保存中...' : '保存配置'}
        </button>
      </div>

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
                      value={reward.rank_start}
                      onChange={(e) => updateReward(index, 'rank_start', parseInt(e.target.value) || 1)}
                      className="w-16 px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm text-center"
                    />
                    <span className="text-slate-400">-</span>
                    <input
                      type="number"
                      min={reward.rank_start}
                      value={reward.rank_end}
                      onChange={(e) => updateReward(index, 'rank_end', parseInt(e.target.value) || reward.rank_start)}
                      className="w-16 px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm text-center"
                    />
                    <span className="text-slate-500 text-sm">名</span>
                  </div>

                  <input
                    type="text"
                    value={reward.reward}
                    onChange={(e) => updateReward(index, 'reward', e.target.value)}
                    placeholder="奖励名称"
                    className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm"
                  />

                  <select
                    value={reward.reward_type}
                    onChange={(e) => updateReward(index, 'reward_type', e.target.value)}
                    className="w-28 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm"
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
                      value={reward.reward_value}
                      onChange={(e) => updateReward(index, 'reward_value', parseFloat(e.target.value) || 0)}
                      className="w-24 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm"
                    />
                  </div>

                  <button
                    onClick={() => removeReward(index)}
                    className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
              ))}

              <button
                onClick={addReward}
                className="flex items-center gap-2 text-primary text-sm font-medium hover:underline"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                添加奖励档位
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
              {Object.entries(periodWeights).map(([key, config]) => (
                <div key={key} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-slate-900 dark:text-white">{config.label}</span>
                    <label className="flex items-center cursor-pointer">
                      <div
                        onClick={() => setPeriodWeights(prev => ({
                          ...prev,
                          [key]: { ...prev[key as keyof typeof prev], enabled: !prev[key as keyof typeof prev].enabled }
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
                      step="0.1"
                      value={config.weight}
                      onChange={(e) => setPeriodWeights(prev => ({
                        ...prev,
                        [key]: { ...prev[key as keyof typeof prev], weight: parseFloat(e.target.value) || 1 }
                      }))}
                      disabled={!config.enabled}
                      className="w-20 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm disabled:opacity-50"
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
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-sm"
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
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-sm"
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
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-center">
                <span className="material-symbols-outlined text-4xl text-primary mb-2">emoji_events</span>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{salesRewards.length}</p>
                <p className="text-sm text-slate-500">销售榜奖励档位</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-center">
                <span className="material-symbols-outlined text-4xl text-emerald-500 mb-2">payments</span>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{incomeRewards.length}</p>
                <p className="text-sm text-slate-500">收益榜奖励档位</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-center">
                <span className="material-symbols-outlined text-4xl text-blue-500 mb-2">leaderboard</span>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {Object.values(periodWeights).filter(p => p.enabled).length}
                </p>
                <p className="text-sm text-slate-500">启用的排行榜周期</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}