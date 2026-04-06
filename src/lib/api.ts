/**
 * API 请求封装
 * 统一处理请求和响应
 */

import type { RankReward, PeriodWeights, DisplaySettings } from '../pages/admin/AdminLeaderboard';

// 生产环境使用相对路径，开发环境使用环境变量或默认值
const API_BASE_URL = import.meta.env.PROD
  ? '/api'
  : (import.meta.env.VITE_API_URL || 'http://localhost:5000/api');

// 获取存储的 token
const getToken = (): string | null => {
  // 首先尝试从 token 键获取（Login.tsx 保存方式）
  const token = localStorage.getItem('token');
  if (token) {
    return token;
  }
  // 然后尝试从 session 键获取（兼容旧方式）
  const session = localStorage.getItem('session');
  if (session) {
    try {
      const parsed = JSON.parse(session);
      return parsed.access_token || null;
    } catch {
      return null;
    }
  }
  return null;
};

// 请求配置
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
  token?: string;
}

// API 响应类型
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  message?: string;
}

/**
 * 发起 API 请求
 */
async function request<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, headers = {}, token } = options;

  const authToken = token || getToken();

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
    }
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || {
          code: 'REQUEST_ERROR',
          message: `请求失败: ${response.status}`
        }
      };
    }

    return data;
  } catch (error) {
    console.error('API request error:', error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: '网络错误，请检查网络连接'
      }
    };
  }
}

// ===========================================
// 认证 API
// ===========================================

export const authApi = {
  register: (data: { phone: string; password: string; name?: string; inviteCode?: string }) =>
    request('/auth/register', { method: 'POST', body: data }),

  login: (data: { phone: string; password: string }) =>
    request('/auth/login', { method: 'POST', body: data }),

  logout: () =>
    request('/auth/logout', { method: 'POST' }),

  getMe: () =>
    request('/auth/me'),

  updateProfile: (data: { name?: string; avatar?: string }) =>
    request('/auth/profile', { method: 'PUT', body: data }),

  updatePassword: (data: { oldPassword: string; newPassword: string }) =>
    request('/auth/password', { method: 'PUT', body: data }),

  // 忘记密码：发送验证码
  forgotPassword: (phone: string) =>
    request('/auth/forgot-password', { method: 'POST', body: { phone } }),

  // 重置密码
  resetPassword: (data: { phone: string; code: string; newPassword: string }) =>
    request('/auth/reset-password', { method: 'POST', body: data })
};

// ===========================================
// 商品 API
// ===========================================

export const productsApi = {
  getList: (params?: {
    page?: number;
    pageSize?: number;
    category?: string;
    keyword?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    sortOrder?: string;
  }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, String(value));
        }
      });
    }
    return request(`/products?${query.toString()}`);
  },

  getDetail: (id: string) =>
    request(`/products/${id}`),

  getCategories: () =>
    request('/products/categories/list'),

  searchSuggest: (keyword: string) =>
    request(`/products/search/suggest?keyword=${encodeURIComponent(keyword)}`)
};

// ===========================================
// 购物车 API
// ===========================================

export const cartApi = {
  get: () =>
    request('/orders/cart'),

  add: (data: { product_id: string; spec?: string; quantity?: number }) =>
    request('/orders/cart', { method: 'POST', body: data }),

  update: (id: string, data: { quantity?: number; selected?: boolean }) =>
    request(`/orders/cart/${id}`, { method: 'PUT', body: data }),

  remove: (id: string) =>
    request(`/orders/cart/${id}`, { method: 'DELETE' })
};

// ===========================================
// 订单 API
// ===========================================

export const ordersApi = {
  getList: (params?: { status?: string; page?: number; pageSize?: number }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, String(value));
        }
      });
    }
    return request(`/orders?${query.toString()}`);
  },

  getStats: () =>
    request('/orders/stats'),

  getDetail: (id: string) =>
    request(`/orders/${id}`),

  create: (data: {
    address_id: string;
    cart_item_ids?: string[];
    coupon_id?: string;
    note?: string;
    referrer_id?: string;
    order_type?: 'normal' | 'flash_sale' | 'group_buy';
    activity_id?: string;
  }) =>
    request('/orders', { method: 'POST', body: data }),

  cancel: (id: string) =>
    request(`/orders/${id}/cancel`, { method: 'PUT' }),

  confirm: (id: string) =>
    request(`/orders/${id}/confirm`, { method: 'PUT' }),

  pay: (id: string) =>
    request(`/orders/${id}/pay`, { method: 'PUT' }),

  // 申请退款
  requestRefund: (id: string, data: { reason: string }) =>
    request(`/orders/${id}/refund`, { method: 'POST', body: data })
};

