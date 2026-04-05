import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Empty from '../../components/Empty';
import { ListSkeleton } from '../../components/Skeleton';
import { useToast } from '../../components/Toast';
import { adminApi, productsApi } from '../../lib/api';
import { ProductStatus, ProductStatusLabel } from '../../types';

// API 错误处理
interface ApiError {
  code?: string;
  message?: string;
}

const handleApiError = (
  error: any,
  toast: ReturnType<typeof useToast>,
  navigate: ReturnType<typeof useNavigate>,
  defaultMessage: string = '操作失败'
): boolean => {
  // 检查是否是 API 响应错误
  const apiError = error?.error as ApiError | undefined;
  const errorCode = apiError?.code || error?.code;
  const errorMessage = apiError?.message || error?.message;

  // 处理未授权错误
  if (errorCode === 'UNAUTHORIZED' || errorCode === 'INVALID_TOKEN' || errorCode === 'TOKEN_EXPIRED') {
    toast.error('登录已过期，请重新登录');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login?redirect=/admin/products');
    return true;
  }

  // 处理权限错误
  if (errorCode === 'FORBIDDEN' || errorCode === 'ADMIN_REQUIRED') {
    toast.error('您没有权限执行此操作');
    navigate('/');
    return true;
  }

  // 处理网络错误
  if (errorCode === 'NETWORK_ERROR') {
    toast.error('网络错误，请检查网络连接');
    return true;
  }

  // 其他错误
  toast.error(errorMessage || defaultMessage);
  return false;
};

interface Category {
  id: string;
  name: string;
  parent_id?: string;
  sort_order?: number;
  children?: Category[];
}

interface Product {
  id: string;
  name: string;
  images: string[];
  price: number;
  original_price?: number;
  stock: number;
  sales: number;
  category_id: string;
  category?: { name: string };
  status: ProductStatus;
  tags?: string[];
  specs?: Record<string, string[]>;
}

