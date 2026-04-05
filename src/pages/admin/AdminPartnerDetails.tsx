import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Empty from '../../components/Empty';
import { DetailSkeleton } from '../../components/Skeleton';
import { PartnerLevel, PartnerLevelLabel, UserStatus, UserStatusLabel } from '../../types';
import { adminApi } from '../../lib/api';

interface PartnerDetail {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  partner_level: PartnerLevel;
  status: UserStatus;
  referrer?: { id: string; name: string; phone: string; level: string } | null;
  teamSize: number;
  directInvites: number;
  indirectInvites: number;
  totalCommission: number;
  currentBalance: number;
  withdrawnAmount: number;
  joinDate: string;
  upgradeDate?: string | null;
  personal_sales?: number;
  team_sales?: number;
}

interface TeamMember {
  id: string;
  name: string;
  phone: string;
  partner_level: string;
  created_at: string;
  type: string;
  contribution: number;
}

interface IncomeRecord {
  id: string;
  order_id?: string;
  type: string;
  amount: number;
  rate?: string;
  status: string;
  created_at: string;
  orderAmount?: number;
  buyerName?: string;
  buyerPhone?: string;
}

export default function AdminPartnerDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [partner, setPartner] = useState<PartnerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({ 'root': true });

  // Team members
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamFilter, setTeamFilter] = useState('all');
  const [teamTotal, setTeamTotal] = useState(0);

  // Income records
  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>([]);
  const [incomeLoading, setIncomeLoading] = useState(false);
  const [incomeFilter, setIncomeFilter] = useState('all');
  const [incomeTotal, setIncomeTotal] = useState(0);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  // 获取合伙人详情
  useEffect(() => {
    const fetchPartner = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);

      try {
        const res = await adminApi.getPartner(id);
        if (res.success && res.data) {
          setPartner(res.data);
        } else {
          setError(res.error?.message || '获取合伙人详情失败');
        }
      } catch (err) {
        setError('网络错误，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    fetchPartner();
  }, [id]);

  // 获取团队成员
  useEffect(() => {
    const fetchTeam = async () => {
      if (!id || activeTab !== 'team') return;
      setTeamLoading(true);

      try {
        const typeParam = teamFilter === 'all' ? undefined : teamFilter;
        const res = await adminApi.getPartnerTeam(id, { type: typeParam, pageSize: 50 });
        if (res.success && res.data) {
          setTeamMembers(res.data.list || []);
          setTeamTotal(res.data.total || 0);
        }
      } catch (err) {
        console.error('获取团队成员失败:', err);
      } finally {
        setTeamLoading(false);
      }
    };

    fetchTeam();
  }, [id, activeTab, teamFilter]);

  // 获取佣金明细
  useEffect(() => {
    const fetchIncome = async () => {
      if (!id || activeTab !== 'commission') return;
      setIncomeLoading(true);

      try {
        const typeParam = incomeFilter === 'all' ? undefined :
          incomeFilter === 'direct' ? 'direct_commission' : 'indirect_commission';
        const res = await adminApi.getPartnerIncome(id, { type: typeParam, pageSize: 50 });
        if (res.success && res.data) {
          setIncomeRecords(res.data.list || []);
          setIncomeTotal(res.data.total || 0);
        }
      } catch (err) {
        console.error('获取佣金明细失败:', err);
      } finally {
        setIncomeLoading(false);
      }
    };

    fetchIncome();
  }, [id, activeTab, incomeFilter]);

  // 渲染关系树节点
  const renderTreeNode = (node: TeamMember, isRoot = false) => {
    const nodeId = node.id;
    const isExpanded = expandedNodes[nodeId];
    const children = teamMembers.filter(m => m.type === '间推' && teamMembers.some(t => t.id === nodeId && t.type === '直推'));

    return (
      <div key={nodeId} className={`flex flex-col ${!isRoot ? 'ml-8 mt-4 relative before:content-[""] before:absolute before:left-[-16px] before:top-[-16px] before:bottom-0 before:w-px before:bg-slate-200 dark:before:bg-slate-700' : ''}`}>
        {!isRoot && (
          <div className="absolute left-[-16px] top-[24px] w-4 h-px bg-slate-200 dark:bg-slate-700"></div>
        )}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm w-fit relative z-10">
          {children.length > 0 && (
            <button
              onClick={() => toggleNode(nodeId)}
              className="w-5 h-5 flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">
                {isExpanded ? 'remove' : 'add'}
              </span>
            </button>
          )}
          {children.length === 0 && <div className="w-5"></div>}
          <img src={`https://ui-avatars.com/api/?name=${node.name}&background=random`} alt={node.name} className="w-10 h-10 rounded-full" />
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">{node.name}</p>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-medium ${
              node.partner_level !== 'none' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
              'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
            }`}>
              {PartnerLevelLabel[node.partner_level as PartnerLevel] || node.partner_level}
            </span>
          </div>
        </div>
        {children.length > 0 && isExpanded && (
          <div className="flex flex-col">
            {children.map(child => renderTreeNode(child))}
          </div>
        )}
      </div>
    );
  };

  if (loading) return <DetailSkeleton />;
  if (error) return (
    <div className="p-8 text-center">
      <div className="text-red-500 mb-4">{error}</div>
      <button
        onClick={() => navigate('/admin/partners')}
        className="px-4 py-2 bg-primary text-white rounded-lg"
      >
        返回列表
      </button>
    </div>
  );
  if (!partner) return <div className="p-8 text-center text-slate-500">合伙人不存在</div>;

  const levelLabel = PartnerLevelLabel[partner.partner_level] || partner.partner_level;

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/partners')}
            className="p-2 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">合伙人详情</h1>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
            partner.status === UserStatus.ACTIVE ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
            'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
          }`}>
            {UserStatusLabel[partner.status]}
          </span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/admin/users/${partner.id}`)}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            查看用户资料
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-500 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">当前等级</p>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{levelLabel}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-500 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">payments</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">累计佣金</p>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">¥{partner.totalCommission.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-500 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">当前余额</p>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">¥{partner.currentBalance.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-500 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">groups</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">团队总人数</p>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{partner.teamSize} 人</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('basic')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'basic' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
        >
          合伙人信息
        </button>
        <button
          onClick={() => setActiveTab('network')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'network' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
        >
          关系图谱
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'team' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
        >
          团队成员 ({partner.teamSize})
        </button>
        <button
          onClick={() => setActiveTab('commission')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'commission' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
        >
          佣金明细
        </button>
      </div>

      {/* Tab Content: Basic Info */}
      {activeTab === 'basic' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">合伙人档案</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
            <div className="flex items-center gap-4">
              <img src={partner.avatar || `https://ui-avatars.com/api/?name=${partner.name}&background=random`} alt={partner.name} className="w-16 h-16 rounded-full" />
              <div>
                <p className="text-lg font-medium text-slate-900 dark:text-white">{partner.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">ID: {partner.id}</p>
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">合伙人等级</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                  partner.partner_level === PartnerLevel.SENIOR ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                  partner.partner_level === PartnerLevel.MIDDLE ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                  'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                }`}>
                  {levelLabel}
                </span>
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">手机号码</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{partner.phone}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">推荐人</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {partner.referrer ? `${partner.referrer.name} (${partner.referrer.phone})` : '平台直邀'}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">加入合伙人时间</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{partner.joinDate}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">最近升级时间</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{partner.upgradeDate || '暂无升级记录'}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">直推人数</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{partner.directInvites} 人</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">间推人数</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{partner.indirectInvites} 人</p>
            </div>

            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">已提现金额</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">¥{partner.withdrawnAmount.toFixed(2)}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">个人销售额</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">¥{(partner.personal_sales || 0).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">团队销售额</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">¥{(partner.team_sales || 0).toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Network Graph */}
      {activeTab === 'network' && (
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 overflow-x-auto">
          <div className="min-w-max">
            {teamLoading ? (
              <div className="text-center text-slate-500 py-8">加载中...</div>
            ) : teamMembers.filter(m => m.type === '直推').length > 0 ? (
              teamMembers.filter(m => m.type === '直推').map(member => renderTreeNode(member, member.id === partner.id))
            ) : (
              <Empty
                icon="account_tree"
                title="暂无团队关系"
                description="该合伙人暂无团队成员"
              />
            )}
          </div>
        </div>
      )}

      {/* Tab Content: Team */}
      {activeTab === 'team' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">团队成员列表</h2>
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm rounded-lg px-3 py-2 outline-none"
            >
              <option value="all">全部成员 ({teamTotal})</option>
              <option value="direct">直推成员 ({partner.directInvites})</option>
              <option value="indirect">间推成员 ({partner.indirectInvites})</option>
            </select>
          </div>
          {teamLoading ? (
            <div className="p-8 text-center text-slate-500">加载中...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
                    <th className="p-4 font-medium">成员信息</th>
                    <th className="p-4 font-medium">等级</th>
                    <th className="p-4 font-medium">关系类型</th>
                    <th className="p-4 font-medium">加入时间</th>
                    <th className="p-4 font-medium">贡献佣金</th>
                    <th className="p-4 font-medium text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {teamMembers.length > 0 ? (
                    teamMembers.map(member => (
                      <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img src={`https://ui-avatars.com/api/?name=${member.name}&background=random`} alt={member.name} className="w-10 h-10 rounded-full" />
                            <div>
                              <p className="text-sm font-medium text-slate-900 dark:text-white">{member.name}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{member.phone} · {member.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            member.partner_level !== 'none' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                            'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                          }`}>
                            {PartnerLevelLabel[member.partner_level as PartnerLevel] || '无'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${member.type === '直推' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>
                            {member.type}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{member.created_at}</td>
                        <td className="p-4 text-sm font-medium text-slate-900 dark:text-white">¥{member.contribution.toFixed(2)}</td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => navigate(`/admin/users/${member.id}`)}
                            className="text-primary text-sm font-medium hover:underline"
                          >
                            查看详情
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-0">
                        <Empty
                          icon="group"
                          title="暂无团队成员"
                          description="没有找到符合条件的团队成员"
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Commission */}
      {activeTab === 'commission' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">佣金明细</h2>
            <select
              value={incomeFilter}
              onChange={(e) => setIncomeFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm rounded-lg px-3 py-2 outline-none"
            >
              <option value="all">全部类型 ({incomeTotal})</option>
              <option value="direct">直推佣金</option>
              <option value="team">团队分红</option>
            </select>
          </div>
          {incomeLoading ? (
            <div className="p-8 text-center text-slate-500">加载中...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
                    <th className="p-4 font-medium">关联订单号</th>
                    <th className="p-4 font-medium">购买用户</th>
                    <th className="p-4 font-medium">订单金额</th>
                    <th className="p-4 font-medium">佣金类型</th>
                    <th className="p-4 font-medium">佣金收益</th>
                    <th className="p-4 font-medium">产生时间</th>
                    <th className="p-4 font-medium text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {incomeRecords.length > 0 ? (
                    incomeRecords.map(record => (
                      <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                        <td className="p-4 text-sm font-medium text-slate-900 dark:text-white">{record.order_id || '-'}</td>
                        <td className="p-4">
                          <div className="text-sm font-medium text-slate-900 dark:text-white">{record.buyerName || '未知'}</div>
                          <div className="text-xs text-slate-500">{record.buyerPhone || ''}</div>
                        </td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">¥{(record.orderAmount || 0).toFixed(2)}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            record.type === 'direct_commission' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                            'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400'
                          }`}>
                            {record.type === 'direct_commission' ? '直推佣金' : '团队分红'}
                          </span>
                        </td>
                        <td className="p-4 text-sm font-bold text-emerald-600 dark:text-emerald-500">+¥{record.amount.toFixed(2)}</td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{record.created_at}</td>
                        <td className="p-4 text-right">
                          {record.order_id && (
                            <button
                              onClick={() => navigate(`/admin/orders/${record.order_id}`)}
                              className="text-primary text-sm font-medium hover:underline"
                            >
                              查看订单
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-0">
                        <Empty
                          icon="account_balance_wallet"
                          title="暂无佣金明细"
                          description="没有找到符合条件的佣金记录"
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}