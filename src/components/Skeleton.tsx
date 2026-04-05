/**
 * 骨架屏组件
 * 用于数据加载时的占位显示
 */

interface SkeletonProps {
  className?: string;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function Skeleton({ className = '', rounded = 'md' }: SkeletonProps) {
  const roundedClass = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full'
  }[rounded];

  return (
    <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 ${roundedClass} ${className}`} />
  );
}

// 商品卡片骨架屏
export function ProductCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800">
      <Skeleton className="w-full aspect-square" rounded="none" />
      <div className="p-3">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3 mb-3" />
        <div className="flex justify-between items-end">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-6" rounded="full" />
        </div>
      </div>
    </div>
  );
}

// 商品列表骨架屏
export function ProductListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

// 订单卡片骨架屏
export function OrderCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
      <div className="flex justify-between items-center mb-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="w-16 h-16 shrink-0" rounded="lg" />
        <div className="flex-1">
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3 mb-2" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
      <div className="flex justify-end mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <Skeleton className="h-8 w-20" rounded="lg" />
      </div>
    </div>
  );
}

// 订单列表骨架屏
export function OrderListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <OrderCardSkeleton key={i} />
      ))}
    </div>
  );
}

// 商品详情骨架屏
export function ProductDetailSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
      <Skeleton className="w-full aspect-square" rounded="none" />
      <div className="bg-white dark:bg-slate-900 p-4 mb-2">
        <Skeleton className="h-6 w-2/3 mb-2" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-3/4 mb-3" />
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="bg-white dark:bg-slate-900 p-4 mb-2">
        <Skeleton className="h-5 w-24 mb-3" />
        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-900 p-4">
        <Skeleton className="h-5 w-24 mb-3" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

// 购物车商品骨架屏
export function CartItemSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-4 flex gap-4 shadow-sm border border-slate-100 dark:border-slate-800">
      <Skeleton className="w-5 h-5 shrink-0 mt-6" rounded="sm" />
      <Skeleton className="w-20 h-20 shrink-0" rounded="lg" />
      <div className="flex-1">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3 mb-3" />
        <div className="flex justify-between items-end">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-8 w-24" rounded="lg" />
        </div>
      </div>
    </div>
  );
}

// 购物车列表骨架屏
export function CartListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <CartItemSkeleton key={i} />
      ))}
    </div>
  );
}

// 列表项骨架屏（通用）
export function ListItemSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-4 flex gap-4 shadow-sm border border-slate-100 dark:border-slate-800">
      <Skeleton className="w-16 h-16 shrink-0" rounded="lg" />
      <div className="flex-1">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

// 通用列表骨架屏
export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <ListItemSkeleton key={i} />
      ))}
    </div>
  );
}

// 页面加载骨架屏
export function PageLoadingSkeleton() {
  return (
    <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">
          progress_activity
        </span>
        <p className="text-sm text-slate-500">加载中...</p>
      </div>
    </div>
  );
}

// 详情页骨架屏（用于订单详情、用户详情等）
export function DetailSkeleton() {
  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="w-10 h-10" rounded="lg" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-6 w-20" rounded="full" />
        <Skeleton className="h-6 w-20" rounded="full" />
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order info card */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <Skeleton className="h-6 w-24 mb-6" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>

          {/* Products card */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <Skeleton className="h-6 w-24 mx-6 mt-6 mb-4" />
            <div className="p-6 space-y-4">
              <div className="flex gap-4">
                <Skeleton className="w-12 h-12" rounded="lg" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-2/3 mb-2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <Skeleton className="h-6 w-24 mb-6" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <Skeleton className="h-6 w-24 mb-6" />
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}