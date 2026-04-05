import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { partnerApi } from '../lib/api';
import { PartnerLevelLabel, PartnerLevel, IncomeTypeLabel, IncomeStatusLabel, IncomeStatus } from '../types';

interface PartnerProfile {
  id: string;
  name: string;
  phone: string;
  avatar: string | null;
  status: string;
  is_partner: boolean;
  partner_level: string;
  invite_code: string;
  balance: number;
  total_income: number;
  team_size: number;
  month_sales: number;
  total_referral_reward: number;
  total_sales_commission: number;
  total_dividend: number;
}

interface IncomeRecord {
  id: string;
  type: string;
  amount: number;
  status: string;
  description: string;
  created_at: string;
}

export default function Partner() {
  const [profile, setProfile] = useState<PartnerProfile | null>(null);
  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPartnerData();
  }, []);

  const loadPartnerData = async () => {
    setLoading(true);
    setError(null);

    try {
      // 加载合伙人信息
      const profileRes = await partnerApi.getProfile();
      if (profileRes.success && profileRes.data) {
        setProfile(profileRes.data);
      } else {
        setError(profileRes.error?.message || '加载失败');
      }

      // 加载收益明细
      const incomeRes = await partnerApi.getIncome({ pageSize: 10 });
      if (incomeRes.success && incomeRes.data) {
        setIncomeRecords(incomeRes.data.list || []);
      }
    } catch (err) {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  // 获取等级显示文本
  const getLevelDisplay = (level: string) => {
    const levelKey = level as PartnerLevel;
    return PartnerLevelLabel[levelKey] || '普通用户';
  };

  // 收益类型显示
  const getIncomeTypeLabel = (type: string) => {
    const typeKey = type as IncomeType;
    return IncomeTypeLabel[typeKey] || type;
  };

  // 收益状态显示
  const getIncomeStatusLabel = (status: string) => {
    const statusKey = status as IncomeStatus;
    const text = IncomeStatusLabel[statusKey] || status;
    const colorMap: Record<string, string> = {
      'pending': 'text-yellow-500',
      'settled': 'text-green-500',
      'completed': 'text-blue-500'
    };
    return { text, color: colorMap[status] || 'text-gray-500' };
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark">
        <div className="flex items-center justify-center h-[50vh]">
          <div className="text-slate-400">加载中...</div>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark">
        <div className="flex items-center bg-white dark:bg-slate-900 p-4 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
          <Link to="/" className="material-symbols-outlined cursor-pointer text-slate-900 dark:text-slate-100">arrow_back</Link>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex-1 text-center">合伙人中心</h2>
        </div>
        <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
          <span className="material-symbols-outlined text-4xl text-slate-400">error</span>
          <p className="text-slate-500">{error}</p>
          <button
            onClick={loadPartnerData}
            className="px-4 py-2 bg-primary text-white rounded-lg"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  const userStatus = profile?.status || 'active';
  const isFrozen = userStatus === 'frozen';

  return (
    <div className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark pb-24">
      {/* 头部 */}
      <div className="flex items-center bg-white dark:bg-slate-900 p-4 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800 justify-between">
        <div className="text-slate-900 dark:text-slate-100 flex size-10 shrink-0 items-center justify-start">
          <Link to="/" className="material-symbols-outlined cursor-pointer">arrow_back</Link>
        </div>
        <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-tight flex-1 text-center">合伙人中心</h2>
        <div className="flex w-10 items-center justify-end">
          <button className="flex cursor-pointer items-center justify-center text-slate-900 dark:text-slate-100">
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>
      </div>

      {/* 账号冻结提示 */}
      {isFrozen && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 text-sm flex items-start gap-2 border-b border-red-100 dark:border-red-900/30">
          <span className="material-symbols-outlined text-base mt-0.5">block</span>
          <div className="flex-1">
            <p className="font-bold">账号已冻结</p>
            <p className="text-xs mt-0.5 opacity-90">您的合伙人权限已被冻结，提现和邀请功能暂时受限。如有疑问请联系客服。</p>
          </div>
        </div>
      )}

      {/* 合伙人卡片 */}
      <div className="p-4">
        <div className="flex flex-col items-stretch justify-start rounded-xl shadow-lg bg-gradient-to-br from-primary to-blue-700 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <span className="material-symbols-outlined text-6xl">workspace_premium</span>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-12 rounded-full border-2 border-white/50 bg-white/20 flex items-center justify-center overflow-hidden">
                {profile?.avatar ? (
                  <img className="w-full h-full object-cover" src={profile.avatar} alt="用户头像" />
                ) : (
                  <span className="material-symbols-outlined text-2xl">person</span>
                )}
              </div>
              <div>
                <p className="text-white/80 text-xs font-normal">合伙人 ID: {profile?.invite_code || '未分配'}</p>
                <p className="text-xl font-bold leading-tight tracking-tight">{getLevelDisplay(profile?.partner_level || 'none')}</p>
              </div>
            </div>

            {/* 销售和收益 */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <Link to="/sales/details" className="bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/10 block hover:bg-white/20 transition-colors">
                <p className="text-white/70 text-xs mb-1">个人销售额</p>
                <p className="text-lg font-bold">¥{(profile?.month_sales || 0).toFixed(2)}</p>
              </Link>
              <Link to="/sales" className="bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/10 block hover:bg-white/20 transition-colors">
                <p className="text-white/70 text-xs mb-1">个人收益</p>
                <p className="text-lg font-bold">¥{(profile?.total_income || 0).toFixed(2)}</p>
              </Link>
            </div>

            {/* 团队人数 */}
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-white/70 text-xs">团队成员</p>
                <p className="text-lg font-bold">{profile?.team_size || 0} 人</p>
              </div>
              <Link
                to="/privileges"
                className="flex cursor-pointer items-center justify-center rounded-lg h-9 px-4 bg-white text-primary text-sm font-bold shadow-sm"
              >
                查看权益
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 邀请合伙人 */}
      <div className="px-4 mb-6">
        <div className="bg-gradient-to-r from-[#ff7a18] to-[#ffb347] rounded-xl p-5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-full bg-white/20 flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-3xl">person_add</span>
            </div>
            <div>
              <h3 className="text-white text-lg font-bold leading-tight">邀请合伙人</h3>
              <p className="text-white/90 text-xs mt-1">邀请好友加入，享二级返佣加成</p>
            </div>
          </div>
          {isFrozen ? (
            <button disabled className="bg-white/50 text-[#ff7a18]/50 px-4 py-2 rounded-full text-sm font-bold shadow-sm whitespace-nowrap cursor-not-allowed">
              不可用
            </button>
          ) : (
            <Link to="/partner/invite" className="bg-white text-[#ff7a18] px-4 py-2 rounded-full text-sm font-bold shadow-sm whitespace-nowrap active:opacity-90 transition-opacity">
              立即邀请
            </Link>
          )}
        </div>
      </div>

      {/* 收益明细 */}
      <div className="px-4 mb-6">
        <div className="flex items-center mb-4">
          <h2 className="text-slate-900 dark:text-slate-100 text-xl font-bold">收益明细</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="size-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500">
                <span className="material-symbols-outlined text-sm">card_giftcard</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">推荐奖励</p>
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">¥{(profile?.total_referral_reward || 0).toFixed(2)}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="size-8 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-500">
                <span className="material-symbols-outlined text-sm">payments</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">销售提成</p>
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">¥{(profile?.total_sales_commission || 0).toFixed(2)}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="size-8 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-500">
                <span className="material-symbols-outlined text-sm">pie_chart</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">销售分红</p>
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">¥{(profile?.total_dividend || 0).toFixed(2)}</p>
          </div>
          <Link to="/partner/withdrawals" className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <div className="size-8 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-500">
                <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">可提现余额</p>
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">¥{(profile?.balance || 0).toFixed(2)}</p>
          </Link>
        </div>
      </div>

      {/* 最近收益记录 */}
      {incomeRecords.length > 0 && (
        <div className="px-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-slate-900 dark:text-slate-100 text-xl font-bold">最近收益</h2>
            <Link to="/partner/income" className="text-primary text-sm">查看全部</Link>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {incomeRecords.slice(0, 5).map((record, index) => (
              <div key={record.id} className={`flex items-center justify-between p-4 ${index < incomeRecords.length - 1 ? 'border-b border-slate-100 dark:border-slate-800' : ''}`}>
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{getIncomeTypeLabel(record.type)}</p>
                  <p className="text-xs text-slate-400">{new Date(record.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-500">+¥{record.amount.toFixed(2)}</p>
                  <p className={`text-xs ${getIncomeStatusLabel(record.status).color}`}>{getIncomeStatusLabel(record.status).text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 提现按钮 */}
      {profile?.balance > 0 && !isFrozen && (
        <div className="px-4 mb-6">
          <Link
            to="/partner/withdraw"
            className="block w-full py-3 bg-primary text-white text-center font-bold rounded-xl shadow-sm hover:opacity-90 transition-opacity"
          >
            申请提现
          </Link>
        </div>
      )}

      {/* 合伙人指南 */}
      <div className="px-4 mb-8">
        <h2 className="text-slate-900 dark:text-slate-100 text-xl font-bold mb-4">合伙人指南</h2>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <Link to="/faq/commission" className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-slate-400">help</span>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">佣金如何结算与提现？</span>
            </div>
            <span className="material-symbols-outlined text-slate-400 text-sm">chevron_right</span>
          </Link>
          <Link to="/faq/upgrade" className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-slate-400">trending_up</span>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">如何升级合伙人等级？</span>
            </div>
            <span className="material-symbols-outlined text-slate-400 text-sm">chevron_right</span>
          </Link>
          <Link to="/faq/invite" className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-slate-400">group_add</span>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">邀请好友有什么奖励？</span>
            </div>
            <span className="material-symbols-outlined text-slate-400 text-sm">chevron_right</span>
          </Link>
        </div>
      </div>
    </div>
  );
}