import { useState, useEffect, KeyboardEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { productsApi } from '../lib/api';

interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  children: Category[];
}

interface SearchSuggestion {
  id: string;
  name: string;
  price: number;
  images: string[];
}

export default function Category() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // 搜索状态
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);

  // 从 URL 获取当前选中的分类
  useEffect(() => {
    const categoryId = searchParams.get('category');
    if (categoryId) {
      setSelectedCategoryId(categoryId);
    }
  }, [searchParams]);

  // 获取分类列表
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await productsApi.getCategories();
      if (res.success && res.data) {
        setCategories(res.data);
        // 如果没有选中分类，默认选中第一个
        if (!selectedCategoryId && res.data.length > 0) {
          setSelectedCategoryId(res.data[0].id);
        }
      }
    } catch (error) {
      console.error('获取分类失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 搜索建议
  useEffect(() => {
    if (searchKeyword.length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await productsApi.searchSuggest(searchKeyword);
        if (res.success && res.data) {
          setSearchSuggestions(res.data);
          setShowSuggestions(res.data.length > 0);
        }
      } catch (error) {
        console.error('搜索失败:', error);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchKeyword]);

  // 获取当前选中分类的子分类
  const selectedCategory = categories.find(c => c.id === selectedCategoryId);
  const subCategories = selectedCategory?.children || [];

  // 点击分类
  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSearchParams({ category: categoryId });
  };

  // 搜索提交
  const handleSearch = () => {
    if (searchKeyword.trim()) {
      window.location.href = `/products?keyword=${encodeURIComponent(searchKeyword.trim())}`;
    }
  };

  // 键盘回车搜索
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 获取分类图标
  const getCategoryIcon = (name: string): string => {
    const iconMap: Record<string, string> = {
      '白酒': 'liquor',
      '红酒': 'wine_bar',
      '洋酒': 'local_bar',
      '养生酒': 'spa',
      '酱香型': 'liquor',
      '浓香型': 'local_bar',
      '清香型': 'wine_bar',
      '干红': 'wine_bar',
      '干白': 'local_bar',
    };
    return iconMap[name] || 'category';
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex-1 flex gap-2 items-center relative">
            <label className="flex-1 flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg px-3 h-10 border border-transparent focus-within:border-primary transition-all">
              <span className="material-symbols-outlined text-slate-400 text-[20px]">search</span>
              <input
                className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-slate-500 dark:placeholder:text-slate-400 outline-none"
                placeholder="搜索酒款或品牌"
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => searchKeyword.length >= 2 && setSearchSuggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
            </label>
            <button
              onClick={handleSearch}
              className="bg-primary text-white text-sm px-4 h-10 rounded-lg font-medium whitespace-nowrap"
            >
              搜索
            </button>

            {/* 搜索建议下拉 */}
            {showSuggestions && (
              <div className="absolute top-full left-0 right-16 mt-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-50 max-h-80 overflow-y-auto">
                {searching ? (
                  <div className="p-4 text-center text-slate-500 text-sm">搜索中...</div>
                ) : searchSuggestions.length > 0 ? (
                  searchSuggestions.map((item) => (
                    <Link
                      key={item.id}
                      to={`/product/${item.id}`}
                      className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <img
                        src={item.images?.[0] || '/placeholder.png'}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{item.name}</p>
                        <p className="text-sm text-primary font-bold">¥{item.price}</p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="p-4 text-center text-slate-500 text-sm">未找到相关商品</div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        {/* 左侧分类导航 */}
        <aside className="w-24 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 overflow-y-auto hide-scrollbar">
          {loading ? (
            <div className="flex flex-col">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="py-5 px-2 animate-pulse">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mx-auto w-16" />
                </div>
              ))}
            </div>
          ) : (
            <nav className="flex flex-col">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className={`flex flex-col items-center justify-center py-5 gap-1 border-l-4 transition-colors ${
                    selectedCategoryId === category.id
                      ? 'border-primary bg-white dark:bg-slate-900 text-primary'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-primary'
                  }`}
                >
                  <span className={`text-sm ${selectedCategoryId === category.id ? 'font-bold' : 'font-medium'}`}>
                    {category.name}
                  </span>
                </button>
              ))}
            </nav>
          )}
        </aside>

        {/* 右侧内容区 */}
        <section className="flex-1 bg-white dark:bg-slate-900 overflow-y-auto p-4">
          {loading ? (
            <div className="space-y-8">
              {[1, 2].map((i) => (
                <div key={i}>
                  <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-24 mb-4 animate-pulse" />
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="flex flex-col items-center gap-2">
                        <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-12 animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* 子分类列表 */}
              {subCategories.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">
                      {selectedCategory?.name}分类
                    </h4>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {subCategories.map((sub) => (
                      <Link
                        to={`/products?category=${sub.id}`}
                        key={sub.id}
                        className="flex flex-col items-center text-center gap-2"
                      >
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-primary shadow-sm border border-slate-100 dark:border-slate-800">
                          <span className="material-symbols-outlined text-[32px]">
                            {getCategoryIcon(sub.name)}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {sub.name}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* 快捷入口 */}
              <div className="mb-8">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-4">快捷入口</h4>
                <div className="grid grid-cols-3 gap-4">
                  <Link to="/products?sortBy=sales&sortOrder=desc" className="flex flex-col items-center text-center gap-2">
                    <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/30 rounded-xl flex items-center justify-center text-amber-500 shadow-sm border border-amber-100 dark:border-amber-900/50">
                      <span className="material-symbols-outlined text-[32px]">trending_up</span>
                    </div>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">热销榜</span>
                  </Link>
                  <Link to="/products?sortBy=price&sortOrder=asc" className="flex flex-col items-center text-center gap-2">
                    <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-100 dark:border-emerald-900/50">
                      <span className="material-symbols-outlined text-[32px]">local_offer</span>
                    </div>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">特价区</span>
                  </Link>
                  <Link to="/products?sortBy=created_at&sortOrder=desc" className="flex flex-col items-center text-center gap-2">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-500 shadow-sm border border-blue-100 dark:border-blue-900/50">
                      <span className="material-symbols-outlined text-[32px]">new_releases</span>
                    </div>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">新品上市</span>
                  </Link>
                </div>
              </div>

              {/* 热门品牌 */}
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-4">热门品牌</h4>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { name: '茅台', keyword: '茅台' },
                    { name: '五粮液', keyword: '五粮液' },
                    { name: '泸州老窖', keyword: '泸州' },
                    { name: '剑南春', keyword: '剑南春' },
                    { name: '洋河', keyword: '洋河' },
                    { name: '拉菲', keyword: '拉菲' },
                  ].map((brand) => (
                    <Link
                      to={`/products?keyword=${encodeURIComponent(brand.keyword)}`}
                      key={brand.name}
                      className="flex flex-col items-center text-center gap-2"
                    >
                      <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 shadow-sm border border-slate-100 dark:border-slate-800">
                        <span className="material-symbols-outlined text-[32px]">liquor</span>
                      </div>
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{brand.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}