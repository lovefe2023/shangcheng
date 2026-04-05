import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Empty from '../../components/Empty';
import { ListSkeleton } from '../../components/Skeleton';
import { adminApi } from '../../lib/api';

interface GroupBuyRecord {
  id: string;
  order_no: string;
  user_id: string;
  paid_amount: number;
  created_at: string;
  status: string;
  user?: {
    id: string;
    name: string;
    phone: string;
    avatar?: string;
  };
}

interface GroupBuyInfo {
  id: string;
  product_id: string;
  group_price: number;
  min_quantity: number;
  current_quantity: number;
  status: string;
  product?: {
    id: string;
    name: string;
    images: string[];
  };
}

export default function AdminGroupBuyDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);

  // Data states
  const [groupBuy, setGroupBuy] = useState<GroupBuyInfo | null>(null);
  const [records, setRecords] = useState<GroupBuyRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Filter states
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (id) {
      fetchRecords();
    }
  }, [id, page, statusFilter]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getGroupBuyRecords(id!, {
        page,
        pageSize
      });

      if (res.success && res.data) {
        setGroupBuy(res.data.groupBuy);
        setRecords(res.data.list || []);
        setTotal(res.data.total || 0);
      } else {
        // 如果没有数据，可能是字段不存在，显示空状态
        setRecords([]);
        setTotal(0);
      }
    } catch (error) {
      console.error('Get group buy records error:', error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const maskPhone = (phone: string) => {
    if (!phone) return '-';
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  };

  const totalPages = Math.ceil(total / pageSize);

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending_payment': '待付款',
      'pending_shipment': '待发货',
      'shipped': '已发货',
      'completed': '已完成',
      'cancelled': '已取消'
    };
    return statusMap[status] || status;
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/admin/marketing')}
          className="p-2 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">参团记录</h1>
          <p className="text-sm text-slate-500 mt-1">
            {groupBuy?.product?.name || `团购活动 ID: ${id}`}
          </p>
        </div>
      </div>

      {/* 活动信息 */}
      {groupBuy && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 mb-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <img
                src={groupBuy.product?.images?.[0] || ''}
                alt=""
                className="w-12 h-12 rounded object-cover"
              />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {groupBuy.product?.name || '未知商品'}
                </p>
                <p className="text-xs text-slate-500">
                  团购价: ¥{groupBuy.group_price} | 成团人数: {groupBuy.min_quantity}人
                </p>
              </div>
            </div>
            <div className="ml-auto text-right">
              <p className="text-sm text-slate-500">当前参团人数</p>
              <p className="text-xl font-bold text-primary">{groupBuy.current_quantity}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Table */}
        {loading ? (
          <div className="p-4"><ListSkeleton count={5} /></div>
        ) : records.length === 0 ? (
          <Empty
            icon="group"
            title="暂无参团记录"
            description="该团购活动暂无参与者"
            className="py-10"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
                  <th className="p-4 font-medium">订单号</th>
                  <th className="p-4 font-medium">参团用户</th>
                  <th className="p-4 font-medium">支付金额</th>
                  <th className="p-4 font-medium">参团时间</th>
                  <th className="p-4 font-medium">订单状态</th>
                  <th className="p-4 font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="p-4 text-sm font-medium text-slate-900 dark:text-white">
                      {record.order_no || record.id.slice(0, 8)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                          {record.user?.avatar ? (
                            <img src={record.user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-slate-500 text-[18px]">person</span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {record.user?.name || '未知用户'}
                          </p>
                          <p className="text-xs text-slate-500">{maskPhone(record.user?.phone || '')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm font-bold text-primary">
                      ¥{record.paid_amount?.toFixed(2) || '0.00'}
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                      {formatDate(record.created_at)}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        record.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        record.status === 'pending_payment' ? 'bg-amber-100 text-amber-700' :
                        record.status === 'pending_shipment' ? 'bg-blue-100 text-blue-700' :
                        record.status === 'shipped' ? 'bg-purple-100 text-purple-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {getStatusLabel(record.status)}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => navigate(`/admin/orders/${record.id}`)}
                        className="text-primary text-sm font-medium hover:underline"
                      >
                        查看订单
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 0 && (
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
                disabled={page >= totalPages}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}