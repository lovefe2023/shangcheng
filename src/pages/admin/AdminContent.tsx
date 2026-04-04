import { useState, useEffect, useRef } from 'react';
import { useToast } from '../../components/Toast';
import { ListSkeleton } from '../../components/Skeleton';
import Empty from '../../components/Empty';
import { adminApi } from '../../lib/api';
import { ContentStatus, ContentStatusLabel } from '../../types';

interface Banner {
  id: string;
  title: string | null;
  image_url: string;
  link_url: string | null;
  sort_order: number;
  status: string;
  created_at: string;
}

interface Notification {
  id: string;
  title: string;
  content: string | null;
  type: string;
  status: string;
  created_at: string;
}

interface Faq {
  id: string;
  category: string;
  question: string;
  answer: string;
  sort_order: number;
  status: string;
  created_at: string;
}

interface RecruitConfig {
  title: string;
  description: string;
  imageUrl: string;
  benefits: string[];
}

const VALID_BANNER_TYPES = ['carousel', 'popup'];
const VALID_NOTIFICATION_TYPES = ['announcement', 'notice', 'faq'];
const VALID_FAQ_CATEGORIES = ['佣金规则', '升级规则', '邀请规则', '其他问题'];

const defaultRecruitConfig: RecruitConfig = {
  title: '成为我们的合伙人',
  description: '加入我们，共享财富盛宴。名酒商城为您提供优质的货源、丰厚的佣金和全方位的支持。',
  imageUrl: 'https://images.unsplash.com/photo-1556761175-5973dc0f32d7?auto=format&fit=crop&q=80&w=1200',
  benefits: ['高额佣金回报', '专属客服支持', '定期培训指导', '一件代发，零库存压力']
};

