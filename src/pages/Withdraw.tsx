import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserStatus, WithdrawalStatus } from '../types';

export default function Withdraw() {
  const navigate = useNavigate();
  // 模拟用户状态，实际应从全局状态或 API 获取
  const [userStatus] = useState<UserStatus>(UserStatus.FROZEN);
  const [amount, setAmount] = useState<string>('500.00');

  const availableBalance = 1280.50;
  const feeRate = 0.003; // 0.3% 手续费
  
  const numAmount = parseFloat(amount) || 0;
  const fee = Math.max(0, numAmount * feeRate);
  const actualReceived = Math.max(0, numAmount - fee);

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen flex flex-col">
      {/* 顶部导航 */}
      <nav className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="material-symbols-outlined cursor-pointer text-slate-600 dark:text-slate-300">arrow_back</button>
          <h1 className="text-lg font-bold">提现</h1>
        </div>
        <div className="w-10"></div> {/* 占位符 */}
      </nav>

      {userStatus === UserStatus.FROZEN && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 text-sm flex items-start gap-2 border-b border-red-100 dark:border-red-900/30">
          <span className="material-symbols-outlined text-base mt-0.5">block</span>
          <div className="flex-1">
            <p className="font-bold">账号已冻结</p>
            <p className="text-xs mt-0.5 opacity-90">您的合伙人权限已被冻结，提现功能暂时受限。如有疑问请联系客服。</p>
          </div>
        </div>
      )}

      <main className="max-w-md mx-auto pb-24 flex-1 w-full">
        {/* 余额卡片 */}
        <div className="p-4">
          <div className="relative overflow-hidden bg-primary rounded-xl p-6 text-white shadow-lg shadow-primary/20">
            <div className="relative z-10">
              <p className="text-primary-foreground/80 text-sm font-medium opacity-90">可用余额</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-bold">¥</span>
                <span className="text-4xl font-bold tracking-tight">{availableBalance.toFixed(2)}</span>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs bg-white/10 w-fit px-2 py-1 rounded">
                <span className="material-symbols-outlined text-sm">verified_user</span>
                <span>资金安全存储中</span>
              </div>
            </div>
            {/* 抽象背景图案 */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-48 h-48 bg-white/10 rounded-full blur-3xl" title="abstract white glow pattern"></div>
          </div>
        </div>

        {/* 提现表单 */}
        <div className="px-4 space-y-6">
          {/* 金额输入 */}
          <section>
            <div className="flex justify-between items-end mb-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">提现金额</label>
              <button 
                onClick={() => setAmount(availableBalance.toString())}
                className="text-primary text-xs font-bold uppercase tracking-wider"
              >
                全部提现
              </button>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-xl font-bold text-slate-400">¥</span>
              <input 
                className="w-full pl-10 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-xl font-bold" 
                placeholder="0.00" 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="mt-2 flex justify-between items-center text-xs">
              <p className="text-slate-500">扣除手续费 (0.3%): <span className="font-medium text-slate-700 dark:text-slate-300">¥{fee.toFixed(2)}</span></p>
              <p className="text-slate-500">实际到账金额: <span className="font-bold text-primary">¥{actualReceived.toFixed(2)}</span></p>
            </div>
          </section>

          {/* 方式选择 */}
          <section>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">提现方式</label>
            <div className="space-y-2">
              {/* 银行卡 */}
              <label className="flex items-center p-4 bg-white dark:bg-slate-900 border-2 border-primary rounded-xl cursor-pointer">
                <span className="material-symbols-outlined text-primary mr-3">account_balance</span>
                <div className="flex-1">
                  <p className="text-sm font-bold">银行卡</p>
                  <p className="text-xs text-slate-500">尾号 **** 8829</p>
                </div>
                <input defaultChecked className="text-primary focus:ring-primary h-5 w-5 border-slate-300" name="method" type="radio" />
              </label>

              {/* 微信支付 */}
              <label className="flex items-center p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                <span className="material-symbols-outlined text-green-500 mr-3">payments</span>
                <div className="flex-1">
                  <p className="text-sm font-bold">微信支付</p>
                  <p className="text-xs text-slate-500">即时到账</p>
                </div>
                <input className="text-primary focus:ring-primary h-5 w-5 border-slate-300" name="method" type="radio" />
              </label>

              {/* 支付宝 */}
              <label className="flex items-center p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                <span className="material-symbols-outlined text-blue-400 mr-3">account_balance_wallet</span>
                <div className="flex-1">
                  <p className="text-sm font-bold">支付宝</p>
                  <p className="text-xs text-slate-500">快速处理</p>
                </div>
                <input className="text-primary focus:ring-primary h-5 w-5 border-slate-300" name="method" type="radio" />
              </label>
            </div>
          </section>

          {/* 备注 */}
          <section>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">提现备注 (可选)</label>
            <textarea 
              className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none resize-none text-sm" 
              placeholder="添加备注以供记录" 
              rows={2}
            ></textarea>
          </section>
        </div>

        {/* 提交按钮容器 */}
        <div className="p-4 mt-4">
          <button 
            disabled={userStatus === UserStatus.FROZEN}
            className={`w-full font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform ${
              userStatus === UserStatus.FROZEN 
                ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed shadow-none' 
                : 'bg-primary hover:bg-primary/90 text-white shadow-primary/30 active:scale-[0.98]'
            }`}
          >
            <span className="material-symbols-outlined">send</span>
            提交申请
          </button>
          <p className="text-center text-[10px] text-slate-400 mt-4 px-8 leading-relaxed">
            点击提交即表示您同意我们的服务条款。资金通常在 1-3 个工作日内处理完毕，具体取决于提现方式。
          </p>
        </div>

        {/* 提现记录 */}
        <section className="mt-8 px-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-200">提现记录</h3>
            <button className="text-primary text-xs font-semibold">查看全部</button>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
            {/* 记录 1 */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">schedule</span>
                </div>
                <div>
                  <p className="text-sm font-bold">银行卡提现</p>
                  <p className="text-[10px] text-slate-400">2026年03月14日 • 14:20</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">¥200.00</p>
                <p className="text-[10px] text-orange-500 font-semibold uppercase">{WithdrawalStatus.PENDING}</p>
              </div>
            </div>

            {/* 记录 2 */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">check_circle</span>
                </div>
                <div>
                  <p className="text-sm font-bold">微信支付</p>
                  <p className="text-[10px] text-slate-400">2026年03月10日 • 09:15</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">¥50.00</p>
                <p className="text-[10px] text-green-500 font-semibold uppercase">{WithdrawalStatus.COMPLETED}</p>
              </div>
            </div>

            {/* 记录 3 */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">error</span>
                </div>
                <div>
                  <p className="text-sm font-bold">支付宝提现</p>
                  <p className="text-[10px] text-slate-400">2026年03月05日 • 18:45</p>
                  <p className="text-[10px] text-red-500 mt-0.5">原因: 账号信息不匹配</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-400 line-through">¥1,000.00</p>
                <p className="text-[10px] text-red-500 font-semibold uppercase">{WithdrawalStatus.REJECTED}</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 底部导航 */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 h-16 flex items-center justify-around text-slate-400 z-50">
        <Link to="/" className="flex flex-col items-center hover:text-primary transition-colors">
          <span className="material-symbols-outlined">home</span>
          <span className="text-[10px]">首页</span>
        </Link>
        <Link to="/category" className="flex flex-col items-center hover:text-primary transition-colors">
          <span className="material-symbols-outlined">category</span>
          <span className="text-[10px]">分类</span>
        </Link>
        <Link to="/cart" className="flex flex-col items-center hover:text-primary transition-colors">
          <span className="material-symbols-outlined">shopping_cart</span>
          <span className="text-[10px]">购物车</span>
        </Link>
        <Link to="/partner" className="flex flex-col items-center hover:text-primary transition-colors">
          <span className="material-symbols-outlined">handshake</span>
          <span className="text-[10px]">合伙人</span>
        </Link>
        <Link to="/profile" className="flex flex-col items-center hover:text-primary transition-colors">
          <span className="material-symbols-outlined">person</span>
          <span className="text-[10px]">我的</span>
        </Link>
      </footer>
    </div>
  );
}
