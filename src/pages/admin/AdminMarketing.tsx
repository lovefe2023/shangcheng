import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Empty from '../../components/Empty';
import { ListSkeleton } from '../../components/Skeleton';
import { useToast } from '../../components/Toast';
import { marketingApi } from '../../lib/api';
import { CampaignStatus, CampaignStatusLabel, PartnerPackageStatus, PartnerPackageStatusLabel, CouponStatus, CouponStatusLabel } from '../../types';

interface FlashSale {
  id: string;
  product_id: string;
  flash_price: number;
  stock: number;
  sold_count: number;
  start_time: string;
  end_time: string;
  status: CampaignStatus;
  product?: {
    name: string;
    images: string[];
    original_price: number;
  };
}

interface GroupBuy {
  id: string;
  product_id: string;
  group_price: number;
  min_quantity: number;
  current_quantity: number;
  status: CampaignStatus;
  start_time: string;
  end_time: string;
  product?: {
    name: string;
    images: string[];
  };
}

interface Coupon {
  id: string;
  name: string;
  type: string;
  discount_amount: number;
  min_amount: number;
  total_count: number;
  used_count: number;
  start_time: string;
  end_time: string;
  status: CouponStatus;
}

interface PartnerPackage {
  id: string;
  name: string;
  price: number;
  original_price: number;
  includes: any;
  benefits: string[];
  stock: number;
  sales: number;
  status: PartnerPackageStatus;
  images?: string[];
}

