import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { OrderStatus, OrderType } from '../../types';

export default function AdminOrderDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  // Mock fetching order data
  const [order, setOrder] = useState<any>(null);
  const [remark, setRemark] = useState('');
  const [showShipModal, setShowShipModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [shippingCompany, setShippingCompany] = useState('顺丰速运');
  const [trackingNo, setTrackingNo] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 3000);
  };

  useEffect(() => {
    // Simulate API call
    setOrder({
      id: id || 'ORD-20231024-001',
      type: OrderType.NORMAL,
      status: OrderStatus.PENDING_SHIPMENT,
      createdAt: '2023-10-24 14:30:00',
      paymentMethod: '微信支付',
      paymentTime: '2023-10-24 14:32:15',
      customer: {
        name: '张三',
        phone: '13812345678',
        address: '广东省深圳市南山区科技园高新南九道9号',
      },
      products: [
        {
          id: 'P1001',
          name: '飞天茅台 53度 500ml 酱香型白酒',
          price: 2999.00,
          quantity: 1,
          img: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=200&auto=format&fit=crop'
        }
      ],
      summary: {
        subtotal: 2999.00,
        shipping: 0.00,
        discount: 100.00,
        total: 2899.00
      },
      logistics: {
        company: '顺丰速运',
        trackingNo: 'SF1234567890123',
        status: '等待揽收',
        history: [
          { time: '2023-10-24 15:00:00', desc: '商家已通知快递揽件' }
        ]
      },
      commission: {
        referrer: '李总 (U10001)',
        referrerReward: 50.00,
        salesCommission: 150.00,
        dividendPool: 50.00
      },
      remarks: [
        { time: '2023-10-24 14:35:00', user: '系统', content: '用户支付成功' }
      ]
    });
  }, [id]);

  if (!order) return <div className="p-8 text-center text-slate-500">加载中...</div>;

  const handleAddRemark = () => {
    if (!remark.trim()) return;
    setOrder({
      ...order,
      remarks: [{ time: new Date().toLocaleString(), user: '管理员', content: remark }, ...order.remarks]
    });
    setRemark('');
    showToast('备注添加成功');
  };

  const handleShipOrder = () => {
    if (!trackingNo.trim()) {
      showToast('请输入物流单号');
      return;
    }
    
    setOrder({
      ...order,
      status: OrderStatus.SHIPPED,
      logistics: {
        company: shippingCompany,
        trackingNo: trackingNo,
        status: '已发货',
        history: [
          { time: new Date().toLocaleString(), desc: '商家已发货，等待快递揽收' },
          ...order.logistics.history
        ]
      }
    });
    
    setShowShipModal(false);
    showToast('发货成功');
  };

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
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
            order.status === OrderStatus.PENDING_SHIPMENT ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
            order.status === OrderStatus.SHIPPED ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
            order.status === OrderStatus.COMPLETED ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
            order.status === OrderStatus.CANCELLED ? 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' :
            'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400'
          }`}>
            {order.status}
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
            {order.type}
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
            <button className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shadow-sm">
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
                <p className="text-sm font-medium text-slate-900 dark:text-white">{order.id}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">下单时间</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{order.createdAt}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">支付方式</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{order.paymentMethod}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">支付时间</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{order.paymentTime}</p>
              </div>
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
                    <th className="p-4 font-medium text-right">单价</th>
                    <th className="p-4 font-medium text-right">数量</th>
                    <th className="p-4 font-medium text-right">小计</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {order.products.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={item.img} alt={item.name} className="w-12 h-12 rounded-lg object-cover bg-slate-100 dark:bg-slate-700" />
                          <p className="text-sm font-medium text-slate-900 dark:text-white max-w-[200px] truncate" title={item.name}>{item.name}</p>
                        </div>
                      </td>
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
                  <span>¥{order.summary.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>运费</span>
                  <span>¥{order.summary.shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>优惠折扣</span>
                  <span className="text-red-500">-¥{order.summary.discount.toFixed(2)}</span>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <span className="font-medium text-slate-900 dark:text-white">实付金额</span>
                  <span className="text-xl font-bold text-primary">¥{order.summary.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Distribution Commission Details */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">分销分成明细</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700/50">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">推荐人</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{order.commission.referrer}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700/50">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">推荐奖励</p>
                  <p className="text-sm font-bold text-blue-600 dark:text-blue-400">¥{order.commission.referrerReward.toFixed(2)}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700/50">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">销售提成</p>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">¥{order.commission.salesCommission.toFixed(2)}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700/50">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">分红池贡献</p>
                  <p className="text-sm font-bold text-purple-600 dark:text-purple-400">¥{order.commission.dividendPool.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Logistics Info */}
          {(order.status === OrderStatus.SHIPPED || order.status === OrderStatus.COMPLETED || order.logistics?.trackingNo) && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">物流信息</h2>
                <span className="text-sm text-slate-500">{order.logistics.company}: {order.logistics.trackingNo}</span>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {order.logistics.history.map((item: any, idx: number) => (
                    <div key={idx} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${idx === 0 ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                        {idx !== order.logistics.history.length - 1 && <div className="w-px h-full bg-slate-200 dark:bg-slate-700 my-1"></div>}
                      </div>
                      <div className="pb-4">
                        <p className={`text-sm ${idx === 0 ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-500 dark:text-slate-400'}`}>{item.desc}</p>
                        <p className="text-xs text-slate-400 mt-1">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
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
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{order.customer.name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-slate-400 mt-0.5">phone_iphone</span>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-0.5">联系电话</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{order.customer.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-slate-400 mt-0.5">location_on</span>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-0.5">收货地址</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white leading-relaxed">{order.customer.address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Remarks */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">订单备注</h2>
            </div>
            <div className="p-6 flex flex-col h-[400px]">
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                {order.remarks.map((rm: any, idx: number) => (
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

      {/* Modals */}
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] bg-slate-800 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in">
          <span className="material-symbols-outlined text-emerald-400">check_circle</span>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

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
              <button onClick={() => setShowShipModal(false)} className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">取消</button>
              <button onClick={handleShipOrder} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">确认发货</button>
            </div>
          </div>
        </div>
      )}

      {showRefundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">订单退款</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">退款金额 (最多 ¥{order.summary.total.toFixed(2)})</label>
                <input type="number" defaultValue={order.summary.total} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">退款原因</label>
                <textarea rows={3} placeholder="请输入退款原因" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors resize-none"></textarea>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowRefundModal(false)} className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">取消</button>
              <button onClick={() => setShowRefundModal(false)} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">确认退款</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
