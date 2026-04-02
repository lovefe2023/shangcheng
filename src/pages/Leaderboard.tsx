import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface LeaderboardItem {
  id: string;
  rank: number;
  name: string;
  sales: number;
  income?: number;
  avatar: string;
  partner_level: string;
}

export default function Leaderboard() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<'sales' | 'income'>('sales');

  useEffect(() => {
    fetchLeaderboard();
  }, [activeType]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/partner/leaderboard?type=${activeType}&limit=10`);
      const data = await res.json();
      if (data.success) {
        setLeaderboardData(data.data || []);
      }
    } catch (error) {
      console.error('获取排行榜失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-500';
      case 2: return 'text-slate-400';
      case 3: return 'text-amber-700';
      default: return 'text-slate-500 dark:text-slate-400';
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank <= 3) {
      return (
        <div className={`font-black text-2xl italic w-8 text-center ${getRankColor(rank)}`}>
          {rank}
        </div>
      );
    }
    return (
      <div className={`font-bold text-lg w-8 text-center ${getRankColor(rank)}`}>
        {rank}
      </div>
    );
  };

  const getValueLabel = () => activeType === 'sales' ? '销售额' : '收益';

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <header className="shrink-0 sticky top-0 z-10 flex items-center bg-white dark:bg-slate-900 p-4 border-b border-slate-200 dark:border-slate-800 justify-between">
        <Link to="/partner" className="text-slate-900 dark:text-slate-100 flex size-10 shrink-0 items-center justify-start">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-tight flex-1 text-center">
          {activeType === 'sales' ? '本月销售龙虎榜' : '本月收益排行榜'}
        </h1>
        <div className="flex w-10 items-center justify-end"></div>
      </header>

      {/* Type Switch */}
      <div className="shrink-0 bg-white dark:bg-slate-900 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveType('sales')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeType === 'sales'
                ? 'bg-primary text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            销售榜
          </button>
          <button
            onClick={() => setActiveType('income')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeType === 'income'
                ? 'bg-primary text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            收益榜
          </button>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
          </div>
        ) : leaderboardData.length > 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">排名</span>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{getValueLabel()}</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {leaderboardData.map((user) => (
                <Link
                  to={`/member/${user.id}`}
                  key={user.id}
                  className="p-4 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  {getRankBadge(user.rank)}
                  <img
                    src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80'}
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover border border-slate-100 dark:border-slate-700"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{user.name}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-primary">
                      ¥{(activeType === 'sales' ? user.sales : user.income)?.toLocaleString()}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-slate-300 text-sm ml-1">chevron_right</span>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400">
            <span className="material-symbols-outlined text-5xl mb-3">leaderboard</span>
            <p className="text-sm">暂无排行数据</p>
          </div>
        )}
      </main>
    </div>
  );
}
