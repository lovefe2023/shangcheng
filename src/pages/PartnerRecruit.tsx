import { Link } from 'react-router-dom';

export default function PartnerRecruit() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 relative">
      <header className="shrink-0 sticky top-0 z-50 flex items-center bg-white/80 dark:bg-background-dark/80 backdrop-blur-md p-4 justify-between border-b border-slate-100 dark:border-slate-800">
        <Link to="/partner" className="text-slate-900 dark:text-slate-100 flex size-10 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-tight flex-1 text-center">合伙人招募中心</h2>
        <div className="flex size-10 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
          <span className="material-symbols-outlined">share</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-28">
        <section className="px-4 pt-4">
        <div className="relative overflow-hidden rounded-3xl bg-primary aspect-[16/10] flex flex-col items-center justify-center text-center p-6 shadow-xl shadow-primary/20">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-red-600 opacity-90"></div>
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
          <div className="relative z-10 space-y-3">
            <h1 className="text-white text-3xl font-black leading-tight tracking-tight">加入我们 · 共创财富</h1>
            <p className="text-white/90 text-sm font-medium">开启您的合伙人进阶之路，享受最高 25% 佣金回报</p>
            <div className="pt-2">
              <span className="inline-block bg-white/20 backdrop-blur-md text-white text-xs px-3 py-1 rounded-full border border-white/30">已有 52,490+ 位合伙人加入</span>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 mt-8">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary">info</span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">项目介绍</h3>
          </div>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm mb-4">
            合伙人计划是我们为忠实用户打造的共享创业平台。通过分享您喜爱的优质商品，您不仅能为好友提供专属优惠，还能在每一笔成功的交易中获得丰厚的现金奖励。
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-primary/5 dark:bg-primary/10 p-4 rounded-2xl border border-primary/10">
              <div className="text-primary font-bold text-xl mb-1">0门槛</div>
              <div className="text-slate-500 dark:text-slate-400 text-xs">无需押金 快速开通</div>
            </div>
            <div className="bg-primary/5 dark:bg-primary/10 p-4 rounded-2xl border border-primary/10">
              <div className="text-primary font-bold text-xl mb-1">全方位</div>
              <div className="text-slate-500 dark:text-slate-400 text-xs">专业导师 1对1指导</div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 mt-8">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 px-2">合伙人专属权益</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
            <div className="size-12 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 mb-3">
              <span className="material-symbols-outlined text-3xl">payments</span>
            </div>
            <h4 className="font-bold text-sm mb-1">高额佣金</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">每单结算佣金高达25%</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
            <div className="size-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 mb-3">
              <span className="material-symbols-outlined text-3xl">card_giftcard</span>
            </div>
            <h4 className="font-bold text-sm mb-1">专属折扣</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">合伙人尊享全场内部价</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
            <div className="size-12 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 mb-3">
              <span className="material-symbols-outlined text-3xl">school</span>
            </div>
            <h4 className="font-bold text-sm mb-1">运营培训</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">系统化电商运营课程</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
            <div className="size-12 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 mb-3">
              <span className="material-symbols-outlined text-3xl">support_agent</span>
            </div>
            <h4 className="font-bold text-sm mb-1">专属客服</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">7*24小时优先响应支持</p>
          </div>
        </div>
      </section>

      <section className="px-4 mt-8">
        <div className="bg-slate-900 dark:bg-primary/5 rounded-3xl p-6 text-white overflow-hidden relative">
          <div className="absolute -right-10 -top-10 size-40 bg-primary/20 rounded-full blur-3xl"></div>
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
            收益模式说明
          </h3>
          <div className="space-y-6 relative z-10">
            <div className="flex gap-4 items-start">
              <div className="size-8 rounded-full bg-primary flex items-center justify-center shrink-0 font-bold text-sm">1</div>
              <div>
                <h4 className="font-bold mb-1">分享商品</h4>
                <p className="text-slate-400 text-xs">通过社交渠道发送您的专属商品链接或海报</p>
              </div>
            </div>
            <div className="flex gap-4 items-start border-l-2 border-slate-800 dark:border-primary/20 ml-4 pl-4 py-2">
              <div className="size-8 rounded-full bg-primary flex items-center justify-center shrink-0 font-bold text-sm">2</div>
              <div>
                <h4 className="font-bold mb-1">产生购买</h4>
                <p className="text-slate-400 text-xs">好友通过您的链接点击并成功下单支付</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="size-8 rounded-full bg-primary flex items-center justify-center shrink-0 font-bold text-sm">3</div>
              <div>
                <h4 className="font-bold mb-1">获取佣金</h4>
                <p className="text-slate-400 text-xs">订单确认收货后，佣金即刻计入您的账户余额</p>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-800 dark:border-primary/20 text-center">
            <p className="text-xs text-slate-500 italic">" 您的努力，每一分都有价值回报 "</p>
          </div>
        </div>
      </section>

      <section className="px-4 mt-8 mb-8">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 px-2">优秀合伙人证言</h3>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          <div className="min-w-[280px] bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-12 rounded-full overflow-hidden bg-slate-100">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDL8GDAySnpZWJnGmBxs-0eTh3INb72gR8Y59QCcH57oyfXjumcplXXio0JSpQvjLWixrjT5Uu-SByovXX9yvKXqCDi2rRAhq7ilVViMUhZs3956jncMqVhw3EhoSG56OVIBOJg0JD8o0q79uO_siIq7JmazWfV7tMMrfhgXX00yRNavtxopX5C_ERwTI-kfuZ1Nu6hKBvvXl5RtKtnP0UZu2KK26rUmoBFfhltNBIOVNIuYcOVtEd5maZ1xNJb-R-uLP70kID9lg4" alt="User" />
              </div>
              <div>
                <h4 className="font-bold text-sm">王小美</h4>
                <p className="text-[10px] text-slate-500">加入12个月 · 月入 2W+</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed italic">
              "当初只是抱着试试看的心态，没想到平台提供的培训非常到位，现在这份副业收入已经超过了我的本职工作！"
            </p>
          </div>
          <div className="min-w-[280px] bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-12 rounded-full overflow-hidden bg-slate-100">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDd8MtINeQOEnDOvZaiPp2fqX9DX_lvxT7g9s_NaOtGRa-nhjWiUrZCN4yPHlNFm9yd_FIWQaZnLNeV-mrOxUziez11U7mVx8UFSoavvTxLXTlwPpeK1BCTM18KLNJnvhQ9UwbDtxXFA9URwwnHGmyZE1oczXENWNWF6gEmhd3pjr-f_H-NmfKad53MQfhVwZV5fJr3PfXlr3HN_vmywkXvcIUW33qse5oVRm-gZHoQA9kQEV9uNSueba4rWSgDN3HG-HpvsUj-CrM" alt="User" />
              </div>
              <div>
                <h4 className="font-bold text-sm">李大勇</h4>
                <p className="text-[10px] text-slate-500">加入6个月 · 月入 8K+</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed italic">
              "平台的产品质量非常好，分享给身边的朋友完全不丢面子，而且返佣到账非常准时，值得信赖。"
            </p>
          </div>
        </div>
      </section>
      </main>

      <div className="absolute bottom-6 left-4 right-4 z-40">
        <Link to="/partner/recruit/details" className="w-full bg-primary hover:bg-red-800 text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/30 flex items-center justify-center gap-2 transition-transform active:scale-95">
          <span className="material-symbols-outlined">rocket_launch</span>
          立即开启创业之旅
        </Link>
      </div>
    </div>
  );
}
