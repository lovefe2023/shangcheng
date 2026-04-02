import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ordersApi } from '../lib/api';
import { useToast } from '../components/Toast';
import { OrderStatus, OrderStatusLabel } from '../types';

interface OrderItem {
  id: string;
  product_name: string;
  product_image: string;
  spec: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  order_no: string;
  status: OrderStatus;
  total_amount: number;
  paid_amount: number;
  discount_amount: number;
  payment_method: string;
  payment_time: string;
  created_at: string;
  address_snapshot: {
    name: string;
    phone: string;
    province: string;
    city: string;
    district: string;
    detail: string;
  };
  items: OrderItem[];
  logistics_company?: string;
  logistics_no?: string;
}

const getStatusMessage = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.PENDING_PAYMENT:
      return '订单待支付，请尽快完成付款';
    case OrderStatus.PENDING_SHIPMENT:
      return '订单已支付，等待商家发货';
    case OrderStatus.SHIPPED:
      return '您的包裹正在路上，请注意查收';
    case OrderStatus.COMPLETED:
      return '订单已完成，感谢您的购买';
    case OrderStatus.REFUNDING:
      return '退款申请处理中，请耐心等待';
    case OrderStatus.CANCELLED:
      return '订单已取消';
    default:
      return '';
  }
};

const getStatusIcon = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.PENDING_PAYMENT:
      return 'schedule';
    case OrderStatus.PENDING_SHIPMENT:
      return 'inventory_2';
    case OrderStatus.SHIPPED:
      return 'local_shipping';
    case OrderStatus.COMPLETED:
      return 'check_circle';
    case OrderStatus.REFUNDING:
      return 'autorenew';
    case OrderStatus.CANCELLED:
      return 'cancel';
    default:
      return 'receipt_long';
  }
};

