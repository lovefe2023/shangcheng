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
    // 合伙人 API（需要登录）
    // ==========================================

    // 合伙人信息
    if (path === '/partner/profile' && method === 'GET') {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: '请先登录' } });

      const { data: user, error } = await supabase
        .from('users')
        .select('id, phone, name, avatar, status, is_partner, partner_level, referrer_id, invite_code, balance, total_income, created_at')
        .eq('id', userId)
        .single();

      if (error || !user) return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: '用户不存在' } });

      // 获取团队人数
      const { count: teamSize } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('referrer_id', user.id);

      // 获取本月销售额
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { data: monthOrders } = await supabase.from('orders').select('paid_amount').eq('referrer_id', user.id).in('status', ['completed', 'shipped']).gte('created_at', monthStart);
      const monthSales = monthOrders?.reduce((sum, o) => sum + o.paid_amount, 0) || 0;

      // 获取收益统计
      const { data: incomeStats } = await supabase.from('income_records').select('type, amount, status').eq('user_id', user.id);
      const stats = { referral_reward: 0, sales_commission: 0, dividend: 0 };
      incomeStats?.forEach(r => { if (r.status === 'settled' || r.status === 'completed') stats[r.type as keyof typeof stats] += r.amount; });

      return res.json({
        success: true,
        data: {
          ...user,
          team_size: teamSize || 0,
          month_sales: monthSales,
          total_referral_reward: stats.referral_reward,
          total_sales_commission: stats.sales_commission,
          total_dividend: stats.dividend
        }
      });
    }

    // 收益明细
    if (path === '/partner/income' && method === 'GET') {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: '请先登录' } });

      const page = parseInt(url.searchParams.get('page') || '1');
      const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
      const type = url.searchParams.get('type');
      const status = url.searchParams.get('status');

      let query = supabase.from('income_records').select('*', { count: 'exact' }).eq('user_id', userId).order('created_at', { ascending: false });
      if (type) query = query.eq('type', type);
      if (status) query = query.eq('status', status);
      query = query.range((page - 1) * pageSize, page * pageSize - 1);

      const { data, error, count } = await query;
      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.json({ success: true, data: { list: data || [], total: count || 0, page, pageSize } });
    }

    // 团队成员
    if (path === '/partner/team' && method === 'GET') {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: '请先登录' } });

      const page = parseInt(url.searchParams.get('page') || '1');
      const pageSize = parseInt(url.searchParams.get('pageSize') || '20');

      const { data, error, count } = await supabase
        .from('users')
        .select('id, name, phone, avatar, partner_level, created_at', { count: 'exact' })
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.json({ success: true, data: { list: data || [], total: count || 0, page, pageSize } });
    }

    // 申请成为合伙人
    if (path === '/partner/apply' && method === 'POST') {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: '请先登录' } });

      const { level = 'junior' } = req.body;

      // 检查是否已经是合伙人
      const { data: user } = await supabase.from('users').select('is_partner').eq('id', userId).single();
      if (user?.is_partner) return res.status(400).json({ success: false, error: { code: 'ALREADY_PARTNER', message: '您已经是合伙人' } });

      // 检查是否有待审核申请
      const { data: existing } = await supabase.from('partner_applications').select('*').eq('user_id', userId).eq('status', 'pending').single();
      if (existing) return res.status(400).json({ success: false, error: { code: 'APPLICATION_EXISTS', message: '您已提交申请，请等待审核' } });

      const { error } = await supabase.from('partner_applications').insert({ user_id: userId, status: 'pending', level });
      if (error) return res.status(500).json({ success: false, error: { code: 'APPLY_FAILED', message: '申请失败' } });

      return res.json({ success: true, message: '申请已提交，请等待审核' });
    }

    // 提现申请
    if (path === '/partner/withdraw' && method === 'POST') {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: '请先登录' } });

      const { amount, method: withdrawMethod, account_info } = req.body;
      if (!amount || amount <= 0) return res.status(400).json({ success: false, error: { code: 'INVALID_AMOUNT', message: '请输入正确的提现金额' } });
      if (amount < 10) return res.status(400).json({ success: false, error: { code: 'AMOUNT_TOO_SMALL', message: '最低提现金额为10元' } });

      // 获取用户余额
      const { data: user } = await supabase.from('users').select('balance, status').eq('id', userId).single();
      if (!user) return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: '用户不存在' } });
      if (user.status === 'frozen') return res.status(403).json({ success: false, error: { code: 'USER_FROZEN', message: '账号已冻结' } });
      if (user.balance < amount) return res.status(400).json({ success: false, error: { code: 'INSUFFICIENT_BALANCE', message: '余额不足' } });

      // 生成提现单号
      const withdrawalNo = `WD${Date.now()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
      const fee = Math.ceil(amount * 0.003 * 100) / 100;
      const actualAmount = amount - fee;

      // 扣减余额
      const { error: balanceError } = await supabase.from('users').update({ balance: user.balance - amount }).eq('id', userId).gte('balance', amount);
      if (balanceError) return res.status(400).json({ success: false, error: { code: 'INSUFFICIENT_BALANCE', message: '余额不足' } });

      // 创建提现记录
      const { data: withdrawal, error } = await supabase.from('withdrawals').insert({
        withdrawal_no: withdrawalNo, user_id: userId, amount, fee, actual_amount: actualAmount, method: withdrawMethod, account_info, status: 'pending'
      }).select().single();

      if (error) {
        await supabase.from('users').update({ balance: user.balance }).eq('id', userId);
        return res.status(500).json({ success: false, error: { code: 'WITHDRAW_FAILED', message: '提现申请失败' } });
      }

      return res.json({ success: true, data: withdrawal, message: '提现申请已提交' });
    }

    // 提现记录
    if (path === '/partner/withdrawals' && method === 'GET') {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: '请先登录' } });

      const page = parseInt(url.searchParams.get('page') || '1');
      const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
      const status = url.searchParams.get('status');

      let query = supabase.from('withdrawals').select('*', { count: 'exact' }).eq('user_id', userId).order('created_at', { ascending: false });
      if (status) query = query.eq('status', status);
      query = query.range((page - 1) * pageSize, page * pageSize - 1);

      const { data, error, count } = await query;
      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.json({ success: true, data: { list: data || [], total: count || 0, page, pageSize } });
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

    // 更新购物车商品（数量/选中状态）
    const cartItemMatch = path.match(/^\/orders\/cart\/([a-f0-9-]+)$/);
    if (cartItemMatch && method === 'PUT') {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ success: false, error: '未登录' });

      const { quantity, selected } = req.body;
      const updateData: any = {};
      if (quantity !== undefined) updateData.quantity = quantity;
      if (selected !== undefined) updateData.selected = selected;

      const { error } = await supabase.from('cart_items').update(updateData).eq('id', cartItemMatch[1]).eq('user_id', userId);
      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.json({ success: true, message: '更新成功' });
    }

    // 删除购物车商品
    if (cartItemMatch && method === 'DELETE') {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ success: false, error: '未登录' });

      const { error } = await supabase.from('cart_items').delete().eq('id', cartItemMatch[1]).eq('user_id', userId);
      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.json({ success: true, message: '删除成功' });
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

      // ===== 仪表盘 =====
      if (path === '/admin/dashboard') {
        const [usersCount, productsCount, ordersCount, ordersData] = await Promise.all([
          supabase.from('users').select('id', { count: 'exact', head: true }),
          supabase.from('products').select('id', { count: 'exact', head: true }),
          supabase.from('orders').select('id', { count: 'exact', head: true }),
          supabase.from('orders').select('paid_amount').in('status', ['completed', 'shipped', 'pending_shipment'])
        ]);
        const totalRevenue = ordersData.data?.reduce((sum: number, o: any) => sum + (o.paid_amount || 0), 0) || 0;
        return res.json({ success: true, data: { usersCount: usersCount.count || 0, productsCount: productsCount.count || 0, ordersCount: ordersCount.count || 0, totalRevenue } });
      }

      // ===== 商品管理 =====
      if (path === '/admin/products' && method === 'GET') {
        const page = parseInt(url.searchParams.get('page') || '1');
        const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
        const keyword = url.searchParams.get('keyword');
        const status = url.searchParams.get('status');

        let query = supabase.from('products').select('*, category:categories(id, name)', { count: 'exact' });
        if (keyword) query = query.ilike('name', `%${keyword}%`);
        if (status) query = query.eq('status', status);
        query = query.order('created_at', { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1);

        const { data, error, count } = await query;
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true, data: { list: data, total: count, page, pageSize } });
      }
      if (path === '/admin/products' && method === 'POST') {
        const { data, error } = await supabase.from('products').insert({ ...req.body, status: req.body.status || 'on_shelves' }).select().single();
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true, data });
      }
      const productDetailMatch = path.match(/^\/admin\/products\/([a-f0-9-]+)$/);
      if (productDetailMatch && method === 'GET') {
        const { data, error } = await supabase.from('products').select('*, category:categories(id, name)').eq('id', productDetailMatch[1]).single();
        if (error) return res.status(404).json({ success: false, error: '商品不存在' });
        return res.json({ success: true, data });
      }
      if (productDetailMatch && method === 'PUT') {
        const { data, error } = await supabase.from('products').update(req.body).eq('id', productDetailMatch[1]).select().single();
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true, data });
      }
      if (productDetailMatch && method === 'DELETE') {
        const { error } = await supabase.from('products').delete().eq('id', productDetailMatch[1]);
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true });
      }

      // ===== 订单管理 =====
      if (path === '/admin/orders' && method === 'GET') {
        const page = parseInt(url.searchParams.get('page') || '1');
        const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
        const status = url.searchParams.get('status');

        let query = supabase.from('orders').select('*', { count: 'exact' });
        if (status) query = query.eq('status', status);
        query = query.order('created_at', { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1);

        const { data, error, count } = await query;
        if (error) return res.status(500).json({ success: false, error: error.message });

        // 获取用户信息
        if (data && data.length > 0) {
          const userIds = data.map(o => o.user_id).filter(Boolean);
          if (userIds.length > 0) {
            const { data: users } = await supabase.from('users').select('id, name, phone').in('id', userIds);
            const userMap = new Map(users?.map(u => [u.id, u]) || []);
            data.forEach(order => {
              order.user = userMap.get(order.user_id) || null;
            });
          }
        }

        return res.json({ success: true, data: { list: data, total: count, page, pageSize } });
      }
      const orderDetailMatch = path.match(/^\/admin\/orders\/([a-f0-9-]+)$/);
      if (orderDetailMatch && method === 'GET') {
        const { data: order, error } = await supabase.from('orders').select('*').eq('id', orderDetailMatch[1]).single();
        if (error) return res.status(404).json({ success: false, error: '订单不存在' });

        // 获取订单商品
        const { data: items } = await supabase.from('order_items').select('*').eq('order_id', orderDetailMatch[1]);
        order.items = items || [];

        // 获取用户信息
        if (order.user_id) {
          const { data: user } = await supabase.from('users').select('id, name, phone').eq('id', order.user_id).single();
          order.user = user || null;
        }

        return res.json({ success: true, data: order });
      }
      const orderShipMatch = path.match(/^\/admin\/orders\/([a-f0-9-]+)\/ship$/);
      if (orderShipMatch && method === 'PUT') {
        const { logistics_company, logistics_no } = req.body;
        const { error } = await supabase.from('orders').update({ status: 'shipped', logistics_company, logistics_no, shipped_at: new Date().toISOString() }).eq('id', orderShipMatch[1]);
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true, message: '发货成功' });
      }
      const orderCancelMatch = path.match(/^\/admin\/orders\/([a-f0-9-]+)\/cancel$/);
      if (orderCancelMatch && method === 'PUT') {
        const { error } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderCancelMatch[1]);
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true, message: '订单已取消' });
      }

      // ===== 用户管理 =====
      if (path === '/admin/users' && method === 'GET') {
        const page = parseInt(url.searchParams.get('page') || '1');
        const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
        const keyword = url.searchParams.get('keyword');

        let query = supabase.from('users').select('id, phone, name, avatar, status, is_partner, partner_level, balance, total_income, created_at', { count: 'exact' });
        if (keyword) query = query.or(`name.ilike.%${keyword}%,phone.ilike.%${keyword}%`);
        query = query.order('created_at', { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1);

        const { data, error, count } = await query;
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true, data: { list: data, total: count, page, pageSize } });
      }
      const userDetailMatch = path.match(/^\/admin\/users\/([a-f0-9-]+)$/);
      if (userDetailMatch && method === 'GET') {
        const { data, error } = await supabase.from('users').select('id, phone, name, avatar, status, is_partner, partner_level, balance, total_income, invite_code, created_at, gender, birthday, email').eq('id', userDetailMatch[1]).single();
        if (error) return res.status(404).json({ success: false, error: '用户不存在' });
        return res.json({ success: true, data });
      }
      const userStatusMatch = path.match(/^\/admin\/users\/([a-f0-9-]+)\/status$/);
      if (userStatusMatch && method === 'PUT') {
        const { status } = req.body;
        const { error } = await supabase.from('users').update({ status }).eq('id', userStatusMatch[1]);
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true });
      }
      const userOrdersMatch = path.match(/^\/admin\/users\/([a-f0-9-]+)\/orders$/);
      if (userOrdersMatch && method === 'GET') {
        const { data, error } = await supabase.from('orders').select('*').eq('user_id', userOrdersMatch[1]).order('created_at', { ascending: false });
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true, data: { list: data } });
      }
      const userIncomeMatch = path.match(/^\/admin\/users\/([a-f0-9-]+)\/income$/);
      if (userIncomeMatch && method === 'GET') {
        const { data, error } = await supabase.from('income_records').select('*').eq('user_id', userIncomeMatch[1]).order('created_at', { ascending: false });
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true, data: { list: data } });
      }
      const userAddressesMatch = path.match(/^\/admin\/users\/([a-f0-9-]+)\/addresses$/);
      if (userAddressesMatch && method === 'GET') {
        const { data, error } = await supabase.from('addresses').select('*').eq('user_id', userAddressesMatch[1]);
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true, data });
      }
      const userCellarMatch = path.match(/^\/admin\/users\/([a-f0-9-]+)\/cellar$/);
      if (userCellarMatch && method === 'GET') {
        const { data, error } = await supabase.from('cellar_items').select('*').eq('user_id', userCellarMatch[1]);
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true, data });
      }
      const userTeamMatch = path.match(/^\/admin\/users\/([a-f0-9-]+)\/team$/);
      if (userTeamMatch && method === 'GET') {
        const { data, error } = await supabase.from('users').select('id, name, phone, avatar, created_at').eq('referrer_id', userTeamMatch[1]);
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true, data: { list: data } });
      }

      // ===== 合伙人管理 =====
      if (path === '/admin/partners' && method === 'GET') {
        const page = parseInt(url.searchParams.get('page') || '1');
        const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
        const { data, error, count } = await supabase.from('users').select('id, phone, name, avatar, partner_level, balance, total_income, created_at', { count: 'exact' }).eq('is_partner', true).order('created_at', { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1);
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true, data: { list: data, total: count, page, pageSize } });
      }
      const partnerDetailMatch = path.match(/^\/admin\/partners\/([a-f0-9-]+)$/);
      if (partnerDetailMatch && method === 'GET') {
        const { data, error } = await supabase.from('users').select('*').eq('id', partnerDetailMatch[1]).single();
        if (error) return res.status(404).json({ success: false, error: '合伙人不存在' });
        return res.json({ success: true, data });
      }
      const partnerTeamMatch = path.match(/^\/admin\/partners\/([a-f0-9-]+)\/team$/);
      if (partnerTeamMatch && method === 'GET') {
        const { data, error } = await supabase.from('users').select('id, name, phone, avatar, created_at').eq('referrer_id', partnerTeamMatch[1]);
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true, data: { list: data } });
      }
      const partnerIncomeMatch = path.match(/^\/admin\/partners\/([a-f0-9-]+)\/income$/);
      if (partnerIncomeMatch && method === 'GET') {
        const { data, error } = await supabase.from('income_records').select('*').eq('user_id', partnerIncomeMatch[1]).order('created_at', { ascending: false });
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true, data: { list: data } });
      }

      // ===== 合伙人申请管理 =====
      if (path === '/admin/partner-applications' && method === 'GET') {
        const page = parseInt(url.searchParams.get('page') || '1');
        const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
        const { data, error, count } = await supabase.from('partner_applications').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1);
        if (error) return res.status(500).json({ success: false, error: error.message });

        // 获取用户信息
        if (data && data.length > 0) {
          const userIds = data.map(a => a.user_id).filter(Boolean);
          if (userIds.length > 0) {
            const { data: users } = await supabase.from('users').select('id, name, phone').in('id', userIds);
            const userMap = new Map(users?.map(u => [u.id, u]) || []);
            data.forEach(app => { app.user = userMap.get(app.user_id) || null; });
          }
        }

        return res.json({ success: true, data: { list: data, total: count, page, pageSize } });
      }
      const appReviewMatch = path.match(/^\/admin\/partner-applications\/([a-f0-9-]+)\/review$/);
      if (appReviewMatch && method === 'PUT') {
        const { status, note } = req.body;
        const app = await supabase.from('partner_applications').select('user_id, level').eq('id', appReviewMatch[1]).single();
        if (app.data) {
          if (status === 'approved') {
            await supabase.from('users').update({ is_partner: true, partner_level: app.data.level || 'junior' }).eq('id', app.data.user_id);
          }
          await supabase.from('partner_applications').update({ status, note, reviewed_at: new Date().toISOString() }).eq('id', appReviewMatch[1]);
        }
        return res.json({ success: true });
      }

      // ===== 提现管理 =====
      if (path === '/admin/withdrawals' && method === 'GET') {
        const page = parseInt(url.searchParams.get('page') || '1');
        const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
        const status = url.searchParams.get('status');
        let query = supabase.from('withdrawals').select('*', { count: 'exact' });
        if (status) query = query.eq('status', status);
        query = query.order('created_at', { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1);
        const { data, error, count } = await query;
        if (error) return res.status(500).json({ success: false, error: error.message });

        // 获取用户信息
        if (data && data.length > 0) {
          const userIds = data.map(w => w.user_id).filter(Boolean);
          if (userIds.length > 0) {
            const { data: users } = await supabase.from('users').select('id, name, phone').in('id', userIds);
            const userMap = new Map(users?.map(u => [u.id, u]) || []);
            data.forEach(w => { w.user = userMap.get(w.user_id) || null; });
          }
        }

        return res.json({ success: true, data: { list: data, total: count, page, pageSize } });
      }
      const withdrawalProcessMatch = path.match(/^\/admin\/withdrawals\/([a-f0-9-]+)\/process$/);
      if (withdrawalProcessMatch && method === 'PUT') {
        const { status, reason } = req.body;
        const { error } = await supabase.from('withdrawals').update({ status, reason, processed_at: new Date().toISOString() }).eq('id', withdrawalProcessMatch[1]);
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true });
      }

      // ===== 分类管理 =====
      if (path === '/admin/categories' && method === 'GET') {
        const { data, error } = await supabase.from('categories').select('*').order('sort_order');
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true, data });
      }
      if (path === '/admin/categories' && method === 'POST') {
        const { data, error } = await supabase.from('categories').insert(req.body).select().single();
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true, data });
      }
      const categoryMatch = path.match(/^\/admin\/categories\/([a-f0-9-]+)$/);
      if (categoryMatch && method === 'PUT') {
        const { error } = await supabase.from('categories').update(req.body).eq('id', categoryMatch[1]);
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true });
      }
      if (categoryMatch && method === 'DELETE') {
        const { error } = await supabase.from('categories').delete().eq('id', categoryMatch[1]);
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true });
      }

      // ===== 轮播图管理 =====
      if (path === '/admin/banners' && method === 'GET') {
        const { data, error } = await supabase.from('banners').select('*').order('sort_order');
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true, data });
      }
      if (path === '/admin/banners' && method === 'POST') {
        const { data, error } = await supabase.from('banners').insert(req.body).select().single();
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true, data });
      }
      const bannerMatch = path.match(/^\/admin\/banners\/([a-f0-9-]+)$/);
      if (bannerMatch && method === 'PUT') {
        const { error } = await supabase.from('banners').update(req.body).eq('id', bannerMatch[1]);
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true });
      }
      if (bannerMatch && method === 'DELETE') {
        const { error } = await supabase.from('banners').delete().eq('id', bannerMatch[1]);
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true });
      }
      const bannerStatusMatch = path.match(/^\/admin\/banners\/([a-f0-9-]+)\/status$/);
      if (bannerStatusMatch && method === 'PUT') {
        const { status } = req.body;
        const { error } = await supabase.from('banners').update({ status }).eq('id', bannerStatusMatch[1]);
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true });
      }

      // ===== 公告管理 =====
      if (path === '/admin/notifications' && method === 'GET') {
        const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true, data });
      }
      if (path === '/admin/notifications' && method === 'POST') {
        const { data, error } = await supabase.from('notifications').insert(req.body).select().single();
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true, data });
      }
      const notificationMatch = path.match(/^\/admin\/notifications\/([a-f0-9-]+)$/);
      if (notificationMatch && method === 'PUT') {
        const { error } = await supabase.from('notifications').update(req.body).eq('id', notificationMatch[1]);
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true });
      }
      if (notificationMatch && method === 'DELETE') {
        const { error } = await supabase.from('notifications').delete().eq('id', notificationMatch[1]);
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true });
      }

      // ===== 优惠券管理 =====
      if (path === '/admin/coupons' && method === 'GET') {
        const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true, data });
      }
      if (path === '/admin/coupons' && method === 'POST') {
        const { data, error } = await supabase.from('coupons').insert(req.body).select().single();
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true, data });
      }
      const couponMatch = path.match(/^\/admin\/coupons\/([a-f0-9-]+)$/);
      if (couponMatch && method === 'GET') {
        const { data, error } = await supabase.from('coupons').select('*').eq('id', couponMatch[1]).single();
        if (error) return res.status(404).json({ success: false, error: '优惠券不存在' });
        return res.json({ success: true, data });
      }
      if (couponMatch && method === 'PUT') {
        const { error } = await supabase.from('coupons').update(req.body).eq('id', couponMatch[1]);
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true });
      }
      if (couponMatch && method === 'DELETE') {
        const { error } = await supabase.from('coupons').delete().eq('id', couponMatch[1]);
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true });
      }

      // ===== 秒杀活动管理 =====
      if (path === '/admin/flash-sales' && method === 'GET') {
        const { data, error } = await supabase.from('flash_sales').select('*').order('created_at', { ascending: false });
        if (error) return res.status(500).json({ success: false, error: error.message });

        // 获取商品信息
        if (data && data.length > 0) {
          const productIds = data.map(f => f.product_id).filter(Boolean);
          if (productIds.length > 0) {
            const { data: products } = await supabase.from('products').select('id, name').in('id', productIds);
            const productMap = new Map(products?.map(p => [p.id, p]) || []);
            data.forEach(f => { f.product = productMap.get(f.product_id) || null; });
          }
        }

        return res.json({ success: true, data });
      }
      if (path === '/admin/flash-sales' && method === 'POST') {
        const { data, error } = await supabase.from('flash_sales').insert(req.body).select().single();
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true, data });
      }
      const flashSaleMatch = path.match(/^\/admin\/flash-sales\/([a-f0-9-]+)$/);
      if (flashSaleMatch && method === 'PUT') {
        const { error } = await supabase.from('flash_sales').update(req.body).eq('id', flashSaleMatch[1]);
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true });
      }
      if (flashSaleMatch && method === 'DELETE') {
        const { error } = await supabase.from('flash_sales').delete().eq('id', flashSaleMatch[1]);
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true });
      }

      // ===== 团购活动管理 =====
      if (path === '/admin/group-buys' && method === 'GET') {
        const { data, error } = await supabase.from('group_buys').select('*').order('created_at', { ascending: false });
        if (error) return res.status(500).json({ success: false, error: error.message });

        // 获取商品信息
        if (data && data.length > 0) {
          const productIds = data.map(g => g.product_id).filter(Boolean);
          if (productIds.length > 0) {
            const { data: products } = await supabase.from('products').select('id, name').in('id', productIds);
            const productMap = new Map(products?.map(p => [p.id, p]) || []);
            data.forEach(g => { g.product = productMap.get(g.product_id) || null; });
          }
        }

        return res.json({ success: true, data });
      }
      if (path === '/admin/group-buys' && method === 'POST') {
        const { data, error } = await supabase.from('group_buys').insert(req.body).select().single();
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true, data });
      }
      const groupBuyMatch = path.match(/^\/admin\/group-buys\/([a-f0-9-]+)$/);
      if (groupBuyMatch && method === 'PUT') {
        const { error } = await supabase.from('group_buys').update(req.body).eq('id', groupBuyMatch[1]);
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true });
      }
      if (groupBuyMatch && method === 'DELETE') {
        const { error } = await supabase.from('group_buys').delete().eq('id', groupBuyMatch[1]);
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true });
      }

      // ===== 退款管理 =====
      if (path === '/admin/refunds' && method === 'GET') {
        const { data, error } = await supabase.from('refunds').select('*').order('created_at', { ascending: false });
        if (error) return res.status(500).json({ success: false, error: error.message });

        // 获取订单和用户信息
        if (data && data.length > 0) {
          const orderIds = data.map(r => r.order_id).filter(Boolean);
          const userIds = data.map(r => r.user_id).filter(Boolean);
          if (orderIds.length > 0) {
            const { data: orders } = await supabase.from('orders').select('id, order_no').in('id', orderIds);
            const orderMap = new Map(orders?.map(o => [o.id, o]) || []);
            data.forEach(r => { r.order = orderMap.get(r.order_id) || null; });
          }
          if (userIds.length > 0) {
            const { data: users } = await supabase.from('users').select('id, name, phone').in('id', userIds);
            const userMap = new Map(users?.map(u => [u.id, u]) || []);
            data.forEach(r => { r.user = userMap.get(r.user_id) || null; });
          }
        }

        return res.json({ success: true, data });
      }
      const refundApproveMatch = path.match(/^\/admin\/refunds\/([a-f0-9-]+)\/approve$/);
      if (refundApproveMatch && method === 'PUT') {
        const { admin_note } = req.body;
        const { error } = await supabase.from('refunds').update({ status: 'approved', admin_note }).eq('id', refundApproveMatch[1]);
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true });
      }
      const refundRejectMatch = path.match(/^\/admin\/refunds\/([a-f0-9-]+)\/reject$/);
      if (refundRejectMatch && method === 'PUT') {
        const { admin_note } = req.body;
        const { error } = await supabase.from('refunds').update({ status: 'rejected', admin_note }).eq('id', refundRejectMatch[1]);
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.json({ success: true });
      }

      // ===== 财务统计 =====
      if (path === '/admin/finance/stats') {
        const { data: orders } = await supabase.from('orders').select('paid_amount').in('status', ['completed', 'shipped']);
        const totalRevenue = orders?.reduce((sum: number, o: any) => sum + (o.paid_amount || 0), 0) || 0;
        const { data: incomes } = await supabase.from('income_records').select('amount').in('status', ['settled', 'completed']);
        const totalIncome = incomes?.reduce((sum: number, i: any) => sum + (i.amount || 0), 0) || 0;
        return res.json({ success: true, data: { totalRevenue, totalIncome, pendingWithdrawals: 0 } });
      }

      // ===== 设置 =====
      if (path === '/admin/settings' && method === 'GET') {
        const { data, error } = await supabase.from('settings').select('*');
        if (error) return res.json({ success: true, data: [] });
        return res.json({ success: true, data });
      }
      if (path === '/admin/settings' && method === 'PUT') {
        const settings = req.body;
        for (const item of settings) {
          await supabase.from('settings').upsert({ key: item.key, value: item.value }, { onConflict: 'key' });
        }
        return res.json({ success: true });
      }

      // ===== 分销配置 =====
      if (path === '/admin/distribution-settings' && method === 'GET') {
        const { data, error } = await supabase.from('settings').select('*').in('key', [
          'partner_referral_reward', 'partner_sales_commission_rate',
          'partner_one_star_direct', 'partner_two_star_direct_one', 'partner_two_star_direct',
          'partner_pool_inject_amount', 'partner_pool_period', 'partner_pool_algorithm'
        ]);
        if (error) return res.json({ success: true, data: {} });
        // 转换为对象格式
        const settingsMap: Record<string, string> = {};
        data?.forEach(s => { settingsMap[s.key] = s.value; });
        return res.json({ success: true, data: settingsMap });
      }
      if (path === '/admin/distribution-settings' && method === 'PUT') {
        const { settings } = req.body;
        if (settings && Array.isArray(settings)) {
          for (const item of settings) {
            await supabase.from('settings').upsert({ key: item.key, value: item.value }, { onConflict: 'key' });
          }
        }
        return res.json({ success: true });
      }

      // ===== 收益记录 =====
      if (path === '/admin/income-records' && method === 'GET') {
        const page = parseInt(url.searchParams.get('page') || '1');
        const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
        const type = url.searchParams.get('type');
        const keyword = url.searchParams.get('keyword');

        let query = supabase.from('income_records').select('*', { count: 'exact' });
        if (type) query = query.eq('type', type);
        query = query.order('created_at', { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1);

        const { data, error, count } = await query;
        if (error) return res.status(500).json({ success: false, error: error.message });

        // 获取用户信息
        if (data && data.length > 0) {
          const userIds = data.map(r => r.user_id).filter(Boolean);
          if (userIds.length > 0) {
            const { data: users } = await supabase.from('users').select('id, name, phone').in('id', userIds);
            const userMap = new Map(users?.map(u => [u.id, u]) || []);
            data.forEach(r => { r.user = userMap.get(r.user_id) || null; });
          }
        }

        return res.json({ success: true, data: { list: data || [], total: count || 0, page, pageSize } });
      }

      // ===== 销售排行榜 =====
      if (path === '/admin/sales-leaderboard' && method === 'GET') {
        const period = url.searchParams.get('period') || 'month';
        const limit = parseInt(url.searchParams.get('limit') || '50');

        // 获取合伙人用户
        const { data: partners, error } = await supabase.from('users')
          .select('id, name, phone, partner_level, total_income, created_at')
          .eq('is_partner', true)
          .order('total_income', { ascending: false })
          .limit(limit);

        if (error) return res.status(500).json({ success: false, error: error.message });

        // 计算团队销售额（简化版：使用 total_income 作为参考）
        const leaderboard = partners?.map((p, index) => ({
          rank: index + 1,
          id: p.id,
          name: p.name || '未知',
          phone: p.phone || '-',
          level: p.partner_level || 'junior',
          team_sales: p.total_income || 0,  // 简化处理
          personal_sales: p.total_income || 0,
          total_earnings: p.total_income || 0
        })) || [];

        return res.json({ success: true, data: leaderboard });
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