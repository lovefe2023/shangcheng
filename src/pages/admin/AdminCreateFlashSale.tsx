import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi, productsApi } from '../../lib/api';

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  stock: number;
}

export default function AdminCreateFlashSale() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // 商品选择
  const [showProductModal, setShowProductModal] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productSearch, setProductSearch] = useState('');

  // 表单数据
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [flashPrice, setFlashPrice] = useState('');
  const [stock, setStock] = useState('');
  const [limitPerUser, setLimitPerUser] = useState('0');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productsApi.getList({ pageSize: 100, status: 'on_shelves' });
      if (res.success && res.data) {
        setProducts(res.data.list || res.data || []);
      }
    } catch (error) {
      console.error('Fetch products error:', error);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleSave = async () => {
    // 验证时间
    if (!startTime || !endTime) {
      showToast('请选择活动时间段', 'error');
      return;
    }
    if (new Date(startTime) >= new Date(endTime)) {
      showToast('结束时间必须晚于开始时间', 'error');
      return;
    }

    // 验证商品
    if (!selectedProduct) {
      showToast('请选择商品', 'error');
      return;
    }

    // 验证秒杀价
    const flashPriceNum = parseFloat(flashPrice) || 0;
    if (flashPriceNum <= 0) {
      showToast('请输入有效的秒杀价格', 'error');
      return;
    }
    if (flashPriceNum >= selectedProduct.price) {
      showToast('秒杀价应低于商品原价', 'error');
      return;
    }

    // 验证库存
    const stockNum = parseInt(stock) || 0;
    if (stockNum <= 0) {
      showToast('请输入秒杀库存', 'error');
      return;
    }
    if (stockNum > selectedProduct.stock) {
      showToast('秒杀库存不能超过商品库存', 'error');
      return;
    }

    setSaving(true);

    try {
      const res = await adminApi.createFlashSale({
        product_id: selectedProduct.id,
        flash_price: flashPriceNum,
        stock: stockNum,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        limit_per_user: parseInt(limitPerUser) || 0
      });

      if (res.success) {
        showToast('秒杀活动创建成功');
        setTimeout(() => {
          navigate('/admin/marketing');
        }, 1000);
      } else {
        showToast(res.error?.message || '创建失败', 'error');
      }
    } catch (error) {
      console.error('Create flash sale error:', error);
      showToast('创建失败，请重试', 'error');
    } finally {
      setSaving(false);
    }
  };

  // 过滤商品列表
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in ${
          toastType === 'error' ? 'bg-red-600 text-white' : 'bg-slate-800 text-white'
        }`}>
          <span className={`material-symbols-outlined ${toastType === 'error' ? 'text-red-200' : 'text-amber-400'}`}>
            {toastType === 'error' ? 'error' : 'info'}
          </span>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/admin/marketing')}
          className="p-2 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">创建秒杀活动</h1>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* 基本信息 */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">基本信息</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                活动时间段 <span className="text-red-500">*</span>
              </label>
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
            </div>
          </div>
        </div>

        {/* 商品设置 */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">商品设置</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                选择商品 <span className="text-red-500">*</span>
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
                      <p className="text-xs text-slate-500 mt-0.5">
                        原价: ¥{selectedProduct.price.toFixed(2)} | 库存: {selectedProduct.stock}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="text-sm text-red-500 hover:underline"
                  >
                    重新选择
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowProductModal(true)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  从商品库选择
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  秒杀价 (元) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={flashPrice}
                  onChange={(e) => setFlashPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
                />
                {selectedProduct && (
                  <p className="text-xs text-slate-500 mt-1">原价: ¥{selectedProduct.price.toFixed(2)}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  秒杀库存 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="独立于商品总库存"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
                />
                {selectedProduct && (
                  <p className="text-xs text-slate-500 mt-1">商品库存: {selectedProduct.stock}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  每人限购 (件)
                </label>
                <input
                  type="number"
                  value={limitPerUser}
                  onChange={(e) => setLimitPerUser(e.target.value)}
                  placeholder="0表示不限购"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 flex justify-end gap-4 bg-slate-50 dark:bg-slate-900/50">
          <button
            onClick={() => navigate('/admin/marketing')}
            disabled={saving}
            className="px-6 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-white dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {saving && (
              <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
            )}
            {saving ? '保存中...' : '保存并发布'}
          </button>
        </div>
      </div>

      {/* Product Selection Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-2xl shadow-xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">选择商品</h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="text-slate-400 hover:text-slate-500"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="mb-4 relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="搜索商品名称..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="max-h-[400px] overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg">
              {loading ? (
                <div className="p-8 text-center text-slate-500">
                  <span className="material-symbols-outlined animate-spin text-2xl">progress_activity</span>
                  <p className="mt-2 text-sm">加载中...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <p className="text-sm">暂无可用商品</p>
                </div>
              ) : (
                filteredProducts.map(p => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={p.images?.[0] || ''}
                        alt={p.name}
                        className="w-12 h-12 rounded object-cover"
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{p.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          ¥{p.price.toFixed(2)} | 库存: {p.stock}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedProduct(p);
                        setShowProductModal(false);
                        setProductSearch('');
                      }}
                      className="px-3 py-1.5 bg-primary/10 text-primary rounded text-sm font-medium hover:bg-primary hover:text-white transition-colors"
                    >
                      选择
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}