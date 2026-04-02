import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { UserStatus, PartnerLevel } from '../../types';

export default function AdminEditUser() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Mock API call
    setUser({
      id: id || 'U88291',
      name: '张三',
      phone: '13812345678',
      role: PartnerLevel.SENIOR,
      status: UserStatus.ACTIVE,
    });
  }, [id]);

  const operationLogs = [
    { id: 1, date: '2023-10-24 10:30:00', operator: 'Admin01', action: '调整合伙人等级', detail: '从 初级合伙人 调整为 高级合伙人' },
    { id: 2, date: '2023-08-15 14:20:00', operator: 'Admin02', action: '修改用户信息', detail: '修改了手机号码' },
    { id: 3, date: '2023-01-15 10:30:00', operator: 'System', action: '用户注册', detail: '新用户注册' },
  ];

  if (!user) return <div className="p-8 text-center text-slate-500">加载中...</div>;

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate('/admin/users')}
          className="p-2 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">编辑用户</h1>
      </div>

      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">基本信息</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  用户名 <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  defaultValue={user.name}
                  placeholder="请输入用户名"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  手机号码 <span className="text-red-500">*</span>
                </label>
                <input 
                  type="tel" 
                  defaultValue={user.phone}
                  placeholder="请输入手机号码"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  身份角色
                </label>
                <select defaultValue={user.role} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white appearance-none">
                  <option value={PartnerLevel.NONE}>普通用户</option>
                  <option value={PartnerLevel.JUNIOR}>初级合伙人</option>
                  <option value={PartnerLevel.MIDDLE}>中级合伙人</option>
                  <option value={PartnerLevel.SENIOR}>高级合伙人</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  状态
                </label>
                <select defaultValue={user.status} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white appearance-none">
                  <option value={UserStatus.ACTIVE}>正常</option>
                  <option value={UserStatus.FROZEN}>冻结 (无法登录、无法进行分销操作)</option>
                </select>
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  重置密码
                </label>
                <input 
                  type="password" 
                  placeholder="如需重置密码请输入，不修改请留空"
                  className="w-full md:w-1/2 px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Operation Logs */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">操作日志</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
                  <th className="p-4 font-medium">操作时间</th>
                  <th className="p-4 font-medium">操作人</th>
                  <th className="p-4 font-medium">操作类型</th>
                  <th className="p-4 font-medium">操作详情</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {operationLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{log.date}</td>
                    <td className="p-4 text-sm font-medium text-slate-900 dark:text-white">{log.operator}</td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        log.action.includes('合伙人') ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{log.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 pt-4">
          <button 
            type="button"
            onClick={() => navigate('/admin/users')}
            className="px-6 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            取消
          </button>
          <button 
            type="submit"
            onClick={() => navigate('/admin/users')}
            className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            保存修改
          </button>
        </div>
      </form>
    </div>
  );
}