export default function AdminProducts() {
  const navigate = useNavigate();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('list');
  const [showTagModal, setShowTagModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const [tempTags, setTempTags] = useState<string[]>([]);
  const [tagsSaving, setTagsSaving] = useState(false);
  const [togglingStatusIds, setTogglingStatusIds] = useState<Set<string>>(new Set());
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ id: '', name: '', sort: 1, parentId: null as string | null });
  const [categorySaving, setCategorySaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'product' | 'category'; parentId?: string | null } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // 添加新分类
  const openCategoryModal = (parentId: string | null = null) => {
    setCategoryForm({ id: '', name: '', sort: 1, parentId });
    setShowCategoryModal(true);
  };

  // 编辑现有分类
  const editCategory = (category: Category, parentId: string | null = null) => {
    setCategoryForm({
      id: category.id,
      name: category.name,
      sort: category.sort_order || 1,
      parentId
    });
    setShowCategoryModal(true);
  };

  const saveCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast.error('请输入分类名称');
      return;
    }

    setCategorySaving(true);
    try {
      if (categoryForm.id) {
        // 更新现有分类
        const res = await adminApi.updateCategory(categoryForm.id, {
          name: categoryForm.name.trim(),
          parent_id: categoryForm.parentId || undefined,
          sort_order: categoryForm.sort
        });

        if (res.success) {
          toast.success('分类更新成功');
          setShowCategoryModal(false);
          fetchCategories(true);
        } else {
          handleApiError(res, toast, navigate, '更新分类失败');
        }
      } else {
        // 创建新分类
        const res = await adminApi.createCategory({
          name: categoryForm.name.trim(),
          parent_id: categoryForm.parentId || undefined,
          sort_order: categoryForm.sort
        });

        if (res.success) {
          toast.success('分类添加成功');
          setShowCategoryModal(false);
          fetchCategories(true);
        } else {
          handleApiError(res, toast, navigate, '添加分类失败');
        }
      }
    } catch (error) {
      console.error('Save category error:', error);
      handleApiError(error, toast, navigate, categoryForm.id ? '更新分类失败' : '添加分类失败');
    } finally {
      setCategorySaving(false);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const res = await adminApi.deleteCategory(id);
      if (res.success) {
        toast.success('分类已删除');
        fetchCategories(true);
      } else {
        handleApiError(res, toast, navigate, '删除分类失败');
      }
    } catch (error) {
      console.error('Delete category error:', error);
      handleApiError(error, toast, navigate, '删除分类失败');
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [page, categoryFilter, statusFilter, tagFilter]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getProducts({
        page,
        pageSize,
        keyword: searchQuery || undefined,
        category: categoryFilter || undefined,
        status: statusFilter || undefined,
        tag: tagFilter || undefined
      });

      if (res.success && res.data) {
        setProducts(res.data.list || []);
        setTotal(res.data.total || 0);
      } else {
        handleApiError(res, toast, navigate, '获取商品列表失败');
      }
    } catch (error) {
      console.error('Get products error:', error);
      handleApiError(error, toast, navigate, '获取商品列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async (forceRefresh: boolean = false) => {
    // 只有在已加载过数据且不是强制刷新时才跳过
    if (categories.length > 0 && !forceRefresh && !categoriesLoading) return;

    setCategoriesLoading(true);
    try {
      const res = await productsApi.getCategories();
      if (res.success && res.data) {
        setCategories(res.data);
      }
    } catch (error) {
      console.error('Get categories error:', error);
      // 分类加载失败不跳转登录，只记录错误
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchProducts();
  };

  const openTagModal = (product: Product) => {
    setSelectedProduct(product);
    setTempTags(product.tags || []);
    setShowTagModal(true);
  };

  const toggleTag = (tag: string) => {
    if (tempTags.includes(tag)) {
      setTempTags(tempTags.filter(t => t !== tag));
    } else {
      setTempTags([...tempTags, tag]);
    }
  };

  const saveTags = async () => {
    if (!selectedProduct || tagsSaving) return;
    setTagsSaving(true);
    try {
      const res = await adminApi.updateProduct(selectedProduct.id, { tags: tempTags });
      if (res.success) {
        setProducts(products.map(p =>
          p.id === selectedProduct.id ? { ...p, tags: tempTags } : p
        ));
        toast.success('商品标签已更新');
        setShowTagModal(false);
      } else {
        handleApiError(res, toast, navigate, '更新失败');
      }
    } catch (error) {
      handleApiError(error, toast, navigate, '更新失败');
    } finally {
      setTagsSaving(false);
    }
  };

  const toggleStatus = async (id: string) => {
    // 防止重复点击
    if (togglingStatusIds.has(id)) return;

    const product = products.find(p => p.id === id);
    if (!product) return;

    const newStatus = product.status === ProductStatus.ON_SHELVES
      ? ProductStatus.OFF_SHELVES
      : ProductStatus.ON_SHELVES;

    setTogglingStatusIds(prev => new Set(prev).add(id));
    try {
      const res = await adminApi.updateProduct(id, { status: newStatus });
      if (res.success) {
        setProducts(products.map(p =>
          p.id === id ? { ...p, status: newStatus } : p
        ));
        toast.success(`商品已${newStatus === ProductStatus.ON_SHELVES ? '上架' : '下架'}`);
      } else {
        handleApiError(res, toast, navigate, '操作失败');
      }
    } catch (error) {
      handleApiError(error, toast, navigate, '操作失败');
    } finally {
      setTogglingStatusIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const deleteProduct = (id: string) => {
    setItemToDelete({ id, type: 'product' });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete || deleteLoading) return;

    setDeleteLoading(true);
    try {
      if (itemToDelete.type === 'product') {
        const res = await adminApi.deleteProduct(itemToDelete.id);
        if (res.success) {
          setProducts(products.filter(p => p.id !== itemToDelete.id));
          toast.success('商品已删除');
        } else {
          handleApiError(res, toast, navigate, '删除失败');
          return; // 不关闭弹窗，让用户可以看到错误信息
        }
      } else if (itemToDelete.type === 'category') {
        const res = await adminApi.deleteCategory(itemToDelete.id);
        if (res.success) {
          toast.success('分类已删除');
          fetchCategories(true);
        } else {
          handleApiError(res, toast, navigate, '删除分类失败');
          return; // 不关闭弹窗，让用户可以看到错误信息
        }
      }
      setShowDeleteModal(false);
      setItemToDelete(null);
    } catch (error) {
      handleApiError(error, toast, navigate, itemToDelete?.type === 'product' ? '删除失败' : '删除分类失败');
    } finally {
      setDeleteLoading(false);
    }
  };

  const getCategoryName = (categoryId: string) => {
    for (const cat of categories) {
      if (cat.id === categoryId) return cat.name;
      if (cat.children) {
        const child = cat.children.find(c => c.id === categoryId);
        if (child) return child.name;
      }
    }
    return '未分类';
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">商品管理</h1>
        {activeTab === 'list' ? (
          <button
            onClick={() => navigate('/admin/products/add')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            添加商品
          </button>
        ) : (
          <button
            onClick={() => openCategoryModal(null)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            添加一级分类
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'list' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
          >
            商品列表
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'categories' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
          >
            商品分类
          </button>
        </div>

        {/* Tab Content: Product List */}
        {activeTab === 'list' && (
          <div>
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-4 items-center">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
                  <input
                    type="text"
                    placeholder="搜索商品名称/ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-64"
                  />
                </div>
                <select
                  value={categoryFilter}
                  onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm rounded-lg px-3 py-2 outline-none"
                >
                  <option value="">所有分类</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm rounded-lg px-3 py-2 outline-none"
                >
                  <option value="">所有状态</option>
                  <option value={ProductStatus.ON_SHELVES}>{ProductStatusLabel[ProductStatus.ON_SHELVES]}中</option>
                  <option value={ProductStatus.OFF_SHELVES}>已{ProductStatusLabel[ProductStatus.OFF_SHELVES]}</option>
                </select>
                <select
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm rounded-lg px-3 py-2 outline-none"
                >
                  <option value="">所有营销标签</option>
                  <option value="秒杀">秒杀</option>
                  <option value="团购">团购</option>
                  <option value="热卖">热卖</option>
                </select>
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
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      <th className="p-4 font-medium">商品信息</th>
                      <th className="p-4 font-medium">分类</th>
                      <th className="p-4 font-medium">价格</th>
                      <th className="p-4 font-medium">总库存</th>
                      <th className="p-4 font-medium">总销量</th>
                      <th className="p-4 font-medium">营销标签</th>
                      <th className="p-4 font-medium">状态</th>
                      <th className="p-4 font-medium text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {products.length > 0 ? (
                      products.map((product) => (
                        <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img src={product.images?.[0] || ''} alt={product.name} className="w-12 h-12 rounded object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-1" title={product.name}>{product.name}</p>
                                <p className="text-xs text-slate-500 mt-0.5">ID: {product.id.slice(0, 8)}...</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{getCategoryName(product.category_id)}</td>
                          <td className="p-4 text-sm font-medium text-slate-900 dark:text-white">¥{product.price.toLocaleString()}</td>
                          <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                            <span className={product.stock === 0 ? 'text-red-500 font-medium' : ''}>{product.stock}</span>
                          </td>
                          <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{product.sales}</td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1">
                              {product.tags && product.tags.length > 0 ? product.tags.map(tag => (
                                <span key={tag} className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  tag === '秒杀' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
                                  tag === '团购' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                                  'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400'
                                }`}>
                                  {tag}
                                </span>
                              )) : <span className="text-xs text-slate-400">-</span>}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                              product.status === ProductStatus.ON_SHELVES ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                              'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                            }`}>
                              {ProductStatusLabel[product.status]}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => openTagModal(product)} className="text-xs text-primary hover:underline font-medium px-2 py-1">
                                设置标签
                              </button>
                              <button
                                onClick={() => toggleStatus(product.id)}
                                disabled={togglingStatusIds.has(product.id)}
                                className={`text-xs font-medium px-2 py-1 hover:underline disabled:opacity-50 disabled:cursor-not-allowed ${product.status === ProductStatus.ON_SHELVES ? 'text-slate-500' : 'text-emerald-600'}`}
                              >
                                {togglingStatusIds.has(product.id) ? '处理中...' : (product.status === ProductStatus.ON_SHELVES ? '下架' : '上架')}
                              </button>
                              <button onClick={() => navigate(`/admin/products/edit/${product.id}`)} className="p-1.5 text-slate-400 hover:text-primary transition-colors rounded hover:bg-slate-100 dark:hover:bg-slate-700" title="编辑">
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                              </button>
                              <button onClick={() => deleteProduct(product.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded hover:bg-slate-100 dark:hover:bg-slate-700" title="删除">
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="p-0">
                          <Empty
                            icon="search_off"
                            title="未找到商品"
                            description="没有找到符合条件的商品，请尝试更改搜索条件"
                            actionText="清除筛选"
                            onAction={() => {
                              setSearchQuery('');
                              setCategoryFilter('');
                              setStatusFilter('');
                              setTagFilter('');
                              setPage(1);
                            }}
                          />
                        </td>
                      </tr>
                    )}
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
        )}

        {/* Tab Content: Categories */}
        {activeTab === 'categories' && (
          <div className="p-6">
            {categoriesLoading ? (
              <ListSkeleton count={3} />
            ) : (
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-500 dark:text-slate-400">
                  <div className="col-span-4">分类名称</div>
                  <div className="col-span-2 text-center">级别</div>
                  <div className="col-span-2 text-center">排序</div>
                  <div className="col-span-2 text-center">操作</div>
                </div>
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {categories.length > 0 ? (
                    categories.map((category) => (
                      <div key={category.id}>
                        <div className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors">
                          <div className="col-span-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-slate-400 text-[20px] cursor-pointer">
                              {category.children && category.children.length > 0 ? 'expand_more' : 'chevron_right'}
                            </span>
                            <span className="font-medium text-slate-900 dark:text-white">{category.name}</span>
                          </div>
                          <div className="col-span-2 text-center text-sm text-slate-600 dark:text-slate-400">一级</div>
                          <div className="col-span-2 text-center text-sm text-slate-600 dark:text-slate-400">-</div>
                          <div className="col-span-2 flex items-center justify-end gap-2">
                            <button onClick={() => openCategoryModal(category.id)} className="text-xs text-primary hover:underline font-medium">添加子分类</button>
                            <button onClick={() => editCategory(category, null)} className="text-slate-400 hover:text-primary transition-colors" title="编辑">
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button onClick={() => {
                              setItemToDelete({ id: category.id, type: 'category', parentId: null });
                              setShowDeleteModal(true);
                            }} className="text-slate-400 hover:text-red-500 transition-colors" title="删除">
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </div>
                        {category.children && category.children.map((child) => (
                          <div key={child.id} className="grid grid-cols-12 gap-4 p-4 items-center bg-white dark:bg-slate-800/30 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors border-t border-slate-100 dark:border-slate-800">
                            <div className="col-span-4 flex items-center gap-2 pl-8">
                              <span className="w-4 border-b border-l border-slate-300 dark:border-slate-600 h-4 -mt-4 rounded-bl"></span>
                              <span className="text-sm text-slate-700 dark:text-slate-300">{child.name}</span>
                            </div>
                            <div className="col-span-2 text-center text-sm text-slate-500 dark:text-slate-500">二级</div>
                            <div className="col-span-2 text-center text-sm text-slate-600 dark:text-slate-400">-</div>
                            <div className="col-span-2 flex items-center justify-end gap-2">
                              <button onClick={() => editCategory(child, category.id)} className="text-slate-400 hover:text-primary transition-colors" title="编辑">
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                              </button>
                              <button onClick={() => {
                                setItemToDelete({ id: child.id, type: 'category', parentId: category.id });
                                setShowDeleteModal(true);
                              }} className="text-slate-400 hover:text-red-500 transition-colors" title="删除">
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-slate-500">暂无分类</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tag Modal */}
      {showTagModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">设置营销标签</h3>
              <button onClick={() => setShowTagModal(false)} className="text-slate-400 hover:text-slate-500">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                为商品 <span className="font-medium text-slate-900 dark:text-white">{selectedProduct.name}</span> 设置展示标签：
              </p>

              <div className="space-y-3">
                {['热卖', '秒杀', '团购'].map(tag => (
                  <label key={tag} className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <input type="checkbox" checked={tempTags.includes(tag)} onChange={() => toggleTag(tag)} className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{tag}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowTagModal(false)} className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                取消
              </button>
              <button
                onClick={saveTags}
                disabled={tagsSaving}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {tagsSaving ? '保存中...' : '保存设置'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">确认删除</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                {itemToDelete?.type === 'product' ? '确定要删除该商品吗？此操作不可恢复。' : '确定要删除该分类吗？此操作不可恢复。'}
              </p>
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
              <button onClick={() => { setShowDeleteModal(false); setItemToDelete(null); }} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                取消
              </button>
              <button
              onClick={confirmDelete}
              disabled={deleteLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleteLoading ? '删除中...' : '确认删除'}
            </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {categoryForm.id ? '编辑分类' : (categoryForm.parentId ? '添加子分类' : '添加一级分类')}
              </h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-slate-400 hover:text-slate-500">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  分类名称
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-slate-900"
                  placeholder="请输入分类名称"
                  maxLength={20}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  排序（数字越小越靠前）
                </label>
                <input
                  type="number"
                  value={categoryForm.sort}
                  onChange={(e) => setCategoryForm({ ...categoryForm, sort: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-slate-900"
                  min={1}
                  max={999}
                />
              </div>

              {categoryForm.parentId && (
                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    父级分类：
                    <span className="font-medium text-slate-900 dark:text-white ml-1">
                      {categories.find(c => c.id === categoryForm.parentId)?.name || '未知'}
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                取消
              </button>
              <button
                onClick={saveCategory}
                disabled={categorySaving}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {categorySaving ? '保存中...' : (categoryForm.id ? '更新' : '添加')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}