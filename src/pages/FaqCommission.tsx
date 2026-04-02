import { Link } from 'react-router-dom';

export default function FaqCommission() {
  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 pb-24">
      <div className="flex items-center bg-white dark:bg-slate-900 p-4 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800 justify-between">
        <div className="text-slate-900 dark:text-slate-100 flex size-10 shrink-0 items-center justify-start">
          <Link to="/partner" className="material-symbols-outlined cursor-pointer">arrow_back</Link>
        </div>
        <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-tight flex-1 text-center">佣金结算与提现</h2>
        <div className="flex w-10 items-center justify-end"></div>
      </div>

      <div className="p-4 space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">payments</span>
            佣金如何结算？
          </h3>
          <div className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed space-y-2">
            <p>1. 您的客户在商城成功下单并完成支付后，对应的预估佣金将立即显示在您的“我的收益”中，此时状态为“待结算”。</p>
            <p>2. 当客户确认收货且过了7天无理由退货期后，该笔订单的佣金将自动转为“已结算”状态，并计入您的可提现余额。</p>
            <p>3. 如果客户在退货期内发生退款，对应的预估佣金将被取消。</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">account_balance</span>
            如何提现？
          </h3>
          <div className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed space-y-2">
            <p>1. 提现门槛：账户可提现余额满 100 元即可申请提现。</p>
            <p>2. 提现方式：支持提现至微信零钱、支付宝或绑定的银行卡。</p>
            <p>3. 到账时间：工作日申请提现，通常在 24 小时内审核并打款；节假日顺延至下一个工作日处理。</p>
            <p>4. 手续费：每月前两笔提现免手续费，超出部分按提现金额的 0.1% 收取手续费（最低 1 元）。</p>
          </div>
        </div>
      </div>
    </div>
  );
}
