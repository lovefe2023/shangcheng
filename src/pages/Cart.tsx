import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Empty from '../components/Empty';
import { CartListSkeleton } from '../components/Skeleton';
import { useToast } from '../components/Toast';
import { cartApi } from '../lib/api';
import { ProductStatus } from '../types';

interface CartItem {
  id: string;
  product_id: string;
  product: {
    id: string;
    name: string;
    images: string[];
    price: number;
    status: string;
    stock: number;
  };
  spec: string;
  quantity: number;
  selected: boolean;
}

export default function Cart() {
  const navigate = useNavigate();
  const toast = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const res = await cartApi.get();
      if (res.success && res.data) {
        // API returns { items: [...], total_amount, item_count }
        const items = res.data.items || res.data;
        setCartItems(items.map((item: any) => ({
          ...item,
          selected: item.selected ?? true
        })));
      }
    } catch (error) {
      console.error('获取购物车失败:', error);
      toast.error('获取购物车失败');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = async (id: string) => {
    const item = cartItems.find(i => i.id === id);
    if (!item || item.product.status !== ProductStatus.ON_SHELVES) return;

    const newSelected = !item.selected;
    setCartItems(items => items.map(i => i.id === id ? { ...i, selected: newSelected } : i));

    try {
      await cartApi.update(id, { selected: newSelected });
    } catch (error) {
      // 恢复状态
      setCartItems(items => items.map(i => i.id === id ? { ...i, selected: !newSelected } : i));
      toast.error('操作失败');
    }
  };

  const toggleAllSelect = async () => {
    const activeItems = cartItems.filter(item => item.product.status === ProductStatus.ON_SHELVES);
    if (activeItems.length === 0) return;

    const allSelected = activeItems.every(item => item.selected);
    const newSelected = !allSelected;

    setCartItems(items => items.map(item =>
      item.product.status === ProductStatus.ON_SHELVES ? { ...item, selected: newSelected } : item
    ));

    // 批量更新
    try {
      await Promise.all(activeItems.map(item => cartApi.update(item.id, { selected: newSelected })));
    } catch (error) {
      toast.error('操作失败');
      fetchCart(); // 重新获取
    }
  };

  const updateQuantity = async (id: string, delta: number) => {
    const item = cartItems.find(i => i.id === id);
    if (!item || item.product.status !== ProductStatus.ON_SHELVES) return;

    const newQuantity = Math.max(1, Math.min(item.product.stock, item.quantity + delta));
    if (newQuantity === item.quantity) return;

    setUpdating(id);
    try {
      const res = await cartApi.update(id, { quantity: newQuantity });
      if (res.success) {
        setCartItems(items => items.map(i => i.id === id ? { ...i, quantity: newQuantity } : i));
      } else {
        toast.error('更新失败');
      }
    } catch (error) {
      toast.error('更新失败');
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (id: string) => {
    try {
      const res = await cartApi.remove(id);
      if (res.success) {
        setCartItems(items => items.filter(i => i.id !== id));
        toast.success('已删除');
      } else {
        toast.error('删除失败');
      }
    } catch (error) {
      toast.error('删除失败');
    }
  };

  const clearInactiveItems = async () => {
    const inactiveIds = cartItems
      .filter(item => item.product.status !== ProductStatus.ON_SHELVES)
      .map(item => item.id);

    if (inactiveIds.length === 0) return;

    try {
      await Promise.all(inactiveIds.map(id => cartApi.remove(id)));
      setCartItems(items => items.filter(item => item.product.status === ProductStatus.ON_SHELVES));
      toast.success('已清空失效商品');
    } catch (error) {
      toast.error('操作失败');
    }
  };

  const activeItems = cartItems.filter(item => item.product.status === ProductStatus.ON_SHELVES);
  const inactiveItems = cartItems.filter(item => item.product.status !== ProductStatus.ON_SHELVES);
  const allActiveSelected = activeItems.length > 0 && activeItems.every(item => item.selected);
  const selectedItems = activeItems.filter(item => item.selected);
  const totalPrice = selectedItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      toast.warning('请选择商品');
      return;
    }
    const cartItemIds = selectedItems.map(item => item.id).join(',');
    navigate(`/checkout?cart_items=${cartItemIds}`);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="shrink-0 sticky top-0 z-10 flex items-center bg-white dark:bg-slate-900 p-4 border-b border-slate-200 dark:border-slate-800 justify-between">
        <Link to="/" className="text-slate-900 dark:text-slate-100 flex size-10 shrink-0 items-center justify-start">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-tight flex-1 text-center">购物车 ({cartItems.length})</h1>
        <div className="flex w-10 items-center justify-end"></div>
      </header>

      {/* Cart Content */}
      <main className="flex-1 overflow-y-auto pb-safe">
        {loading ? (
          <div className="p-4">
            <CartListSkeleton count={3} />
          </div>
        ) : cartItems.length === 0 ? (
          <Empty
            icon="shopping_cart"
            title="购物车是空的"
            description="再去逛逛吧，挑选一些心仪的商品"
            actionText="去逛逛"
            actionLink="/"
            className="mt-20"
          />
        ) : (
          <>
            {/* Active Items */}
            {activeItems.length > 0 && (
              <section className="mt-2 bg-white dark:bg-slate-900">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 dark:border-slate-800">
                  <span className="material-symbols-outlined text-slate-500">store</span>
                  <h2 className="text-slate-900 dark:text-slate-100 text-sm font-bold">购物车商品</h2>
                </div>

                {activeItems.map(item => (
                  <div key={item.id} className="flex gap-3 px-4 py-4 border-b border-slate-50 dark:border-slate-800 last:border-0">
                    <div className="flex items-center">
                      <input
                        checked={item.selected}
                        onChange={() => toggleSelect(item.id)}
                        className="rounded border-slate-300 text-primary focus:ring-primary h-5 w-5"
                        type="checkbox"
                      />
                    </div>
                    <Link to={`/product/${item.product_id}`} className="bg-center bg-no-repeat aspect-square bg-cover rounded-lg size-24 shrink-0 bg-slate-100 dark:bg-slate-800" style={{ backgroundImage: `url("${item.product.images?.[0]}")` }} />
                    <div className="flex flex-1 flex-col justify-between min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <Link to={`/product/${item.product_id}`} className="text-slate-900 dark:text-slate-100 text-sm font-medium line-clamp-2 flex-1 hover:text-primary">
                          {item.product.name}
                        </Link>
                        <button onClick={() => removeItem(item.id)} className="text-slate-400 hover:text-red-500 shrink-0">
                          <span className="material-symbols-outlined text-xl">delete</span>
                        </button>
                      </div>
                      {item.spec && (
                        <div className="mt-1 inline-flex items-center self-start rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5">
                          <span className="text-slate-500 dark:text-slate-400 text-xs">{item.spec}</span>
                        </div>
                      )}
                      <div className="flex items-end justify-between mt-2">
                        <div>
                          <p className="text-primary text-lg font-bold">¥{item.product.price.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</p>
                          {item.product.stock <= 10 && (
                            <p className="text-xs text-orange-500">仅剩{item.product.stock}件</p>
                          )}
                        </div>
                        <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden h-8">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            disabled={updating === item.id}
                            className="px-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 active:bg-slate-200 dark:active:bg-slate-700 disabled:opacity-50"
                          >
                            -
                          </button>
                          <input
                            className="w-10 text-center text-sm border-x border-slate-200 dark:border-slate-700 bg-transparent focus:outline-none"
                            type="number"
                            value={updating === item.id ? '...' : item.quantity}
                            readOnly
                          />
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            disabled={updating === item.id || item.quantity >= item.product.stock}
                            className="px-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 active:bg-slate-200 dark:active:bg-slate-700 disabled:opacity-50"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </section>
            )}

            {/* Inactive Items Section */}
            {inactiveItems.length > 0 && (
              <section className="mt-4 bg-white dark:bg-slate-900">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50 dark:border-slate-800">
                  <h2 className="text-slate-900 dark:text-slate-100 text-sm font-bold">失效商品 ({inactiveItems.length})</h2>
                  <button onClick={clearInactiveItems} className="text-primary text-sm font-medium">清空失效商品</button>
                </div>

                {inactiveItems.map(item => (
                  <div key={item.id} className="flex gap-3 px-4 py-4 border-b border-slate-50 dark:border-slate-800 last:border-0 opacity-60 grayscale">
                    <div className="flex items-center">
                      <div className="bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] px-1.5 py-0.5 rounded">失效</div>
                    </div>
                    <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-lg size-24 shrink-0 bg-slate-100 dark:bg-slate-800" style={{ backgroundImage: `url("${item.product.images?.[0]}")` }}></div>
                    <div className="flex flex-1 flex-col justify-between min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-slate-900 dark:text-slate-100 text-sm font-medium line-clamp-2 flex-1">{item.product.name}</p>
                        <button onClick={() => removeItem(item.id)} className="text-slate-400 hover:text-red-500 shrink-0">
                          <span className="material-symbols-outlined text-xl">delete</span>
                        </button>
                      </div>
                      <div className="flex items-end justify-between mt-2">
                        <p className="text-slate-500 dark:text-slate-400 text-sm">商品已下架或售罄</p>
                      </div>
                    </div>
                  </div>
                ))}
              </section>
            )}

            {/* Bottom spacing */}
            <div className="p-8 text-center text-slate-400">
              <p className="text-xs">已经到底了</p>
            </div>
          </>
        )}
      </main>

      {/* Checkout Bottom Bar */}
      <div className="shrink-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-2">
          <input
            checked={allActiveSelected}
            onChange={toggleAllSelect}
            className="rounded border-slate-300 text-primary focus:ring-primary h-5 w-5"
            type="checkbox"
            disabled={activeItems.length === 0}
          />
          <span className="text-slate-600 dark:text-slate-400 text-sm">全选</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-slate-500">合计:</p>
            <p className="text-primary text-lg font-bold leading-none">¥{totalPrice.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</p>
          </div>
          <button
            onClick={handleCheckout}
            disabled={selectedItems.length === 0}
            className={`${selectedItems.length > 0 ? 'bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 active:scale-95' : 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'} text-white font-bold py-3 px-8 rounded-full transition-all text-center`}
          >
            去结算{selectedItems.length > 0 && ` (${selectedItems.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}
