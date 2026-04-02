import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { cartApi, addressesApi, ordersApi, marketingApi } from '../lib/api';
import { useToast } from '../components/Toast';
import { CartListSkeleton } from '../components/Skeleton';

interface CartItem {
  id: string;
  product_id: string;
  product: {
    id: string;
    name: string;
    images: string[];
    price: number;
    status: string;
    stock: number;
  };
  spec: string;
  quantity: number;
}

interface Address {
  id: string;
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  is_default: boolean;
}

interface UserCoupon {
  id: string;
  coupon: {
    id: string;
    name: string;
    discount_amount: number;
    min_amount: number;
  };
  status: string;
}

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  // 数据状态
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [coupons, setCoupons] = useState<UserCoupon[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [selectedCoupon, setSelectedCoupon] = useState<UserCoupon | null>(null);

  // UI状态
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 并行获取购物车、地址、优惠券
      const [cartRes, addressRes, couponRes] = await Promise.all([
        cartApi.get(),
        addressesApi.getList(),
        marketingApi.getMyCoupons('unused')
      ]);

      // 处理购物车 - 根据URL参数筛选
      const urlParams = new URLSearchParams(location.search);
      const cartItemIds = urlParams.get('cart_items')?.split(',') || [];

      if (cartRes.success && cartRes.data) {
        const items = (cartRes.data.items || cartRes.data) as CartItem[];
        const filteredItems = cartItemIds.length > 0
          ? items.filter(item => cartItemIds.includes(item.id))
          : items.filter(item => item.selected);
        setCartItems(filteredItems);
      }

      // 处理地址 - 默认选中第一个或默认地址
      if (addressRes.success && addressRes.data) {
        const addrList = Array.isArray(addressRes.data) ? addressRes.data : [];
        setAddresses(addrList);
        const defaultAddr = addrList.find(a => a.is_default) || addrList[0];
        setSelectedAddress(defaultAddr || null);
      }

      // 处理优惠券
      if (couponRes.success && couponRes.data) {
        const couponList = couponRes.data.list || couponRes.data || [];
        setCoupons(Array.isArray(couponList) ? couponList : []);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 计算金额
  const subtotal = cartItems.reduce((sum, item) =>
    sum + (item.product?.price || 0) * item.quantity, 0);
  const discount = selectedCoupon?.coupon?.discount_amount || 0;
  const total = Math.max(0, subtotal - discount);

  // 提交订单
  const handleSubmit = async () => {
    if (!selectedAddress) {
      toast.error('请选择收货地址');
      return;
    }

    if (cartItems.length === 0) {
      toast.error('购物车为空');
      return;
    }

    setSubmitting(true);
    try {
      const res = await ordersApi.create({
        address_id: selectedAddress.id,
        cart_item_ids: cartItems.map(item => item.id),
        coupon_id: selectedCoupon?.id,
        note
      });

      if (res.success && res.data) {
        toast.success('订单创建成功');
        navigate(`/payment?order_id=${res.data.id}`);
      } else {
        toast.error(res.error?.message || '创建订单失败');
      }
    } catch (error) {
      console.error('创建订单失败:', error);
      toast.error('创建订单失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 格式化地址显示
  const formatAddress = (addr: Address) => {
    const parts = [addr.province, addr.city, addr.district, addr.detail].filter(Boolean);
    return parts.join(' ');
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
        <header className="sticky top-0 z-50 flex items-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <Link to="/cart" className="flex items-center justify-center p-1.5">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="flex-1 text-center text-lg font-bold mr-8">确认订单</h1>
        </header>
        <div className="p-4">
          <CartListSkeleton count={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 flex items-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-3 border-b border-slate-200/60 dark:border-slate-800/60">
        <Link to="/cart" className="flex items-center justify-center p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-90">
          <span className="material-symbols-outlined text-slate-900 dark:text-slate-100">arrow_back</span>
        </Link>
        <h1 className="flex-1 text-center text-lg font-bold leading-tight mr-8">确认订单</h1>
      </header>

      <main className="flex-1 overflow-y-auto pb-32">
        {/* Address Selector Section */}
        <section className="mt-2 mx-0 bg-white dark:bg-slate-900 shadow-sm relative overflow-hidden">
          {selectedAddress ? (
            <div
              className="flex items-center gap-4 px-4 py-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              onClick={() => setShowAddressModal(true)}
            >
              <div className="flex items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20 p-3 shrink-0">
                <span className="material-symbols-outlined text-primary text-2xl">location_on</span>
              </div>
              <div className="flex flex-1 flex-col justify-center overflow-hidden">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-slate-900 dark:text-slate-100 text-[17px] font-bold">{selectedAddress.name}</span>
                  <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">{selectedAddress.phone}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-snug line-clamp-2">
                  {formatAddress(selectedAddress)}
                </p>
              </div>
              <div className="shrink-0 ml-1">
                <span className="material-symbols-outlined text-slate-300 dark:text-slate-600">chevron_right</span>
              </div>
            </div>
          ) : (
            <div
              className="flex items-center gap-4 px-4 py-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              onClick={() => navigate('/addresses?redirect=/checkout')}
            >
              <div className="flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 p-3 shrink-0">
                <span className="material-symbols-outlined text-slate-400 text-2xl">add_location</span>
              </div>
              <div className="flex flex-1 flex-col justify-center">
                <span className="text-slate-500 dark:text-slate-400">添加收货地址</span>
              </div>
              <span className="material-symbols-outlined text-slate-300 dark:text-slate-600">chevron_right</span>
            </div>
          )}
          {/* Decorative border */}
          {selectedAddress && (
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[repeating-linear-gradient(45deg,#136dec,#136dec_12px,#fff_12px,#fff_24px,#ef4444_24px,#ef4444_36px,#fff_36px,#fff_48px)] dark:opacity-80"></div>
          )}
        </section>

        {/* Order Products List */}
        <section className="mt-3 bg-white dark:bg-slate-900 shadow-sm">
          <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800/60">
            <h3 className="text-slate-900 dark:text-slate-100 text-[15px] font-bold">订单商品 ({cartItems.length})</h3>
          </div>
          <div className="flex flex-col">
            {cartItems.map(item => (
              <div key={item.id} className="flex gap-4 px-4 py-4 border-b border-slate-50 dark:border-slate-800/40 last:border-0">
                <div
                  className="bg-slate-50 dark:bg-slate-800 aspect-square rounded-xl w-22 h-22 bg-cover bg-center overflow-hidden border border-slate-100 dark:border-slate-800 flex-shrink-0"
                  style={{ backgroundImage: `url("${item.product?.images?.[0] || ''}")` }}
                />
                <div className="flex flex-1 flex-col py-0.5">
                  <div className="mb-1">
                    <p className="text-slate-900 dark:text-slate-100 text-sm font-semibold leading-tight line-clamp-1">
                      {item.product?.name || '商品已下架'}
                    </p>
                    {item.spec && (
                      <p className="text-slate-500 dark:text-slate-400 text-xs mt-1.5 font-medium bg-slate-100 dark:bg-slate-800 self-start inline-block px-2 py-0.5 rounded">
                        {item.spec}
                      </p>
                    )}
                  </div>
                  <div className="mt-auto flex justify-between items-baseline">
                    <p className="text-primary text-[17px] font-bold">
                      ¥{(item.product?.price || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">x{item.quantity}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Note & Coupons */}
        <section className="mt-3 bg-white dark:bg-slate-900 shadow-sm divide-y divide-slate-50 dark:divide-slate-800/40">
          <div className="flex justify-between items-center px-4 py-4">
            <span className="text-slate-700 dark:text-slate-300 text-[15px]">订单备注</span>
            <input
              type="text"
              placeholder="选填，可填写特殊需求"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="flex-1 ml-4 text-right text-sm text-slate-600 dark:text-slate-400 bg-transparent outline-none placeholder:text-slate-300"
              maxLength={100}
            />
          </div>
          <div
            className="flex justify-between items-center px-4 py-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
            onClick={() => setShowCouponModal(true)}
          >
            <span className="text-slate-700 dark:text-slate-300 text-[15px]">优惠券</span>
            <div className="flex items-center gap-1.5">
              {selectedCoupon ? (
                <span className="text-primary text-sm font-medium">-¥{discount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
              ) : coupons.length > 0 ? (
                <span className="text-primary text-sm font-medium">{coupons.length}张可用</span>
              ) : (
                <span className="text-slate-400 dark:text-slate-500 text-sm">暂无可用</span>
              )}
              <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-[20px]">chevron_right</span>
            </div>
          </div>
        </section>

        {/* Order Summary */}
        <section className="mt-3 bg-white dark:bg-slate-900 px-4 py-5 shadow-sm space-y-3.5">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400 dark:text-slate-500">商品总计</span>
            <span className="text-slate-900 dark:text-slate-100 font-medium tracking-tight">¥{subtotal.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400 dark:text-slate-500">运费</span>
            <span className="text-slate-900 dark:text-slate-100 font-medium tracking-tight">¥0.00</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400 dark:text-slate-500">优惠减免</span>
              <span className="text-emerald-500 font-medium tracking-tight">-¥{discount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 flex justify-between items-center">
            <span className="text-slate-900 dark:text-slate-100 font-bold">实付款</span>
            <span className="text-primary text-xl font-bold tracking-tight">¥{total.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
          </div>
        </section>
      </main>

      {/* Bottom Submission Bar */}
      <footer className="shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200/50 dark:border-slate-800/50 px-4 py-4 flex items-center justify-between z-50 shadow-[0_-4px_16px_rgba(0,0,0,0.03)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        <div className="flex flex-col">
          <span className="text-slate-400 dark:text-slate-500 text-[11px] font-medium uppercase tracking-wider mb-0.5">实付总额</span>
          <div className="flex items-baseline gap-0.5">
            <span className="text-primary text-[24px] font-black tracking-tight">¥{total.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={submitting || cartItems.length === 0 || !selectedAddress}
          className={`${
            submitting || cartItems.length === 0 || !selectedAddress
              ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 active:scale-[0.97]'
          } text-white font-bold py-3 px-12 rounded-full transition-all text-base`}
        >
          {submitting ? '提交中...' : '提交订单'}
        </button>
      </footer>

      {/* Address Selection Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAddressModal(false)}
          />
          <div className="relative bg-slate-50 dark:bg-slate-900 rounded-t-2xl w-full max-h-[80vh] flex flex-col animate-in slide-in-from-bottom-full duration-300">
            <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-t-2xl">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">选择地址</h3>
              <button onClick={() => setShowAddressModal(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {addresses.map(addr => (
                <div
                  key={addr.id}
                  className={`p-4 rounded-xl border bg-white dark:bg-slate-950 cursor-pointer transition-colors ${
                    selectedAddress?.id === addr.id
                      ? 'border-primary bg-primary/5 dark:bg-primary/10'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                  onClick={() => {
                    setSelectedAddress(addr);
                    setShowAddressModal(false);
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold">{addr.name}</span>
                    <span className="text-slate-500 text-sm">{addr.phone}</span>
                    {addr.is_default && (
                      <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">默认</span>
                    )}
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">{formatAddress(addr)}</p>
                </div>
              ))}
              <Link
                to="/addresses?redirect=/checkout"
                className="flex items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:text-primary hover:border-primary transition-colors"
              >
                <span className="material-symbols-outlined">add</span>
                <span>添加新地址</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Coupon Selection Modal */}
      {showCouponModal && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCouponModal(false)}
          />
          <div className="relative bg-slate-50 dark:bg-slate-900 rounded-t-2xl w-full max-h-[80vh] flex flex-col animate-in slide-in-from-bottom-full duration-300">
            <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-t-2xl">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">选择优惠券</h3>
              <button onClick={() => setShowCouponModal(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Do not use coupon option */}
              <div
                className={`flex items-center justify-between p-4 rounded-xl border bg-white dark:bg-slate-950 cursor-pointer transition-colors ${
                  !selectedCoupon ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-slate-200 dark:border-slate-800'
                }`}
                onClick={() => {
                  setSelectedCoupon(null);
                  setShowCouponModal(false);
                }}
              >
                <span className="text-slate-900 dark:text-white font-medium">不使用优惠券</span>
                {!selectedCoupon && <span className="material-symbols-outlined text-primary">check_circle</span>}
              </div>

              {/* Coupon list */}
              {coupons.map(uc => {
                const minAmount = uc.coupon?.min_amount || 0;
                const discountAmount = uc.coupon?.discount_amount || 0;
                const isUsable = subtotal >= minAmount;

                return (
                  <div
                    key={uc.id}
                    className={`flex items-center p-4 rounded-xl border bg-white dark:bg-slate-950 cursor-pointer transition-colors ${
                      selectedCoupon?.id === uc.id
                        ? 'border-primary bg-primary/5 dark:bg-primary/10'
                        : isUsable
                          ? 'border-slate-200 dark:border-slate-800'
                          : 'border-slate-200 dark:border-slate-800 opacity-50'
                    }`}
                    onClick={() => {
                      if (isUsable) {
                        setSelectedCoupon(uc);
                        setShowCouponModal(false);
                      } else {
                        toast.warning(`需满¥${minAmount}才能使用`);
                      }
                    }}
                  >
                    <div className="flex-1 flex items-center gap-4">
                      <div className="flex flex-col items-center justify-center w-20 text-primary border-r border-slate-100 dark:border-slate-800 pr-4">
                        <span className="text-2xl font-bold">
                          <span className="text-sm">¥</span>{discountAmount}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-900 dark:text-white font-bold">{uc.coupon?.name || '优惠券'}</span>
                        <span className="text-slate-500 text-xs mt-1">
                          满¥{minAmount}可用
                        </span>
                      </div>
                    </div>
                    {selectedCoupon?.id === uc.id && (
                      <span className="material-symbols-outlined text-primary">check_circle</span>
                    )}
                  </div>
                );
              })}

              {coupons.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <span className="material-symbols-outlined text-4xl mb-2">receipt_long</span>
                  <p>暂无可用优惠券</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}