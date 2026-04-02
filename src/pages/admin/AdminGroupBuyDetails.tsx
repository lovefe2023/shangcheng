import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Empty from '../../components/Empty';
import { GroupBuyStatus } from '../../types';

export default function AdminGroupBuyDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Mock data
  const groupRecords = [
    {
      id: 'GB-001',
      leader: { name: '张三', phone: '138****1234', avatar: 'https://ui-avatars.com/api/?name=张三&background=random' },
      members: [
        { name: '李四', phone: '139****5678', avatar: 'https://ui-avatars.com/api/?name=李四&background=random' },
        { name: '王五', phone: '137****9012', avatar: 'https://ui-avatars.com/api/?name=王五&background=random' }
      ],
      status: GroupBuyStatus.SUCCESS, // success, pending, failed
      freeWinner: '李四',
      startTime: '2023-10-24 14:30:00',
      endTime: '2023-10-24 18:45:22'
    },
    {
      id: 'GB-002',
      leader: { name: '赵六', phone: '136****3456', avatar: 'https://ui-avatars.com/api/?name=赵六&background=random' },
      members: [
        { name: '钱七', phone: '135****7890', avatar: 'https://ui-avatars.com/api/?name=钱七&background=random' }
      ],
      status: GroupBuyStatus.PENDING,
      freeWinner: '-',
      startTime: '2023-10-25 09:15:00',
      endTime: '-'
    },
    {
      id: 'GB-003',
      leader: { name: '孙八', phone: '134****1122', avatar: 'https://ui-avatars.com/api/?name=孙八&background=random' },
      members: [
        { name: '周九', phone: '133****3344', avatar: 'https://ui-avatars.com/api/?name=周九&background=random' },
        { name: '吴十', phone: '132****5566', avatar: 'https://ui-avatars.com/api/?name=吴十&background=random' }
      ],
      status: GroupBuyStatus.FAILED,
      freeWinner: '-',
      startTime: '2023-10-20 10:00:00',
      endTime: '2023-10-21 10:00:00'
    }
  ];

  const filteredRecords = groupRecords.filter(record => {
    const matchesSearch = record.leader.name.includes(searchQuery) || 
                          record.leader.phone.includes(searchQuery) ||
                          record.members.some(m => m.name.includes(searchQuery) || m.phone.includes(searchQuery));
    const matchesStatus = statusFilter === '' ? true : record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate('/admin/marketing')}
          className="p-2 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">参团记录</h1>
          <p className="text-sm text-slate-500 mt-1">活动 ID: {id || '1'} | 国窖1573三人团</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4 items-center">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
              <input 
                type="text" 
                placeholder="搜索团长/团员..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-64"
              />
            </div>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm rounded-lg px-3 py-2 outline-none"
            >
              <option value="">所有状态</option>
              <option value={GroupBuyStatus.SUCCESS}>拼团成功</option>
              <option value={GroupBuyStatus.PENDING}>拼团中</option>
              <option value={GroupBuyStatus.FAILED}>拼团失败</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
                <th className="p-4 font-medium">团ID</th>
                <th className="p-4 font-medium">团长</th>
                <th className="p-4 font-medium">团员</th>
                <th className="p-4 font-medium">成团状态</th>
                <th className="p-4 font-medium">免单中奖者</th>
                <th className="p-4 font-medium">开团/成团时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="p-4 text-sm font-medium text-slate-900 dark:text-white">{record.id}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={record.leader.avatar} alt={record.leader.name} className="w-8 h-8 rounded-full" />
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{record.leader.name}</p>
                          <p className="text-xs text-slate-500">{record.leader.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-2">
                        {record.members.map((member, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <img src={member.avatar} alt={member.name} className="w-6 h-6 rounded-full" />
                            <span className="text-sm text-slate-600 dark:text-slate-300">{member.name}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        record.status === GroupBuyStatus.SUCCESS ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                        record.status === GroupBuyStatus.PENDING ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                        'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {record.freeWinner !== '-' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 rounded text-xs font-medium">
                          <span className="material-symbols-outlined text-[14px]">stars</span>
                          {record.freeWinner}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-500">-</span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                      <div>开：{record.startTime}</div>
                      <div>成：{record.endTime}</div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-0">
                    <Empty 
                      icon="group"
                      title="未找到参团记录"
                      description="没有找到符合条件的参团记录，请尝试更改搜索条件"
                      actionText="清除筛选"
                      onAction={() => {
                        setSearchQuery('');
                        setStatusFilter('');
                      }}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-sm">
          <span className="text-slate-500">共 3 条记录，当前 1/1 页</span>
          <div className="flex gap-1">
            <button className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50" disabled>上一页</button>
            <button className="px-3 py-1.5 border border-primary bg-primary text-white rounded">1</button>
            <button className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50" disabled>下一页</button>
          </div>
        </div>
      </div>
    </div>
  );
}
