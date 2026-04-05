import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../lib/api';

export default function AdminCreateCoupon() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // 基本信息
  const [name, setName] = useState('');
  const [couponType, setCouponType] = useState('platform'); // platform, product, new_user

  // 优惠设置
  const [discountType, setDiscountType] = useState<'discount' | 'full_reduction'>('full_reduction'); // discount=立减券, full_reduction=满减券
  const [discountAmount, setDiscountAmount] = useState('');
  const [minAmount, setMinAmount] = useState('0');

  // 发放规则
  const [totalCount, setTotalCount] = useState('');
  const [limitPerUser, setLimitPerUser] = useState('1');

  // 有效期
  const [validityType, setValidityType] = useState('fixed'); // fixed, days
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [validDays, setValidDays] = useState('');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleSave = async () => {
    // 验证基本信息
    if (!name.trim()) {
      showToast('请输入优惠券名称', 'error');
      return;
    }

    // 验证优惠金额
    const discount = parseFloat(discountAmount) || 0;
    if (discount <= 0) {
      showToast('优惠金额必须大于0', 'error');
      return;
    }

    // 验证使用门槛
    const min = parseFloat(minAmount) || 0;
    if (discountType === 'full_reduction' && min > 0 && discount >= min) {
      showToast('减免金额必须小于使用门槛', 'error');
      return;
    }

    // 验证发放总量
    const total = parseInt(totalCount) || 0;
    if (total <= 0) {
      showToast('请输入发放总量', 'error');
      return;
    }

    // 验证有效期
    if (validityType === 'fixed') {
      if (!startTime || !endTime) {
        showToast('请选择完整的有效时间段', 'error');
        return;
      }
      if (new Date(endTime) <= new Date(startTime)) {
        showToast('结束时间必须晚于开始时间', 'error');
        return;
      }
    } else {
      const days = parseInt(validDays) || 0;
      if (days <= 0) {
        showToast('请输入有效的有效天数', 'error');
        return;
      }
    }

    setSaving(true);

    try {
      // 如果是领取后N天有效，计算具体时间
      let finalStartTime = startTime;
      let finalEndTime = endTime;

      if (validityType === 'days') {
        const now = new Date();
        finalStartTime = now.toISOString().slice(0, 16);
        const endDate = new Date(now.getTime() + parseInt(validDays) * 24 * 60 * 60 * 1000);
        finalEndTime = endDate.toISOString().slice(0, 16);
      }

      const res = await adminApi.createCoupon({
        name: name.trim(),
        type: discountType,
        discount_amount: discount,
        min_amount: min,
        total_count: total,
        start_time: new Date(finalStartTime).toISOString(),
        end_time: new Date(finalEndTime).toISOString(),
        limit_per_user: parseInt(limitPerUser) || 1
      });

      if (res.success) {
        showToast('优惠券创建成功');
        setTimeout(() => {
          navigate('/admin/marketing');
        }, 1000);
      } else {
        showToast(res.error?.message || '创建失败', 'error');
      }
    } catch (error) {
      console.error('Create coupon error:', error);
      showToast('创建失败，请重试', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in ${
          toastType === 'error' ? 'bg-red-600 text-white' : 'bg-slate-800 text-white'
        }`}>
          <span className={`material-symbols-outlined ${toastType === 'error' ? 'text-red-200' : 'text-amber-400'}`}>
            {toastType === 'error' ? 'error' : 'info'}
          </span>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/admin/marketing')}
          className="p-2 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">创建优惠券</h1>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">基本信息</h2>
        </div>
        <div className="p-6 space-y-6">
          {/* 名称 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              优惠券名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：双十一满减券"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* 类型 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              优惠券类型 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="couponType"
                  value="platform"
                  checked={couponType === 'platform'}
                  onChange={(e) => setCouponType(e.target.value)}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">平台通用券</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="couponType"
                  value="product"
                  checked={couponType === 'product'}
                  onChange={(e) => setCouponType(e.target.value)}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">指定商品券</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="couponType"
                  value="new_user"
                  checked={couponType === 'new_user'}
                  onChange={(e) => setCouponType(e.target.value)}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">新人专享券</span>
              </label>
            </div>
          </div>

          {/* 适用商品 */}
          {couponType === 'product' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                适用商品 <span className="text-red-500">*</span>
              </label>
              <button className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">add</span>
                选择商品
              </button>
            </div>
          )}

          {/* 优惠设置 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              优惠设置 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4 mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="discountType"
                  value="discount"
                  checked={discountType === 'discount'}
                  onChange={(e) => setDiscountType(e.target.value as 'discount' | 'full_reduction')}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">立减券</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="discountType"
                  value="full_reduction"
                  checked={discountType === 'full_reduction'}
                  onChange={(e) => setDiscountType(e.target.value as 'discount' | 'full_reduction')}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">满减券</span>
              </label>
            </div>

            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">满</span>
                <input
                  type="number"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  placeholder="0"
                  className="w-24 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary transition-colors"
                />
                <span className="text-sm text-slate-600 dark:text-slate-400">元可用，</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">减</span>
                <input
                  type="number"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  placeholder="0"
                  className="w-24 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary transition-colors"
                />
                <span className="text-sm text-slate-600 dark:text-slate-400">元</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">使用门槛填0即为无门槛。</p>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">发放与使用规则</h2>
          <div className="space-y-6">
            {/* 发放数量 */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  发放总量 (张) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={totalCount}
                  onChange={(e) => setTotalCount(e.target.value)}
                  placeholder="请输入总库存"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  每人限领 (张)
                </label>
                <input
                  type="number"
                  value={limitPerUser}
                  onChange={(e) => setLimitPerUser(e.target.value)}
                  placeholder="默认1张"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            {/* 有效期 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                有效期 <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4 mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="validityType"
                    value="fixed"
                    checked={validityType === 'fixed'}
                    onChange={(e) => setValidityType(e.target.value)}
                    className="text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">固定时间段</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="validityType"
                    value="days"
                    checked={validityType === 'days'}
                    onChange={(e) => setValidityType(e.target.value)}
                    className="text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">领取后N天有效</span>
                </label>
              </div>

              {validityType === 'fixed' ? (
                <div className="flex items-center gap-2">
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors text-slate-500"
                  />
                  <span className="text-slate-400">-</span>
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors text-slate-500"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">领取后</span>
                  <input
                    type="number"
                    value={validDays}
                    onChange={(e) => setValidDays(e.target.value)}
                    placeholder="7"
                    className="w-24 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">天内有效</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-4 bg-slate-50 dark:bg-slate-900/50">
          <button
            onClick={() => navigate('/admin/marketing')}
            disabled={saving}
            className="px-6 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-white dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {saving && (
              <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
            )}
            {saving ? '保存中...' : '保存并发布'}
          </button>
        </div>
      </div>
    </div>
  );
}