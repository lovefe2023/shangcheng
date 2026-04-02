import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminCreateCoupon() {
  const navigate = useNavigate();
  const [couponType, setCouponType] = useState('platform'); // platform, product, new_user
  const [discountType, setDiscountType] = useState('amount'); // amount, discount
  const [validityType, setValidityType] = useState('fixed'); // fixed, days

  const [name, setName] = useState('');
  const [minSpend, setMinSpend] = useState('');
  const [discountValue, setDiscountValue] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [validDays, setValidDays] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleSave = () => {
    if (!name.trim()) {
      showToast('请输入优惠券名称');
      return;
    }

    const min = parseFloat(minSpend) || 0;
    const val = parseFloat(discountValue) || 0;

    if (val <= 0) {
      showToast('优惠额度/折扣必须大于0');
      return;
    }

    if (discountType === 'amount' && min > 0 && val >= min) {
      showToast('减免金额必须小于使用门槛');
      return;
    }

    if (discountType === 'discount' && (val <= 0 || val >= 10)) {
      showToast('折扣必须在0到10之间');
      return;
    }

    if (validityType === 'fixed') {
      if (!startTime || !endTime) {
        showToast('请选择完整的有效时间段');
        return;
      }
      if (new Date(endTime) <= new Date(startTime)) {
        showToast('结束时间必须晚于开始时间');
        return;
      }
    } else {
      if (!validDays || parseInt(validDays) <= 0) {
        showToast('请输入有效的有效天数');
        return;
      }
    }

    showToast('优惠券创建成功');
    setTimeout(() => {
      navigate('/admin/marketing/coupons');
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] bg-slate-800 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in">
          <span className="material-symbols-outlined text-amber-400">info</span>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate('/admin/marketing/coupons')}
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
                  value="amount"
                  checked={discountType === 'amount'}
                  onChange={(e) => setDiscountType(e.target.value)}
                  className="text-primary focus:ring-primary" 
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">满减券</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="discountType" 
                  value="discount"
                  checked={discountType === 'discount'}
                  onChange={(e) => setDiscountType(e.target.value)}
                  className="text-primary focus:ring-primary" 
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">折扣券</span>
              </label>
            </div>
            
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">满</span>
                <input 
                  type="number" 
                  value={minSpend}
                  onChange={(e) => setMinSpend(e.target.value)}
                  placeholder="0" 
                  className="w-24 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary transition-colors" 
                />
                <span className="text-sm text-slate-600 dark:text-slate-400">元可用，</span>
              </div>
              
              {discountType === 'amount' ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">减</span>
                  <input 
                    type="number" 
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder="0" 
                    className="w-24 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary transition-colors" 
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">元</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">打</span>
                  <input 
                    type="number" 
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder="9.5" 
                    className="w-24 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary transition-colors" 
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">折</span>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2">使用门槛填0即为无门槛。</p>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">发放与使用规则</h2>
          <div className="space-y-6">
            {/* 发放方式 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                发放方式 <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="distMethod" value="manual" defaultChecked className="text-primary focus:ring-primary" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">用户手动领取</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="distMethod" value="admin" className="text-primary focus:ring-primary" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">后台定向派发</span>
                </label>
              </div>
            </div>

            {/* 发放数量 */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  发放总量 (张) <span className="text-red-500">*</span>
                </label>
                <input 
                  type="number" 
                  placeholder="请输入总库存" 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  每人限领 (张) <span className="text-red-500">*</span>
                </label>
                <input 
                  type="number" 
                  placeholder="不填则不限制" 
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
            onClick={() => navigate('/admin/marketing/coupons')}
            className="px-6 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-white dark:hover:bg-slate-800 transition-colors"
          >
            取消
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            保存并发布
          </button>
        </div>
      </div>
    </div>
  );
}
