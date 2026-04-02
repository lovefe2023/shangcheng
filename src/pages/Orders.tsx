import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Empty from '../components/Empty';
import { OrderListSkeleton } from '../components/Skeleton';
import { useToast } from '../components/Toast';
import { ordersApi } from '../lib/api';
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
  created_at: string;
  items: OrderItem[];
}

export default function Orders() {
  const navigate = useNavigate();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const tabs = ['全部', '待付款', '待发货', '已发货', '已完成', '退款/售后'];
  const statusFilters: (OrderStatus | undefined)[] = [
    undefined, // 全部
    OrderStatus.PENDING_PAYMENT,
    OrderStatus.PENDING_SHIPMENT,
    OrderStatus.SHIPPED,
    OrderStatus.COMPLETED,
    OrderStatus.REFUNDING
  ];

  useEffect(() => {
    setPage(1);
    setOrders([]);
    setHasMore(true);
    fetchOrders(1, true);
  }, [activeTab]);

  const fetchOrders = async (pageNum: number = page, reset: boolean = false) => {
    setLoading(true);
    try {
      const status = statusFilters[activeTab];
      const res = await ordersApi.getList({
        page: pageNum,
        pageSize: 10,
        status
      });

      if (res.success && res.data) {
        const newList = res.data.list || [];
        if (reset) {
          setOrders(newList);
        } else {
          setOrders(prev => [...prev, ...newList]);
        }
        setHasMore(newList.length >= 10);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('获取订单列表失败:', error);
      toast.error('获取订单列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchOrders(page + 1);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      const res = await ordersApi.cancel(orderId);
      if (res.success) {
        toast.success('订单已取消');
        fetchOrders(1, true);
      } else {
        toast.error(res.error?.message || '取消失败');
      }
    } catch (error) {
      toast.error('取消失败');
    }
  };

  const handleConfirmReceive = async (orderId: string) => {
    try {
      const res = await ordersApi.confirm(orderId);
      if (res.success) {
        toast.success('已确认收货');
        fetchOrders(1, true);
      } else {
        toast.error(res.error?.message || '操作失败');
      }
    } catch (error) {
      toast.error('操作失败');
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING_PAYMENT:
        return 'text-orange-500';
      case OrderStatus.PENDING_SHIPMENT:
        return 'text-blue-500';
      case OrderStatus.SHIPPED:
        return 'text-primary';
      case OrderStatus.COMPLETED:
        return 'text-slate-500';
      case OrderStatus.REFUNDING:
        return 'text-red-500';
      case OrderStatus.CANCELLED:
        return 'text-slate-400';
      default:
        return 'text-slate-500';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-50 flex items-center bg-white dark:bg-slate-900 p-4 border-b border-slate-200 dark:border-slate-800 justify-between">
        <Link to="/profile" className="text-slate-900 dark:text-slate-100 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-tight flex-1 text-center">我的订单</h2>
        <div className="flex w-10 items-center justify-end">
          <button className="flex size-10 cursor-pointer items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <span className="material-symbols-outlined">search</span>
          </button>
        </div>
      </header>

      <div className="sticky top-[73px] z-40 bg-white dark:bg-slate-900 overflow-x-auto hide-scrollbar border-b border-slate-200 dark:border-slate-800">
        <div className="flex px-4 min-w-max">
          {tabs.map((tab, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={`flex flex-col items-center justify-center border-b-2 px-4 py-3 ${activeTab === i ? 'border-primary text-primary' : 'border-transparent text-slate-500 dark:text-slate-400'}`}
            >
              <span className={`text-sm ${activeTab === i ? 'font-bold' : 'font-medium'}`}>{tab}</span>
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {loading && orders.length === 0 ? (
          <OrderListSkeleton count={3} />
        ) : orders.length === 0 ? (
          <Empty
            icon="receipt_long"
            title="暂无订单"
            description={`您还没有${tabs[activeTab]}的订单`}
            actionText="去逛逛"
            actionLink="/"
            className="mt-10"
          />
        ) : (
          <>
            {orders.map(order => (
              <Link to={`/order/${order.id}`} key={order.id} className="block rounded-xl bg-white dark:bg-slate-900 p-4 shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-slate-400">订单号: {order.order_no}</span>
                  <span className={`text-sm font-semibold ${getStatusColor(order.status)}`}>
                    {OrderStatusLabel[order.status]}
                  </span>
                </div>

                {/* 商品列表 */}
                <div className="space-y-3">
                  {order.items?.slice(0, 2).map((item, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="h-20 w-20 shrink-0 bg-slate-100 dark:bg-slate-800 rounded-lg bg-center bg-no-repeat bg-cover" style={{ backgroundImage: `url('${item.product_image}')` }}></div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <p className="text-slate-900 dark:text-slate-100 text-sm font-bold truncate">{item.product_name}</p>
                        {item.spec && <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">{item.spec}</p>}
                        <div className="flex items-end justify-between mt-auto">
                          <p className="text-slate-900 dark:text-slate-100 text-base font-bold">¥{item.price.toLocaleString()}</p>
                          <p className="text-slate-400 text-xs">x{item.quantity}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {order.items?.length > 2 && (
                    <p className="text-xs text-slate-400 text-center">共{order.items.length}件商品</p>
                  )}
                </div>

                {/* 订单金额 */}
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-50 dark:border-slate-800">
                  <span className="text-xs text-slate-400">{formatDate(order.created_at)}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-500">实付:</span>
                    <span className="text-primary font-bold">¥{order.paid_amount.toLocaleString()}</span>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex justify-end gap-3 mt-3 pt-3 border-t border-slate-50 dark:border-slate-800">
                  {order.status === OrderStatus.PENDING_PAYMENT && (
                    <>
                      <button
                        onClick={(e) => { e.preventDefault(); handleCancelOrder(order.id); }}
                        className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                      >
                        取消订单
                      </button>
                      <button
                        onClick={(e) => { e.preventDefault(); navigate(`/payment?order_id=${order.id}`); }}
                        className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-primary shadow-sm shadow-primary/20"
                      >
                        去支付
                      </button>
                    </>
                  )}

                  {order.status === OrderStatus.PENDING_SHIPMENT && (
                    <button className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      提醒发货
                    </button>
                  )}

                  {order.status === OrderStatus.SHIPPED && (
                    <>
                      <button className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                        查看物流
                      </button>
                      <button
                        onClick={(e) => { e.preventDefault(); handleConfirmReceive(order.id); }}
                        className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-primary shadow-sm shadow-primary/20"
                      >
                        确认收货
                      </button>
                    </>
                  )}

                  {order.status === OrderStatus.COMPLETED && (
                    <>
                      <button className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        再次购买
                      </button>
                      <button className="px-4 py-1.5 rounded-lg text-xs font-semibold text-primary border border-primary/30 bg-primary/5">
                        评价商品
                      </button>
                    </>
                  )}

                  {order.status === OrderStatus.REFUNDING && (
                    <>
                      <button className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        查看进度
                      </button>
                      <button className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        联系客服
                      </button>
                    </>
                  )}
                </div>
              </Link>
            ))}

            {hasMore && (
              <button
                onClick={loadMore}
                disabled={loading}
                className="py-3 text-center text-sm text-slate-500 hover:text-primary w-full"
              >
                {loading ? '加载中...' : '加载更多'}
              </button>
            )}

            {!hasMore && orders.length > 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <span className="text-xs">没有更多订单了</span>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
