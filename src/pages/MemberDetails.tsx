import { Link, useParams, useNavigate } from 'react-router-dom';

export default function MemberDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-display">
      {/* Top Header */}
      <header className="sticky top-0 z-50 flex items-center bg-white dark:bg-slate-900 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
        <button onClick={() => navigate(-1)} className="text-slate-900 dark:text-slate-100 flex items-center justify-center p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </button>
        <h1 className="flex-1 text-center text-lg font-bold tracking-tight mr-8">成员详情</h1>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        {/* Member Profile Section */}
        <section className="bg-white dark:bg-slate-900 px-4 py-8 mb-3">
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <div 
                className="w-24 h-24 rounded-full border-4 border-primary/10 overflow-hidden bg-slate-100" 
                style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuC1BQFOTOWlINCitMTHNoGQUeNmodikDzJWkAuVUQYb8On1B2NdW8wRj6FczQK6EX_p7U9FPebtUrvioDgCID9SRChZE3bFUlbzE7IDZtAr8B4W_iWxOXHd2fu_Ii-HXCj5jaVBAskqdDZAvFdtFdHvNdBz_TyUcmV0AszDIkvbjnHhTOUoSQ1WXL1RwMSr9IlDCsAP0S-U46iBZFBgfkN53zwfdQKdwY27CgRdRXkAHyU9ZaEiBHA3KyWwsYo7ai0agYLpegNxTJ8')", backgroundSize: 'cover' }}
              >
              </div>
              <div className="absolute bottom-0 right-0 bg-primary text-white text-[10px] px-2 py-0.5 rounded-full border-2 border-white dark:border-slate-900 font-bold uppercase">
                PRO
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-1">李华</h2>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                  金牌合伙人
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">注册日期：2023-10-15</p>
            </div>
          </div>
        </section>

        {/* Statistics Grid */}
        <section className="px-4 mb-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 col-span-2 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">总贡献值</p>
                <span className="material-symbols-outlined text-primary/40">payments</span>
              </div>
              <p className="text-2xl font-bold text-primary">¥12,800.00</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">团队规模</p>
              <p className="text-xl font-bold">15人</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">直营销售</p>
              <p className="text-xl font-bold">¥5,420</p>
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <section className="px-4 mb-6 flex gap-3">
          <button className="flex-1 bg-primary text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-transform">
            <span className="material-symbols-outlined text-xl">call</span>
            立即联系
          </button>
          <button className="flex-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-3 rounded-xl font-bold border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2 active:scale-95 transition-transform">
            <span className="material-symbols-outlined text-xl">chat</span>
            发送消息
          </button>
        </section>

        {/* Recent Activity */}
        <section className="px-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">近期动态</h3>
            <button className="text-primary text-sm font-medium">查看全部</button>
          </div>
          <div className="space-y-3">
            {/* Activity Item 1 */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                <span className="material-symbols-outlined">shopping_bag</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">成功销售一笔订单</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">订单号：SO-2938491</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-green-600">+¥899.00</p>
                <p className="text-[10px] text-slate-400">2小时前</p>
              </div>
            </div>

            {/* Activity Item 2 */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                <span className="material-symbols-outlined">person_add</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">邀请新成员入队</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">成员：王五 (普通合伙人)</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400">昨天 14:20</p>
              </div>
            </div>

            {/* Activity Item 3 */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3 opacity-80">
              <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600">
                <span className="material-symbols-outlined">star</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">等级晋升</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">从 银牌 晋升为 金牌</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400">2023-11-01</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
