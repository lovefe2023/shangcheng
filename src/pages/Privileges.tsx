import { Link, useNavigate } from 'react-router-dom';

export default function Privileges() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 relative">
      <header className="shrink-0 sticky top-0 z-50 flex items-center bg-white/80 dark:bg-background-dark/80 backdrop-blur-md p-4 justify-between border-b border-slate-100 dark:border-slate-800">
        <button onClick={() => navigate(-1)} className="text-slate-900 dark:text-slate-100 flex size-10 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-tight flex-1 text-center">身份权益</h2>
        <div className="flex w-10"></div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-5 text-center border-b border-slate-100 dark:border-slate-800 relative shrink-0">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">合伙人等级权益</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">升级解锁更高比例佣金</p>
          </div>
          
          <div className="p-5 bg-slate-50 dark:bg-slate-800/50 flex-1 space-y-4">
            {/* 银牌合伙人 */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="size-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400">
                  <span className="material-symbols-outlined">military_tech</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">银牌合伙人</h4>
                  <p className="text-xs text-slate-500">条件：免费注册即可</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2">
                  <p className="text-[10px] text-slate-500 mb-1">自购返佣</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200">10%</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2">
                  <p className="text-[10px] text-slate-500 mb-1">直推奖励</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200">5%</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2">
                  <p className="text-[10px] text-slate-500 mb-1">间推奖励</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200">-</p>
                </div>
              </div>
            </div>

            {/* 金牌合伙人 */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border-2 border-yellow-400 relative shadow-md shadow-yellow-400/10">
              <div className="absolute -top-3 right-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-sm">
                当前等级
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="size-10 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center text-white shadow-inner">
                  <span className="material-symbols-outlined">workspace_premium</span>
                </div>
                <div>
                  <h4 className="font-bold text-yellow-600 dark:text-yellow-500">金牌合伙人</h4>
                  <p className="text-xs text-slate-500">条件：直推 10 人或销售额满 1万</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2">
                  <p className="text-[10px] text-yellow-700 dark:text-yellow-500 mb-1">自购返佣</p>
                  <p className="font-bold text-yellow-700 dark:text-yellow-500">15%</p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2">
                  <p className="text-[10px] text-yellow-700 dark:text-yellow-500 mb-1">直推奖励</p>
                  <p className="font-bold text-yellow-700 dark:text-yellow-500">10%</p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2">
                  <p className="text-[10px] text-yellow-700 dark:text-yellow-500 mb-1">间推奖励</p>
                  <p className="font-bold text-yellow-700 dark:text-yellow-500">5%</p>
                </div>
              </div>
            </div>

            {/* 钻石合伙人 */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="size-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white">
                  <span className="material-symbols-outlined">diamond</span>
                </div>
                <div>
                  <h4 className="font-bold text-blue-600 dark:text-blue-400">钻石合伙人</h4>
                  <p className="text-xs text-slate-500">条件：直推 50 人或销售额满 10万</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2">
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 mb-1">自购返佣</p>
                  <p className="font-bold text-blue-700 dark:text-blue-400">20%</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2">
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 mb-1">直推奖励</p>
                  <p className="font-bold text-blue-700 dark:text-blue-400">15%</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2">
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 mb-1">间推奖励</p>
                  <p className="font-bold text-blue-700 dark:text-blue-400">10%</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-5 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-3">距离升级 <span className="font-bold text-slate-800 dark:text-slate-200">钻石合伙人</span> 还需推荐 2 人</p>
            <Link 
              to="/partner-package"
              className="block text-center w-full bg-primary text-white font-bold py-3 rounded-xl shadow-md hover:bg-primary/90 transition-colors"
            >
              去升级
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
