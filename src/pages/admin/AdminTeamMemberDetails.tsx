import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { UserStatus } from '../../types';

export default function AdminTeamMemberDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [member, setMember] = useState<any>(null);

  useEffect(() => {
    // Mock API call
    setMember({
      id: id || 'U99201',
      name: '王五',
      phone: '13711223344',
      level: '普通用户',
      status: UserStatus.ACTIVE,
      joinDate: '2023-10-26 09:30:00',
      type: '直推',
      referrer: '张三 (P88291)',
      contribution: 150.00,
      orderCount: 5,
      lastActive: '2023-10-27 14:20:00'
    });
  }, [id]);

  if (!member) return <div className="p-8 text-center text-slate-500">加载中...</div>;

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">团队成员详情</h1>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
            member.status === UserStatus.ACTIVE ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
            'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
          }`}>
            {member.status}
          </span>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate(`/admin/users/${member.id}`)}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            查看完整用户资料
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mb-6">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">成员信息</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
          <div className="flex items-center gap-4">
            <img src={`https://ui-avatars.com/api/?name=${member.name}&background=random`} alt={member.name} className="w-16 h-16 rounded-full" />
            <div>
              <p className="text-lg font-medium text-slate-900 dark:text-white">{member.name}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">ID: {member.id}</p>
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">成员等级</p>
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                member.level.includes('合伙人') ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
              }`}>
                {member.level}
              </span>
            </p>
          </div>
          
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">手机号码</p>
            <p className="text-sm font-medium text-slate-900 dark:text-white">{member.phone}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">归属合伙人</p>
            <p className="text-sm font-medium text-slate-900 dark:text-white">{member.referrer}</p>
          </div>
          
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">关系类型</p>
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${member.type === '直推' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>
                {member.type}
              </span>
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">加入时间</p>
            <p className="text-sm font-medium text-slate-900 dark:text-white">{member.joinDate}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mb-6">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">关系链溯源</h2>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-4 overflow-x-auto pb-2">
            {/* Top Partner */}
            <div className="flex flex-col items-center min-w-[100px]">
              <img src="https://ui-avatars.com/api/?name=平台&background=random" alt="平台" className="w-12 h-12 rounded-full mb-2" />
              <span className="text-sm font-medium text-slate-900 dark:text-white">平台</span>
              <span className="text-xs text-slate-500">直营</span>
            </div>
            
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700 min-w-[40px] relative">
              <span className="material-symbols-outlined absolute right-[-8px] top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 text-[16px]">chevron_right</span>
            </div>

            {/* Referrer */}
            <div className="flex flex-col items-center min-w-[100px]">
              <img src="https://ui-avatars.com/api/?name=张三&background=random" alt="张三" className="w-12 h-12 rounded-full mb-2" />
              <span className="text-sm font-medium text-slate-900 dark:text-white">张三</span>
              <span className="text-xs text-amber-600 bg-amber-100 dark:bg-amber-500/20 px-2 py-0.5 rounded mt-1">高级合伙人</span>
            </div>

            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700 min-w-[40px] relative">
              <span className="material-symbols-outlined absolute right-[-8px] top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 text-[16px]">chevron_right</span>
            </div>

            {/* Current Member */}
            <div className="flex flex-col items-center min-w-[100px] relative">
              <div className="absolute -top-2 -right-2 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full">当前</div>
              <img src={`https://ui-avatars.com/api/?name=${member.name}&background=random`} alt={member.name} className="w-12 h-12 rounded-full mb-2 ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-800" />
              <span className="text-sm font-medium text-slate-900 dark:text-white">{member.name}</span>
              <span className="text-xs text-slate-600 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded mt-1">{member.level}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-500 flex items-center justify-center">
            <span className="material-symbols-outlined">shopping_bag</span>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">累计有效订单</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{member.orderCount} 笔</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-500 flex items-center justify-center">
            <span className="material-symbols-outlined">payments</span>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">为合伙人贡献佣金</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">¥{member.contribution.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
