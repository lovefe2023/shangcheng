import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '../components/Layout';
import { ordersApi } from '../lib/api';
import { Skeleton } from '../components/Skeleton';

interface Order {
  id: string;
  order_no: string;
  status: string;
  total_amount: number;
  paid_amount: number;
  discount_amount: number;
}

export default function Payment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState('wechat');

  // 剩余时间计算（15分钟）
  const [remainingTime, setRemainingTime] = useState(15 * 60);

  useEffect(() => {
    if (!orderId) {
      setError('缺少订单ID');
      setLoading(false);
      return;
    }

    loadOrder();
  }, [orderId]);

  useEffect(() => {
    if (remainingTime > 0) {
      const timer = setInterval(() => {
        setRemainingTime(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [remainingTime]);

  const loadOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ordersApi.getDetail(orderId!);
      if (res.success) {
        setOrder(res.data);
        // 如果订单已支付，直接跳转到订单详情
        if (res.data.status !== 'pending_payment') {
          navigate(`/order/${orderId}`, { replace: true });
        }
      } else {
        setError(res.error?.message || '订单加载失败');
      }
    } catch (err) {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (!order || paying) return;
    setPaying(true);
    try {
      const res = await ordersApi.pay(order.id);
      if (res.success) {
        // 支付成功，跳转到订单详情
        navigate(`/order/${order.id}`, { replace: true });
      } else {
        alert(res.error?.message || '支付失败');
      }
    } catch (err) {
      alert('网络错误，请稍后重试');
    } finally {
      setPaying(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return { mins, secs };
  };

  const time = formatTime(remainingTime);

  if (loading) {
    return (
      <div className="relative flex h-screen w-full flex-col bg-background-light dark:bg-background-dark overflow-x-hidden max-w-md mx-auto shadow-xl">
        <div className="flex items-center bg-white dark:bg-background-dark p-4 pb-2 justify-between sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
          <button onClick={() => navigate(-1)} className="text-slate-900 dark:text-slate-100 flex size-12 shrink-0 items-center cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
          </button>
          <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-12">支付订单</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Skeleton className="h-32 w-3/4" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="relative flex h-screen w-full flex-col bg-background-light dark:bg-background-dark overflow-x-hidden max-w-md mx-auto shadow-xl">
        <div className="flex items-center bg-white dark:bg-background-dark p-4 pb-2 justify-between sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
          <button onClick={() => navigate(-1)} className="text-slate-900 dark:text-slate-100 flex size-12 shrink-0 items-center cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
          </button>
          <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-12">支付订单</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-red-500">{error || '订单不存在'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-background-dark overflow-x-hidden max-w-md mx-auto shadow-xl">
      {/* Top Navigation */}
      <div className="flex items-center bg-white dark:bg-background-dark p-4 pb-2 justify-between sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
        <button onClick={() => navigate(-1)} className="text-slate-900 dark:text-slate-100 flex size-12 shrink-0 items-center cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
        </button>
        <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-12">支付订单</h2>
      </div>

      {/* Countdown Section */}
      <div className="flex flex-col items-center py-8 px-4 bg-white dark:bg-background-dark">
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">支付剩余时间</p>
        <div className="flex gap-3">
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-16 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20">
              <p className="text-primary text-xl font-bold">{String(time.mins).padStart(2, '0')}</p>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs">分</p>
          </div>
          <div className="flex h-12 items-center justify-center text-primary font-bold text-xl">:</div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-16 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20">
              <p className="text-primary text-xl font-bold">{String(time.secs).padStart(2, '0')}</p>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs">秒</p>
          </div>
        </div>
        {remainingTime === 0 && (
          <p className="text-red-500 text-sm mt-4">订单已超时，请重新下单</p>
        )}
      </div>

      {/* Order Summary Card */}
      <div className="mx-4 mt-6 p-6 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex flex-col items-center">
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">订单总额</p>
          <h1 className="text-slate-900 dark:text-slate-100 text-4xl font-extrabold py-3">
            ¥{order.paid_amount.toFixed(2)}
          </h1>
          {order.discount_amount > 0 && (
            <p className="text-slate-400 text-sm">已优惠 ¥{order.discount_amount.toFixed(2)}</p>
          )}
          <div className="flex items-center gap-2 mt-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">
            <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider font-bold">
              订单号: {order.order_no}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="px-4 mt-8">
        <h3 className="text-slate-900 dark:text-slate-100 text-lg font-bold mb-4">选择支付方式</h3>
        <div className="space-y-3">
          {/* WeChat Pay */}
          <label
            className={cn(
              "flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl cursor-pointer transition-colors",
              selectedPayment === 'wechat' ? "border-2 border-primary" : "border border-slate-100 dark:border-slate-800 hover:border-primary/50"
            )}
            onClick={() => setSelectedPayment('wechat')}
          >
            <div className="flex items-center gap-4">
              <div className="size-10 rounded-lg bg-[#07C160]/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#07C160" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
              </div>
              <div>
                <p className="text-slate-900 dark:text-slate-100 font-semibold">微信支付</p>
                <p className="text-slate-500 dark:text-slate-400 text-xs">推荐使用的快捷支付</p>
              </div>
            </div>
            {selectedPayment === 'wechat' ? (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
            ) : (
              <div className="size-6 border-2 border-slate-200 dark:border-slate-700 rounded-full"></div>
            )}
            <input type="radio" name="payment" className="hidden" checked={selectedPayment === 'wechat'} readOnly />
          </label>
        </div>
      </div>

      {/* Security Info */}
      <div className="flex items-center justify-center gap-2 mt-8 text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        <span className="text-xs uppercase tracking-widest font-bold">安全加密支付</span>
      </div>

      {/* Footer Button */}
      <div className="mt-auto p-4 pt-8 bg-background-light dark:bg-background-dark">
        <button
          onClick={handlePay}
          disabled={paying || remainingTime === 0}
          className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary/30 active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {paying ? '支付中...' : `立即支付 ¥${order.paid_amount.toFixed(2)}`}
        </button>
        <p className="text-center text-slate-400 text-[10px] mt-4 pb-4 leading-relaxed">
          点击"立即支付"即代表您同意我们的《服务条款》和《退款政策》。
        </p>
      </div>
    </div>
  );
}