// ===========================================
// 地址 API
// ===========================================

export const addressesApi = {
  getList: () =>
    request('/addresses'),

  add: (data: {
    name: string;
    phone: string;
    province?: string;
    city?: string;
    district?: string;
    detail?: string;
    is_default?: boolean;
  }) =>
    request('/addresses', { method: 'POST', body: data }),

  update: (id: string, data: Partial<{
    name: string;
    phone: string;
    province: string;
    city: string;
    district: string;
    detail: string;
    is_default: boolean;
  }>) =>
    request(`/addresses/${id}`, { method: 'PUT', body: data }),

  remove: (id: string) =>
    request(`/addresses/${id}`, { method: 'DELETE' })
};

// ===========================================
// 合伙人 API
// ===========================================

export const partnerApi = {
  getProfile: () =>
    request('/partner/profile'),

  getTeam: (params?: { page?: number; pageSize?: number; level?: string }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, String(value));
        }
      });
    }
    return request(`/partner/team?${query.toString()}`);
  },

  apply: (level?: string) =>
    request('/partner/apply', { method: 'POST', body: { level } }),

  getIncome: (params?: { page?: number; pageSize?: number; type?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, String(value));
        }
      });
    }
    return request(`/partner/income?${query.toString()}`);
  },

  withdraw: (data: { amount: number; method: string; account_info: any }) =>
    request('/partner/withdraw', { method: 'POST', body: data }),

  getWithdrawals: (params?: { page?: number; pageSize?: number; status?: string }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, String(value));
        }
      });
    }
    return request(`/partner/withdrawals?${query.toString()}`);
  },

  // 排行榜（公开接口，无需登录）
  getLeaderboard: (params?: { type?: 'sales' | 'income'; period?: 'week' | 'month' | 'year'; limit?: number }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, String(value));
        }
      });
    }
    return request(`/partner/leaderboard?${query.toString()}`);
  }
};

// ===========================================
// 营销 API
// ===========================================

export const marketingApi = {
  getCoupons: () =>
    request('/coupons'),

  claimCoupon: (id: string) =>
    request(`/coupons/${id}/claim`, { method: 'POST' }),

  getMyCoupons: (status?: string) => {
    const query = status ? `?status=${status}` : '';
    return request(`/my-coupons${query}`);
  },

  getFlashSales: (status?: string) => {
    const query = status ? `?status=${status}` : '';
    return request(`/flash-sales${query}`);
  },

  getGroupBuys: (status?: string) => {
    const query = status ? `?status=${status}` : '';
    return request(`/group-buys${query}`);
  },

  getBanners: () =>
    request('/banners'),

  getNotifications: (type?: string) => {
    const query = type ? `?type=${type}` : '';
    return request(`/notifications${query}`);
  }
};

// ===========================================
// 后台管理 API
// ===========================================

