import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Empty from '../../components/Empty';
import { ListSkeleton } from '../../components/Skeleton';
import { useToast } from '../../components/Toast';
import { adminApi } from '../../lib/api';
import { OrderStatus, OrderType, OrderStatusLabel, OrderTypeLabel } from '../../types';

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
  type: OrderType;
  status: OrderStatus;
  total_amount: number;
  paid_amount: number;
  payment_method: string;
  payment_time: string;
  created_at: string;
  user: {
    name: string;
    phone: string;
  };
  items: OrderItem[];
  referrer?: {
    name: string;
    id: string;
  };
}

export default function AdminOrders() {
  const navigate = useNavigate();
  const toast = useToast();
  const [showExportModal, setShowExportModal] = useState(false);

  // Data states
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter, typeFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getOrders({
        page,
        pageSize,
        keyword: searchQuery || undefined,
        type: typeFilter || undefined,
        status: statusFilter || undefined,
        date: dateFilter || undefined
      });

      if (res.success && res.data) {
        setOrders(res.data.list || []);
        setTotal(res.data.total || 0);
      } else {
        toast.error('获取订单列表失败');
      }
    } catch (error) {
      console.error('获取订单列表失败:', error);
      toast.error('获取订单列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchOrders();
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
    return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">订单管理</h1>
        <button
          onClick={() => setShowExportModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-[20px]">download</span>
          导出订单
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4 items-center w-full">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
              <input
                type="text"
                placeholder="搜索订单号/手机号..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-64"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm rounded-lg px-3 py-2 outline-none"
            >
              <option value="">订单类型</option>
              <option value={OrderType.NORMAL}>{OrderTypeLabel[OrderType.NORMAL]}</option>
              <option value={OrderType.FLASH_SALE}>{OrderTypeLabel[OrderType.FLASH_SALE]}</option>
              <option value={OrderType.GROUP_BUY}>{OrderTypeLabel[OrderType.GROUP_BUY]}</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm rounded-lg px-3 py-2 outline-none"
            >
              <option value="">所有状态</option>
              <option value={OrderStatus.PENDING_PAYMENT}>{OrderStatusLabel[OrderStatus.PENDING_PAYMENT]}</option>
              <option value={OrderStatus.PENDING_SHIPMENT}>{OrderStatusLabel[OrderStatus.PENDING_SHIPMENT]}</option>
              <option value={OrderStatus.SHIPPED}>{OrderStatusLabel[OrderStatus.SHIPPED]}</option>
              <option value={OrderStatus.COMPLETED}>{OrderStatusLabel[OrderStatus.COMPLETED]}</option>
              <option value={OrderStatus.REFUNDING}>{OrderStatusLabel[OrderStatus.REFUNDING]}</option>
              <option value={OrderStatus.CANCELLED}>{OrderStatusLabel[OrderStatus.CANCELLED]}</option>
            </select>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm rounded-lg px-3 py-2 outline-none text-slate-500"
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium"
            >
              搜索
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-4"><ListSkeleton count={5} /></div>
          ) : orders.length === 0 ? (
            <Empty
              icon="search_off"
              title="未找到订单"
              description="没有找到符合条件的订单，请尝试更改搜索条件"
              actionText="清除筛选"
              onAction={() => {
                setSearchQuery('');
                setTypeFilter('');
                setStatusFilter('');
                setDateFilter('');
                setPage(1);
              }}
              className="py-10"
            />
          ) : (
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
                  <th className="p-4 font-medium">订单编号/类型</th>
                  <th className="p-4 font-medium">下单用户</th>
                  <th className="p-4 font-medium">商品信息</th>
                  <th className="p-4 font-medium">金额明细</th>
                  <th className="p-4 font-medium">支付信息</th>
                  <th className="p-4 font-medium">状态</th>
                  <th className="p-4 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="p-4">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{order.order_no}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-medium ${
                        order.type === OrderType.NORMAL ? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' :
                        order.type === OrderType.FLASH_SALE ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' :
                        'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                      }`}>
                        {OrderTypeLabel[order.type]}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-slate-900 dark:text-white">{order.user?.name || '-'}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{order.user?.phone || '-'}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {order.items?.[0] && (
                          <img src={order.items[0].product_image} alt="商品" className="w-10 h-10 rounded object-cover border border-slate-200 dark:border-slate-700" />
                        )}
                        <div>
                          <p className="text-sm text-slate-900 dark:text-white max-w-[150px] truncate">
                            {order.items?.[0]?.product_name || '-'}
                          </p>
                          {order.items && order.items.length > 1 && (
                            <p className="text-xs text-slate-400">+{order.items.length - 1}件</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-slate-500">总额: <span className="line-through">¥{order.total_amount.toLocaleString()}</span></p>
                      <p className="text-sm font-bold text-primary mt-0.5">实付: ¥{order.paid_amount.toLocaleString()}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-slate-900 dark:text-white">{order.payment_method || '-'}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{formatDate(order.payment_time)}</p>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                        {OrderStatusLabel[order.status]}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex flex-col items-end gap-2">
                        <button onClick={() => navigate(`/admin/orders/${order.id}`)} className="text-primary text-sm font-medium hover:underline">
                          查看详情
                        </button>
                        <div className="flex items-center gap-2">
                          {order.status === OrderStatus.PENDING_SHIPMENT && (
                            <button className="text-emerald-600 dark:text-emerald-400 text-xs font-medium hover:underline">
                              发货
                            </button>
                          )}
                          {order.status === OrderStatus.REFUNDING && (
                            <button className="text-red-600 dark:text-red-400 text-xs font-medium hover:underline">
                              处理售后
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-sm">
            <span className="text-slate-500">共 {total} 条记录，当前 {page}/{totalPages} 页</span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
              >
                上一页
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">导出订单数据</h3>
              <button onClick={() => setShowExportModal(false)} className="text-slate-400 hover:text-slate-500">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">请选择需要导出的字段：</p>
              <div className="grid grid-cols-2 gap-3">
                {['订单号', '订单类型', '下单用户', '手机号', '商品信息', '订单金额', '实付金额', '支付方式', '支付时间', '订单状态', '收货地址'].map((field, idx) => (
                  <label key={idx} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-primary focus:ring-primary" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{field}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setShowExportModal(false);
                  toast.success('报表导出成功');
                }}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                确认导出
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}