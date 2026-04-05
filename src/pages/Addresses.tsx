import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Empty from '../components/Empty';
import { addressesApi } from '../lib/api';
import { Skeleton } from '../components/Skeleton';
import { useToast } from '../components/Toast';

interface Address {
  id: string;
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  is_default: boolean;
}

export default function Addresses() {
  const navigate = useNavigate();
  const toast = useToast();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [saving, setSaving] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    detail: '',
    is_default: false
  });

  // 验证手机号格式
  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  // 加载地址列表
  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await addressesApi.getList();
      if (res.success) {
        setAddresses(res.data || []);
      } else {
        setError(res.error?.message || '加载失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 拼接完整地址显示
  const formatAddress = (addr: Address) => {
    const parts = [addr.province, addr.city, addr.district, addr.detail].filter(Boolean);
    return parts.join(' ');
  };

  // 格式化手机号显示
  const formatPhone = (phone: string) => {
    if (phone.length === 11) {
      return `+86 ${phone.slice(0, 3)} ${phone.slice(3, 7)} ${phone.slice(7)}`;
    }
    return phone;
  };

  // 编辑地址
  const handleEditClick = (address: Address) => {
    setEditingAddress({ ...address });
    setIsEditModalOpen(true);
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editingAddress) return;

    if (!validatePhone(editingAddress.phone)) {
      toast.error('请输入正确的手机号码');
      return;
    }

    setSaving(true);
    try {
      const res = await addressesApi.update(editingAddress.id, {
        name: editingAddress.name,
        phone: editingAddress.phone,
        province: editingAddress.province,
        city: editingAddress.city,
        district: editingAddress.district,
        detail: editingAddress.detail,
        is_default: editingAddress.is_default
      });
      if (res.success) {
        toast.success('保存成功');
        setIsEditModalOpen(false);
        setEditingAddress(null);
        loadAddresses();
      } else {
        toast.error(res.error?.message || '保存失败');
      }
    } catch (err) {
      toast.error('网络错误，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  // 删除地址
  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个地址吗？')) return;
    try {
      const res = await addressesApi.remove(id);
      if (res.success) {
        toast.success('删除成功');
        loadAddresses();
      } else {
        toast.error(res.error?.message || '删除失败');
      }
    } catch (err) {
      toast.error('网络错误，请稍后重试');
    }
  };

  // 添加新地址
  const handleAddAddress = async () => {
    if (!newAddress.name || !newAddress.phone || !newAddress.detail) {
      toast.error('请填写收货人、手机号码和详细地址');
      return;
    }

    if (!validatePhone(newAddress.phone)) {
      toast.error('请输入正确的手机号码');
      return;
    }

    setSaving(true);
    try {
      const res = await addressesApi.add({
        name: newAddress.name,
        phone: newAddress.phone,
        province: newAddress.province,
        city: newAddress.city,
        district: newAddress.district,
        detail: newAddress.detail,
        is_default: newAddress.is_default
      });
      if (res.success) {
        toast.success('添加成功');
        setIsAddModalOpen(false);
        setNewAddress({
          name: '',
          phone: '',
          province: '',
          city: '',
          district: '',
          detail: '',
          is_default: false
        });
        loadAddresses();
      } else {
        toast.error(res.error?.message || '添加失败');
      }
    } catch (err) {
      toast.error('网络错误，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  // 编辑输入框变化
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (editingAddress) {
      const { name, value, type } = e.target;
      const checked = (e.target as HTMLInputElement).checked;
      setEditingAddress({
        ...editingAddress,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };

  // 新地址输入框变化
  const handleAddInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setNewAddress({
      ...newAddress,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  return (
    <div className="relative flex h-screen max-w-md mx-auto flex-col bg-white dark:bg-slate-900 overflow-hidden shadow-xl">
      {/* Top App Bar */}
      <div className="flex items-center bg-white dark:bg-slate-900 p-4 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-slate-900 dark:text-slate-100 flex size-10 shrink-0 items-center justify-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
        </button>
        <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-tight flex-1 ml-2">我的收货地址</h2>
      </div>

      {/* Address List Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg p-5">
                <Skeleton className="h-5 w-24 mb-2" />
                <Skeleton className="h-4 w-32 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-10">{error}</div>
        ) : addresses.length > 0 ? (
          addresses.map((address) => (
            <div key={address.id} className={`bg-white dark:bg-slate-800 border ${address.is_default ? 'border-primary/20' : 'border-slate-100 dark:border-slate-700'} rounded-lg p-5 shadow-sm relative`}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-slate-900 dark:text-slate-100 font-bold text-base">{address.name}</span>
                  <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">{formatPhone(address.phone)}</span>
                </div>
                {address.is_default && (
                  <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-sm">默认</span>
                )}
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">
                {formatAddress(address)}
              </p>
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-4">
                <div className="flex gap-6">
                  <button onClick={() => handleEditClick(address)} className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-sm font-medium hover:text-primary transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                    编辑
                  </button>
                  <button onClick={() => handleDelete(address.id)} className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-sm font-medium hover:text-red-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                    删除
                  </button>
                </div>
                <div className="w-16 h-10 bg-slate-100 dark:bg-slate-700 rounded flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
              </div>
            </div>
          ))
        ) : (
          <Empty
            icon="location_on"
            title="暂无收货地址"
            description="您还没有添加任何收货地址"
            className="mt-10"
          />
        )}
      </div>

      {/* Sticky Bottom Action Button */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
        <button onClick={() => setIsAddModalOpen(true)} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-primary/25 transition-all active:scale-[0.98]">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          添加新地址
        </button>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setIsAddModalOpen(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">添加新地址</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">收货人 *</label>
                <input
                  type="text"
                  name="name"
                  value={newAddress.name}
                  onChange={handleAddInputChange}
                  placeholder="请输入收货人姓名"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">手机号码 *</label>
                <input
                  type="text"
                  name="phone"
                  value={newAddress.phone}
                  onChange={handleAddInputChange}
                  placeholder="请输入11位手机号"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">省份</label>
                  <input
                    type="text"
                    name="province"
                    value={newAddress.province}
                    onChange={handleAddInputChange}
                    placeholder="如: 广东省"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">城市</label>
                  <input
                    type="text"
                    name="city"
                    value={newAddress.city}
                    onChange={handleAddInputChange}
                    placeholder="如: 深圳市"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">区县</label>
                  <input
                    type="text"
                    name="district"
                    value={newAddress.district}
                    onChange={handleAddInputChange}
                    placeholder="如: 南山区"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">详细地址 *</label>
                <textarea
                  name="detail"
                  value={newAddress.detail}
                  onChange={handleAddInputChange}
                  rows={3}
                  placeholder="请输入详细地址，如街道、门牌号等"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>
              <div className="flex items-center justify-between pt-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">设为默认地址</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_default"
                    checked={newAddress.is_default}
                    onChange={handleAddInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
              <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-2.5 rounded-lg font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                取消
              </button>
              <button onClick={handleAddAddress} disabled={saving} className="flex-1 py-2.5 rounded-lg font-medium text-white bg-primary hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20 disabled:opacity-50">
                {saving ? '添加中...' : '添加'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingAddress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setIsEditModalOpen(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">编辑地址</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">收货人</label>
                <input
                  type="text"
                  name="name"
                  value={editingAddress.name}
                  onChange={handleEditInputChange}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">手机号码</label>
                <input
                  type="text"
                  name="phone"
                  value={editingAddress.phone}
                  onChange={handleEditInputChange}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">省份</label>
                  <input
                    type="text"
                    name="province"
                    value={editingAddress.province}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">城市</label>
                  <input
                    type="text"
                    name="city"
                    value={editingAddress.city}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">区县</label>
                  <input
                    type="text"
                    name="district"
                    value={editingAddress.district}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">详细地址</label>
                <textarea
                  name="detail"
                  value={editingAddress.detail}
                  onChange={handleEditInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>
              <div className="flex items-center justify-between pt-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">设为默认地址</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_default"
                    checked={editingAddress.is_default}
                    onChange={handleEditInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
              <button onClick={() => setIsEditModalOpen(false)} className="flex-1 py-2.5 rounded-lg font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                取消
              </button>
              <button onClick={handleSaveEdit} disabled={saving} className="flex-1 py-2.5 rounded-lg font-medium text-white bg-primary hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20 disabled:opacity-50">
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}