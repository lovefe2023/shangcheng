import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Empty from '../../components/Empty';
import { PartnerLevel, UserStatus } from '../../types';

export default function AdminPartnerDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [partner, setPartner] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({ 'root': true });

  // Filter states
  const [teamFilter, setTeamFilter] = useState('all');
  const [commissionFilter, setCommissionFilter] = useState('all');

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const networkTree = {
    id: 'root',
    name: '张三',
    level: PartnerLevel.ADVANCED,
    avatar: 'https://ui-avatars.com/api/?name=张三&background=random',
    children: [
      {
        id: 'child1',
        name: '李四',
        level: PartnerLevel.BASIC,
        avatar: 'https://ui-avatars.com/api/?name=李四&background=random',
        children: [
          {
            id: 'child1-1',
            name: '王五',
            level: PartnerLevel.NONE,
            avatar: 'https://ui-avatars.com/api/?name=王五&background=random',
            children: []
          },
          {
            id: 'child1-2',
            name: '钱七',
            level: PartnerLevel.BASIC,
            avatar: 'https://ui-avatars.com/api/?name=钱七&background=random',
            children: []
          }
        ]
      },
      {
        id: 'child2',
        name: '赵六',
        level: PartnerLevel.NONE,
        avatar: 'https://ui-avatars.com/api/?name=赵六&background=random',
        children: []
      }
    ]
  };

  const renderTreeNode = (node: any, isRoot = false) => {
    const isExpanded = expandedNodes[node.id];
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} className={`flex flex-col ${!isRoot ? 'ml-8 mt-4 relative before:content-[""] before:absolute before:left-[-16px] before:top-[-16px] before:bottom-0 before:w-px before:bg-slate-200 dark:before:bg-slate-700' : ''}`}>
        {!isRoot && (
          <div className="absolute left-[-16px] top-[24px] w-4 h-px bg-slate-200 dark:bg-slate-700"></div>
        )}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm w-fit relative z-10">
          {hasChildren && (
            <button 
              onClick={() => toggleNode(node.id)}
              className="w-5 h-5 flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">
                {isExpanded ? 'remove' : 'add'}
              </span>
            </button>
          )}
          {!hasChildren && <div className="w-5"></div>}
          <img src={node.avatar} alt={node.name} className="w-10 h-10 rounded-full" />
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">{node.name}</p>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-medium ${
              node.level.includes('合伙人') ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
              'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
            }`}>
              {node.level}
            </span>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="flex flex-col">
            {node.children.map((child: any) => renderTreeNode(child))}
          </div>
        )}
      </div>
    );
  };

  const teamMembers = [
    { id: 'U99201', name: '王五', phone: '137****1122', level: PartnerLevel.NONE, joinDate: '2023-10-26', type: '直推', contribution: 150.00 },
    { id: 'U99205', name: '赵六', phone: '136****3344', level: PartnerLevel.BASIC, joinDate: '2023-10-25', type: '直推', contribution: 1200.00 },
    { id: 'U99210', name: '钱七', phone: '139****5566', level: PartnerLevel.NONE, joinDate: '2023-10-24', type: '间推', contribution: 30.00 },
    { id: 'U99188', name: '孙八', phone: '135****7788', level: PartnerLevel.INTERMEDIATE, joinDate: '2023-10-20', type: '间推', contribution: 450.00 },
  ];

  const commissions = [
    { id: 'C001', orderId: 'ORD-20231026-001', buyerName: '王五', buyerPhone: '137****1122', orderAmount: 299.00, type: '直推佣金', rate: '10%', amount: 29.90, date: '2023-10-26 10:30:00' },
    { id: 'C002', orderId: 'ORD-20231025-089', buyerName: '赵六', buyerPhone: '136****3344', orderAmount: 599.00, type: '直推佣金', rate: '10%', amount: 59.90, date: '2023-10-25 15:45:00' },
    { id: 'C003', orderId: 'ORD-20231024-120', buyerName: '孙八', buyerPhone: '135****7788', orderAmount: 199.00, type: '间推佣金', rate: '5%', amount: 9.95, date: '2023-10-24 09:15:00' },
    { id: 'C004', orderId: 'ORD-20231023-045', buyerName: '钱七', buyerPhone: '139****5566', orderAmount: 899.00, type: '间推佣金', rate: '5%', amount: 44.95, date: '2023-10-23 18:20:00' },
  ];

  const filteredTeamMembers = teamMembers.filter(member => {
    if (teamFilter === 'all') return true;
    if (teamFilter === 'direct') return member.type === '直推';
    if (teamFilter === 'indirect') return member.type === '间推';
    return true;
  });

  const filteredCommissions = commissions.filter(comm => {
    if (commissionFilter === 'all') return true;
    if (commissionFilter === 'direct') return comm.type === '直推佣金';
    if (commissionFilter === 'team') return comm.type === '间推佣金';
    return true;
  });

  useEffect(() => {
    // Mock API call
    setPartner({
      id: id || 'P88291',
      name: '张三',
      phone: '13812345678',
      level: PartnerLevel.ADVANCED,
      status: UserStatus.ACTIVE,
      teamSize: 128,
      directInvites: 45,
      indirectInvites: 83,
      totalCommission: 45800.00,
      currentBalance: 1280.50,
      withdrawnAmount: 44519.50,
      joinDate: '2023-01-15 10:30:00',
      upgradeDate: '2023-06-20 14:15:00',
      referrer: '平台直邀',
    });
  }, [id]);

  if (!partner) return <div className="p-8 text-center text-slate-500">加载中...</div>;

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
            {partner.status}
          </span>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate(`/admin/partners/edit/${partner.id}`)}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            编辑合伙人
          </button>
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
          <p className="text-xl font-bold text-slate-900 dark:text-white">{partner.level}</p>
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
              <img src={`https://ui-avatars.com/api/?name=${partner.name}&background=random`} alt={partner.name} className="w-16 h-16 rounded-full" />
              <div>
                <p className="text-lg font-medium text-slate-900 dark:text-white">{partner.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">ID: {partner.id}</p>
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">合伙人等级</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                  partner.level === '高级合伙人' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                  partner.level === '中级合伙人' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                  'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                }`}>
                  {partner.level}
                </span>
              </p>
            </div>
            
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">手机号码</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{partner.phone}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">推荐人</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{partner.referrer}</p>
            </div>
            
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">加入合伙人时间</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{partner.joinDate}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">最近升级时间</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{partner.upgradeDate}</p>
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
          </div>
        </div>
      )}

      {/* Tab Content: Network Graph */}
      {activeTab === 'network' && (
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 overflow-x-auto">
          <div className="min-w-max">
            {renderTreeNode(networkTree, true)}
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
              <option value="all">全部成员</option>
              <option value="direct">直推成员 (45)</option>
              <option value="indirect">间推成员 (83)</option>
            </select>
          </div>
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
                {filteredTeamMembers.length > 0 ? (
                  filteredTeamMembers.map(member => (
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
                          member.level.includes('合伙人') ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                          'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                        }`}>
                          {member.level}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${member.type === '直推' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>
                          {member.type}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{member.joinDate}</td>
                      <td className="p-4 text-sm font-medium text-slate-900 dark:text-white">¥{member.contribution.toFixed(2)}</td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => navigate(`/admin/partners/team-member/${member.id}`)}
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
        </div>
      )}

      {/* Tab Content: Commission */}
      {activeTab === 'commission' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">佣金明细</h2>
            <select 
              value={commissionFilter}
              onChange={(e) => setCommissionFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm rounded-lg px-3 py-2 outline-none"
            >
              <option value="all">全部类型</option>
              <option value="direct">直推佣金</option>
              <option value="team">团队分红</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
                  <th className="p-4 font-medium">关联订单号</th>
                  <th className="p-4 font-medium">购买用户</th>
                  <th className="p-4 font-medium">订单金额</th>
                  <th className="p-4 font-medium">佣金类型</th>
                  <th className="p-4 font-medium">佣金比例</th>
                  <th className="p-4 font-medium">佣金收益</th>
                  <th className="p-4 font-medium">产生时间</th>
                  <th className="p-4 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredCommissions.length > 0 ? (
                  filteredCommissions.map(commission => (
                    <tr key={commission.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="p-4 text-sm font-medium text-slate-900 dark:text-white">{commission.orderId}</td>
                      <td className="p-4">
                        <div className="text-sm font-medium text-slate-900 dark:text-white">{commission.buyerName}</div>
                        <div className="text-xs text-slate-500">{commission.buyerPhone}</div>
                      </td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-300">¥{commission.orderAmount.toFixed(2)}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          commission.type === '直推佣金' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                          'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400'
                        }`}>
                          {commission.type}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{commission.rate}</td>
                      <td className="p-4 text-sm font-bold text-emerald-600 dark:text-emerald-500">+¥{commission.amount.toFixed(2)}</td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{commission.date}</td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => navigate(`/admin/orders/${commission.orderId}`)}
                          className="text-primary text-sm font-medium hover:underline"
                        >
                          查看订单
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-0">
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
        </div>
      )}
    </div>
  );
}
