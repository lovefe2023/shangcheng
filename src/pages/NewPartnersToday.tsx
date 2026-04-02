import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Empty from '../components/Empty';
import { ListSkeleton } from '../components/Skeleton';
import { partnerApi } from '../lib/api';
import { PartnerActivationStatus, PartnerActivationStatusLabel, PartnerLevel, PartnerLevelLabel } from '../types';

interface NewPartner {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  partner_level: PartnerLevel;
  activation_status: PartnerActivationStatus;
  created_at: string;
}

export default function NewPartnersToday() {
  const [partners, setPartners] = useState<NewPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0 });

  useEffect(() => {
    fetchNewPartners();
  }, []);

  const fetchNewPartners = async () => {
    setLoading(true);
    try {
      const res = await partnerApi.getTodayNew();
      if (res.success && res.data) {
        setPartners(res.data.list || []);
        setStats({
          total: res.data.total || 0,
          pending: res.data.pending || 0
        });
      }
    } catch (error) {
      console.error('获取今日新增合伙人失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <header className="shrink-0 sticky top-0 z-10 flex items-center bg-white dark:bg-slate-900 p-4 border-b border-slate-200 dark:border-slate-800 justify-between">
        <Link to="/partner" className="text-slate-900 dark:text-slate-100 flex size-10 shrink-0 items-center justify-start">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-tight flex-1 text-center">今日新增合伙人</h1>
        <div className="flex w-10 items-center justify-end"></div>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <ListSkeleton count={6} />
          </div>
        ) : partners.length === 0 ? (
          <Empty
            icon="group_off"
            title="暂无新增合伙人"
            description="今天还没有新的合伙人加入"
            className="py-10"
          />
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">共新增 {stats.total} 人</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">待激活 {stats.pending} 人</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {partners.map((partner) => (
                <Link to={`/member/${partner.id}`} key={partner.id} className="p-4 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-lg font-medium text-slate-600 dark:text-slate-300">
                    {partner.name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{partner.name || '未知用户'}</h3>
                      <span className="text-xs text-slate-400">{formatTime(partner.created_at)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500 dark:text-slate-400">{partner.phone || '-'}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        partner.activation_status === PartnerActivationStatus.ACTIVATED
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                      }`}>
                        {PartnerActivationStatusLabel[partner.activation_status] || partner.activation_status}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}