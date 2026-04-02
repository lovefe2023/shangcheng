import { Link } from 'react-router-dom';

export default function PartnerInvite() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 relative">
      <header className="shrink-0 sticky top-0 z-50 flex items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 border-b border-slate-100 dark:border-slate-800">
        <Link to="/profile" className="text-slate-900 dark:text-slate-100 flex size-10 shrink-0 items-center justify-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h2 className="text-lg font-bold flex-1 text-center pr-10">诚邀合伙人</h2>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        <div className="px-4 py-6 @container">
          <div className="flex flex-col overflow-hidden rounded-xl shadow-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
            <div className="w-full bg-center bg-no-repeat aspect-[3/4] bg-cover relative" style={{ backgroundImage: 'url("https://picsum.photos/seed/wine/800/1200")' }}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div className="text-white">
                  <p className="text-sm font-medium opacity-80">您的专属码</p>
                  <p className="text-lg font-bold">INVITE-2024</p>
                </div>
                <div className="size-32 bg-white p-2 rounded-lg shadow-xl">
                  <div className="w-full h-full bg-slate-100 rounded flex items-center justify-center">
                    <span className="material-symbols-outlined text-slate-400 text-6xl">qr_code_2</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex w-full flex-col gap-3 p-4">
              <div className="flex flex-col gap-1">
                <p className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight">邀请好友 加入我们</p>
                <p className="text-slate-500 dark:text-slate-400 text-sm">每成功邀请一位好友，立得 50 元佣金</p>
              </div>
              <div className="flex gap-2 pt-2">
                <button className="flex-1 bg-primary text-white rounded-lg h-11 px-4 font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform">
                  <span className="material-symbols-outlined text-lg">image</span>
                  保存图片海报
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 mb-8">
          <h3 className="text-slate-900 dark:text-slate-100 text-base font-bold mb-4">项目介绍</h3>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-sm">rocket_launch</span>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">丰厚回报</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">提供行业领先的提成方案，每一笔订单都能为您带来可观的收益分红。</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-sm">support_agent</span>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">专属培训</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">提供全方位的运营支持与专业培训课程，助力合伙人快速成长并开展业务。</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-sm">verified_user</span>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">品质保障</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">所有产品经过严格筛选，确保每一位受邀客户都能获得优质的购物体验。</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
