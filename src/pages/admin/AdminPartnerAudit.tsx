import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Empty from '../../components/Empty';
import { ListSkeleton } from '../../components/Skeleton';
import { useToast } from '../../components/Toast';
import { adminApi } from '../../lib/api';
import { AuditStatus, AuditStatusLabel, PartnerLevel, PartnerLevelLabel } from '../../types';

interface PartnerApplication {
  id: string;
  user_id: string;
  level: PartnerLevel;
  status: AuditStatus;
  reason: string;
  note?: string;
  applied_at: string;
  reviewed_at?: string;
  user?: {
    id: string;
    name: string;
    phone: string;
    avatar?: string;
  };
}

export default function AdminPartnerAudit() {
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<AuditStatus>(AuditStatus.PENDING);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [applications, setApplications] = useState<PartnerApplication[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    fetchApplications();
  }, [activeTab]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getPartnerApplications({
        status: activeTab
      });

      if (res.success && res.data) {
        setApplications(res.data.list || []);
        if (activeTab === AuditStatus.PENDING) {
          setPendingCount(res.data.total || 0);
        }
      }
    } catch (error) {
      console.error('Get applications error:', error);
      toast.error('获取申请列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await adminApi.reviewPartnerApplication(id, 'approved');
      if (res.success) {
        toast.success('申请已通过');
        fetchApplications();
      } else {
        toast.error('操作失败');
      }
    } catch (error) {
      toast.error('操作失败');
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('请输入拒绝原因（可选）');
    try {
      const res = await adminApi.reviewPartnerApplication(id, 'rejected', reason || undefined);
      if (res.success) {
        toast.success('申请已拒绝');
        fetchApplications();
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

  const filteredApplications = applications.filter(app => {
    if (!searchQuery) return true;
    const name = app.user?.name || '';
    const phone = app.user?.phone || '';
    const userId = app.user_id || '';
    return name.includes(searchQuery) || phone.includes(searchQuery) || userId.includes(searchQuery);
  });

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/admin/partners')}
          className="p-2 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">合伙人申请审核</h1>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Tabs and Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-700 p-4 sm:p-0">
          <div className="flex overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setActiveTab(AuditStatus.PENDING)}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === AuditStatus.PENDING ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
            >
              待审核
              {pendingCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab(AuditStatus.APPROVED)}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === AuditStatus.APPROVED ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
            >
              已通过
            </button>
            <button
              onClick={() => setActiveTab(AuditStatus.REJECTED)}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === AuditStatus.REJECTED ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
            >
              已拒绝
            </button>
          </div>
          <div className="mt-4 sm:mt-0 sm:pr-4">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
              <input
                type="text"
                placeholder="搜索姓名/手机号..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-full sm:w-64"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-4"><ListSkeleton count={5} /></div>
          ) : filteredApplications.length === 0 ? (
            <Empty
              icon="fact_check"
              title={`暂无${AuditStatusLabel[activeTab]}的申请记录`}
              description="没有找到符合条件的合伙人申请记录"
              className="py-10"
            />
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
                  <th className="p-4 font-medium">申请人</th>
                  <th className="p-4 font-medium">申请等级</th>
                  <th className="p-4 font-medium">申请理由/优势</th>
                  <th className="p-4 font-medium">申请时间</th>
                  <th className="p-4 font-medium">状态</th>
                  <th className="p-4 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 font-medium">
                          {app.user?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{app.user?.name || '未知用户'}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{app.user?.phone || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        app.level === PartnerLevel.SENIOR ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                        app.level === PartnerLevel.MIDDLE ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {PartnerLevelLabel[app.level]}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300 max-w-xs truncate" title={app.reason}>
                      {app.reason || '-'}
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{formatDate(app.applied_at)}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        app.status === AuditStatus.PENDING ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                        app.status === AuditStatus.APPROVED ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                        'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                      }`}>
                        {AuditStatusLabel[app.status]}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {app.status === AuditStatus.PENDING ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(app.id)}
                            className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-500 dark:hover:text-emerald-400 text-sm font-medium hover:underline"
                          >
                            通过
                          </button>
                          <span className="text-slate-300 dark:text-slate-600">|</span>
                          <button
                            onClick={() => handleReject(app.id)}
                            className="text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 text-sm font-medium hover:underline"
                          >
                            拒绝
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => navigate(`/admin/users/${app.user_id}`)}
                          className="text-primary text-sm font-medium hover:underline"
                        >
                          查看资料
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}