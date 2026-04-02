import { useState, useEffect } from 'react';
import Empty from '../../components/Empty';
import { ListSkeleton } from '../../components/Skeleton';
import { useToast } from '../../components/Toast';
import { UserStatus } from '../../types';
import { adminApi } from '../../lib/api';

interface Settings {
  site_name: string;
  customer_service_phone: string;
  site_logo: string;
  site_description: string;
  copyright: string;
  wechat_appid: string;
  wechat_appsecret: string;
  [key: string]: string;
}

interface OperationLog {
  id: string;
  date: string;
  operator: string;
  operator_id: string;
  type: string;
  detail: string;
  ip: string;
}

export default function AdminSettings() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Settings state
  const [settings, setSettings] = useState<Settings>({
    site_name: '名酒佳酿合伙人商城',
    customer_service_phone: '400-123-4567',
    site_logo: '',
    site_description: '专注于高端白酒、红酒及养生酒的社交电商平台。',
    copyright: '© 2026 名酒佳酿 版权所有',
    wechat_appid: '',
    wechat_appsecret: '',
  });

  // Operation Logs State
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logDate, setLogDate] = useState('');
  const [logOperator, setLogOperator] = useState('');
  const [logType, setLogType] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'admin') {
      fetchOperationLogs();
    }
  }, [activeTab, logDate, logOperator, logType]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getSettings();
      if (res.success && res.data) {
        setSettings(prev => ({ ...prev, ...res.data }));
      }
    } catch (error) {
      console.error('Get settings error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOperationLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await adminApi.getOperationLogs({
        date: logDate || undefined,
        operator: logOperator || undefined,
        type: logType || undefined
      });
      if (res.success && res.data) {
        setLogs(res.data.list || []);
      }
    } catch (error) {
      console.error('Get operation logs error:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const res = await adminApi.updateSettings(settings);
      if (res.success) {
        toast.success('设置保存成功');
      } else {
        toast.error('保存失败');
      }
    } catch (error) {
      console.error('Save settings error:', error);
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const filteredLogs = logs.filter(log => {
    const matchesDate = logDate ? log.date.startsWith(logDate) : true;
    const matchesOperator = logOperator ? log.operator === logOperator : true;
    const matchesType = logType ? log.type === logType : true;
    return matchesDate && matchesOperator && matchesType;
  });

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">系统设置</h1>
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[18px]">save</span>
          {saving ? '保存中...' : '保存设置'}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
            <button
              onClick={() => setActiveTab('basic')}
              className={`px-4 py-3 text-left text-sm font-medium transition-colors flex items-center gap-3 ${activeTab === 'basic' ? 'bg-primary/5 text-primary border-r-2 border-primary' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50 border-r-2 border-transparent'}`}
            >
              <span className="material-symbols-outlined text-[20px]">storefront</span>
              基础设置
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-3 text-left text-sm font-medium transition-colors flex items-center gap-3 ${activeTab === 'admin' ? 'bg-primary/5 text-primary border-r-2 border-primary' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50 border-r-2 border-transparent'}`}
            >
              <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
              管理员账号
            </button>
            <button
              onClick={() => setActiveTab('payment')}
              className={`px-4 py-3 text-left text-sm font-medium transition-colors flex items-center gap-3 ${activeTab === 'payment' ? 'bg-primary/5 text-primary border-r-2 border-primary' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50 border-r-2 border-transparent'}`}
            >
              <span className="material-symbols-outlined text-[20px]">payments</span>
              支付配置
            </button>
            <button
              onClick={() => setActiveTab('notification')}
              className={`px-4 py-3 text-left text-sm font-medium transition-colors flex items-center gap-3 ${activeTab === 'notification' ? 'bg-primary/5 text-primary border-r-2 border-primary' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50 border-r-2 border-transparent'}`}
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              消息模板配置
            </button>
            <button
              onClick={() => setActiveTab('anticheat')}
              className={`px-4 py-3 text-left text-sm font-medium transition-colors flex items-center gap-3 ${activeTab === 'anticheat' ? 'bg-primary/5 text-primary border-r-2 border-primary' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50 border-r-2 border-transparent'}`}
            >
              <span className="material-symbols-outlined text-[20px]">security</span>
              反作弊设置
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">

          {/* Basic Settings */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-4">基础设置</h2>

              {loading ? (
                <ListSkeleton count={5} />
              ) : (
                <div className="grid grid-cols-1 gap-6 max-w-2xl">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">商城名称</label>
                    <input
                      type="text"
                      value={settings.site_name}
                      onChange={(e) => updateSetting('site_name', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary dark:focus:border-primary transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">客服电话</label>
                    <input
                      type="text"
                      value={settings.customer_service_phone}
                      onChange={(e) => updateSetting('customer_service_phone', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary dark:focus:border-primary transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">商城Logo</label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                        {settings.site_logo ? (
                          <img src={settings.site_logo} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-slate-400">image</span>
                        )}
                      </div>
                      <button className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                        上传图片
                      </button>
                      <p className="text-xs text-slate-500">建议尺寸 200x200px，支持 PNG/JPG</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">商城简介</label>
                    <textarea
                      rows={4}
                      value={settings.site_description}
                      onChange={(e) => updateSetting('site_description', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary dark:focus:border-primary transition-colors resize-none"
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">版权信息</label>
                    <input
                      type="text"
                      value={settings.copyright}
                      onChange={(e) => updateSetting('copyright', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary dark:focus:border-primary transition-colors"
                    />
                  </div>

                  <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                    <h3 className="text-md font-medium text-slate-900 dark:text-white mb-4">小程序配置</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">AppID</label>
                        <input
                          type="text"
                          value={settings.wechat_appid}
                          onChange={(e) => updateSetting('wechat_appid', e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary dark:focus:border-primary transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">AppSecret</label>
                        <input
                          type="password"
                          value={settings.wechat_appsecret}
                          onChange={(e) => updateSetting('wechat_appsecret', e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary dark:focus:border-primary transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Admin Account Management */}
          {activeTab === 'admin' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">管理员账号管理</h2>
                <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  添加管理员
                </button>
              </div>

              <div className="space-y-8">
                {/* Admin List */}
                <div>
                  <h3 className="text-md font-medium text-slate-900 dark:text-white mb-4">管理员列表</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
                          <th className="p-4 font-medium">账号</th>
                          <th className="p-4 font-medium">姓名</th>
                          <th className="p-4 font-medium">角色权限</th>
                          <th className="p-4 font-medium">最后登录</th>
                          <th className="p-4 font-medium">状态</th>
                          <th className="p-4 font-medium text-right">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="p-4 text-sm text-slate-900 dark:text-white">admin</td>
                          <td className="p-4 text-sm text-slate-600 dark:text-slate-300">超级管理员</td>
                          <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                            <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs">全部权限</span>
                          </td>
                          <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{new Date().toLocaleString('zh-CN')}</td>
                          <td className="p-4">
                            <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 px-2 py-1 rounded text-xs">{UserStatus.ACTIVE}</span>
                          </td>
                          <td className="p-4 text-right">
                            <button className="text-slate-400 hover:text-primary transition-colors" title="编辑"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Operation Logs */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-md font-medium text-slate-900 dark:text-white">操作日志</h3>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={logDate}
                        onChange={(e) => setLogDate(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary text-slate-500"
                      />
                      <select
                        value={logOperator}
                        onChange={(e) => setLogOperator(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary"
                      >
                        <option value="">全部操作人</option>
                        <option value="admin">admin</option>
                      </select>
                      <select
                        value={logType}
                        onChange={(e) => setLogType(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary"
                      >
                        <option value="">全部操作类型</option>
                        <option value="系统登录">系统登录</option>
                        <option value="审核提现">审核提现</option>
                        <option value="修改等级">修改等级</option>
                      </select>
                    </div>
                  </div>
                  {logsLoading ? (
                    <ListSkeleton count={3} />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
                            <th className="p-4 font-medium">时间</th>
                            <th className="p-4 font-medium">操作人</th>
                            <th className="p-4 font-medium">操作类型</th>
                            <th className="p-4 font-medium">操作详情</th>
                            <th className="p-4 font-medium">IP地址</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                          {filteredLogs.length > 0 ? (
                            filteredLogs.map(log => (
                              <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{log.date}</td>
                                <td className="p-4 text-sm text-slate-900 dark:text-white">{log.operator}</td>
                                <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{log.type}</td>
                                <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{log.detail}</td>
                                <td className="p-4 text-sm text-slate-500">{log.ip}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="p-0">
                                <Empty
                                  icon="history"
                                  title="暂无操作日志"
                                  description="没有找到符合条件的操作日志"
                                />
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Payment Config */}
          {activeTab === 'payment' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-4">支付配置</h2>

              <div className="grid grid-cols-1 gap-6 max-w-2xl">
                <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                        <span className="material-symbols-outlined">chat</span>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-slate-900 dark:text-white">微信支付</h3>
                        <p className="text-xs text-slate-500">用于小程序和公众号支付</p>
                      </div>
                    </div>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                      <input type="checkbox" name="toggle" id="wx-toggle" defaultChecked className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer" style={{ right: 0, borderColor: '#10b981' }}/>
                      <label htmlFor="wx-toggle" className="toggle-label block overflow-hidden h-5 rounded-full bg-emerald-500 cursor-pointer"></label>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">AppID</label>
                      <input
                        type="text"
                        value={settings.wechat_appid}
                        onChange={(e) => updateSetting('wechat_appid', e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">商户号 (MCHID)</label>
                      <input type="text" placeholder="请输入商户号" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">API 密钥</label>
                      <input type="password" placeholder="请输入API密钥" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none" />
                    </div>
                  </div>
                </div>

                <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                        <span className="material-symbols-outlined">payments</span>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-slate-900 dark:text-white">支付宝支付</h3>
                        <p className="text-xs text-slate-500">用于H5和App支付</p>
                      </div>
                    </div>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                      <input type="checkbox" name="toggle" id="ali-toggle" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer" style={{ right: '1.25rem', borderColor: '#cbd5e1' }}/>
                      <label htmlFor="ali-toggle" className="toggle-label block overflow-hidden h-5 rounded-full bg-slate-300 cursor-pointer"></label>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500">当前未启用支付宝支付</p>
                </div>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notification' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-4">消息模板配置</h2>

              <div className="grid grid-cols-1 gap-6 max-w-2xl">
                <div className="p-5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-md font-medium text-slate-900 dark:text-white">收益到账通知</h3>
                      <p className="text-xs text-slate-500 mt-1">当合伙人获得分销佣金或分红时触发</p>
                    </div>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                      <input type="checkbox" name="toggle" id="income-toggle" defaultChecked className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer" style={{ right: 0, borderColor: '#10b981' }}/>
                      <label htmlFor="income-toggle" className="toggle-label block overflow-hidden h-5 rounded-full bg-emerald-500 cursor-pointer"></label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">微信小程序模板 ID</label>
                    <input type="text" placeholder="请输入模板ID" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none" />
                  </div>
                </div>

                <div className="p-5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-md font-medium text-slate-900 dark:text-white">等级升级通知</h3>
                      <p className="text-xs text-slate-500 mt-1">当合伙人星级或销售级别提升时触发</p>
                    </div>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                      <input type="checkbox" name="toggle" id="upgrade-toggle" defaultChecked className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer" style={{ right: 0, borderColor: '#10b981' }}/>
                      <label htmlFor="upgrade-toggle" className="toggle-label block overflow-hidden h-5 rounded-full bg-emerald-500 cursor-pointer"></label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">微信小程序模板 ID</label>
                    <input type="text" placeholder="请输入模板ID" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none" />
                  </div>
                </div>

                <div className="p-5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-md font-medium text-slate-900 dark:text-white">提现审核通知</h3>
                      <p className="text-xs text-slate-500 mt-1">当提现申请通过或被拒绝时触发</p>
                    </div>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                      <input type="checkbox" name="toggle" id="withdraw-toggle" defaultChecked className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer" style={{ right: 0, borderColor: '#10b981' }}/>
                      <label htmlFor="withdraw-toggle" className="toggle-label block overflow-hidden h-5 rounded-full bg-emerald-500 cursor-pointer"></label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">微信小程序模板 ID</label>
                    <input type="text" placeholder="请输入模板ID" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Anti-Cheat Settings */}
          {activeTab === 'anticheat' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-4">反作弊设置</h2>

              <div className="space-y-8">
                {/* Risk Control Rules */}
                <div className="max-w-2xl space-y-4">
                  <h3 className="text-md font-medium text-slate-900 dark:text-white">风控规则配置</h3>

                  <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-slate-900 dark:text-white">同一IP下单频率限制</h4>
                        <p className="text-xs text-slate-500 mt-1">限制短时间内同一IP的异常下单行为</p>
                      </div>
                      <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                        <input type="checkbox" name="toggle" id="ip-limit-toggle" defaultChecked className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer" style={{ right: 0, borderColor: '#10b981' }}/>
                        <label htmlFor="ip-limit-toggle" className="toggle-label block overflow-hidden h-5 rounded-full bg-emerald-500 cursor-pointer"></label>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600 dark:text-slate-400">限制</span>
                      <input type="number" defaultValue="1" className="w-16 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-sm outline-none text-center" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">分钟内，最多允许下单</span>
                      <input type="number" defaultValue="5" className="w-16 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-sm outline-none text-center" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">次</span>
                    </div>
                  </div>

                  <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-slate-900 dark:text-white">同一设备关联多个账号预警</h4>
                        <p className="text-xs text-slate-500 mt-1">检测并预警可能存在的刷单或作弊行为</p>
                      </div>
                      <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                        <input type="checkbox" name="toggle" id="device-limit-toggle" defaultChecked className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer" style={{ right: 0, borderColor: '#10b981' }}/>
                        <label htmlFor="device-limit-toggle" className="toggle-label block overflow-hidden h-5 rounded-full bg-emerald-500 cursor-pointer"></label>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600 dark:text-slate-400">同一设备登录超过</span>
                      <input type="number" defaultValue="3" className="w-16 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-sm outline-none text-center" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">个不同账号时，触发预警</span>
                    </div>
                  </div>
                </div>

                {/* Blacklist Management */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-md font-medium text-slate-900 dark:text-white">黑名单管理</h3>
                    <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">add</span>
                      添加封禁
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
                          <th className="p-4 font-medium">用户ID/手机号</th>
                          <th className="p-4 font-medium">封禁原因</th>
                          <th className="p-4 font-medium">封禁时间</th>
                          <th className="p-4 font-medium">限制范围</th>
                          <th className="p-4 font-medium text-right">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="p-4 text-sm text-slate-900 dark:text-white">138****1234</td>
                          <td className="p-4 text-sm text-slate-600 dark:text-slate-300">恶意刷单，异常高频下单</td>
                          <td className="p-4 text-sm text-slate-600 dark:text-slate-300">2026-03-20 11:30:00</td>
                          <td className="p-4">
                            <div className="flex gap-1">
                              <span className="bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400 px-2 py-0.5 rounded text-xs">禁止登录</span>
                              <span className="bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400 px-2 py-0.5 rounded text-xs">禁止下单</span>
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <button className="text-slate-400 hover:text-primary transition-colors text-sm">解除封禁</button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}