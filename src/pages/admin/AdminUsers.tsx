import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Empty from '../../components/Empty';
import { ListSkeleton } from '../../components/Skeleton';
import { useToast } from '../../components/Toast';
import { adminApi } from '../../lib/api';
import { UserStatus, UserStatusLabel, PartnerLevel, PartnerLevelLabel } from '../../types';

interface User {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  status: UserStatus;
  is_partner: boolean;
  partner_level: PartnerLevel;
  referrer?: { name: string; id: string };
  team_size: number;
  created_at: string;
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const toast = useToast();

  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    fetchUsers();
  }, [page, filterLevel, filterStatus]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers({
        page,
        pageSize,
        keyword: searchQuery || undefined,
        partnerLevel: filterLevel || undefined,
        status: filterStatus || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      });

      if (res.success && res.data) {
        setUsers(res.data.list || []);
        setTotal(res.data.total || 0);
      } else {
        toast.error('获取用户列表失败');
      }
    } catch (error) {
      console.error('Get users error:', error);
      toast.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchUsers();
  };

  const toggleStatus = async (id: string, currentStatus: UserStatus) => {
    const newStatus = currentStatus === UserStatus.ACTIVE ? UserStatus.FROZEN : UserStatus.ACTIVE;
    try {
      const res = await adminApi.updateUserStatus(id, newStatus);
      if (res.success) {
        setUsers(users.map(user =>
          user.id === id ? { ...user, status: newStatus } : user
        ));
        toast.success(`用户状态已更新为: ${UserStatusLabel[newStatus]}`);
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
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">用户管理</h1>
        <button
          onClick={() => navigate('/admin/users/add')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-[20px]">person_add</span>
          添加用户
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Toolbar & Filters */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-wrap gap-4 items-center justify-between bg-slate-50/50 dark:bg-slate-900/20">
          <div className="flex flex-wrap gap-4 items-center w-full lg:w-auto">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="搜索昵称/手机号..."
                className="pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-primary dark:focus:border-primary transition-colors w-64"
              />
            </div>

            <select
              value={filterLevel}
              onChange={(e) => { setFilterLevel(e.target.value); setPage(1); }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors"
            >
              <option value="">所有等级</option>
              <option value={PartnerLevel.NONE}>非合伙人</option>
              <option value={PartnerLevel.JUNIOR}>{PartnerLevelLabel[PartnerLevel.JUNIOR]}</option>
              <option value={PartnerLevel.MIDDLE}>{PartnerLevelLabel[PartnerLevel.MIDDLE]}</option>
              <option value={PartnerLevel.SENIOR}>{PartnerLevelLabel[PartnerLevel.SENIOR]}</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors"
            >
              <option value="">所有状态</option>
              <option value={UserStatus.ACTIVE}>{UserStatusLabel[UserStatus.ACTIVE]}</option>
              <option value={UserStatus.FROZEN}>{UserStatusLabel[UserStatus.FROZEN]}</option>
            </select>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors"
              />
              <span className="text-slate-400">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors"
              />
            </div>

            <button onClick={handleSearch} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">
              搜索
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-4"><ListSkeleton count={5} /></div>
          ) : users.length === 0 ? (
            <Empty
              icon="search_off"
              title="未找到用户"
              description="没有找到符合条件的用户，请尝试更改搜索条件"
              actionText="清除筛选"
              onAction={() => {
                setSearchQuery('');
                setFilterLevel('');
                setFilterStatus('');
                setStartDate('');
                setEndDate('');
                setPage(1);
              }}
              className="py-10"
            />
          ) : (
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
                  <th className="p-4 font-medium">用户信息 (ID/昵称/手机号)</th>
                  <th className="p-4 font-medium">合伙人信息</th>
                  <th className="p-4 font-medium">推荐人</th>
                  <th className="p-4 font-medium">团队人数</th>
                  <th className="p-4 font-medium">注册时间</th>
                  <th className="p-4 font-medium">状态</th>
                  <th className="p-4 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 font-medium">
                          {user.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{user.name || '未设置昵称'}</p>
                            <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{user.id.slice(0, 6)}...</span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{user.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {user.is_partner ? (
                        <div>
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            user.partner_level === PartnerLevel.SENIOR ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                            user.partner_level === PartnerLevel.MIDDLE ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                            'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                          }`}>
                            {PartnerLevelLabel[user.partner_level]}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">非合伙人</span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                      {user.referrer?.name || '系统'}
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                      {user.team_size || 0}
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        user.status === UserStatus.ACTIVE
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                      }`}>
                        {UserStatusLabel[user.status]}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/admin/users/${user.id}`)}
                          className="text-primary text-sm font-medium hover:underline"
                        >
                          详情
                        </button>
                        <button
                          onClick={() => toggleStatus(user.id, user.status)}
                          className={`text-sm font-medium px-2 py-1 rounded hover:underline ${
                            user.status === UserStatus.ACTIVE ? 'text-red-500' : 'text-emerald-500'
                          }`}
                        >
                          {user.status === UserStatus.ACTIVE ? '冻结' : '解冻'}
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