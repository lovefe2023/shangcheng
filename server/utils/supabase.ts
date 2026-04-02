/**
 * Supabase 服务端客户端
 * 用于后端服务访问 Supabase
 */

import { createClient } from '@supabase/supabase-js';

// 延迟获取环境变量
const getSupabaseConfig = () => ({
  url: process.env.VITE_SUPABASE_URL || '',
  serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || ''
});

// 延迟创建客户端（首次使用时才创建）
let _supabaseAdmin: ReturnType<typeof createClient> | null = null;

const getSupabaseAdmin = () => {
  if (!_supabaseAdmin) {
    const { url, serviceKey } = getSupabaseConfig();
    if (!url || !serviceKey) {
      console.warn('Warning: Supabase credentials not configured. Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
    }
    _supabaseAdmin = createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return _supabaseAdmin;
};

// 导出一个 getter，而不是直接导出客户端
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    return getSupabaseAdmin()[prop as keyof ReturnType<typeof createClient>];
  }
});

// 类型定义
export interface User {
  id: string;
  phone: string;
  name?: string;
  avatar?: string;
  status: 'active' | 'frozen';
  is_partner: boolean;
  partner_level: 'none' | 'junior' | 'middle' | 'senior';
  referrer_id?: string;
  invite_code?: string;
  balance: number;
  total_income: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  images: string[];
  category_id?: string;
  price: number;
  original_price?: number;
  stock: number;
  sales: number;
  status: 'on_shelves' | 'off_shelves';
  specs?: Record<string, any>;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  parent_id?: string;
  sort_order: number;
  created_at: string;
}

export interface Order {
  id: string;
  order_no: string;
  user_id: string;
  type: 'normal' | 'flash_sale' | 'group_buy';
  status: 'pending_payment' | 'pending_shipment' | 'shipped' | 'completed' | 'refunding' | 'cancelled';
  total_amount: number;
  paid_amount: number;
  discount_amount: number;
  payment_method?: string;
  payment_time?: string;
  address_snapshot?: Record<string, any>;
  referrer_id?: string;
  sales_commission: number;
  dividend_pool: number;
  note?: string;
  logistics_company?: string;
  logistics_no?: string;
  shipped_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  spec?: string;
  price: number;
  quantity: number;
  created_at: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  spec?: string;
  quantity: number;
  selected: boolean;
  created_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  province?: string;
  city?: string;
  district?: string;
  detail?: string;
  is_default: boolean;
  created_at: string;
}

export interface IncomeRecord {
  id: string;
  user_id: string;
  type: 'referral_reward' | 'sales_commission' | 'dividend';
  amount: number;
  status: 'pending' | 'settled' | 'completed';
  order_id?: string;
  source_user_id?: string;
  description?: string;
  created_at: string;
}

export interface Withdrawal {
  id: string;
  withdrawal_no: string;
  user_id: string;
  amount: number;
  fee: number;
  actual_amount: number;
  method: 'bank' | 'wechat' | 'alipay';
  account_info?: Record<string, any>;
  status: 'pending' | 'success' | 'rejected' | 'failed';
  reason?: string;
  created_at: string;
  processed_at?: string;
}

export interface Coupon {
  id: string;
  name: string;
  type: 'discount' | 'full_reduction';
  discount_amount?: number;
  min_amount: number;
  total_count: number;
  used_count: number;
  start_time?: string;
  end_time?: string;
  status: 'distributing' | 'ended';
  created_at: string;
}

export interface UserCoupon {
  id: string;
  user_id: string;
  coupon_id: string;
  status: 'unused' | 'used' | 'expired';
  used_at?: string;
  order_id?: string;
  created_at: string;
}

export interface FlashSale {
  id: string;
  product_id: string;
  flash_price: number;
  stock: number;
  sold_count: number;
  start_time: string;
  end_time: string;
  status: 'not_started' | 'ongoing' | 'ended';
  created_at: string;
}

export interface GroupBuy {
  id: string;
  product_id: string;
  group_price: number;
  min_quantity: number;
  max_quantity?: number;
  current_quantity: number;
  status: 'pending' | 'success' | 'failed';
  start_time?: string;
  end_time?: string;
  created_at: string;
}

export interface Banner {
  id: string;
  title?: string;
  image_url: string;
  link_url?: string;
  sort_order: number;
  status: 'visible' | 'hidden';
  created_at: string;
}

export interface Notification {
  id: string;
  title: string;
  content?: string;
  type: 'announcement' | 'notice' | 'faq';
  status: 'published' | 'draft';
  created_at: string;
}

export interface PartnerApplication {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  level: 'junior' | 'middle' | 'senior';
  applied_at: string;
  reviewed_at?: string;
  reviewer_id?: string;
  note?: string;
}