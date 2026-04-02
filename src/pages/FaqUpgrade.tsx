import { Link } from 'react-router-dom';

export default function FaqUpgrade() {
  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 pb-24">
      <div className="flex items-center bg-white dark:bg-slate-900 p-4 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800 justify-between">
        <div className="text-slate-900 dark:text-slate-100 flex size-10 shrink-0 items-center justify-start">
          <Link to="/partner" className="material-symbols-outlined cursor-pointer">arrow_back</Link>
        </div>
        <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-tight flex-1 text-center">合伙人等级升级</h2>
        <div className="flex w-10 items-center justify-end"></div>
      </div>

      <div className="p-4 space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">trending_up</span>
            等级划分与条件
          </h3>
          <div className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed space-y-4">
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200">1. 白银合伙人 (默认)</p>
              <p>条件：注册并认证成为合伙人即可。</p>
              <p>权益：享受基础商品推广佣金（10%）。</p>
            </div>
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200">2. 黄金合伙人</p>
              <p>条件：累计有效直推客户达 20 人，或累计个人销售额满 10,000 元。</p>
              <p>权益：享受进阶商品推广佣金（15%），解锁专属营销素材库。</p>
            </div>
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200">3. 钻石合伙人</p>
              <p>条件：累计有效直推客户达 100 人，或累计个人销售额满 50,000 元。</p>
              <p>权益：享受最高商品推广佣金（20%），获得团队业绩分红资格（2%），专属客服1对1指导。</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">upgrade</span>
            如何快速升级？
          </h3>
          <div className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed space-y-2">
            <p>1. 积极分享商品链接或专属海报到朋友圈、微信群。</p>
            <p>2. 邀请好友注册成为您的直属客户，他们下单您即可获得业绩累计。</p>
            <p>3. 购买“合伙人专属礼包”可直接获得经验值加成，加速升级进程。</p>
          </div>
        </div>
      </div>
    </div>
  );
}
