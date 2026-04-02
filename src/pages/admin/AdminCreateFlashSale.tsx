import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminCreateFlashSale() {
  const navigate = useNavigate();
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2000);
  };

  const handleSave = () => {
    if (!startTime || !endTime) {
      showToast('请选择活动时间段');
      return;
    }
    if (new Date(startTime) >= new Date(endTime)) {
      showToast('结束时间必须晚于开始时间');
      return;
    }
    if (!selectedProduct) {
      showToast('请选择商品');
      return;
    }
    
    showToast('保存成功');
    setTimeout(() => {
      navigate('/admin/marketing');
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
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
                活动名称 <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                placeholder="例如：周末高端白酒秒杀" 
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
              />
            </div>
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
                    <img src={selectedProduct.img} alt={selectedProduct.name} className="w-12 h-12 rounded object-cover" />
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedProduct.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">原价: ¥{selectedProduct.price.toFixed(2)}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedProduct(null)} className="text-sm text-red-500 hover:underline">重新选择</button>
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
                  placeholder="0.00" 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  秒杀库存 <span className="text-red-500">*</span>
                </label>
                <input 
                  type="number" 
                  placeholder="独立于商品总库存" 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  每人限购 (件) <span className="text-red-500">*</span>
                </label>
                <input 
                  type="number" 
                  placeholder="0表示不限购" 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 页面配置 */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">活动页面配置</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                活动 Banner 图
              </label>
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">add_photo_alternate</span>
                <p className="text-sm text-slate-600 dark:text-slate-400">点击上传 Banner 图片</p>
                <p className="text-xs text-slate-400 mt-1">建议尺寸 750x300px，支持 JPG、PNG 格式</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                活动说明 (富文本)
              </label>
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-2 flex gap-2">
                  <button className="p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded"><span className="material-symbols-outlined text-[18px]">format_bold</span></button>
                  <button className="p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded"><span className="material-symbols-outlined text-[18px]">format_italic</span></button>
                  <button className="p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded"><span className="material-symbols-outlined text-[18px]">format_list_bulleted</span></button>
                  <button className="p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded"><span className="material-symbols-outlined text-[18px]">image</span></button>
                </div>
                <textarea 
                  rows={6}
                  placeholder="请输入活动规则、发货说明等..."
                  className="w-full p-4 text-sm outline-none bg-white dark:bg-slate-800 resize-none"
                ></textarea>
              </div>
            </div>
          </div>
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
            className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            保存并发布
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[110] bg-black/80 text-white px-6 py-3 rounded-lg flex items-center gap-2 animate-in fade-in zoom-in duration-200">
          <span className="material-symbols-outlined text-green-400">info</span>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Product Selection Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-2xl shadow-xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">选择商品</h3>
              <button onClick={() => setShowProductModal(false)} className="text-slate-400 hover:text-slate-500">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="mb-4 relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
              <input 
                type="text" 
                placeholder="搜索商品名称..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="max-h-[400px] overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg">
              {[
                { id: 1, name: '飞天茅台 53度 500ml 酱香型白酒', price: 2999.00, img: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80' },
                { id: 2, name: '五粮液 普五 52度 500ml 浓香型白酒', price: 1499.00, img: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80' },
                { id: 3, name: '剑南春 水晶剑 52度 500ml 浓香型白酒', price: 489.00, img: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80' },
              ].map(p => (
                <div key={p.id} className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                  <div className="flex items-center gap-3">
                    <img src={p.img} alt={p.name} className="w-12 h-12 rounded object-cover" />
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{p.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">¥{p.price.toFixed(2)}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedProduct(p);
                      setShowProductModal(false);
                    }}
                    className="px-3 py-1.5 bg-primary/10 text-primary rounded text-sm font-medium hover:bg-primary hover:text-white transition-colors"
                  >
                    选择
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
