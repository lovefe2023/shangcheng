import { Link } from 'react-router-dom';

export default function FaqInvite() {
  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 pb-24">
      <div className="flex items-center bg-white dark:bg-slate-900 p-4 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800 justify-between">
        <div className="text-slate-900 dark:text-slate-100 flex size-10 shrink-0 items-center justify-start">
          <Link to="/partner" className="material-symbols-outlined cursor-pointer">arrow_back</Link>
        </div>
        <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-tight flex-1 text-center">邀请好友奖励</h2>
        <div className="flex w-10 items-center justify-end"></div>
      </div>

      <div className="p-4 space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">group_add</span>
            邀请客户奖励
          </h3>
          <div className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed space-y-2">
            <p>当您通过专属链接或海报邀请新用户注册商城后，该用户将永久绑定为您的直属客户。</p>
            <p>1. <span className="font-bold text-slate-800 dark:text-slate-200">首单奖励：</span>您的直属客户完成首笔订单后，您将获得额外的 50 元现金奖励。</p>
            <p>2. <span className="font-bold text-slate-800 dark:text-slate-200">持续返佣：</span>该客户未来在商城产生的所有有效消费，您都将按照您当前的合伙人等级比例获得佣金提成。</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">handshake</span>
            邀请合伙人奖励
          </h3>
          <div className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed space-y-2">
            <p>您还可以邀请好友成为合伙人，共同拓展市场。</p>
            <p>1. <span className="font-bold text-slate-800 dark:text-slate-200">推荐奖励：</span>每成功邀请一位好友认证成为合伙人，您将获得 100 元推荐奖金。</p>
            <p>2. <span className="font-bold text-slate-800 dark:text-slate-200">团队分红：</span>当您达到“钻石合伙人”等级后，您邀请的合伙人将组成您的专属团队，您可以获得团队总销售额 2% 的额外分红收益。</p>
          </div>
        </div>
      </div>
    </div>
  );
}
