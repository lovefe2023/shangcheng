import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { UserStatus } from '../../types';

export default function AdminEditPartnerLevel() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [partner, setPartner] = useState<any>(null);

  useEffect(() => {
    // Mock API call
    setPartner({
      id: id || 'P88291',
      name: '张三',
      phone: '13812345678',
      level: 'partner_senior',
      status: UserStatus.ACTIVE,
    });
  }, [id]);

  if (!partner) return <div className="p-8 text-center text-slate-500">加载中...</div>;

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate('/admin/partners')}
          className="p-2 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">调整合伙人等级</h1>
      </div>

      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-4">
              <img src={`https://ui-avatars.com/api/?name=${partner.name}&background=random`} alt={partner.name} className="w-12 h-12 rounded-full" />
              <div>
                <p className="text-lg font-medium text-slate-900 dark:text-white">{partner.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{partner.phone} · ID: {partner.id}</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                当前等级
              </label>
              <input 
                type="text" 
                disabled
                value={partner.level === 'partner_senior' ? '高级合伙人' : partner.level === 'partner_middle' ? '中级合伙人' : '初级合伙人'}
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                调整为 <span className="text-red-500">*</span>
              </label>
              <select defaultValue={partner.level} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white appearance-none">
                <option value="partner_junior">初级合伙人</option>
                <option value="partner_middle">中级合伙人</option>
                <option value="partner_senior">高级合伙人</option>
                <option value="normal">取消合伙人资格 (降为普通用户)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                调整原因/备注
              </label>
              <textarea 
                rows={4}
                placeholder="请输入调整等级的原因（选填）"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white resize-none"
              ></textarea>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 pt-4">
          <button 
            type="button"
            onClick={() => navigate('/admin/partners')}
            className="px-6 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            取消
          </button>
          <button 
            type="submit"
            onClick={() => navigate('/admin/partners')}
            className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            确认调整
          </button>
        </div>
      </form>
    </div>
  );
}
