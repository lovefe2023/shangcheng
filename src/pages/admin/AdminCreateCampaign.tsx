import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminCreateCampaign() {
  const navigate = useNavigate();
  const [campaignType, setCampaignType] = useState('flash-sale');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock save action
    navigate('/admin/marketing');
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate('/admin/marketing')}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">创建营销活动</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">基本信息</h2>
          
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">活动类型</label>
              <select 
                value={campaignType}
                onChange={(e) => setCampaignType(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary dark:focus:border-primary transition-colors"
              >
                <option value="flash-sale">限时秒杀</option>
                <option value="coupon">优惠券</option>
                <option value="new-user">新人专享</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">活动名称</label>
              <input 
                type="text" 
                placeholder="例如：双十一高端白酒特惠" 
                required
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary dark:focus:border-primary transition-colors" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">开始时间</label>
                <input 
                  type="datetime-local" 
                  required
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary dark:focus:border-primary transition-colors" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">结束时间</label>
                <input 
                  type="datetime-local" 
                  required
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary dark:focus:border-primary transition-colors" 
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">活动说明 (可选)</label>
              <textarea 
                rows={3} 
                placeholder="输入活动规则或备注信息..." 
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary dark:focus:border-primary transition-colors resize-none"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Dynamic Config based on Type */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">活动规则配置</h2>
          
          {campaignType === 'flash-sale' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">选择参与商品</label>
                <button type="button" className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                  添加商品
                </button>
                <p className="text-xs text-slate-500 mt-2">已选择 0 件商品</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">统一折扣 (%)</label>
                  <input 
                    type="number" 
                    placeholder="例如：80 表示 8折" 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary dark:focus:border-primary transition-colors" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">每人限购数量</label>
                  <input 
                    type="number" 
                    placeholder="不填则不限购" 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary dark:focus:border-primary transition-colors" 
                  />
                </div>
              </div>
            </div>
          )}

          {campaignType === 'coupon' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">优惠券类型</label>
                  <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary dark:focus:border-primary transition-colors">
                    <option value="满减">满减券</option>
                    <option value="折扣">折扣券</option>
                    <option value="兑换">兑换券</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">发放总量 (张)</label>
                  <input 
                    type="number" 
                    placeholder="例如：10000" 
                    required
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary dark:focus:border-primary transition-colors" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">面值/折扣额度</label>
                  <input 
                    type="number" 
                    placeholder="例如：50 (元) 或 90 (9折)" 
                    required
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary dark:focus:border-primary transition-colors" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">使用门槛 (元)</label>
                  <input 
                    type="number" 
                    placeholder="例如：500 (满500可用)，0为无门槛" 
                    required
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary dark:focus:border-primary transition-colors" 
                  />
                </div>
              </div>
            </div>
          )}

          {campaignType === 'new-user' && (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-lg text-sm mb-4">
                新人专享活动仅对首次注册且未下过单的用户可见。
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">新人礼包内容</label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <input type="checkbox" className="rounded text-primary focus:ring-primary" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">赠送无门槛优惠券 (需先在优惠券管理中创建)</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <input type="checkbox" className="rounded text-primary focus:ring-primary" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">首单免邮</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <input type="checkbox" className="rounded text-primary focus:ring-primary" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">首单双倍积分</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-4">
          <button 
            type="button"
            onClick={() => navigate('/admin/marketing')}
            className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            取消
          </button>
          <button 
            type="submit"
            className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            保存并发布
          </button>
        </div>
      </form>
    </div>
  );
}
