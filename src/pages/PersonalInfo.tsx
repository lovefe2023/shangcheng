import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../lib/api';
import { useToast } from '../components/Toast';
import { Gender, GenderOptions } from '../types';

interface User {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  status: string;
  is_partner: boolean;
  partner_level: string;
  invite_code: string;
  balance: number;
  gender?: string;
  birthday?: string;
  email?: string;
}

export default function PersonalInfo() {
  const navigate = useNavigate();
  const toast = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 编辑模态框状态
  const [showEditModal, setShowEditModal] = useState(false);
  const [editField, setEditField] = useState<'name' | 'gender' | 'birthday'>('name');
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const res = await authApi.getMe();
      if (res.success && res.data) {
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      } else {
        toast.error('获取用户信息失败');
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      toast.error('获取用户信息失败');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (field: 'name' | 'gender' | 'birthday') => {
    setEditField(field);
    if (field === 'name') {
      setEditValue(user?.name || '');
    } else if (field === 'gender') {
      setEditValue(user?.gender || '男');
    } else if (field === 'birthday') {
      setEditValue(user?.birthday || '');
    }
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (editField === 'name' && !editValue.trim()) {
      toast.error('昵称不能为空');
      return;
    }

    setSaving(true);
    try {
      const updateData: any = {};
      if (editField === 'name') {
        updateData.name = editValue;
      } else if (editField === 'gender') {
        updateData.gender = editValue;
      } else if (editField === 'birthday') {
        updateData.birthday = editValue;
      }

      const res = await authApi.updateProfile(updateData);
      if (res.success) {
        toast.success('保存成功');
        setShowEditModal(false);
        fetchUser();
      } else {
        toast.error('保存失败');
      }
    } catch (error) {
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const maskPhone = (phone: string) => {
    if (!phone) return '-';
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  };

  const maskEmail = (email: string) => {
    if (!email) return '未绑定';
    const [name, domain] = email.split('@');
    return `${name.slice(0, 3)}***@${domain}`;
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-background-light dark:bg-background-dark">
        <header className="sticky top-0 z-50 flex items-center bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 h-14">
          <Link to="/settings" className="text-slate-900 dark:text-slate-100 flex items-center">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="flex-1 text-center text-lg font-bold leading-tight tracking-tight mr-6">个人信息</h1>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background-light dark:bg-background-dark">
      <header className="sticky top-0 z-50 flex items-center bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 h-14">
        <Link to="/settings" className="text-slate-900 dark:text-slate-100 flex items-center">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="flex-1 text-center text-lg font-bold leading-tight tracking-tight mr-6">个人信息</h1>
      </header>

      <main className="flex-1 overflow-y-auto pb-8">
        <div className="mt-4 px-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="px-4 py-3 flex items-center justify-between border-b border-slate-50 dark:border-slate-800/50 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors cursor-pointer">
              <span className="text-slate-900 dark:text-slate-100 text-base">头像</span>
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-lg font-medium text-slate-500 dark:text-slate-400 overflow-hidden">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.charAt(0) || '?'
                  )}
                </div>
                <span className="material-symbols-outlined text-slate-400 text-xl">chevron_right</span>
              </div>
            </div>
            <div
              onClick={() => openEditModal('name')}
              className="px-4 py-3 flex items-center justify-between border-b border-slate-50 dark:border-slate-800/50 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors cursor-pointer"
            >
              <span className="text-slate-900 dark:text-slate-100 text-base">昵称</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 dark:text-slate-400 text-sm">{user?.name || '未设置'}</span>
                <span className="material-symbols-outlined text-slate-400 text-xl">chevron_right</span>
              </div>
            </div>
            <div
              onClick={() => openEditModal('gender')}
              className="px-4 py-3 flex items-center justify-between border-b border-slate-50 dark:border-slate-800/50 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors cursor-pointer"
            >
              <span className="text-slate-900 dark:text-slate-100 text-base">性别</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 dark:text-slate-400 text-sm">{user?.gender || '未设置'}</span>
                <span className="material-symbols-outlined text-slate-400 text-xl">chevron_right</span>
              </div>
            </div>
            <div
              onClick={() => openEditModal('birthday')}
              className="px-4 py-3 flex items-center justify-between active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors cursor-pointer"
            >
              <span className="text-slate-900 dark:text-slate-100 text-base">出生日期</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 dark:text-slate-400 text-sm">{user?.birthday || '未设置'}</span>
                <span className="material-symbols-outlined text-slate-400 text-xl">chevron_right</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="px-4 py-3 flex items-center justify-between border-b border-slate-50 dark:border-slate-800/50 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors cursor-pointer">
              <span className="text-slate-900 dark:text-slate-100 text-base">手机号码</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 dark:text-slate-400 text-sm">+86 {maskPhone(user?.phone || '')}</span>
                <span className="material-symbols-outlined text-slate-400 text-xl">chevron_right</span>
              </div>
            </div>
            <div className="px-4 py-3 flex items-center justify-between border-b border-slate-50 dark:border-slate-800/50 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors cursor-pointer">
              <span className="text-slate-900 dark:text-slate-100 text-base">邮箱地址</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 dark:text-slate-400 text-sm">{maskEmail(user?.email || '')}</span>
                <span className="material-symbols-outlined text-slate-400 text-xl">chevron_right</span>
              </div>
            </div>
            <Link to="/addresses" className="px-4 py-3 flex items-center justify-between active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors cursor-pointer">
              <span className="text-slate-900 dark:text-slate-100 text-base">收货地址</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 dark:text-slate-400 text-sm">管理</span>
                <span className="material-symbols-outlined text-slate-400 text-xl">chevron_right</span>
              </div>
            </Link>
          </div>

          {/* 邀请码信息 */}
          {user?.invite_code && (
            <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm p-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-900 dark:text-slate-100 text-base">我的邀请码</span>
                <span className="text-primary font-bold">{user.invite_code}</span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 编辑模态框 */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                编辑{editField === 'name' ? '昵称' : editField === 'gender' ? '性别' : '出生日期'}
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-500">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="mb-6">
              {editField === 'name' ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder="请输入昵称"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
                  maxLength={20}
                />
              ) : editField === 'gender' ? (
                <div className="flex gap-4">
                  {GenderOptions.map((g) => (
                    <button
                      key={g}
                      onClick={() => setEditValue(g)}
                      className={`flex-1 py-3 rounded-lg text-sm font-medium transition-colors ${
                        editValue === g
                          ? 'bg-primary text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  type="date"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
                />
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}