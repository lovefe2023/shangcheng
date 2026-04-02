import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Empty from '../../components/Empty';
import { ListSkeleton } from '../../components/Skeleton';
import { useToast } from '../../components/Toast';
import { adminApi } from '../../lib/api';
import { PartnerLevel, PartnerLevelLabel, UserStatus, UserStatusLabel } from '../../types';

interface Partner {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  is_partner: boolean;
  partner_level: PartnerLevel;
  referrer?: { name: string; id: string };
  team_size: number;
  created_at: string;
  status: UserStatus;
}

export default function AdminPartners() {
  const navigate = useNavigate();
  const toast = useToast();

  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    fetchPartners();
  }, [page, levelFilter, statusFilter]);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getPartners({
        page,
        pageSize,
        keyword: searchQuery || undefined,
        level: levelFilter || undefined,
        status: statusFilter || undefined
      });

      if (res.success && res.data) {
        setPartners(res.data.list || []);
        setTotal(res.data.total || 0);
      } else {
        toast.error('获取合伙人列表失败');
      }
    } catch (error) {
      console.error('Get partners error:', error);
      toast.error('获取合伙人列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchPartners();
  };

  const toggleStatus = async (id: string, currentStatus: UserStatus) => {
    const newStatus = currentStatus === UserStatus.ACTIVE ? UserStatus.FROZEN : UserStatus.ACTIVE;
    try {
      const res = await adminApi.updateUserStatus(id, newStatus);
      if (res.success) {
        setPartners(partners.map(p =>
          p.id === id ? { ...p, status: newStatus } : p
        ));
        toast.success(`合伙人状态已更新为: ${UserStatusLabel[newStatus]}`);
      } else {
        toast.error('操作失败');
      }
    } catch (error) {
      toast.error('操作失败');
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">合伙人管理</h1>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/admin/partners/audit')}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">fact_check</span>
            审核申请
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
              <input
                type="text"
                placeholder="搜索姓名/手机号..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-64"
              />
            </div>
            <select
              value={levelFilter}
              onChange={(e) => { setLevelFilter(e.target.value); setPage(1); }}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm rounded-lg px-3 py-2 outline-none"
            >
              <option value="">所有等级</option>
              <option value={PartnerLevel.JUNIOR}>{PartnerLevelLabel[PartnerLevel.JUNIOR]}</option>
              <option value={PartnerLevel.MIDDLE}>{PartnerLevelLabel[PartnerLevel.MIDDLE]}</option>
              <option value={PartnerLevel.SENIOR}>{PartnerLevelLabel[PartnerLevel.SENIOR]}</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm rounded-lg px-3 py-2 outline-none"
            >
              <option value="">所有状态</option>
              <option value={UserStatus.ACTIVE}>{UserStatusLabel[UserStatus.ACTIVE]}</option>
              <option value={UserStatus.FROZEN}>{UserStatusLabel[UserStatus.FROZEN]}</option>
            </select>
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium"
            >
              搜索
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-4"><ListSkeleton count={5} /></div>
          ) : partners.length === 0 ? (
            <Empty
              icon="group_off"
              title="未找到合伙人"
              description="没有找到符合条件的合伙人，请尝试更改搜索条件"
              actionText="清除筛选"
              onAction={() => {
                setSearchQuery('');
                setLevelFilter('');
                setStatusFilter('');
                setPage(1);
              }}
              className="py-10"
            />
          ) : (
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
                  <th className="p-4 font-medium">合伙人信息</th>
                  <th className="p-4 font-medium">等级</th>
                  <th className="p-4 font-medium">推荐人</th>
                  <th className="p-4 font-medium">团队人数</th>
                  <th className="p-4 font-medium">注册时间</th>
                  <th className="p-4 font-medium">状态</th>
                  <th className="p-4 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {partners.map((partner) => (
                  <tr key={partner.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 font-medium">
                          {partner.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{partner.name || '未设置昵称'}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{partner.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        partner.partner_level === PartnerLevel.SENIOR ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                        partner.partner_level === PartnerLevel.MIDDLE ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {PartnerLevelLabel[partner.partner_level]}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                      {partner.referrer?.name || '系统'}
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-slate-400">group</span>
                        {partner.team_size || 0}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                      {formatDate(partner.created_at)}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        partner.status === UserStatus.ACTIVE
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                      }`}>
                        {UserStatusLabel[partner.status]}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/admin/partners/${partner.id}`)}
                          className="text-primary text-sm font-medium hover:underline"
                        >
                          详情
                        </button>
                        <button
                          onClick={() => toggleStatus(partner.id, partner.status)}
                          className={`text-sm font-medium px-2 py-1 rounded hover:underline ${
                            partner.status === UserStatus.ACTIVE ? 'text-red-500' : 'text-emerald-500'
                          }`}
                        >
                          {partner.status === UserStatus.ACTIVE ? '冻结' : '解冻'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
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
    </div>
  );
}