export const adminApi = {
  // 仪表盘
  getDashboard: () =>
    request('/admin/dashboard'),

  // 商品管理
  getProducts: (params?: any) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, String(value));
        }
      });
    }
    return request(`/admin/products?${query.toString()}`);
  },

  getProduct: (id: string) =>
    request(`/admin/products/${id}`),

  createProduct: (data: any) =>
    request('/admin/products', { method: 'POST', body: data }),

  updateProduct: (id: string, data: any) =>
    request(`/admin/products/${id}`, { method: 'PUT', body: data }),

  deleteProduct: (id: string) =>
    request(`/admin/products/${id}`, { method: 'DELETE' }),

  // 订单管理
  getOrders: (params?: any) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, String(value));
        }
      });
    }
    return request(`/admin/orders?${query.toString()}`);
  },

  getOrder: (id: string) =>
    request(`/admin/orders/${id}`),

  shipOrder: (id: string, data: { logistics_company: string; logistics_no: string }) =>
    request(`/admin/orders/${id}/ship`, { method: 'PUT', body: data }),

  cancelOrder: (id: string) =>
    request(`/admin/orders/${id}/cancel`, { method: 'PUT' }),

  // 用户管理
  getUsers: (params?: any) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, String(value));
        }
      });
    }
    return request(`/admin/users?${query.toString()}`);
  },

  updateUserStatus: (id: string, status: 'active' | 'frozen') =>
    request(`/admin/users/${id}/status`, { method: 'PUT', body: { status } }),

  getUser: (id: string) =>
    request(`/admin/users/${id}`),

  getUserOrders: (id: string, params?: { page?: number; pageSize?: number; status?: string }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, String(value));
        }
      });
    }
    return request(`/admin/users/${id}/orders?${query.toString()}`);
  },

  getUserIncome: (id: string, params?: { page?: number; pageSize?: number; type?: string }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, String(value));
        }
      });
    }
    return request(`/admin/users/${id}/income?${query.toString()}`);
  },

  getUserAddresses: (id: string) =>
    request(`/admin/users/${id}/addresses`),

  getUserCellar: (id: string) =>
    request(`/admin/users/${id}/cellar`),

  getUserTeam: (id: string) =>
    request(`/admin/users/${id}/team`),

  // 合伙人管理
  getPartners: (params?: any) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, String(value));
        }
      });
    }
    return request(`/admin/partners?${query.toString()}`);
  },

  getPartner: (id: string) =>
    request(`/admin/partners/${id}`),

  getPartnerTeam: (id: string, params?: { page?: number; pageSize?: number; type?: string }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, String(value));
        }
      });
    }
    return request(`/admin/partners/${id}/team?${query.toString()}`);
  },

  getPartnerIncome: (id: string, params?: { page?: number; pageSize?: number; type?: string }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, String(value));
        }
      });
    }
    return request(`/admin/partners/${id}/income?${query.toString()}`);
  },

  getPartnerApplications: (params?: any) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, String(value));
        }
      });
    }
    return request(`/admin/partner-applications?${query.toString()}`);
  },

  reviewPartnerApplication: (id: string, status: 'approved' | 'rejected', note?: string) =>
    request(`/admin/partner-applications/${id}/review`, { method: 'PUT', body: { status, note } }),

  // 提现管理
  getWithdrawals: (params?: any) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, String(value));
        }
      });
    }
    return request(`/admin/withdrawals?${query.toString()}`);
  },

  processWithdrawal: (id: string, status: 'success' | 'rejected', reason?: string) =>
    request(`/admin/withdrawals/${id}/process`, { method: 'PUT', body: { status, reason } }),

  getWithdrawalSettings: () =>
    request('/admin/withdrawal-settings'),

  updateWithdrawalSettings: (settings: {
    min_amount?: number;
    max_amount?: number;
    max_daily_count?: number;
    fee_rate?: number;
    daily_limit?: number;
  }) =>
    request('/admin/withdrawal-settings', { method: 'PUT', body: settings }),

  // 分类管理
  getCategories: () =>
    request('/admin/categories'),

  createCategory: (data: { name: string; parent_id?: string; sort_order?: number }) =>
    request('/admin/categories', { method: 'POST', body: data }),

  updateCategory: (id: string, data: { name: string; parent_id?: string; sort_order?: number }) =>
    request(`/admin/categories/${id}`, { method: 'PUT', body: data }),

  deleteCategory: (id: string) =>
    request(`/admin/categories/${id}`, { method: 'DELETE' }),

  // 酒窖管理
  getCellarItems: (params?: any) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, String(value));
        }
      });
    }
    return request(`/admin/cellar?${query.toString()}`);
  },

  deleteCellarItem: (id: string) =>
    request(`/admin/cellar/${id}`, { method: 'DELETE' }),

  // 财务统计
  getFinanceStats: () =>
    request('/admin/finance/stats'),

  // 交易流水
  getTransactions: (params?: any) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, String(value));
        }
      });
    }
    return request(`/admin/transactions?${query.toString()}`);
  },

  // 收益记录
  getIncomeRecords: (params?: any) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, String(value));
        }
      });
    }
    return request(`/admin/income-records?${query.toString()}`);
  },

  // 销售龙虎榜
  getSalesLeaderboard: (params?: any) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, String(value));
        }
      });
    }
    return request(`/admin/sales-leaderboard?${query.toString()}`);
  },

  // 分销配置
  getDistributionSettings: () =>
    request('/admin/distribution-settings'),

  updateDistributionSettings: (settings: Array<{ key: string; value: string }>) =>
    request('/admin/distribution-settings', { method: 'PUT', body: { settings } }),

  // 排行榜配置
  getLeaderboardSettings: () =>
    request('/admin/leaderboard-settings'),

  updateLeaderboardSettings: (data: {
    sales_rewards?: RankReward[];
    income_rewards?: RankReward[];
    period_weights?: PeriodWeights;
    display_settings?: DisplaySettings;
  }) =>
    request('/admin/leaderboard-settings', { method: 'PUT', body: data }),

  // ===========================================
  // 内容管理
  // ===========================================

  // Banner管理
  getBanners: (params?: { page?: number; pageSize?: number; keyword?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, String(value));
      });
    }
    return request(`/admin/banners?${query.toString()}`);
  },

  createBanner: (data: { title?: string; image_url: string; link_url?: string; sort_order?: number; status?: string }) =>
    request('/admin/banners', { method: 'POST', body: data }),

  updateBanner: (id: string, data: { title?: string; image_url?: string; link_url?: string; sort_order?: number }) =>
    request(`/admin/banners/${id}`, { method: 'PUT', body: data }),

  toggleBannerStatus: (id: string, status: 'visible' | 'hidden') =>
    request(`/admin/banners/${id}/status`, { method: 'PUT', body: { status } }),

  deleteBanner: (id: string) =>
    request(`/admin/banners/${id}`, { method: 'DELETE' }),

  // 公告管理
  getNotifications: (params?: { page?: number; pageSize?: number; keyword?: string; type?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, String(value));
      });
    }
    return request(`/admin/notifications?${query.toString()}`);
  },

  createNotification: (data: { title: string; content?: string; type?: string; status?: string }) =>
    request('/admin/notifications', { method: 'POST', body: data }),

  updateNotification: (id: string, data: { title?: string; content?: string; type?: string }) =>
    request(`/admin/notifications/${id}`, { method: 'PUT', body: data }),

  toggleNotificationStatus: (id: string, status: 'published' | 'draft') =>
    request(`/admin/notifications/${id}/status`, { method: 'PUT', body: { status } }),

  deleteNotification: (id: string) =>
    request(`/admin/notifications/${id}`, { method: 'DELETE' }),

  // FAQ管理
  getFaqs: (params?: { page?: number; pageSize?: number; keyword?: string; category?: string }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, String(value));
      });
    }
    return request(`/admin/faqs?${query.toString()}`);
  },

  createFaq: (data: { category?: string; question: string; answer: string; sort_order?: number; status?: string }) =>
    request('/admin/faqs', { method: 'POST', body: data }),

  updateFaq: (id: string, data: { category?: string; question?: string; answer?: string; sort_order?: number }) =>
    request(`/admin/faqs/${id}`, { method: 'PUT', body: data }),

  deleteFaq: (id: string) =>
    request(`/admin/faqs/${id}`, { method: 'DELETE' }),

  // 招募页配置
  getRecruitSettings: () =>
    request('/admin/recruit-settings'),

  updateRecruitSettings: (data: { title?: string; description?: string; imageUrl?: string; benefits?: string[] }) =>
    request('/admin/recruit-settings', { method: 'PUT', body: data }),

  // 系统设置
  getSettings: () =>
    request('/admin/settings'),

  updateSettings: (settings: Record<string, any>) =>
    request('/admin/settings', { method: 'PUT', body: settings }),

  // 管理员列表
  getAdmins: () =>
    request('/admin/admins'),

  // 操作日志
  getOperationLogs: (params?: { page?: number; pageSize?: number; operator?: string; type?: string; date?: string }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, String(value));
        }
      });
    }
    return request(`/admin/operation-logs?${query.toString()}`);
  },

  // ===========================================
  // 营销活动管理
  // ===========================================

  // 优惠券管理
  getCoupons: (params?: { page?: number; pageSize?: number; status?: string; keyword?: string }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, String(value));
        }
      });
    }
    return request(`/admin/coupons?${query.toString()}`);
  },

  getCoupon: (id: string) =>
    request(`/admin/coupons/${id}`),

  createCoupon: (data: {
    name: string;
    type: 'discount' | 'full_reduction';
    discount_amount: number;
    min_amount?: number;
    total_count: number;
    start_time: string;
    end_time: string;
    limit_per_user?: number;
    description?: string;
  }) =>
    request('/admin/coupons', { method: 'POST', body: data }),

  updateCoupon: (id: string, data: Partial<{
    name: string;
    type: string;
    discount_amount: number;
    min_amount: number;
    total_count: number;
    start_time: string;
    end_time: string;
    limit_per_user: number;
    description: string;
    status: string;
  }>) =>
    request(`/admin/coupons/${id}`, { method: 'PUT', body: data }),

  deleteCoupon: (id: string) =>
    request(`/admin/coupons/${id}`, { method: 'DELETE' }),

  getCouponRecords: (id: string, params?: { page?: number; pageSize?: number; status?: string }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, String(value));
        }
      });
    }
    return request(`/admin/coupons/${id}/records?${query.toString()}`);
  },

  // 秒杀活动管理
  getFlashSales: (params?: { page?: number; pageSize?: number; status?: string; keyword?: string }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, String(value));
        }
      });
    }
    return request(`/admin/flash-sales?${query.toString()}`);
  },

  getFlashSale: (id: string) =>
    request(`/admin/flash-sales/${id}`),

  createFlashSale: (data: {
    product_id: string;
    flash_price: number;
    stock: number;
    start_time: string;
    end_time: string;
    limit_per_user?: number;
  }) =>
    request('/admin/flash-sales', { method: 'POST', body: data }),

  updateFlashSale: (id: string, data: Partial<{
    flash_price: number;
    stock: number;
    start_time: string;
    end_time: string;
    limit_per_user: number;
    status: string;
  }>) =>
    request(`/admin/flash-sales/${id}`, { method: 'PUT', body: data }),

  deleteFlashSale: (id: string) =>
    request(`/admin/flash-sales/${id}`, { method: 'DELETE' }),

  // 团购活动管理
  getGroupBuys: (params?: { page?: number; pageSize?: number; status?: string; keyword?: string }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, String(value));
        }
      });
    }
    return request(`/admin/group-buys?${query.toString()}`);
  },

  getGroupBuy: (id: string) =>
    request(`/admin/group-buys/${id}`),

  createGroupBuy: (data: {
    product_id: string;
    group_price: number;
    min_quantity: number;
    start_time: string;
    end_time: string;
  }) =>
    request('/admin/group-buys', { method: 'POST', body: data }),

  updateGroupBuy: (id: string, data: Partial<{
    group_price: number;
    min_quantity: number;
    start_time: string;
    end_time: string;
    status: string;
  }>) =>
    request(`/admin/group-buys/${id}`, { method: 'PUT', body: data }),

  deleteGroupBuy: (id: string) =>
    request(`/admin/group-buys/${id}`, { method: 'DELETE' }),

  getGroupBuyRecords: (id: string, params?: { page?: number; pageSize?: number }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, String(value));
        }
      });
    }
    return request(`/admin/group-buys/${id}/records?${query.toString()}`);
  },

  // ===========================================
  // 退款管理
  // ===========================================

  getRefunds: (params?: { page?: number; pageSize?: number; status?: string }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, String(value));
        }
      });
    }
    return request(`/admin/refunds?${query.toString()}`);
  },

  getRefund: (id: string) =>
    request(`/admin/refunds/${id}`),

  approveRefund: (id: string, admin_note?: string) =>
    request(`/admin/refunds/${id}/approve`, { method: 'PUT', body: { admin_note } }),

  rejectRefund: (id: string, admin_note: string) =>
    request(`/admin/refunds/${id}/reject`, { method: 'PUT', body: { admin_note } })
};

