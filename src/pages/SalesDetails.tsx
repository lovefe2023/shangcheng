import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { OrderStatus, IncomeStatus } from '../types';

export default function SalesDetails() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'personal' | 'team'>('personal');

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-white dark:bg-background-dark font-display text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center bg-white dark:bg-background-dark p-4 border-b border-slate-100 dark:border-slate-800 justify-between">
        <button onClick={() => navigate(-1)} className="text-slate-900 dark:text-slate-100 flex size-10 shrink-0 items-center justify-start cursor-pointer">
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </button>
        <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-10">个人销售额</h2>
      </div>

      {/* Sales Summary Section */}
      <div className="flex flex-wrap gap-3 p-4">
        <div className="flex min-w-[140px] flex-1 flex-col gap-1 rounded-lg p-5 bg-primary/5 border border-primary/10">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">累计销售额</p>
          <p className="text-primary tracking-tight text-2xl font-bold leading-tight">¥12,850.00</p>
          <div className="flex items-center gap-1 mt-1">
            <span className="material-symbols-outlined text-green-500 text-sm">trending_up</span>
            <p className="text-green-600 text-xs font-bold leading-normal">+15.2%</p>
          </div>
        </div>
        <div className="flex min-w-[140px] flex-1 flex-col gap-1 rounded-lg p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">本月新增</p>
          <p className="text-slate-900 dark:text-slate-100 tracking-tight text-2xl font-bold leading-tight">¥2,340.00</p>
          <div className="flex items-center gap-1 mt-1">
            <span className="material-symbols-outlined text-green-500 text-sm">trending_up</span>
            <p className="text-green-600 text-xs font-bold leading-normal">+8.4%</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4">
        <div className="flex border-b border-slate-100 dark:border-slate-800 justify-between">
          <button 
            onClick={() => setActiveTab('personal')}
            className={`flex flex-col items-center justify-center pb-3 pt-4 flex-1 transition-all ${activeTab === 'personal' ? 'border-b-[3px] border-primary text-primary' : 'border-b-[3px] border-transparent text-slate-400 dark:text-slate-500'}`}
          >
            <p className="text-sm font-bold leading-normal tracking-wide">个人购买</p>
          </button>
          <button 
            onClick={() => setActiveTab('team')}
            className={`flex flex-col items-center justify-center pb-3 pt-4 flex-1 transition-all ${activeTab === 'team' ? 'border-b-[3px] border-primary text-primary' : 'border-b-[3px] border-transparent text-slate-400 dark:text-slate-500'}`}
          >
            <p className="text-sm font-bold leading-normal tracking-wide">团队购买</p>
          </button>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        <h3 className="text-slate-900 dark:text-slate-100 text-base font-bold leading-tight pt-2">最近订单</h3>

        {/* Product Card 1 (Personal) */}
        <div className="flex gap-4 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="size-20 shrink-0 rounded-lg bg-slate-100 overflow-hidden">
            <img className="w-full h-full object-cover" alt="Feitian Moutai" src="https://images.unsplash.com/photo-1563514973413-17686b245a49?w=500&q=80" />
          </div>
          <div className="flex flex-col justify-between flex-1 py-0.5">
            <div>
              <h4 className="text-slate-900 dark:text-slate-100 text-sm font-bold line-clamp-1">飞天茅台 53度 500ml 酱香型白酒</h4>
              <p className="text-slate-400 text-xs mt-1">购买日期: 2023-11-20</p>
            </div>
            <div className="flex justify-between items-end">
              <p className="text-primary text-base font-bold">¥3,198.00</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">{OrderStatus.COMPLETED}</span>
            </div>
          </div>
        </div>

        {/* Product Card 2 (Team) */}
        <div className="flex gap-4 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm border-l-4 border-l-primary/30">
          <div className="size-20 shrink-0 rounded-lg bg-slate-100 overflow-hidden">
            <img className="w-full h-full object-cover" alt="Health Wine" src="https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=500&q=80" />
          </div>
          <div className="flex flex-col justify-between flex-1 py-0.5">
            <div>
              <div className="flex justify-between items-start">
                <h4 className="text-slate-900 dark:text-slate-100 text-sm font-bold line-clamp-1">人参枸杞养生酒 500ml 礼盒装</h4>
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">团队订单</span>
              </div>
              <p className="text-slate-400 text-xs mt-1">购买日期: 2023-11-18</p>
              <p className="text-slate-600 dark:text-slate-400 text-xs mt-0.5 font-medium italic">买家: 李华</p>
            </div>
            <div className="flex justify-between items-end">
              <p className="text-primary text-base font-bold">¥299.00</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">{IncomeStatus.CREDITED}</span>
            </div>
          </div>
        </div>

        {/* Product Card 3 (Personal) */}
        <div className="flex gap-4 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="size-20 shrink-0 rounded-lg bg-slate-100 overflow-hidden">
            <img className="w-full h-full object-cover" alt="Wuliangye" src="https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=500&q=80" />
          </div>
          <div className="flex flex-col justify-between flex-1 py-0.5">
            <div>
              <h4 className="text-slate-900 dark:text-slate-100 text-sm font-bold line-clamp-1">五粮液 普五第八代 52度 500ml</h4>
              <p className="text-slate-400 text-xs mt-1">购买日期: 2023-11-15</p>
            </div>
            <div className="flex justify-between items-end">
              <p className="text-primary text-base font-bold">¥1,099.00</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">{OrderStatus.COMPLETED}</span>
            </div>
          </div>
        </div>

        {/* Product Card 4 (Team) */}
        <div className="flex gap-4 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm border-l-4 border-l-primary/30">
          <div className="size-20 shrink-0 rounded-lg bg-slate-100 overflow-hidden">
            <img className="w-full h-full object-cover" alt="Penfolds" src="https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=500&q=80" />
          </div>
          <div className="flex flex-col justify-between flex-1 py-0.5">
            <div>
              <div className="flex justify-between items-start">
                <h4 className="text-slate-900 dark:text-slate-100 text-sm font-bold line-clamp-1">奔富 BIN389 赤霞珠设拉子红葡萄酒</h4>
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">团队订单</span>
              </div>
              <p className="text-slate-400 text-xs mt-1">购买日期: 2023-11-12</p>
              <p className="text-slate-600 dark:text-slate-400 text-xs mt-0.5 font-medium italic">买家: 王小明</p>
            </div>
            <div className="flex justify-between items-end">
              <p className="text-primary text-base font-bold">¥699.00</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">{IncomeStatus.PENDING}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
