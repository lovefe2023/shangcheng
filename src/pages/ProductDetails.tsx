import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { productsApi, cartApi } from '../lib/api';
import { useToast } from '../components/Toast';
import { ProductDetailSkeleton } from '../components/Skeleton';

interface Product {
  id: string;
  name: string;
  description: string;
  images: string[];
  price: number;
  original_price: number;
  stock: number;
  sales: number;
  tags: string[];
  specs: Record<string, string[]> | null;
}

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedSpec, setSelectedSpec] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('wechat');
  const [currentImage, setCurrentImage] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const res = await productsApi.getDetail(id!);
      if (res.success && res.data) {
        setProduct(res.data);
        // 设置默认规格
        if (res.data.specs) {
          const firstSpecKey = Object.keys(res.data.specs)[0];
          if (firstSpecKey && res.data.specs[firstSpecKey]?.length > 0) {
            setSelectedSpec(res.data.specs[firstSpecKey][0]);
          }
        }
      } else {
        toast.error('商品不存在');
        navigate('/products');
      }
    } catch (error) {
      console.error('获取商品详情失败:', error);
      toast.error('获取商品详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    if (product.stock <= 0) {
      toast.error('商品已售罄');
      return;
    }

    setAddingToCart(true);
    try {
      const res = await cartApi.add({
        product_id: product.id,
        spec: selectedSpec,
        quantity
      });

      if (res.success) {
        toast.success('已添加到购物车');
      } else {
        toast.error(res.error?.message || '添加失败');
      }
    } catch (error) {
      toast.error('添加购物车失败');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = () => {
    if (!product) return;

    if (product.stock <= 0) {
      toast.error('商品已售罄');
      return;
    }

    setShowBuyModal(true);
  };

  const handleConfirmPay = () => {
    setShowBuyModal(false);
    navigate('/checkout?product_id=' + product?.id + '&quantity=' + quantity + '&spec=' + selectedSpec);
  };

  const getStockStatus = () => {
    if (!product) return { text: '', color: '' };
    if (product.stock <= 0) {
      return { text: '已售罄', color: 'text-red-500' };
    }
    if (product.stock <= 10) {
      return { text: `仅剩 ${product.stock} 件`, color: 'text-orange-500' };
    }
    if (product.stock <= 50) {
      return { text: `库存 ${product.stock} 件`, color: 'text-slate-500' };
    }
    return { text: '库存充足', color: 'text-green-500' };
  };

  if (loading) {
    return <ProductDetailSkeleton />;
  }

  if (!product) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <span className="material-symbols-outlined text-5xl mb-3 text-slate-400">error</span>
        <p className="text-slate-500">商品不存在</p>
        <Link to="/products" className="mt-4 text-primary font-medium">返回商品列表</Link>
      </div>
    );
  }

  const stockStatus = getStockStatus();
  const specKeys = product.specs ? Object.keys(product.specs) : [];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
      <nav className="sticky top-0 z-50 flex items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 py-3 border-b border-slate-200 dark:border-slate-800 relative">
        <Link to="/products" className="flex size-10 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h2 className="text-lg font-bold tracking-tight absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">商品详情</h2>
      </nav>

      <main className="flex-1 overflow-y-auto">
        {/* Image Carousel */}
        <div className="relative w-full aspect-square bg-white dark:bg-slate-900 overflow-hidden">
          <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar h-full">
            {product.images?.map((img, i) => (
              <div
                key={i}
                className="snap-center shrink-0 w-full h-full bg-center bg-cover"
                style={{ backgroundImage: `url('${img}')` }}
              />
            ))}
          </div>
          {product.images?.length > 1 && (
            <div className="absolute bottom-4 right-4 bg-black/40 text-white px-3 py-1 rounded-full text-xs backdrop-blur-sm">
              {currentImage + 1} / {product.images.length}
            </div>
          )}
        </div>

        <section className="p-4 bg-white dark:bg-slate-900 mb-2">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-baseline gap-1">
              <span className="text-primary text-3xl font-bold">¥</span>
              <span className="text-primary text-4xl font-bold">{product.price.toLocaleString()}</span>
              {product.original_price > product.price && (
                <span className="text-slate-400 dark:text-slate-500 line-through ml-2 text-sm">¥{product.original_price.toLocaleString()}</span>
              )}
            </div>
            <button onClick={() => setShowShareModal(true)} className="flex flex-col items-center text-slate-500 dark:text-slate-400">
              <span className="material-symbols-outlined text-primary">share</span>
              <span className="text-[10px] mt-0.5">分享</span>
            </button>
          </div>
          <h1 className="text-xl font-bold leading-snug mb-3">{product.name}</h1>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className={stockStatus.color}>{stockStatus.text}</span>
            <span>月销: {product.sales.toLocaleString()}+</span>
          </div>
        </section>

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <section className="p-4 bg-white dark:bg-slate-900 mb-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">标签</span>
              <div className="flex gap-2 flex-wrap">
                {product.tags.map(tag => (
                  <span key={tag} className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-sm border border-primary/20">{tag}</span>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Specs Selection */}
        {specKeys.length > 0 && (
          <section className="p-4 bg-white dark:bg-slate-900 mb-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">规格</span>
              <p className="text-sm truncate">已选：{selectedSpec || '请选择'}</p>
            </div>
            <span className="material-symbols-outlined text-slate-400">keyboard_arrow_down</span>
          </section>
        )}

        <section className="p-4 bg-white dark:bg-slate-900 mb-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
              <span className="material-symbols-outlined text-primary text-sm">verified</span>
              <span>正品保障</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
              <span className="material-symbols-outlined text-primary text-sm">local_shipping</span>
              <span>极速退款</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
              <span className="material-symbols-outlined text-primary text-sm">7mp</span>
              <span>七天无理由</span>
            </div>
          </div>
        </section>

        <div className="flex items-center justify-center p-4 bg-transparent">
          <div className="h-[1px] w-12 bg-slate-300 dark:bg-slate-700"></div>
          <span className="px-4 text-xs font-bold text-slate-500 uppercase tracking-widest">商品详情</span>
          <div className="h-[1px] w-12 bg-slate-300 dark:bg-slate-700"></div>
        </div>

        <section className="bg-white dark:bg-slate-900 mb-10 pb-10">
          <div className="p-4 space-y-4">
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
              {product.description}
            </p>
            {product.images?.slice(1).map((img, i) => (
              <div key={i} className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img src={img} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Bottom Action Bar */}
      <div className="shrink-0 z-40 px-4 py-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center gap-3">
        <div className="flex-1 flex gap-3">
          <button
            onClick={handleAddToCart}
            disabled={addingToCart || product.stock <= 0}
            className="flex-1 h-12 bg-primary/10 text-primary font-bold rounded-full text-base transition-colors hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {addingToCart ? '添加中...' : '加入购物车'}
          </button>
          <button
            onClick={handleBuyNow}
            disabled={product.stock <= 0}
            className="flex-1 h-12 flex items-center justify-center bg-primary text-white font-bold rounded-full text-base shadow-lg shadow-primary/20 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {product.stock <= 0 ? '已售罄' : '立即购买'}
          </button>
        </div>
      </div>

      {/* Buy Modal */}
      {showBuyModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowBuyModal(false)}>
          <div
            className="w-full max-h-[85vh] bg-white dark:bg-slate-900 rounded-t-2xl p-4 pb-0 animate-in slide-in-from-bottom-full duration-300 flex flex-col relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">确认订单</h3>
              <button onClick={() => setShowBuyModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-5 pb-24 hide-scrollbar">
              {/* Product Info */}
              <div className="flex gap-3">
                <img src={product.images?.[0]} alt={product.name} className="w-20 h-20 rounded-lg object-cover bg-slate-100 dark:bg-slate-800 shrink-0" />
                <div className="flex flex-col justify-between py-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-2">{product.name}</h4>
                  <div className="flex items-baseline gap-2">
                    <span className="text-primary font-bold text-lg">¥{product.price.toLocaleString()}</span>
                    <span className={`text-xs ${stockStatus.color}`}>{stockStatus.text}</span>
                  </div>
                </div>
              </div>

              {/* Specs */}
              {specKeys.map(key => (
                <div key={key}>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">{key}</h4>
                  <div className="flex flex-wrap gap-2">
                    {product.specs?.[key]?.map(spec => (
                      <button
                        key={spec}
                        onClick={() => setSelectedSpec(spec)}
                        className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          selectedSpec === spec
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800'
                        }`}
                      >
                        {spec}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Quantity */}
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">购买数量</h4>
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 rounded-full px-1 py-1 border border-slate-100 dark:border-slate-700">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-6 h-6 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[16px]">remove</span>
                  </button>
                  <span className="text-sm font-bold w-6 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                    className="w-6 h-6 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-sm disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                  </button>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">支付方式</h4>
                <div className="space-y-2">
                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#09B83E]">wechat</span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">微信支付</span>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${paymentMethod === 'wechat' ? 'border-primary bg-primary' : 'border-slate-300 dark:border-slate-600'}`}>
                      {paymentMethod === 'wechat' && <span className="material-symbols-outlined text-white text-[14px]">check</span>}
                    </div>
                    <input type="radio" name="payment" value="wechat" checked={paymentMethod === 'wechat'} onChange={() => setPaymentMethod('wechat')} className="hidden" />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#1677FF]">payments</span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">支付宝支付</span>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${paymentMethod === 'alipay' ? 'border-primary bg-primary' : 'border-slate-300 dark:border-slate-600'}`}>
                      {paymentMethod === 'alipay' && <span className="material-symbols-outlined text-white text-[14px]">check</span>}
                    </div>
                    <input type="radio" name="payment" value="alipay" checked={paymentMethod === 'alipay'} onChange={() => setPaymentMethod('alipay')} className="hidden" />
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between pb-safe">
              <div className="flex items-baseline gap-1">
                <span className="text-xs text-slate-500">合计:</span>
                <span className="text-primary font-bold text-xl">¥{(product.price * quantity).toLocaleString()}</span>
              </div>
              <button
                onClick={handleConfirmPay}
                className="bg-primary text-white font-bold px-8 py-2.5 rounded-full shadow-lg shadow-primary/20 active:scale-95 transition-transform"
              >
                立即支付
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowShareModal(false)}>
          <div
            className="w-full bg-white dark:bg-slate-900 rounded-t-2xl p-6 pb-10 animate-in slide-in-from-bottom-full duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">分享商品</h3>
              <button onClick={() => setShowShareModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <button className="flex flex-col items-center gap-2" onClick={() => { toast.success('海报已生成'); setShowShareModal(false); }}>
                <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-500">
                  <span className="material-symbols-outlined">image</span>
                </div>
                <span className="text-xs text-slate-600 dark:text-slate-400">生成海报</span>
              </button>
              <button className="flex flex-col items-center gap-2" onClick={() => { toast.success('链接已复制'); setShowShareModal(false); }}>
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-500">
                  <span className="material-symbols-outlined">link</span>
                </div>
                <span className="text-xs text-slate-600 dark:text-slate-400">复制链接</span>
              </button>
              <button className="flex flex-col items-center gap-2" onClick={() => setShowShareModal(false)}>
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-500">
                  <span className="material-symbols-outlined">chat</span>
                </div>
                <span className="text-xs text-slate-600 dark:text-slate-400">微信好友</span>
              </button>
              <button className="flex flex-col items-center gap-2" onClick={() => setShowShareModal(false)}>
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-500">
                  <span className="material-symbols-outlined">data_usage</span>
                </div>
                <span className="text-xs text-slate-600 dark:text-slate-400">朋友圈</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