// 导出默认请求函数
export default request;

// ===========================================
// 上传 API
// ===========================================

export const uploadApi = {
  uploadImage: async (file: File): Promise<ApiResponse<{ url: string; filename: string; size: number; type: string }>> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const res = await request('/upload/image', {
          method: 'POST',
          body: { image: base64, filename: file.name.replace(/\.[^/.]+$/, '') }
        });
        resolve(res);
      };
      reader.onerror = () => {
        resolve({
          success: false,
          error: { code: 'READ_ERROR', message: '读取文件失败' }
        });
      };
      reader.readAsDataURL(file);
    });
  },

  uploadImages: async (files: File[]): Promise<ApiResponse<{ urls: string[]; errors?: { index: number; message: string }[] }>> => {
    return new Promise((resolve) => {
      const readers = files.map(file => {
        return new Promise<string>((res, rej) => {
          const reader = new FileReader();
          reader.onload = () => res(reader.result as string);
          reader.onerror = () => rej(new Error('读取失败'));
          reader.readAsDataURL(file);
        });
      });

      Promise.all(readers)
        .then(async (base64Images) => {
          const res = await request('/upload/images', {
            method: 'POST',
            body: { images: base64Images }
          });
          resolve(res);
        })
        .catch(() => {
          resolve({
            success: false,
            error: { code: 'READ_ERROR', message: '读取文件失败' }
          });
        });
    });
  }
};