import React from 'react';
import { Link } from 'react-router-dom';

interface EmptyProps {
  icon?: string;
  title?: string;
  description?: string;
  actionText?: string;
  actionLink?: string;
  onAction?: () => void;
  className?: string;
}

export default function Empty({
  icon = 'inbox',
  title = '暂无数据',
  description = '这里空空如也，什么都没有发现',
  actionText,
  actionLink,
  onAction,
  className = '',
}: EmptyProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}>
      <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600">
          {icon}
        </span>
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-6">
        {description}
      </p>
      
      {actionText && (
        actionLink ? (
          <Link 
            to={actionLink}
            className="px-6 py-2.5 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            {actionText}
          </Link>
        ) : onAction ? (
          <button 
            onClick={onAction}
            className="px-6 py-2.5 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            {actionText}
          </button>
        ) : null
      )}
    </div>
  );
}
