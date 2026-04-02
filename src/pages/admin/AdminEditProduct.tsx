import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminApi, productsApi } from '../../lib/api';
import { ProductStatus } from '../../types';
import { useProductForm, ProductSpec } from '../../hooks/useProductForm';

export default function AdminEditProduct() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 使用公共 Hook
  const {
    categories,
    fetchCategories,
    images,
    uploadingImages,
    handleImageUpload,
    removeImage,
    setInitialImages,
    specs,
    isMultiSpec,
    setIsMultiSpec,
    addSpec,
    removeSpec,
    updateSpec,
    setInitialSpecs,
    validateForm,
    toast
  } = useProductForm();

  // 表单状态（仅保留页面特有的状态）
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    brand: '',
    description: '',
    price: '',
    original_price: '',
    stock: '',
    status: ProductStatus.ON_SHELVES
  });

  useEffect(() => {
    if (id) {
      fetchProduct();
      fetchCategories();
    }
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const res = await productsApi.getDetail(id!);
      if (res.success && res.data) {
        const p = res.data;
        setFormData({
          name: p.name || '',
          category_id: p.category_id || '',
          brand: '',
          description: p.description || '',
          price: String(p.price || ''),
          original_price: String(p.original_price || ''),
          stock: String(p.stock || ''),
          status: p.status || ProductStatus.ON_SHELVES
        });
        setInitialImages(p.images || []);
        if (p.specs && Array.isArray(p.specs) && p.specs.length > 0) {
          const specList: ProductSpec[] = p.specs.map((s: any, idx: number) => ({
            id: idx + 1,
            name: s.name || '',
            price: String(s.price || ''),
            original_price: String(s.original_price || ''),
            stock: String(s.stock || '')
          }));
          setInitialSpecs(specList);
        }
      } else {
        toast.error('商品不存在');
        navigate('/admin/products');
      }
    } catch (error) {
      console.error('Get product error:', error);
      toast.error('获取商品信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!validateForm(formData) || !id) return;

    setSaving(true);
    try {
      const productData: any = {
        name: formData.name,
        category_id: formData.category_id,
        description: formData.description,
        images: images,
        status: formData.status,
        tags: []
      };

      if (isMultiSpec) {
        productData.specs = specs
          .filter(s => s.name && s.price && s.stock)
          .map(s => ({
            name: s.name,
            price: parseFloat(s.price),
            original_price: parseFloat(s.original_price) || parseFloat(s.price),
            stock: parseInt(s.stock)
          }));
        productData.price = parseFloat(specs[0].price);
        productData.original_price = parseFloat(specs[0].original_price) || productData.price;
        productData.stock = specs.reduce((sum, s) => sum + (parseInt(s.stock) || 0), 0);
      } else {
        productData.price = parseFloat(formData.price);
        productData.original_price = parseFloat(formData.original_price) || productData.price;
        productData.stock = parseInt(formData.stock);
      }

      const res = await adminApi.updateProduct(id, productData);
      if (res.success) {
        toast.success('商品更新成功');
        navigate('/admin/products');
      } else {
        toast.error(res.error?.message || '更新失败');
      }
    } catch (error) {
      console.error('Update product error:', error);
      toast.error('更新商品失败');
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
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/admin/products')}
          className="p-2 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">编辑商品</h1>
      </div>

      {/* Form Content */}
      <div className="space-y-6">
        {/* Basic Info Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">基本信息</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                商品名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="请输入商品名称，建议包含品牌、品类、规格等信息"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  商品分类 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => handleInputChange('category_id', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white appearance-none"
                >
                  <option value="">请选择分类</option>
                  {categories.map(cat => (
                    <optgroup key={cat.id} label={cat.name}>
                      {cat.children && cat.children.length > 0
                        ? cat.children.map(child => (
                            <option key={child.id} value={child.id}>{child.name}</option>
                          ))
                        : <option key={cat.id} value={cat.id}>{cat.name}</option>
                      }
                    </optgroup>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  商品品牌
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => handleInputChange('brand', e.target.value)}
                  placeholder="例如：茅台、五粮液"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Price & Stock Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">价格与库存</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm text-slate-600 dark:text-slate-400">启用多规格</span>
              <div
                onClick={() => setIsMultiSpec(!isMultiSpec)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${isMultiSpec ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isMultiSpec ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
            </label>
          </div>
          <div className="p-6 space-y-6">
            {!isMultiSpec ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      销售价 (元) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      原价 (元)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.original_price}
                      onChange={(e) => handleInputChange('original_price', e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      库存数量 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={(e) => handleInputChange('stock', e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
                        <th className="p-3 font-medium">规格名称 <span className="text-red-500">*</span></th>
                        <th className="p-3 font-medium">销售价 (元) <span className="text-red-500">*</span></th>
                        <th className="p-3 font-medium">原价 (元)</th>
                        <th className="p-3 font-medium">库存 <span className="text-red-500">*</span></th>
                        <th className="p-3 font-medium text-center w-16">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {specs.map((spec) => (
                        <tr key={spec.id} className="bg-white dark:bg-slate-800">
                          <td className="p-3">
                            <input
                              type="text"
                              value={spec.name}
                              onChange={(e) => updateSpec(spec.id, 'name', e.target.value)}
                              placeholder="如: 500ml"
                              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              min="0" step="0.01"
                              value={spec.price}
                              onChange={(e) => updateSpec(spec.id, 'price', e.target.value)}
                              placeholder="0.00"
                              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              min="0" step="0.01"
                              value={spec.original_price}
                              onChange={(e) => updateSpec(spec.id, 'original_price', e.target.value)}
                              placeholder="0.00"
                              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              min="0"
                              value={spec.stock}
                              onChange={(e) => updateSpec(spec.id, 'stock', e.target.value)}
                              placeholder="0"
                              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeSpec(spec.id)}
                              disabled={specs.length <= 1}
                              className="p-1.5 text-slate-400 hover:text-red-500 disabled:opacity-50 disabled:hover:text-slate-400 transition-colors rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  type="button"
                  onClick={addSpec}
                  className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  添加规格
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Media Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">商品图片</h2>
            <p className="text-xs text-slate-500 mt-1">建议尺寸 800x800 像素，支持 jpg、png 格式，最多上传 5 张</p>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-4">
              {images.map((img, index) => (
                <div key={index} className="relative w-24 h-24 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden group">
                  <img src={img} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                  {index === 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-white text-[10px] text-center py-0.5">
                      主图
                    </div>
                  )}
                </div>
              ))}

              {images.length < 5 && (
                <label className={`w-24 h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors cursor-pointer ${
                  uploadingImages
                    ? 'border-slate-300 dark:border-slate-600 text-slate-400 cursor-wait'
                    : 'border-slate-300 dark:border-slate-600 text-slate-500 hover:text-primary hover:border-primary hover:bg-primary/5'
                }`}>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploadingImages}
                  />
                  {uploadingImages ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-300 border-t-primary mb-1"></div>
                      <span className="text-xs">上传中...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-2xl mb-1">add_photo_alternate</span>
                      <span className="text-xs">上传图片</span>
                    </>
                  )}
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Details Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">商品详情</h2>
          </div>
          <div className="p-6">
            <textarea
              rows={8}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="请输入商品详细描述..."
              className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white resize-y"
            />
          </div>
        </div>

        {/* Settings Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">上架设置</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  checked={formData.status === ProductStatus.ON_SHELVES}
                  onChange={() => handleInputChange('status', ProductStatus.ON_SHELVES)}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">上架</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  checked={formData.status === ProductStatus.OFF_SHELVES}
                  onChange={() => handleInputChange('status', ProductStatus.OFF_SHELVES)}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">下架 (放入仓库)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="px-6 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存修改'}
          </button>
        </div>
      </div>
    </div>
  );
}