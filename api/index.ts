/**
 * Vercel Serverless API - 完整版
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// JWT 密钥
const getJwtSecret = () => process.env.JWT_SECRET || 'default-secret';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = new URL(req.url || '/', `https://${req.headers.host}`);
  const path = url.pathname.replace('/api', '') || '/';
  const method = req.method || 'GET';

  try {
    // 初始化 Supabase
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return res.status(500).json({
        success: false,
        error: 'Missing Supabase credentials'
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // ==========================================
    // 公开 API
    // ==========================================

    // 健康检查
    if (path === '/health' || path === '/') {
      return res.json({ status: 'ok', timestamp: new Date().toISOString() });
    }

    // 商品列表
    if (path === '/products' && method === 'GET') {
      const page = parseInt(url.searchParams.get('page') || '1');
      const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
      const category = url.searchParams.get('category');
      const keyword = url.searchParams.get('keyword');
      const sortBy = url.searchParams.get('sortBy') || 'created_at';
      const sortOrder = url.searchParams.get('sortOrder') || 'desc';

      let query = supabase
        .from('products')
        .select('*, category:categories(id, name)', { count: 'exact' })
        .eq('status', 'on_shelves');

      if (category) query = query.eq('category_id', category);
      if (keyword) query = query.ilike('name', `%${keyword}%`);

      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      query = query.range((page - 1) * pageSize, page * pageSize - 1);

      const { data, error, count } = await query;

      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.json({ success: true, data: { list: data, total: count, page, pageSize, totalPages: Math.ceil((count || 0) / pageSize) } });
    }

    // 分类列表
    if (path === '/products/categories/list' || path === '/categories') {
      const { data, error } = await supabase.from('categories').select('*').order('sort_order');
      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.json({ success: true, data });
    }

    // 搜索建议
    if (path === '/products/search/suggest') {
      const keyword = url.searchParams.get('keyword') || '';
      if (keyword.length < 2) return res.json({ success: true, data: [] });

      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, images')
        .eq('status', 'on_shelves')
        .ilike('name', `%${keyword}%`)
        .limit(10);

      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.json({ success: true, data });
    }

    // 商品详情
    const productMatch = path.match(/^\/products\/([a-f0-9-]+)$/);
    if (productMatch && method === 'GET') {
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(id, name)')
        .eq('id', productMatch[1])
        .single();

      if (error) return res.status(404).json({ success: false, error: '商品不存在' });
      return res.json({ success: true, data });
    }

    // 轮播图
    if (path === '/banners') {
      const { data, error } = await supabase.from('banners').select('*').eq('status', 'visible').order('sort_order');
      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.json({ success: true, data });
    }

    // 秒杀活动
    if (path === '/flash-sales') {
      const status = url.searchParams.get('status');
      let query = supabase.from('flash_sales').select('*, product:products(id, name, images, original_price)');
      if (status) query = query.eq('status', status);
      const { data, error } = await query;
      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.json({ success: true, data });
    }

    // 团购活动
    if (path === '/group-buys') {
      const { data, error } = await supabase.from('group_buys').select('*, product:products(id, name, images, original_price)');
      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.json({ success: true, data });
    }

    // 优惠券列表
    if (path === '/coupons') {
      const { data, error } = await supabase.from('coupons').select('*').eq('status', 'distributing');
      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.json({ success: true, data });
    }

    // 公告
    if (path === '/notifications') {
      const type = url.searchParams.get('type');
      let query = supabase.from('notifications').select('*').eq('status', 'published').order('created_at', { ascending: false });
      if (type) query = query.eq('type', type);
      const { data, error } = await query;
      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.json({ success: true, data });
    }

    // 合伙人礼包
    if (path === '/partner-packages') {
      const { data, error } = await supabase.from('partner_packages').select('*').eq('status', 'on_shelves').order('sort_order');
      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.json({ success: true, data });
    }

    // 排行榜
    if (path === '/partner/leaderboard') {
      const type = url.searchParams.get('type') || 'sales';
      const limit = parseInt(url.searchParams.get('limit') || '10');
      // 简化版排行榜
      const { data, error } = await supabase
        .from('users')
        .select('id, name, avatar, partner_level, total_income')
        .eq('is_partner', true)
        .order('total_income', { ascending: false })
        .limit(limit);
      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.json({ success: true, data: data?.map((u, i) => ({ ...u, rank: i + 1 })) || [] });
    }

    // ==========================================
    // 认证 API
    // ==========================================

    // 登录
    if (path === '/auth/login' && method === 'POST') {
      const { phone, password } = req.body;
      if (!phone || !password) return res.status(400).json({ success: false, error: { code: 'INVALID_PARAMS', message: '手机号和密码不能为空' } });

      const { data: user, error } = await supabase.from('users').select('*').eq('phone', phone).single();
      if (error || !user) return res.status(401).json({ success: false, error: { code: 'LOGIN_FAILED', message: '手机号或密码错误' } });

      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) return res.status(401).json({ success: false, error: { code: 'LOGIN_FAILED', message: '手机号或密码错误' } });

      if (user.status === 'frozen') return res.status(403).json({ success: false, error: { code: 'ACCOUNT_FROZEN', message: '账号已被冻结' } });

      const token = jwt.sign({ userId: user.id }, getJwtSecret(), { expiresIn: '7d' });
      const adminPhones = (process.env.ADMIN_PHONES || '').split(',').filter(p => p.trim());
      const role = adminPhones.includes(user.phone) ? 'admin' : 'user';

      return res.json({
        success: true,
        data: {
          user: { id: user.id, phone: user.phone, name: user.name, avatar: user.avatar, status: user.status, is_partner: user.is_partner, partner_level: user.partner_level, invite_code: user.invite_code, balance: user.balance, role },
          session: { access_token: token }
        }
      });
    }

    // 注册
    if (path === '/auth/register' && method === 'POST') {
      const { phone, password, name, inviteCode } = req.body;
      if (!phone || !password) return res.status(400).json({ success: false, error: { code: 'INVALID_PARAMS', message: '手机号和密码不能为空' } });
      if (!/^1[3-9]\d{9}$/.test(phone)) return res.status(400).json({ success: false, error: { code: 'INVALID_PHONE', message: '请输入正确的手机号' } });
      if (password.length < 6) return res.status(400).json({ success: false, error: { code: 'INVALID_PASSWORD', message: '密码至少需要6位字符' } });

      const { data: existing } = await supabase.from('users').select('id').eq('phone', phone).single();
      if (existing) return res.status(400).json({ success: false, error: { code: 'PHONE_EXISTS', message: '该手机号已注册' } });

      let referrerId = null;
      if (inviteCode) {
        const { data: referrer } = await supabase.from('users').select('id').eq('invite_code', inviteCode).single();
        if (referrer) referrerId = referrer.id;
      }

      const userInviteCode = `U${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
      const hashedPassword = await bcrypt.hash(password, 12);

      const { data: user, error: userError } = await supabase
        .from('users')
        .insert({ phone, password_hash: hashedPassword, name: name || `用户${phone.slice(-4)}`, referrer_id: referrerId, invite_code: userInviteCode, status: 'active' })
        .select().single();

      if (userError) return res.status(500).json({ success: false, error: { code: 'USER_CREATE_FAILED', message: userError.message } });

      const token = jwt.sign({ userId: user.id }, getJwtSecret(), { expiresIn: '7d' });
      return res.json({ success: true, data: { user: { id: user.id, phone: user.phone, name: user.name, invite_code: user.invite_code }, session: { access_token: token } } });
    }

    // 获取当前用户
    if (path === '/auth/me' && method === 'GET') {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: '未登录' } });

      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, getJwtSecret()) as { userId: string };

        const { data: user, error } = await supabase
          .from('users')
          .select('id, phone, name, avatar, status, is_partner, partner_level, invite_code, balance, total_income, gender, birthday, email')
          .eq('id', decoded.userId)
          .single();

        if (error || !user) return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: '用户不存在' } });

        const adminPhones = (process.env.ADMIN_PHONES || '').split(',').filter(p => p.trim());
        const role = adminPhones.includes(user.phone) ? 'admin' : 'user';

        return res.json({ success: true, data: { ...user, role } });
      } catch {
        return res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: '登录已过期' } });
      }
    }

    // 登出
    if (path === '/auth/logout' && method === 'POST') {
      return res.json({ success: true, message: '登出成功' });
    }

    // ==========================================
    // 需要登录的 API（简化版，不完整验证）
    // ==========================================

    // 地址列表
    if (path === '/addresses' && method === 'GET') {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ success: false, error: '未登录' });

      const { data, error } = await supabase.from('addresses').select('*').eq('user_id', userId).order('is_default', { ascending: false });
      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.json({ success: true, data });
    }

    // 新增地址
    if (path === '/addresses' && method === 'POST') {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ success: false, error: '未登录' });

      const { name, phone, province, city, district, detail, is_default } = req.body;
      if (is_default) await supabase.from('addresses').update({ is_default: false }).eq('user_id', userId);

      const { data, error } = await supabase.from('addresses').insert({ user_id: userId, name, phone, province, city, district, detail, is_default: is_default || false }).select().single();
      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.json({ success: true, data });
    }

    // 购物车
    if (path === '/orders/cart' && method === 'GET') {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ success: false, error: '未登录' });

      const { data, error } = await supabase.from('cart_items').select('*, product:products(id, name, price, images, stock, status)').eq('user_id', userId);
      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.json({ success: true, data: { items: data || [], total_amount: data?.reduce((sum: number, item: any) => sum + (item.product?.price || 0) * item.quantity, 0) || 0 } });
    }

    // 添加到购物车
    if (path === '/orders/cart' && method === 'POST') {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ success: false, error: '未登录' });

      const { product_id, quantity = 1 } = req.body;
      const { data: existing } = await supabase.from('cart_items').select('*').eq('user_id', userId).eq('product_id', product_id).single();

      if (existing) {
        await supabase.from('cart_items').update({ quantity: existing.quantity + quantity }).eq('id', existing.id);
      } else {
        await supabase.from('cart_items').insert({ user_id: userId, product_id, quantity, selected: true });
      }

      return res.json({ success: true, message: '已添加到购物车' });
    }

    // 订单列表
    if (path === '/orders' && method === 'GET') {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ success: false, error: '未登录' });

      const status = url.searchParams.get('status');
      let query = supabase.from('orders').select('*, items:order_items(*)').eq('user_id', userId).order('created_at', { ascending: false });
      if (status) query = query.eq('status', status);

      const { data, error } = await query;
      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.json({ success: true, data: { list: data || [] } });
    }

    // 我的优惠券
    if (path === '/my-coupons' && method === 'GET') {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ success: false, error: '未登录' });

      const { data, error } = await supabase.from('user_coupons').select('*, coupon:coupons(*)').eq('user_id', userId);
      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.json({ success: true, data });
    }

    // ==========================================
    // 后台管理 API
    // ==========================================

    if (path.startsWith('/admin')) {
      const adminCheck = await checkAdmin(req, res, supabase);
      if (!adminCheck) return; // 已返回错误响应

      // 仪表盘
      if (path === '/admin/dashboard') {
        const [usersCount, productsCount, ordersCount] = await Promise.all([
          supabase.from('users').select('id', { count: 'exact', head: true }),
          supabase.from('products').select('id', { count: 'exact', head: true }),
          supabase.from('orders').select('id', { count: 'exact', head: true })
        ]);

        return res.json({
          success: true,
          data: {
            usersCount: usersCount.count || 0,
            productsCount: productsCount.count || 0,
            ordersCount: ordersCount.count || 0,
            totalRevenue: 0
          }
        });
      }

      // 商品管理
      if (path === '/admin/products' && method === 'GET') {
        const page = parseInt(url.searchParams.get('page') || '1');
        const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
        const keyword = url.searchParams.get('keyword');

        let query = supabase.from('products').select('*, category:categories(id, name)', { count: 'exact' });
        if (keyword) query = query.ilike('name', `%${keyword}%`);
        query = query.order('created_at', { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1);

        const { data, error, count } = await query;
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true, data: { list: data, total: count, page, pageSize } });
      }

      // 订单管理
      if (path === '/admin/orders' && method === 'GET') {
        const page = parseInt(url.searchParams.get('page') || '1');
        const pageSize = parseInt(url.searchParams.get('pageSize') || '20');

        const { data, error, count } = await supabase
          .from('orders')
          .select('*, user:users(id, name, phone)', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range((page - 1) * pageSize, page * pageSize - 1);

        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true, data: { list: data, total: count, page, pageSize } });
      }

      // 用户管理
      if (path === '/admin/users' && method === 'GET') {
        const page = parseInt(url.searchParams.get('page') || '1');
        const pageSize = parseInt(url.searchParams.get('pageSize') || '20');

        const { data, error, count } = await supabase
          .from('users')
          .select('id, phone, name, avatar, status, is_partner, partner_level, balance, created_at', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range((page - 1) * pageSize, page * pageSize - 1);

        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true, data: { list: data, total: count, page, pageSize } });
      }

      // 分类管理
      if (path === '/admin/categories') {
        const { data, error } = await supabase.from('categories').select('*').order('sort_order');
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true, data });
      }

      // 轮播图管理
      if (path === '/admin/banners') {
        const { data, error } = await supabase.from('banners').select('*').order('sort_order');
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true, data });
      }

      return res.status(404).json({ success: false, error: 'Admin endpoint not found' });
    }

    return res.status(404).json({ success: false, error: 'Not found', path });

  } catch (err: any) {
    console.error('API Error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
}

// 辅助函数
function getUserId(req: VercelRequest): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, getJwtSecret()) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

async function checkAdmin(req: VercelRequest, res: VercelResponse, supabase: any): Promise<string | null> {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ success: false, error: '未登录' });
    return null;
  }

  const { data: user } = await supabase.from('users').select('phone').eq('id', userId).single();
  if (!user) {
    res.status(401).json({ success: false, error: '用户不存在' });
    return null;
  }

  const adminPhones = (process.env.ADMIN_PHONES || '').split(',').filter(p => p.trim());
  if (!adminPhones.includes(user.phone)) {
    res.status(403).json({ success: false, error: '无管理员权限' });
    return null;
  }

  return userId;
}