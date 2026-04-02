/**
 * 公告列表页面
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Notification {
  id: string;
  title: string;
  content: string;
  type: 'announcement' | 'notice' | 'faq';
  status: 'published' | 'draft';
  created_at: string;
}

const typeLabels: Record<string, string> = {
  announcement: '公告',
  notice: '通知',
  faq: '常见问题',
};

const typeColors: Record<string, string> = {
  announcement: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  notice: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  faq: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
};

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<string>('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data || []);
      }
    } catch (error) {
      console.error('获取公告失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotifications = activeType === 'all'
    ? notifications
    : notifications.filter(n => n.type === activeType);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="shrink-0 sticky top-0 z-10 flex items-center bg-white dark:bg-slate-900 p-4 border-b border-slate-200 dark:border-slate-800">
        <Link to="/" className="text-slate-900 dark:text-slate-100 flex size-10 shrink-0 items-center justify-start">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-tight flex-1 text-center">公告中心</h1>
        <div className="flex w-10 items-center justify-end"></div>
      </header>

      {/* Type Filter */}
      <div className="shrink-0 bg-white dark:bg-slate-900 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveType('all')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeType === 'all'
                ? 'bg-primary text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            全部
          </button>
          {['announcement', 'notice', 'faq'].map(type => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeType === type
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {typeLabels[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div className="flex flex-col gap-3">
            {filteredNotifications.map(notification => (
              <Link
                to={`/notification/${notification.id}`}
                key={notification.id}
                className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0">
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${typeColors[notification.type]}`}>
                      {typeLabels[notification.type]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">
                      {notification.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {notification.content}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {formatDate(notification.created_at)}
                      </span>
                      <span className="material-symbols-outlined text-slate-300 text-sm">chevron_right</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400">
            <span className="material-symbols-outlined text-5xl mb-3">campaign</span>
            <p className="text-sm">暂无公告</p>
          </div>
        )}
      </main>
    </div>
  );
}