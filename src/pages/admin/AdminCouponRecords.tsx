import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Empty from '../../components/Empty';
import { UserCouponStatus } from '../../types';

export default function AdminCouponRecords() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [showDistributeModal, setShowDistributeModal] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [toastMessage, setToastMessage] = useState('');

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Mock data
  const records = [
    { id: 'REC-001', user: '张三', phone: '138****1234', claimTime: '2023-10-24 14:30', useTime: '2023-10-25 09:15', status: UserCouponStatus.USED, orderId: 'ORD-20231025-001' },
    { id: 'REC-002', user: '李四', phone: '139****5678', claimTime: '2023-10-24 15:20', useTime: '-', status: UserCouponStatus.UNUSED, orderId: '-' },
    { id: 'REC-003', user: '王五', phone: '137****9012', claimTime: '2023-10-23 08:45', useTime: '-', status: UserCouponStatus.EXPIRED, orderId: '-' },
  ];

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.user.includes(searchQuery) || record.phone.includes(searchQuery);
    const matchesStatus = statusFilter === '' ? true : record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin/marketing/coupons')}
            className="p-2 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">发放记录</h1>
            <p className="text-sm text-slate-500 mt-1">优惠券 ID: {id || '1'}</p>
          </div>
        </div>
        <button 
          onClick={() => setShowDistributeModal(true)}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">send</span>
          批量派发
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4 items-center">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
              <input 
                type="text" 
                placeholder="搜索用户昵称/手机号..." 
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
              <option value={UserCouponStatus.UNUSED}>未使用</option>
              <option value={UserCouponStatus.USED}>已使用</option>
              <option value={UserCouponStatus.EXPIRED}>已过期</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
                <th className="p-4 font-medium">记录ID</th>
                <th className="p-4 font-medium">领取用户</th>
                <th className="p-4 font-medium">领取时间</th>
                <th className="p-4 font-medium">状态</th>
                <th className="p-4 font-medium">使用时间</th>
                <th className="p-4 font-medium">关联订单</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="p-4 text-sm font-medium text-slate-900 dark:text-white">{record.id}</td>
                    <td className="p-4">
                      <p className="text-sm text-slate-900 dark:text-white">{record.user}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{record.phone}</p>
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{record.claimTime}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        record.status === UserCouponStatus.UNUSED ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                        record.status === UserCouponStatus.USED ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{record.useTime}</td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                      {record.orderId !== '-' ? (
                        <button onClick={() => navigate(`/admin/orders/${record.orderId}`)} className="text-primary hover:underline">
                          {record.orderId}
                        </button>
                      ) : '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-0">
                    <Empty 
                      icon="history"
                      title="未找到发放记录"
                      description="没有找到符合条件的发放记录，请尝试更改搜索条件"
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

      {/* Distribute Modal */}
      {showDistributeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">批量派发优惠券</h3>
              <button onClick={() => setShowDistributeModal(false)} className="text-slate-400 hover:text-slate-500">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">派发对象</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="target" value="tags" defaultChecked className="text-primary focus:ring-primary" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">按用户标签</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="target" value="upload" className="text-primary focus:ring-primary" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">上传用户ID列表</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">选择标签</label>
                <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors">
                  <option>所有新注册用户</option>
                  <option>所有合伙人</option>
                  <option>V1及以上合伙人</option>
                  <option>近30天未下单用户</option>
                </select>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3">
                <span className="material-symbols-outlined text-blue-500 mt-0.5">info</span>
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300">派发提示</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">预计将派发给 1,250 名用户。派发操作不可撤销，请确认无误后执行。</p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button 
                onClick={() => setShowDistributeModal(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={() => {
                  setShowDistributeModal(false);
                  showToast('优惠券批量派发成功');
                }}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
                确认派发
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in">
          <span className="material-symbols-outlined text-emerald-400">check_circle</span>
          <p>{toastMessage}</p>
        </div>
      )}
    </div>
  );
}