export default function AdminContent() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'banner' | 'announcement' | 'recruit' | 'faq'>('banner');

  // Loading states
  const [bannerLoading, setBannerLoading] = useState(true);
  const [notificationLoading, setNotificationLoading] = useState(true);
  const [faqLoading, setFaqLoading] = useState(true);
  const [recruitLoading, setRecruitLoading] = useState(true);

  // Data states
  const [banners, setBanners] = useState<Banner[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [recruitConfig, setRecruitConfig] = useState<RecruitConfig>(defaultRecruitConfig);

  // Saving states
  const [saving, setSaving] = useState(false);
  const saveLockRef = useRef(false);

  // Modal states
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);

  // Search states
  const [bannerSearch, setBannerSearch] = useState('');
  const [announcementSearch, setAnnouncementSearch] = useState('');
  const [faqSearch, setFaqSearch] = useState('');

  // New item states
  const [newBanner, setNewBanner] = useState({
    title: '',
    type: 'carousel',
    link: '',
    imageUrl: 'https://images.unsplash.com/photo-1504675099198-7023dd85f5a3?auto=format&fit=crop&q=80&w=800'
  });

  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    type: 'announcement',
    publishNow: true
  });

  const [newFaq, setNewFaq] = useState({
    category: '佣金规则',
    question: '',
    answer: '',
    status: ContentStatus.PUBLISHED
  });

  useEffect(() => {
    fetchBanners();
    fetchNotifications();
    fetchFaqs();
    fetchRecruitConfig();
  }, []);

  // ========== 数据加载 ==========

  const fetchBanners = async () => {
    setBannerLoading(true);
    try {
      const res = await adminApi.getBanners({ pageSize: 100 });
      if (res.success && res.data) {
        setBanners(res.data.list || []);
      }
    } catch (error) {
      console.error('Get banners error:', error);
      toast.error('获取Banner列表失败');
    } finally {
      setBannerLoading(false);
    }
  };

  const fetchNotifications = async () => {
    setNotificationLoading(true);
    try {
      const res = await adminApi.getNotifications({ pageSize: 100 });
      if (res.success && res.data) {
        setNotifications(res.data.list || []);
      }
    } catch (error) {
      console.error('Get notifications error:', error);
      toast.error('获取公告列表失败');
    } finally {
      setNotificationLoading(false);
    }
  };

  const fetchFaqs = async () => {
    setFaqLoading(true);
    try {
      const res = await adminApi.getFaqs({ pageSize: 100 });
      if (res.success && res.data) {
        setFaqs(res.data.list || []);
      }
    } catch (error) {
      console.error('Get faqs error:', error);
      toast.error('获取FAQ列表失败');
    } finally {
      setFaqLoading(false);
    }
  };

  const fetchRecruitConfig = async () => {
    setRecruitLoading(true);
    try {
      const res = await adminApi.getRecruitSettings();
      if (res.success && res.data) {
        setRecruitConfig({
          title: res.data.title || defaultRecruitConfig.title,
          description: res.data.description || defaultRecruitConfig.description,
          imageUrl: res.data.imageUrl || defaultRecruitConfig.imageUrl,
          benefits: res.data.benefits || defaultRecruitConfig.benefits
        });
      }
    } catch (error) {
      console.error('Get recruit settings error:', error);
    } finally {
      setRecruitLoading(false);
    }
  };

  // ========== Banner操作 ==========

  const handleSaveBanner = async () => {
    if (!newBanner.imageUrl.trim()) {
      toast.error('请输入图片URL');
      return;
    }

    if (saveLockRef.current) return;
    saveLockRef.current = true;
    setSaving(true);

    try {
      if (editingBanner) {
        // 更新
        const res = await adminApi.updateBanner(editingBanner.id, {
          title: newBanner.title,
          image_url: newBanner.imageUrl,
          link_url: newBanner.link || null,
          sort_order: 0
        });
        if (res.success) {
          toast.success('Banner更新成功');
          fetchBanners();
        } else {
          toast.error(res.error?.message || '更新失败');
        }
      } else {
        // 创建
        const res = await adminApi.createBanner({
          title: newBanner.title || null,
          image_url: newBanner.imageUrl,
          link_url: newBanner.link || null,
          sort_order: 0,
          status: 'visible'
        });
        if (res.success) {
          toast.success('Banner添加成功');
          fetchBanners();
        } else {
          toast.error(res.error?.message || '添加失败');
        }
      }
      setShowBannerModal(false);
      resetBannerForm();
    } catch (error) {
      console.error('Save banner error:', error);
      toast.error('操作失败');
    } finally {
      setSaving(false);
      saveLockRef.current = false;
    }
  };

  const resetBannerForm = () => {
    setNewBanner({ title: '', type: 'carousel', link: '', imageUrl: 'https://images.unsplash.com/photo-1504675099198-7023dd85f5a3?auto=format&fit=crop&q=80&w=800' });
    setEditingBanner(null);
  };

  const toggleBannerStatus = async (banner: Banner) => {
    const newStatus = banner.status === 'visible' ? 'hidden' : 'visible';
    try {
      const res = await adminApi.toggleBannerStatus(banner.id, newStatus);
      if (res.success) {
        toast.success(`Banner已${newStatus === 'visible' ? '显示' : '隐藏'}`);
        fetchBanners();
      } else {
        toast.error(res.error?.message || '操作失败');
      }
    } catch (error) {
      console.error('Toggle banner status error:', error);
      toast.error('操作失败');
    }
  };

  const deleteBanner = async (id: string) => {
    if (!confirm('确定要删除此Banner吗？')) return;
    try {
      const res = await adminApi.deleteBanner(id);
      if (res.success) {
        toast.success('Banner已删除');
        fetchBanners();
      } else {
        toast.error(res.error?.message || '删除失败');
      }
    } catch (error) {
      console.error('Delete banner error:', error);
      toast.error('删除失败');
    }
  };

  // ========== 公告操作 ==========

  const handleSaveAnnouncement = async () => {
    if (!newAnnouncement.title.trim()) {
      toast.error('请输入公告标题');
      return;
    }

    if (saveLockRef.current) return;
    saveLockRef.current = true;
    setSaving(true);

    try {
      if (editingNotification) {
        const res = await adminApi.updateNotification(editingNotification.id, {
          title: newAnnouncement.title,
          content: newAnnouncement.content,
          type: newAnnouncement.type
        });
        if (res.success) {
          toast.success('公告更新成功');
          fetchNotifications();
        } else {
          toast.error(res.error?.message || '更新失败');
        }
      } else {
        const res = await adminApi.createNotification({
          title: newAnnouncement.title,
          content: newAnnouncement.content,
          type: newAnnouncement.type,
          status: newAnnouncement.publishNow ? 'published' : 'draft'
        });
        if (res.success) {
          toast.success(newAnnouncement.publishNow ? '公告发布成功' : '公告已保存为草稿');
          fetchNotifications();
        } else {
          toast.error(res.error?.message || '发布失败');
        }
      }
      setShowAnnouncementModal(false);
      resetAnnouncementForm();
    } catch (error) {
      console.error('Save announcement error:', error);
      toast.error('操作失败');
    } finally {
      setSaving(false);
      saveLockRef.current = false;
    }
  };

  const resetAnnouncementForm = () => {
    setNewAnnouncement({ title: '', content: '', type: 'announcement', publishNow: true });
    setEditingNotification(null);
  };

  const toggleNotificationStatus = async (notification: Notification) => {
    const newStatus = notification.status === 'published' ? 'draft' : 'published';
    try {
      const res = await adminApi.toggleNotificationStatus(notification.id, newStatus);
      if (res.success) {
        toast.success(`公告已${newStatus === 'published' ? '发布' : '撤回'}`);
        fetchNotifications();
      } else {
        toast.error(res.error?.message || '操作失败');
      }
    } catch (error) {
      console.error('Toggle notification status error:', error);
      toast.error('操作失败');
    }
  };

  const deleteNotification = async (id: string) => {
    if (!confirm('确定要删除此公告吗？')) return;
    try {
      const res = await adminApi.deleteNotification(id);
      if (res.success) {
        toast.success('公告已删除');
        fetchNotifications();
      } else {
        toast.error(res.error?.message || '删除失败');
      }
    } catch (error) {
      console.error('Delete notification error:', error);
      toast.error('删除失败');
    }
  };

  // ========== FAQ操作 ==========

  const handleSaveFaq = async () => {
    if (!newFaq.question.trim()) {
      toast.error('请输入问题');
      return;
    }
    if (!newFaq.answer.trim()) {
      toast.error('请输入回答');
      return;
    }

    if (saveLockRef.current) return;
    saveLockRef.current = true;
    setSaving(true);

    try {
      if (editingFaq) {
        const res = await adminApi.updateFaq(editingFaq.id, {
          category: newFaq.category,
          question: newFaq.question,
          answer: newFaq.answer
        });
        if (res.success) {
          toast.success('FAQ更新成功');
          fetchFaqs();
        } else {
          toast.error(res.error?.message || '更新失败');
        }
      } else {
        const res = await adminApi.createFaq({
          category: newFaq.category,
          question: newFaq.question,
          answer: newFaq.answer,
          sort_order: faqs.length,
          status: newFaq.status === ContentStatus.PUBLISHED ? 'visible' : 'hidden'
        });
        if (res.success) {
          toast.success('FAQ添加成功');
          fetchFaqs();
        } else {
          toast.error(res.error?.message || '添加失败');
        }
      }
      setShowFaqModal(false);
      resetFaqForm();
    } catch (error) {
      console.error('Save faq error:', error);
      toast.error('操作失败');
    } finally {
      setSaving(false);
      saveLockRef.current = false;
    }
  };

  const resetFaqForm = () => {
    setNewFaq({ category: '佣金规则', question: '', answer: '', status: ContentStatus.PUBLISHED });
    setEditingFaq(null);
  };

  const deleteFaq = async (id: string) => {
    if (!confirm('确定要删除此FAQ吗？')) return;
    try {
      const res = await adminApi.deleteFaq(id);
      if (res.success) {
        toast.success('FAQ已删除');
        fetchFaqs();
      } else {
        toast.error(res.error?.message || '删除失败');
      }
    } catch (error) {
      console.error('Delete faq error:', error);
      toast.error('删除失败');
    }
  };

  // ========== 招募配置操作 ==========

  const handleSaveRecruitConfig = async () => {
    if (!recruitConfig.title.trim()) {
      toast.error('请输入招募页主标题');
      return;
    }

    if (saveLockRef.current) return;
    saveLockRef.current = true;
    setSaving(true);

    try {
      const res = await adminApi.updateRecruitSettings({
        title: recruitConfig.title,
        description: recruitConfig.description,
        imageUrl: recruitConfig.imageUrl,
        benefits: recruitConfig.benefits
      });
      if (res.success) {
        toast.success('招募页配置保存成功');
      } else {
        toast.error(res.error?.message || '保存失败');
      }
    } catch (error) {
      console.error('Save recruit config error:', error);
      toast.error('保存失败');
    } finally {
      setSaving(false);
      saveLockRef.current = false;
    }
  };

  // ========== 筛选逻辑 ==========

  const filteredBanners = banners.filter(banner =>
    (banner.title || '').toLowerCase().includes(bannerSearch.toLowerCase())
  );

  const filteredNotifications = notifications.filter(notification =>
    notification.title.toLowerCase().includes(announcementSearch.toLowerCase()) ||
    (notification.content || '').toLowerCase().includes(announcementSearch.toLowerCase())
  );

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
    faq.answer.toLowerCase().includes(faqSearch.toLowerCase()) ||
    faq.category.toLowerCase().includes(faqSearch.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">内容管理</h1>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          <button onClick={() => setActiveTab('banner')} className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'banner' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}>Banner管理</button>
          <button onClick={() => setActiveTab('announcement')} className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'announcement' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}>公告管理</button>
          <button onClick={() => setActiveTab('recruit')} className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'recruit' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}>合伙人招募页配置</button>
          <button onClick={() => setActiveTab('faq')} className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'faq' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}>规则与FAQ</button>
        </div>

        {/* Tab Content: Banner */}
        {activeTab === 'banner' && (
          <div className="overflow-x-auto">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex gap-4 items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <input type="text" placeholder="搜索Banner标题" value={bannerSearch} onChange={(e) => setBannerSearch(e.target.value)} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm rounded-lg px-3 py-2 outline-none w-64" />
              <button onClick={() => { resetBannerForm(); setShowBannerModal(true); }} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">add</span>
                添加Banner
              </button>
            </div>

            {bannerLoading ? (
              <div className="p-4"><ListSkeleton count={3} /></div>
            ) : filteredBanners.length === 0 ? (
              <Empty icon="view_carousel" title="暂无Banner" description="点击右上角添加Banner" className="py-10" />
            ) : (
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
                    <th className="p-4 font-medium">图片</th>
                    <th className="p-4 font-medium">标题</th>
                    <th className="p-4 font-medium">跳转链接</th>
                    <th className="p-4 font-medium">排序</th>
                    <th className="p-4 font-medium">状态</th>
                    <th className="p-4 font-medium text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredBanners.map((banner) => (
                    <tr key={banner.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <td className="p-4">
                        <img src={banner.image_url} alt={banner.title || ''} className="w-24 h-12 object-cover rounded border border-slate-200 dark:border-slate-700" />
                      </td>
                      <td className="p-4 text-sm font-medium text-slate-900 dark:text-white">{banner.title || '-'}</td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-300 max-w-xs truncate">{banner.link_url || '-'}</td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{banner.sort_order}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${banner.status === 'visible' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>
                          {banner.status === 'visible' ? '显示中' : '已隐藏'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => { setEditingBanner(banner); setNewBanner({ title: banner.title || '', type: 'carousel', link: banner.link_url || '', imageUrl: banner.image_url }); setShowBannerModal(true); }} className="text-primary text-sm font-medium hover:underline">编辑</button>
                          <button onClick={() => toggleBannerStatus(banner)} className={`text-sm font-medium px-2 py-1 rounded hover:underline ${banner.status === 'visible' ? 'text-orange-500' : 'text-emerald-500'}`}>{banner.status === 'visible' ? '隐藏' : '显示'}</button>
                          <button onClick={() => deleteBanner(banner.id)} className="text-red-500 text-sm font-medium hover:underline">删除</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab Content: Announcement */}
        {activeTab === 'announcement' && (
          <div className="overflow-x-auto">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex gap-4 items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <input type="text" placeholder="搜索公告标题/内容" value={announcementSearch} onChange={(e) => setAnnouncementSearch(e.target.value)} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm rounded-lg px-3 py-2 outline-none w-64" />
              <button onClick={() => { resetAnnouncementForm(); setShowAnnouncementModal(true); }} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">add</span>
                发布公告
              </button>
            </div>

            {notificationLoading ? (
              <div className="p-4"><ListSkeleton count={3} /></div>
            ) : filteredNotifications.length === 0 ? (
              <Empty icon="campaign" title="暂无公告" description="点击右上角发布公告" className="py-10" />
            ) : (
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
                    <th className="p-4 font-medium">标题</th>
                    <th className="p-4 font-medium">类型</th>
                    <th className="p-4 font-medium">内容摘要</th>
                    <th className="p-4 font-medium">发布时间</th>
                    <th className="p-4 font-medium">状态</th>
                    <th className="p-4 font-medium text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredNotifications.map((notification) => (
                    <tr key={notification.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <td className="p-4 text-sm font-medium text-slate-900 dark:text-white">{notification.title}</td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                        <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs">{notification.type === 'announcement' ? '公告' : notification.type === 'notice' ? '通知' : 'FAQ'}</span>
                      </td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-300 max-w-xs truncate">{notification.content || '-'}</td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{formatDate(notification.created_at)}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${notification.status === 'published' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'}`}>
                          {notification.status === 'published' ? '已发布' : '草稿'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => { setEditingNotification(notification); setNewAnnouncement({ title: notification.title, content: notification.content || '', type: notification.type, publishNow: notification.status === 'published' }); setShowAnnouncementModal(true); }} className="text-primary text-sm font-medium hover:underline">编辑</button>
                          <button onClick={() => toggleNotificationStatus(notification)} className={`text-sm font-medium px-2 py-1 rounded hover:underline ${notification.status === 'published' ? 'text-orange-500' : 'text-emerald-500'}`}>{notification.status === 'published' ? '撤回' : '发布'}</button>
                          <button onClick={() => deleteNotification(notification.id)} className="text-red-500 text-sm font-medium hover:underline">删除</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab Content: Recruit */}
        {activeTab === 'recruit' && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">合伙人招募页配置</h2>
            {recruitLoading ? (
              <ListSkeleton count={4} />
            ) : (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">主标题</label>
                  <input type="text" value={recruitConfig.title} onChange={(e) => setRecruitConfig({ ...recruitConfig, title: e.target.value })} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all" maxLength={200} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">招募说明文案</label>
                  <textarea rows={4} value={recruitConfig.description} onChange={(e) => setRecruitConfig({ ...recruitConfig, description: e.target.value })} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all resize-none" maxLength={2000} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">招募海报/头图URL</label>
                  <input type="text" value={recruitConfig.imageUrl} onChange={(e) => setRecruitConfig({ ...recruitConfig, imageUrl: e.target.value })} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all" maxLength={500} />
                  {recruitConfig.imageUrl && (
                    <img src={recruitConfig.imageUrl} alt="预览" className="mt-2 w-64 h-32 object-cover rounded-lg border border-slate-200 dark:border-slate-700" />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">核心优势 (每行一个)</label>
                  <textarea rows={5} value={recruitConfig.benefits.join('\n')} onChange={(e) => setRecruitConfig({ ...recruitConfig, benefits: e.target.value.split('\n').filter(b => b.trim()) })} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all resize-none" />
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                  <button onClick={handleSaveRecruitConfig} disabled={saving} className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50">
                    {saving ? '保存中...' : '保存配置'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: FAQ */}
        {activeTab === 'faq' && (
          <div className="overflow-x-auto">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex gap-4 items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <input type="text" placeholder="搜索问题或分类" value={faqSearch} onChange={(e) => setFaqSearch(e.target.value)} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm rounded-lg px-3 py-2 outline-none w-64" />
              <button onClick={() => { resetFaqForm(); setShowFaqModal(true); }} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">add</span>
                添加FAQ
              </button>
            </div>

            {faqLoading ? (
              <div className="p-4"><ListSkeleton count={3} /></div>
            ) : filteredFaqs.length === 0 ? (
              <Empty icon="help" title="暂无规则与FAQ" description="点击右上角添加FAQ" className="py-10" />
            ) : (
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
                    <th className="p-4 font-medium">排序</th>
                    <th className="p-4 font-medium">分类</th>
                    <th className="p-4 font-medium">问题</th>
                    <th className="p-4 font-medium">状态</th>
                    <th className="p-4 font-medium text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredFaqs.map((faq) => (
                    <tr key={faq.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <td className="p-4 text-sm text-slate-900 dark:text-white">{faq.sort_order}</td>
                      <td className="p-4 text-sm text-slate-900 dark:text-white">
                        <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs font-medium">{faq.category}</span>
                      </td>
                      <td className="p-4 text-sm text-slate-900 dark:text-white max-w-md">
                        <p className="font-medium truncate">{faq.question}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">{faq.answer}</p>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${faq.status === 'visible' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400'}`}>
                          {faq.status === 'visible' ? '显示中' : '已隐藏'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => { setEditingFaq(faq); setNewFaq({ category: faq.category, question: faq.question, answer: faq.answer, status: faq.status === 'visible' ? ContentStatus.PUBLISHED : ContentStatus.HIDDEN }); setShowFaqModal(true); }} className="text-primary text-sm font-medium hover:underline">编辑</button>
                          <button onClick={() => deleteFaq(faq.id)} className="text-red-500 text-sm font-medium hover:underline">删除</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Banner Modal */}
      {showBannerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{editingBanner ? '编辑Banner' : '添加Banner'}</h3>
              <button onClick={() => { setShowBannerModal(false); resetBannerForm(); }} className="text-slate-400 hover:text-slate-500">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">标题</label>
                <input type="text" value={newBanner.title} onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none" placeholder="如：春季促销" maxLength={100} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">图片URL <span className="text-red-500">*</span></label>
                <input type="text" value={newBanner.imageUrl} onChange={(e) => setNewBanner({ ...newBanner, imageUrl: e.target.value })} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none" placeholder="图片URL" maxLength={500} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">跳转链接</label>
                <input type="text" value={newBanner.link} onChange={(e) => setNewBanner({ ...newBanner, link: e.target.value })} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none" placeholder="如：/products" maxLength={500} />
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => { setShowBannerModal(false); resetBannerForm(); }} className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">取消</button>
              <button onClick={handleSaveBanner} disabled={saving} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">{saving ? '保存中...' : '保存'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{editingNotification ? '编辑公告' : '发布公告'}</h3>
              <button onClick={() => { setShowAnnouncementModal(false); resetAnnouncementForm(); }} className="text-slate-400 hover:text-slate-500">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">公告标题 <span className="text-red-500">*</span></label>
                <input type="text" value={newAnnouncement.title} onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none" placeholder="输入公告标题" maxLength={200} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">类型</label>
                <select value={newAnnouncement.type} onChange={(e) => setNewAnnouncement({ ...newAnnouncement, type: e.target.value })} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none">
                  <option value="announcement">公告</option>
                  <option value="notice">通知</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">公告内容</label>
                <textarea rows={4} value={newAnnouncement.content} onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none resize-none" placeholder="输入公告详细内容" maxLength={5000} />
              </div>
              {!editingNotification && (
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="publishNow" checked={newAnnouncement.publishNow} onChange={(e) => setNewAnnouncement({ ...newAnnouncement, publishNow: e.target.checked })} className="rounded border-slate-300 text-primary focus:ring-primary" />
                  <label htmlFor="publishNow" className="text-sm text-slate-700 dark:text-slate-300">立即发布</label>
                </div>
              )}
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => { setShowAnnouncementModal(false); resetAnnouncementForm(); }} className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">取消</button>
              <button onClick={handleSaveAnnouncement} disabled={saving} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">{saving ? '保存中...' : '保存'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit FAQ Modal */}
      {showFaqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{editingFaq ? '编辑FAQ' : '添加FAQ'}</h3>
              <button onClick={() => { setShowFaqModal(false); resetFaqForm(); }} className="text-slate-400 hover:text-slate-500">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">分类</label>
                <select value={newFaq.category} onChange={(e) => setNewFaq({ ...newFaq, category: e.target.value })} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none">
                  {VALID_FAQ_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">问题 <span className="text-red-500">*</span></label>
                <input type="text" value={newFaq.question} onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none" placeholder="输入常见问题" maxLength={500} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">回答 <span className="text-red-500">*</span></label>
                <textarea rows={4} value={newFaq.answer} onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none resize-none" placeholder="输入详细解答" maxLength={2000} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">状态</label>
                <select value={newFaq.status} onChange={(e) => setNewFaq({ ...newFaq, status: e.target.value as ContentStatus })} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none">
                  <option value={ContentStatus.PUBLISHED}>{ContentStatusLabel[ContentStatus.PUBLISHED]}</option>
                  <option value={ContentStatus.HIDDEN}>{ContentStatusLabel[ContentStatus.HIDDEN]}</option>
                </select>
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => { setShowFaqModal(false); resetFaqForm(); }} className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">取消</button>
              <button onClick={handleSaveFaq} disabled={saving} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">{saving ? '保存中...' : '保存'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}