export default function OrderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (id) {
      fetchOrder();
    }
  }, [id]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await ordersApi.getDetail(id!);
      if (res.success && res.data) {
        setOrder(res.data);
      } else {
        toast.error('订单不存在');
        navigate('/orders');
      }
    } catch (error) {
      console.error('获取订单详情失败:', error);
      toast.error('获取订单详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReceive = async () => {
    if (!order || confirming) return;
    setConfirming(true);
    try {
      const res = await ordersApi.confirm(order.id);
      if (res.success) {
        toast.success('已确认收货');
        fetchOrder();
      } else {
        toast.error(res.error?.message || '操作失败');
      }
    } catch (error) {
      toast.error('操作失败');
    } finally {
      setConfirming(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    try {
      const res = await ordersApi.cancel(order.id);
      if (res.success) {
        toast.success('订单已取消');
        fetchOrder();
      } else {
        toast.error(res.error?.message || '取消失败');
      }
    } catch (error) {
      toast.error('取消失败');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('已复制');
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
        <header className="sticky top-0 z-50 flex items-center bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 h-14">
          <Link to="/orders" className="text-slate-900 dark:text-slate-100 flex items-center">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="flex-1 text-center text-lg font-bold leading-tight tracking-tight mr-6">订单详情</h1>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <span className="material-symbols-outlined text-5xl mb-3 text-slate-400">error</span>
        <p className="text-slate-500">订单不存在</p>
        <Link to="/orders" className="mt-4 text-primary font-medium">返回订单列表</Link>
      </div>
    );
  }

  const address = order.address_snapshot;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-50 flex items-center bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 h-14">
        <Link to="/orders" className="text-slate-900 dark:text-slate-100 flex items-center">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="flex-1 text-center text-lg font-bold leading-tight tracking-tight mr-6">订单详情</h1>
      </header>

      <main className="flex-1 overflow-y-auto pb-32">
        {/* Status Header */}
        <div className="bg-primary px-6 py-8 flex items-center justify-between text-white">
          <div className="flex flex-col gap-1">
            <p className="text-2xl font-bold">{OrderStatusLabel[order.status]}</p>
            <p className="text-white/80 text-sm">{getStatusMessage(order.status)}</p>
          </div>
          <span className="material-symbols-outlined text-6xl opacity-80">{getStatusIcon(order.status)}</span>
        </div>

        {/* Address */}
        {address && (
          <div className="mx-4 -mt-4 bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm flex items-start gap-3 border border-slate-100 dark:border-slate-800 relative z-10">
            <div className="bg-primary/10 text-primary rounded-full p-2 mt-1">
              <span className="material-symbols-outlined">location_on</span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base">{address.name}</span>
                <span className="text-slate-500 dark:text-slate-400 text-sm">{address.phone}</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                {address.province}{address.city}{address.district}{address.detail}
              </p>
            </div>
          </div>
        )}

        {/* Items */}
        <div className="mt-4 px-4">
          <h3 className="text-slate-900 dark:text-slate-100 text-base font-bold mb-3 px-1">商品信息</h3>
          <div className="space-y-3">
            {order.items?.map((item, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 rounded-xl p-3 flex gap-4 border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="w-24 h-24 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0 overflow-hidden">
                  <img className="w-full h-full object-cover" src={item.product_image} alt={item.product_name} />
                </div>
                <div className="flex-1 flex flex-col justify-between py-0.5">
                  <div>
                    <p className="text-slate-900 dark:text-slate-100 font-medium line-clamp-2 text-sm">{item.product_name}</p>
                    {item.spec && <p className="text-slate-400 text-xs mt-1">规格: {item.spec}</p>}
                  </div>
                  <div className="flex justify-between items-end">
                    <p className="text-slate-900 dark:text-slate-100 font-bold">¥{item.price.toLocaleString()}</p>
                    <p className="text-slate-400 text-sm">x{item.quantity}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Info */}
        <div className="mt-6 px-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="text-slate-900 dark:text-slate-100 text-base font-bold mb-4">订单信息</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">订单号</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-900 dark:text-slate-100">{order.order_no}</span>
                  <button onClick={() => copyToClipboard(order.order_no)} className="text-primary">
                    <span className="material-symbols-outlined text-base">content_copy</span>
                  </button>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">下单时间</span>
                <span className="text-slate-900 dark:text-slate-100">{new Date(order.created_at).toLocaleString()}</span>
              </div>
              {order.payment_time && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">支付时间</span>
                  <span className="text-slate-900 dark:text-slate-100">{new Date(order.payment_time).toLocaleString()}</span>
                </div>
              )}
              {order.payment_method && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">支付方式</span>
                  <span className="text-slate-900 dark:text-slate-100">{order.payment_method}</span>
                </div>
              )}
              {order.logistics_no && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">物流单号</span>
                  <span className="text-slate-900 dark:text-slate-100">{order.logistics_company} {order.logistics_no}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Amount */}
        <div className="mt-4 px-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="space-y-3 pb-3 border-b border-slate-50 dark:border-slate-800">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">商品总额</span>
                <span className="text-slate-900 dark:text-slate-100 font-medium">¥{order.total_amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">运费</span>
                <span className="text-slate-900 dark:text-slate-100 font-medium">¥0.00</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">优惠金额</span>
                  <span className="text-red-500 font-medium">-¥{order.discount_amount.toLocaleString()}</span>
                </div>
              )}
            </div>
            <div className="flex justify-between items-center mt-3">
              <span className="text-slate-900 dark:text-slate-100 font-bold">实付款</span>
              <span className="text-primary text-xl font-bold">¥{order.paid_amount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </main>

      {/* Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-4 py-3 flex justify-end gap-3 z-40 pb-safe">
        {order.status === OrderStatus.PENDING_PAYMENT && (
          <>
            <button
              onClick={handleCancelOrder}
              className="px-6 py-2 rounded-full border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium"
            >
              取消订单
            </button>
            <button
              onClick={() => navigate(`/payment?order_id=${order.id}`)}
              className="px-6 py-2 rounded-full bg-primary text-white text-sm font-medium shadow-lg shadow-primary/20"
            >
              去支付
            </button>
          </>
        )}
        {order.status === OrderStatus.PENDING_SHIPMENT && (
          <button className="px-6 py-2 rounded-full border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium">
            提醒发货
          </button>
        )}
        {order.status === OrderStatus.SHIPPED && (
          <>
            <button className="px-6 py-2 rounded-full border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">local_shipping</span>
              查看物流
            </button>
            <button
              onClick={handleConfirmReceive}
              disabled={confirming}
              className="px-6 py-2 rounded-full bg-primary text-white text-sm font-medium shadow-lg shadow-primary/20"
            >
              {confirming ? '处理中...' : '确认收货'}
            </button>
          </>
        )}
        {order.status === OrderStatus.COMPLETED && (
          <>
            <button className="px-6 py-2 rounded-full border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium">
              再次购买
            </button>
            <button className="px-6 py-2 rounded-full border border-primary text-primary text-sm font-medium">
              评价商品
            </button>
          </>
        )}
        {order.status === OrderStatus.REFUNDING && (
          <button className="px-6 py-2 rounded-full border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium">
            查看进度
          </button>
        )}
      </div>
    </div>
  );
}