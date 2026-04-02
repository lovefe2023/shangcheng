import { useNavigate } from 'react-router-dom';
import { UserStatus } from '../../types';

export default function AdminAddPartner() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate('/admin/partners')}
          className="p-2 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">添加合伙人</h1>
      </div>

      {/* Form Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">基本信息</h2>
          <p className="text-sm text-slate-500 mt-1">请填写新合伙人的基本资料和等级信息</p>
        </div>

        <form className="p-6 space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Phone Number */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                手机号码 <span className="text-red-500">*</span>
              </label>
              <input 
                type="tel" 
                placeholder="请输入11位手机号码"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white"
              />
              <p className="text-xs text-slate-500">如果该手机号已注册为普通用户，将直接升级为合伙人</p>
            </div>

            {/* Real Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                真实姓名 <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                placeholder="请输入真实姓名"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white"
              />
            </div>

            {/* Partner Level */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                合伙人等级 <span className="text-red-500">*</span>
              </label>
              <select className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white appearance-none">
                <option value="junior">初级合伙人</option>
                <option value="middle">中级合伙人</option>
                <option value="senior">高级合伙人</option>
              </select>
            </div>

            {/* ID Card */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                身份证号
              </label>
              <input 
                type="text" 
                placeholder="选填，用于实名认证"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white"
              />
            </div>

            {/* Referrer */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                推荐人手机号/ID
              </label>
              <input 
                type="text" 
                placeholder="选填，绑定上级合伙人"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white"
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                账号状态
              </label>
              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="status" value={UserStatus.ACTIVE} defaultChecked className="text-primary focus:ring-primary" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">{UserStatus.ACTIVE}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="status" value={UserStatus.FROZEN} className="text-primary focus:ring-primary" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">{UserStatus.FROZEN}</span>
                </label>
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              备注信息
            </label>
            <textarea 
              rows={4}
              placeholder="选填，内部备注信息"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white resize-none"
            ></textarea>
          </div>

          {/* Actions */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-4">
            <button 
              type="button"
              onClick={() => navigate('/admin/partners')}
              className="px-6 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              取消
            </button>
            <button 
              type="submit"
              onClick={() => {
                // Mock save action
                navigate('/admin/partners');
              }}
              className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
            >
              保存并添加
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