export default function AdminMarketing() {
  const navigate = useNavigate();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('flash-sale');

  // Loading states
  const [flashSaleLoading, setFlashSaleLoading] = useState(true);
  const [groupBuyLoading, setGroupBuyLoading] = useState(true);
  const [couponLoading, setCouponLoading] = useState(true);
  const [packageLoading, setPackageLoading] = useState(true);

  // Data states
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [groupBuys, setGroupBuys] = useState<GroupBuy[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [partnerPackages, setPartnerPackages] = useState<PartnerPackage[]>([]);

  // Filter states
  const [flashSaleStatus, setFlashSaleStatus] = useState('all');
  const [groupBuyStatus, setGroupBuyStatus] = useState('all');
  const [flashSaleSearch, setFlashSaleSearch] = useState('');
  const [groupBuySearch, setGroupBuySearch] = useState('');
  const [packageSearch, setPackageSearch] = useState('');

  useEffect(() => {
    fetchFlashSales();
    fetchGroupBuys();
    fetchCoupons();
    fetchPartnerPackages();
  }, []);

  useEffect(() => {
    fetchFlashSales();
  }, [flashSaleStatus]);

  useEffect(() => {
    fetchGroupBuys();
  }, [groupBuyStatus]);

  const fetchFlashSales = async () => {
    setFlashSaleLoading(true);
    try {
      const res = await marketingApi.getFlashSales(flashSaleStatus !== 'all' ? flashSaleStatus : undefined);
      if (res.success && res.data) {
        setFlashSales(res.data);
      }
    } catch (error) {
      console.error('Get flash sales error:', error);
    } finally {
      setFlashSaleLoading(false);
    }
  };

  const fetchGroupBuys = async () => {
    setGroupBuyLoading(true);
    try {
      const res = await marketingApi.getGroupBuys(groupBuyStatus !== 'all' ? groupBuyStatus : undefined);
      if (res.success && res.data) {
        setGroupBuys(res.data);
      }
    } catch (error) {
      console.error('Get group buys error:', error);
    } finally {
      setGroupBuyLoading(false);
    }
  };

  const fetchCoupons = async () => {
    setCouponLoading(true);
    try {
      const res = await marketingApi.getCoupons();
      if (res.success && res.data) {
        setCoupons(res.data);
      }
    } catch (error) {
      console.error('Get coupons error:', error);
    } finally {
      setCouponLoading(false);
    }
  };

  const fetchPartnerPackages = async () => {
    setPackageLoading(true);
    try {
      const res = await marketingApi.getBanners(); // 暂用 banners API，后续替换
      // setPartnerPackages(res.data || []);
    } catch (error) {
      console.error('Get partner packages error:', error);
    } finally {
      setPackageLoading(false);
    }
  };

  const filteredFlashSales = flashSales.filter(item => {
    const matchesSearch = item.product?.name?.includes(flashSaleSearch) || false;
    return matchesSearch;
  });

  const filteredGroupBuys = groupBuys.filter(item => {
    const matchesSearch = item.product?.name?.includes(groupBuySearch) || false;
    return matchesSearch;
  });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}-${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const formatStatus = (status: string) => {
    return CampaignStatusLabel[status as CampaignStatus] || status;
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">营销活动</h1>
        <button
          onClick={() => {
            if (activeTab === 'flash-sale') navigate('/admin/marketing/flash-sale/create');
            else if (activeTab === 'coupons') navigate('/admin/marketing/coupons/create');
            else if (activeTab === 'group-buy') navigate('/admin/marketing/group-buy/create');
          }}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          创建活动
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('flash-sale')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'flash-sale' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
          >
            限时秒杀
          </button>
          <button
            onClick={() => setActiveTab('coupons')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'coupons' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
          >
            优惠券管理
          </button>
          <button
            onClick={() => setActiveTab('group-buy')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'group-buy' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
          >
            团购免单
          </button>
          <button
            onClick={() => setActiveTab('partner-package')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'partner-package' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
          >
            合伙人礼包
          </button>
        </div>

        {/* Tab Content: Flash Sale */}
        {activeTab === 'flash-sale' && (
          <div className="overflow-x-auto">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex gap-4 bg-slate-50 dark:bg-slate-900/50">
              <select
                value={flashSaleStatus}
                onChange={(e) => setFlashSaleStatus(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm rounded-lg px-3 py-2 outline-none"
              >
                <option value="all">全部状态</option>
                <option value={CampaignStatus.ONGOING}>进行中</option>
                <option value={CampaignStatus.NOT_STARTED}>未开始</option>
                <option value={CampaignStatus.ENDED}>已结束</option>
              </select>
              <input
                type="text"
                placeholder="搜索商品名称"
                value={flashSaleSearch}
                onChange={(e) => setFlashSaleSearch(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm rounded-lg px-3 py-2 outline-none w-64"
              />
            </div>

            {flashSaleLoading ? (
              <div className="p-4"><ListSkeleton count={3} /></div>
            ) : filteredFlashSales.length === 0 ? (
              <Empty icon="bolt" title="暂无秒杀活动" description="点击右上角创建活动" className="py-10" />
            ) : (
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
                    <th className="p-4 font-medium">秒杀商品</th>
                    <th className="p-4 font-medium">秒杀价/原价</th>
                    <th className="p-4 font-medium">剩余/总库存</th>
                    <th className="p-4 font-medium">活动时间</th>
                    <th className="p-4 font-medium">状态</th>
                    <th className="p-4 font-medium text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredFlashSales.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={item.product?.images?.[0] || ''} alt="" className="w-10 h-10 rounded object-cover" />
                          <span className="text-sm text-slate-900 dark:text-white">{item.product?.name || '-'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-primary font-bold">¥{item.flash_price}</span>
                        <span className="text-slate-400 text-sm line-through ml-2">¥{item.product?.original_price}</span>
                      </td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                        {item.stock - item.sold_count} / {item.stock}
                      </td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                        {formatDate(item.start_time)} - {formatDate(item.end_time)}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          item.status === CampaignStatus.ONGOING ? 'bg-emerald-100 text-emerald-700' :
                          item.status === CampaignStatus.NOT_STARTED ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {formatStatus(item.status)}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/admin/marketing/flash-sale/edit/${item.id}`)}
                            className="text-primary text-sm font-medium hover:underline"
                          >
                            编辑
                          </button>
                          {item.status === CampaignStatus.NOT_STARTED && (
                            <button className="text-red-500 text-sm font-medium hover:underline">
                              删除
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab Content: Coupons */}
        {activeTab === 'coupons' && (
          <div className="overflow-x-auto">
            {couponLoading ? (
              <div className="p-4"><ListSkeleton count={3} /></div>
            ) : coupons.length === 0 ? (
              <Empty icon="confirmation_number" title="暂无优惠券" description="点击右上角创建优惠券" className="py-10" />
            ) : (
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
                    <th className="p-4 font-medium">优惠券名称</th>
                    <th className="p-4 font-medium">类型</th>
                    <th className="p-4 font-medium">面额</th>
                    <th className="p-4 font-medium">使用门槛</th>
                    <th className="p-4 font-medium">已领取/总量</th>
                    <th className="p-4 font-medium">状态</th>
                    <th className="p-4 font-medium text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {coupons.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <td className="p-4 text-sm font-medium text-slate-900 dark:text-white">{item.name}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          item.type === 'discount' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {item.type === 'discount' ? '立减券' : '满减券'}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-bold text-primary">¥{item.discount_amount}</td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                        {item.min_amount > 0 ? `满${item.min_amount}元可用` : '无门槛'}
                      </td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                        {item.used_count} / {item.total_count}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          item.status === CouponStatus.DISTRIBUTING ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {CouponStatusLabel[item.status]}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => navigate(`/admin/marketing/coupons/records/${item.id}`)}
                          className="text-primary text-sm font-medium hover:underline"
                        >
                          发放记录
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab Content: Group Buy */}
        {activeTab === 'group-buy' && (
          <div className="overflow-x-auto">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex gap-4 bg-slate-50 dark:bg-slate-900/50">
              <select
                value={groupBuyStatus}
                onChange={(e) => setGroupBuyStatus(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm rounded-lg px-3 py-2 outline-none"
              >
                <option value="all">全部状态</option>
                <option value={CampaignStatus.ONGOING}>进行中</option>
                <option value={CampaignStatus.NOT_STARTED}>未开始</option>
                <option value={CampaignStatus.ENDED}>已结束</option>
              </select>
              <input
                type="text"
                placeholder="搜索商品名称"
                value={groupBuySearch}
                onChange={(e) => setGroupBuySearch(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm rounded-lg px-3 py-2 outline-none w-64"
              />
            </div>

            {groupBuyLoading ? (
              <div className="p-4"><ListSkeleton count={3} /></div>
            ) : filteredGroupBuys.length === 0 ? (
              <Empty icon="groups" title="暂无团购活动" description="点击右上角创建活动" className="py-10" />
            ) : (
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
                    <th className="p-4 font-medium">团购商品</th>
                    <th className="p-4 font-medium">团购价</th>
                    <th className="p-4 font-medium">成团人数</th>
                    <th className="p-4 font-medium">活动时间</th>
                    <th className="p-4 font-medium">状态</th>
                    <th className="p-4 font-medium text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredGroupBuys.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={item.product?.images?.[0] || ''} alt="" className="w-10 h-10 rounded object-cover" />
                          <span className="text-sm text-slate-900 dark:text-white">{item.product?.name || '-'}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm font-bold text-primary">¥{item.group_price}</td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{item.min_quantity}人团</td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                        {formatDate(item.start_time)} - {formatDate(item.end_time)}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          item.status === CampaignStatus.ONGOING ? 'bg-emerald-100 text-emerald-700' :
                          item.status === CampaignStatus.NOT_STARTED ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {formatStatus(item.status)}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/admin/marketing/group-buy/edit/${item.id}`)}
                            className="text-primary text-sm font-medium hover:underline"
                          >
                            编辑
                          </button>
                          {item.status === CampaignStatus.NOT_STARTED && (
                            <button className="text-red-500 text-sm font-medium hover:underline">
                              删除
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab Content: Partner Package */}
        {activeTab === 'partner-package' && (
          <div className="p-6">
            {packageLoading ? (
              <ListSkeleton count={3} />
            ) : partnerPackages.length === 0 ? (
              <Empty icon="card_giftcard" title="暂无合伙人礼包" description="礼包数据需从后端获取" className="py-10" />
            ) : (
              <div className="text-center text-slate-500 py-10">
                合伙人礼包数据需配置对应 API
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}