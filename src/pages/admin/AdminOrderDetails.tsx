import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { adminApi } from '../../lib/api';
import { OrderStatus, OrderType, OrderStatusLabel, OrderTypeLabel } from '../../types';
import { useToast } from '../../components/Toast';
import { DetailSkeleton } from '../../components/Skeleton';

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  spec: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  order_no: string;
  type: OrderType;
  status: OrderStatus;
  total_amount: number;
  paid_amount: number;
  payment_method: string;
  payment_time: string;
  created_at: string;
  note: string;
  logistics_company: string;
  logistics_no: string;
  shipped_at: string;
  completed_at: string;
  address_snapshot: {
    name: string;
    phone: string;
    province: string;
    city: string;
    district: string;
    detail: string;
  };
  user: {
    id: string;
    name: string;
    phone: string;
  };
  items: OrderItem[];
  referrer?: {
    id: string;
    name: string;
    phone: string;
  };
}

export default function AdminOrderDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [remark, setRemark] = useState('');
  const [remarks, setRemarks] = useState<{ time: string; user: string; content: string }[]>([]);
  const [showShipModal, setShowShipModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [shippingCompany, setShippingCompany] = useState('顺丰速运');
  const [trackingNo, setTrackingNo] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getOrder(id!);
      if (res.success && res.data) {
        setOrder(res.data);
        // 初始化系统备注
        setRemarks([
          { time: res.data.created_at, user: '系统', content: '订单创建成功' }
        ]);
        if (res.data.payment_time) {
          setRemarks(prev => [
            { time: res.data.payment_time, user: '系统', content: '用户支付成功' },
            ...prev
          ]);
        }
        if (res.data.shipped_at) {
          setRemarks(prev => [
            { time: res.data.shipped_at, user: '系统', content: `订单已发货，物流公司: ${res.data.logistics_company}, 单号: ${res.data.logistics_no}` },
            ...prev
          ]);
        }
        if (res.data.completed_at) {
          setRemarks(prev => [
            { time: res.data.completed_at, user: '系统', content: '订单已完成' },
            ...prev
          ]);
        }
      } else {
        toast.error('获取订单详情失败');
        navigate('/admin/orders');
      }
    } catch (error) {
      console.error('获取订单详情失败:', error);
      toast.error('获取订单详情失败');
      navigate('/admin/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRemark = () => {
    if (!remark.trim()) return;
    setRemarks([
      { time: new Date().toLocaleString(), user: '管理员', content: remark },
      ...remarks
    ]);
    setRemark('');
    toast.success('备注添加成功');
  };

  const handleShipOrder = async () => {
    if (!trackingNo.trim()) {
      toast.error('请输入物流单号');
      return;
    }

    setActionLoading(true);
    try {
      const res = await adminApi.shipOrder(id!, {
        logistics_company: shippingCompany,
        logistics_no: trackingNo
      });
      if (res.success) {
        toast.success('发货成功');
        setShowShipModal(false);
        fetchOrder();
      } else {
        toast.error(res.error?.message || '发货失败');
      }
    } catch (error) {
      console.error('发货失败:', error);
      toast.error('发货失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    setActionLoading(true);
    try {
      const res = await adminApi.cancelOrder(id!);
      if (res.success) {
        toast.success('订单已取消');
        setShowCancelModal(false);
        fetchOrder();
      } else {
        toast.error(res.error?.message || '取消订单失败');
      }
    } catch (error) {
      console.error('取消订单失败:', error);
      toast.error('取消订单失败');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING_PAYMENT:
        return 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400';
      case OrderStatus.PENDING_SHIPMENT:
        return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400';
      case OrderStatus.SHIPPED:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400';
      case OrderStatus.COMPLETED:
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
      case OrderStatus.REFUNDING:
        return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400';
      case OrderStatus.CANCELLED:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const getFullAddress = () => {
    if (!order?.address_snapshot) return '-';
    const { province, city, district, detail } = order.address_snapshot;
    return `${province || ''}${city || ''}${district || ''}${detail || ''}`;
  };

  if (loading) {
    return <div className="p-8"><DetailSkeleton /></div>;
  }

  if (!order) {
    return <div className="p-8 text-center text-slate-500">订单不存在</div>;
  }

  const discount = order.total_amount - order.paid_amount;

  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/orders')}
            className="p-2 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">订单详情</h1>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
            {OrderStatusLabel[order.status]}
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
            {OrderTypeLabel[order.type]}
          </span>
        </div>
        <div className="flex gap-3">
          {order.status === OrderStatus.PENDING_SHIPMENT && (
            <button
              onClick={() => setShowShipModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              发货
            </button>
          )}
          {(order.status === OrderStatus.PENDING_SHIPMENT || order.status === OrderStatus.SHIPPED) && (
            <button
              onClick={() => setShowRefundModal(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              退款
            </button>
          )}
          {(order.status === OrderStatus.PENDING_PAYMENT || order.status === OrderStatus.PENDING_SHIPMENT) && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shadow-sm"
            >
              关闭订单
            </button>
          )}
          <button className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
            打印订单
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Info & Products */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Info Card */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">订单信息</h2>
            </div>
            <div className="p-6 grid grid-cols-2 gap-y-4 gap-x-6">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">订单编号</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{order.order_no}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">下单时间</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{formatDate(order.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">支付方式</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{order.payment_method || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">支付时间</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{formatDate(order.payment_time)}</p>
              </div>
              {order.note && (
                <div className="col-span-2">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">买家备注</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{order.note}</p>
                </div>
              )}
            </div>
          </div>

          {/* Products Card */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">商品明细</h2>
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
                    <th className="p-4 font-medium">商品</th>
                    <th className="p-4 font-medium">规格</th>
                    <th className="p-4 font-medium text-right">单价</th>
                    <th className="p-4 font-medium text-right">数量</th>
                    <th className="p-4 font-medium text-right">小计</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {order.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.product_image || '/placeholder.png'}
                            alt={item.product_name}
                            className="w-12 h-12 rounded-lg object-cover bg-slate-100 dark:bg-slate-700"
                          />
                          <p className="text-sm font-medium text-slate-900 dark:text-white max-w-[200px] truncate" title={item.product_name}>
                            {item.product_name}
                          </p>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{item.spec || '-'}</td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-300 text-right">¥{item.price.toFixed(2)}</td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-300 text-right">{item.quantity}</td>
                      <td className="p-4 text-sm font-medium text-slate-900 dark:text-white text-right">¥{(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>商品小计</span>
                  <span>¥{order.total_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>运费</span>
                  <span>¥0.00</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>优惠折扣</span>
                    <span className="text-red-500">-¥{discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <span className="font-medium text-slate-900 dark:text-white">实付金额</span>
                  <span className="text-xl font-bold text-primary">¥{order.paid_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Distribution Commission Details */}
          {order.referrer && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">分销信息</h2>
              </div>
              <div className="p-6">
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700/50">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">推荐人</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{order.referrer.name} ({order.referrer.phone})</p>
                </div>
              </div>
            </div>
          )}

          {/* Logistics Info */}
          {(order.status === OrderStatus.SHIPPED || order.status === OrderStatus.COMPLETED || order.logistics_no) && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">物流信息</h2>
                {order.logistics_no && (
                  <span className="text-sm text-slate-500">{order.logistics_company}: {order.logistics_no}</span>
                )}
              </div>
              <div className="p-6">
                {order.shipped_at ? (
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                      </div>
                      <div>
                        <p className="text-sm text-slate-900 dark:text-white font-medium">
                          商家已发货，物流公司: {order.logistics_company}, 单号: {order.logistics_no}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">{formatDate(order.shipped_at)}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">等待发货</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Customer Info & Remarks */}
        <div className="space-y-6">
          {/* Customer Card */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">收货人信息</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-slate-400 mt-0.5">person</span>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-0.5">姓名</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{order.address_snapshot?.name || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-slate-400 mt-0.5">phone_iphone</span>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-0.5">联系电话</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{order.address_snapshot?.phone || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-slate-400 mt-0.5">location_on</span>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-0.5">收货地址</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white leading-relaxed">{getFullAddress()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">下单用户</h2>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-slate-400">person</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{order.user?.name || '-'}</p>
                  <p className="text-xs text-slate-500">{order.user?.phone || '-'}</p>
                </div>
                <button
                  onClick={() => navigate(`/admin/users/${order.user?.id}`)}
                  className="ml-auto text-primary text-sm font-medium hover:underline"
                >
                  查看用户
                </button>
              </div>
            </div>
          </div>

          {/* Order Remarks */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">订单备注</h2>
            </div>
            <div className="p-6 flex flex-col h-[300px]">
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                {remarks.map((rm, idx) => (
                  <div key={idx} className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{rm.user}</span>
                      <span className="text-xs text-slate-400">{rm.time}</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{rm.content}</p>
                  </div>
                ))}
              </div>
              <div className="mt-auto">
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="添加内部备注..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary dark:focus:border-primary transition-colors resize-none mb-2"
                  rows={3}
                ></textarea>
                <button
                  onClick={handleAddRemark}
                  className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  添加备注
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ship Modal */}
      {showShipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">订单发货</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">物流公司</label>
                <select
                  value={shippingCompany}
                  onChange={(e) => setShippingCompany(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
                >
                  <option value="顺丰速运">顺丰速运</option>
                  <option value="中通快递">中通快递</option>
                  <option value="圆通速递">圆通速递</option>
                  <option value="京东物流">京东物流</option>
                  <option value="韵达快递">韵达快递</option>
                  <option value="邮政EMS">邮政EMS</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">物流单号</label>
                <input
                  type="text"
                  value={trackingNo}
                  onChange={(e) => setTrackingNo(e.target.value)}
                  placeholder="请输入物流单号"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowShipModal(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleShipOrder}
                disabled={actionLoading}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {actionLoading ? '处理中...' : '确认发货'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">关闭订单</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              确定要关闭此订单吗？关闭后订单状态将变为已取消。
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? '处理中...' : '确认关闭'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">订单退款</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  退款金额 (最多 ¥{order.paid_amount.toFixed(2)})
                </label>
                <input
                  type="number"
                  defaultValue={order.paid_amount}
                  max={order.paid_amount}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">退款原因</label>
                <textarea
                  rows={3}
                  placeholder="请输入退款原因"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors resize-none"
                ></textarea>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowRefundModal(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  toast.error('退款功能暂未开放');
                  setShowRefundModal(false);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                确认退款
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}