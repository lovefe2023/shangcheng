import { useNavigate } from 'react-router-dom';

export default function ShareGroupBuy() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-3 border-b border-slate-200/60 dark:border-slate-800/60">
        <button onClick={() => navigate('/group-buy')} className="flex items-center justify-center p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-90">
          <span className="material-symbols-outlined text-slate-900 dark:text-slate-100">close</span>
        </button>
        <h1 className="flex-1 text-center text-lg font-bold leading-tight mr-8">邀请好友参团</h1>
      </header>

      <main className="flex-1 overflow-y-auto pb-safe flex flex-col items-center px-6 pt-12">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-green-500 text-4xl">check_circle</span>
        </div>
        
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">支付成功！</h2>
        <p className="text-slate-500 dark:text-slate-400 text-center mb-8">
          您已成功发起拼团，还差 <span className="text-red-500 font-bold">2</span> 人即可享受免单优惠。快去邀请好友吧！
        </p>

        {/* Product Card */}
        <div className="w-full bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 mb-8 flex gap-4">
          <img 
            src="https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=400&auto=format&fit=crop" 
            alt="Product" 
            className="w-24 h-24 object-cover rounded-xl"
          />
          <div className="flex-1 flex flex-col justify-center">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 line-clamp-2 mb-2">飞天茅台 53度 500ml 酱香型白酒</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-red-500 font-bold text-lg">¥2999</span>
              <span className="text-slate-400 text-xs line-through">¥3299</span>
            </div>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="w-full space-y-4">
          <button className="w-full bg-[#07C160] text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-[#07C160]/30 active:scale-[0.98] transition-transform flex items-center justify-center gap-2">
            <span className="material-symbols-outlined">share</span>
            分享给微信好友
          </button>
          
          <button className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 py-4 rounded-xl font-bold text-lg border border-slate-200 dark:border-slate-700 active:scale-[0.98] transition-transform flex items-center justify-center gap-2">
            <span className="material-symbols-outlined">wallpaper</span>
            生成分享海报
          </button>
        </div>
      </main>
    </div>
  );
}
