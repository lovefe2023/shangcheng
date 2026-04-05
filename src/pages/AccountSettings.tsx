import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../lib/api';
import { useToast } from '../components/Toast';

export default function AccountSettings() {
  const navigate = useNavigate();
  const toast = useToast();

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [saving, setSaving] = useState(false);

  const handleUpdatePassword = async () => {
    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('请填写所有密码字段');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('两次输入的新密码不一致');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('新密码长度至少6位');
      return;
    }

    setSaving(true);
    try {
      const res = await authApi.updatePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      });

      if (res.success) {
        toast.success('密码修改成功');
        setShowPasswordModal(false);
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(res.error?.message || '密码修改失败');
      }
    } catch (err) {
      toast.error('网络错误');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background-light dark:bg-background-dark">
      <header className="sticky top-0 z-50 flex items-center bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 h-14">
        <Link to="/settings" className="text-slate-900 dark:text-slate-100 flex items-center">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="flex-1 text-center text-lg font-bold leading-tight tracking-tight mr-6">账号与安全</h1>
      </header>

      <main className="flex-1 overflow-y-auto pb-8">
        <div className="mt-4 px-4 space-y-4">
          {/* 账号安全 */}
          <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="px-4 py-3 flex items-center justify-between border-b border-slate-50 dark:border-slate-800/50">
              <span className="text-slate-900 dark:text-slate-100 text-base">登录密码</span>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="flex items-center gap-2 text-primary text-sm font-medium"
              >
                修改密码
                <span className="material-symbols-outlined text-xl">chevron_right</span>
              </button>
            </div>
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-slate-900 dark:text-slate-100 text-base">绑定手机</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-sm">已绑定</span>
                <span className="material-symbols-outlined text-slate-400 text-xl">chevron_right</span>
              </div>
            </div>
          </div>

          {/* 第三方账号绑定 */}
          <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="px-4 py-3">
              <h3 className="text-slate-900 dark:text-slate-100 text-base font-medium mb-4">第三方账号绑定</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">微</div>
                    <span className="text-slate-700 dark:text-slate-300 text-sm">微信</span>
                  </div>
                  <span className="text-slate-400 text-sm">未绑定</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">支</div>
                    <span className="text-slate-700 dark:text-slate-300 text-sm">支付宝</span>
                  </div>
                  <span className="text-slate-400 text-sm">未绑定</span>
                </div>
              </div>
            </div>
          </div>

          {/* 账号注销 */}
          <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-red-500 text-base">注销账号</span>
              <span className="material-symbols-outlined text-slate-400 text-xl">chevron_right</span>
            </div>
          </div>
        </div>
      </main>

      {/* 修改密码模态框 */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">修改密码</h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-slate-400">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">当前密码</label>
                <input
                  type="password"
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                  placeholder="请输入当前密码"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">新密码</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="请输入新密码（至少6位）"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">确认新密码</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="请再次输入新密码"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 py-2.5 rounded-lg font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800"
              >
                取消
              </button>
              <button
                onClick={handleUpdatePassword}
                disabled={saving}
                className="flex-1 py-2.5 rounded-lg font-medium text-white bg-primary disabled:opacity-50"
              >
                {saving ? '修改中...' : '确认修改'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}