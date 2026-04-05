import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../../components/Toast';
import { adminApi } from '../../lib/api';
import { CampaignStatus } from '../../types';

interface Product {
  id: string;
  name: string;
  images: string[];
  price: number;
  original_price: number;
}

interface FlashSale {
  id: string;
  product_id: string;
  flash_price: number;
  stock: number;
  sold_count: number;
  start_time: string;
  end_time: string;
  status: CampaignStatus;
  product?: Product;
}

export default function AdminEditFlashSale() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    flash_price: '',
    stock: '',
    limit_per_user: '0',
    start_time: '',
    end_time: '',
    description: ''
  });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (id) {
      fetchFlashSale();
    }
  }, [id]);

  const fetchFlashSale = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getFlashSale(id!);
      if (res.success && res.data) {
        const flashSale = res.data;
        setSelectedProduct(flashSale.product || null);
        setFormData({
          name: '',
          flash_price: String(flashSale.flash_price || ''),
          stock: String(flashSale.stock || ''),
          limit_per_user: String(flashSale.limit_per_user || '0'),
          start_time: flashSale.start_time ? flashSale.start_time.slice(0, 16) : '',
          end_time: flashSale.end_time ? flashSale.end_time.slice(0, 16) : '',
          description: ''
        });
      } else {
        toast.error('秒杀活动不存在');
        navigate('/admin/marketing');
      }
    } catch (error) {
      console.error('Get flash sale error:', error);
      toast.error('获取活动信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.start_time || !formData.end_time) {
      toast.error('请选择活动时间段');
      return;
    }
    if (new Date(formData.start_time) >= new Date(formData.end_time)) {
      toast.error('结束时间必须晚于开始时间');
      return;
    }
    if (!selectedProduct) {
      toast.error('请选择商品');
      return;
    }
    if (!formData.flash_price || parseFloat(formData.flash_price) <= 0) {
      toast.error('请输入正确的秒杀价');
      return;
    }
    if (!formData.stock || parseInt(formData.stock) <= 0) {
      toast.error('请输入正确的库存');
      return;
    }

    setSaving(true);
    try {
      const res = await adminApi.updateFlashSale(id!, {
        flash_price: parseFloat(formData.flash_price),
        stock: parseInt(formData.stock),
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
        limit_per_user: parseInt(formData.limit_per_user) || 0
      });

      if (res.success) {
        toast.success('保存成功');
        navigate('/admin/marketing');
      } else {
        toast.error(res.error?.message || '保存失败');
      }
    } catch (error) {
      console.error('Update flash sale error:', error);
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto pb-12">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/admin/marketing')}
          className="p-2 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">编辑秒杀活动</h1>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* 基本信息 */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">基本信息</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                活动名称
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例如：周末高端白酒秒杀"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                活动时间段 <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors text-slate-900 dark:text-white"
                />
                <span className="text-slate-400">-</span>
                <input
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 商品设置 */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">商品设置</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                已选商品
              </label>
              {selectedProduct ? (
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedProduct.images?.[0] || ''}
                      alt={selectedProduct.name}
                      className="w-12 h-12 rounded object-cover"
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedProduct.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">原价: ¥{(selectedProduct.original_price || selectedProduct.price)?.toLocaleString()}</p>
                    </div>
                  </div>
                  <span className="text-sm text-slate-500">不可更改</span>
                </div>
              ) : (
                <p className="text-sm text-slate-500">未选择商品</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  秒杀价 (元) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.flash_price}
                  onChange={(e) => setFormData({ ...formData, flash_price: e.target.value })}
                  placeholder="0.00"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  秒杀库存 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="独立于商品总库存"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  每人限购 (件)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.limit_per_user}
                  onChange={(e) => setFormData({ ...formData, limit_per_user: e.target.value })}
                  placeholder="0表示不限购"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 活动说明 */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">活动说明</h2>
          <textarea
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="请输入活动规则、发货说明等..."
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-sm outline-none focus:border-primary transition-colors text-slate-900 dark:text-white resize-none"
          />
        </div>

        {/* Actions */}
        <div className="p-6 flex justify-end gap-4 bg-slate-50 dark:bg-slate-900/50">
          <button
            onClick={() => navigate('/admin/marketing')}
            className="px-6 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-white dark:hover:bg-slate-800 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存修改'}
          </button>
        </div>
      </div>
    </div>
  );
}