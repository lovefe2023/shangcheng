/**
 * 公告详情页面
 */

import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';

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

export default function NotificationDetails() {
  const { id } = useParams<{ id: string }>();
  const [notification, setNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchNotification();
    }
  }, [id]);

  const fetchNotification = async () => {
    try {
      // 由于API返回列表，我们从列表中筛选
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.success) {
        const found = (data.data || []).find((n: Notification) => n.id === id);
        setNotification(found);
      }
    } catch (error) {
      console.error('获取公告详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
        <header className="shrink-0 sticky top-0 z-10 flex items-center bg-white dark:bg-slate-900 p-4 border-b border-slate-200 dark:border-slate-800">
          <Link to="/notifications" className="text-slate-900 dark:text-slate-100 flex size-10 shrink-0 items-center justify-start">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-lg font-bold flex-1 text-center">公告详情</h1>
          <div className="w-10"></div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
        </div>
      </div>
    );
  }

  if (!notification) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
        <header className="shrink-0 sticky top-0 z-10 flex items-center bg-white dark:bg-slate-900 p-4 border-b border-slate-200 dark:border-slate-800">
          <Link to="/notifications" className="text-slate-900 dark:text-slate-100 flex size-10 shrink-0 items-center justify-start">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-lg font-bold flex-1 text-center">公告详情</h1>
          <div className="w-10"></div>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
          <span className="material-symbols-outlined text-5xl mb-3">error</span>
          <p className="text-sm">公告不存在或已删除</p>
          <Link to="/notifications" className="mt-4 text-primary text-sm font-medium">
            返回公告列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="shrink-0 sticky top-0 z-10 flex items-center bg-white dark:bg-slate-900 p-4 border-b border-slate-200 dark:border-slate-800">
        <Link to="/notifications" className="text-slate-900 dark:text-slate-100 flex size-10 shrink-0 items-center justify-start">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center">公告详情</h1>
        <div className="flex w-10 items-center justify-end"></div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 p-4 mb-2">
          {/* Type Badge */}
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-xs font-semibold px-2 py-1 rounded ${typeColors[notification.type]}`}>
              {typeLabels[notification.type]}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {formatDate(notification.created_at)}
            </span>
          </div>

          {/* Title */}
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug mb-4">
            {notification.title}
          </h2>

          {/* Content */}
          <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {notification.content}
          </div>
        </div>
      </main>
    </div>
  );
}