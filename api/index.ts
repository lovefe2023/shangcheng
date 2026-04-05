/**
 * Vercel Serverless Function - API 入口
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const app = express();

// 中间件
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// Supabase 客户端
const getSupabase = async () => {
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

// JWT 密钥
const getJwtSecret = () => process.env.JWT_SECRET || 'default-secret-key';

// ============================================
// 认证路由
// ============================================

// 用户登录
app.post('/auth/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMS', message: '手机号和密码不能为空' }
      });
    }

    const supabase = await getSupabase();
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: { code: 'LOGIN_FAILED', message: '手机号或密码错误' }
      });
    }

    // 验证密码
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: { code: 'LOGIN_FAILED', message: '手机号或密码错误' }
      });
    }

    // 检查状态
    if (user.status === 'frozen') {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCOUNT_FROZEN', message: '账号已被冻结' }
      });
    }

    // 生成 token
    const token = jwt.sign({ userId: user.id }, getJwtSecret(), { expiresIn: '7d' });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          avatar: user.avatar,
          status: user.status,
          is_partner: user.is_partner,
          partner_level: user.partner_level,
          invite_code: user.invite_code,
          balance: user.balance
        },
        session: { access_token: token }
      }
    });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// 用户注册
app.post('/auth/register', async (req, res) => {
  try {
    const { phone, password, name, inviteCode } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMS', message: '手机号和密码不能为空' }
      });
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PHONE', message: '请输入正确的手机号' }
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PASSWORD', message: '密码至少需要6位字符' }
      });
    }

    const supabase = await getSupabase();

    // 检查手机号
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('phone', phone)
      .single();

    if (existing) {
      return res.status(400).json({
        success: false,
        error: { code: 'PHONE_EXISTS', message: '该手机号已注册' }
      });
    }

    // 查找推荐人
    let referrerId = null;
    if (inviteCode) {
      const { data: referrer } = await supabase
        .from('users')
        .select('id')
        .eq('invite_code', inviteCode)
        .single();
      if (referrer) referrerId = referrer.id;
    }

    // 生成邀请码
    const userInviteCode = `U${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

    // 创建用户
    const hashedPassword = await bcrypt.hash(password, 12);
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        phone,
        password_hash: hashedPassword,
        name: name || `用户${phone.slice(-4)}`,
        referrer_id: referrerId,
        invite_code: userInviteCode,
        status: 'active'
      })
      .select()
      .single();

    if (userError) {
      return res.status(500).json({
        success: false,
        error: { code: 'USER_CREATE_FAILED', message: userError.message }
      });
    }

    const token = jwt.sign({ userId: user.id }, getJwtSecret(), { expiresIn: '7d' });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          invite_code: user.invite_code
        },
        session: { access_token: token }
      }
    });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// 获取当前用户
app.get('/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: '未登录' }
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, getJwtSecret()) as { userId: string };

    const supabase = await getSupabase();
    const { data: user, error } = await supabase
      .from('users')
      .select('id, phone, name, avatar, status, is_partner, partner_level, invite_code, balance, total_income, gender, birthday, email')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: '用户不存在' }
      });
    }

    // 管理员判断
    const adminPhones = (process.env.ADMIN_PHONES || '').split(',').filter(p => p.trim());
    const role = adminPhones.includes(user.phone) ? 'admin' : 'user';

    res.json({ success: true, data: { ...user, role } });
  } catch (e: any) {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: '登录已过期' }
    });
  }
});

// 登出
app.post('/auth/logout', (_req, res) => {
  res.json({ success: true, message: '登出成功' });
});

// ============================================
// 产品路由
// ============================================

// 健康检查
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 产品列表
app.get('/products', async (req, res) => {
  try {
    const supabase = await getSupabase();
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const category = req.query.category as string;

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('status', 'on_shelves')
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (category) {
      query = query.eq('category_id', category);
    }

    const { data, error, count } = await query;

    if (error) throw error;
    res.json({ success: true, data: { list: data, total: count } });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// 产品详情
app.get('/products/:id', async (req, res) => {
  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// 分类
app.get('/categories', async (_req, res) => {
  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order');

    if (error) throw error;
    res.json({ success: true, data });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// 轮播图
app.get('/banners', async (_req, res) => {
  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('status', 'visible')
      .order('sort_order');

    if (error) throw error;
    res.json({ success: true, data });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// 秒杀
app.get('/flash-sales', async (req, res) => {
  try {
    const supabase = await getSupabase();
    const status = req.query.status as string;

    let query = supabase
      .from('flash_sales')
      .select('*, product:products(id, name, images, original_price)');

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, data });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// 团购
app.get('/group-buys', async (_req, res) => {
  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('group_buys')
      .select('*, product:products(id, name, images, original_price)');

    if (error) throw error;
    res.json({ success: true, data });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// 优惠券
app.get('/coupons', async (_req, res) => {
  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('status', 'distributing');

    if (error) throw error;
    res.json({ success: true, data });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// 地址列表
app.get('/addresses', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: '未登录' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, getJwtSecret()) as { userId: string };

    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', decoded.userId)
      .order('is_default', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// 添加地址
app.post('/addresses', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: '未登录' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, getJwtSecret()) as { userId: string };

    const { name, phone, province, city, district, detail, is_default } = req.body;

    const supabase = await getSupabase();

    // 如果设为默认，取消其他默认
    if (is_default) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', decoded.userId);
    }

    const { data, error } = await supabase
      .from('addresses')
      .insert({
        user_id: decoded.userId,
        name,
        phone,
        province,
        city,
        district,
        detail,
        is_default: is_default || false
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// 购物车
app.get('/cart', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: '未登录' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, getJwtSecret()) as { userId: string };

    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('cart_items')
      .select('*, product:products(*)')
      .eq('user_id', decoded.userId);

    if (error) throw error;
    res.json({ success: true, data: { items: data } });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// 添加购物车
app.post('/cart', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: '未登录' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, getJwtSecret()) as { userId: string };

    const { product_id, quantity = 1, spec } = req.body;

    const supabase = await getSupabase();

    // 检查库存
    const { data: product } = await supabase
      .from('products')
      .select('stock')
      .eq('id', product_id)
      .single();

    if (!product || product.stock < quantity) {
      return res.status(400).json({ success: false, error: '库存不足' });
    }

    // 查找已有购物车项
    let query = supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', decoded.userId)
      .eq('product_id', product_id);

    if (spec) {
      query = query.eq('spec', spec);
    } else {
      query = query.is('spec', null);
    }

    const { data: existing } = await query;

    if (existing && existing.length > 0) {
      // 更新数量
      const newQty = existing[0].quantity + quantity;
      await supabase
        .from('cart_items')
        .update({ quantity: newQty })
        .eq('id', existing[0].id);
    } else {
      // 新增
      await supabase
        .from('cart_items')
        .insert({
          user_id: decoded.userId,
          product_id,
          quantity,
          spec,
          selected: true
        });
    }

    res.json({ success: true, message: '已添加到购物车' });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// 订单列表
app.get('/orders', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: '未登录' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, getJwtSecret()) as { userId: string };

    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('user_id', decoded.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data: { list: data } });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// 404
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

// Vercel handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const originalUrl = req.url || '/';
  req.url = originalUrl.replace(/^\/api/, '') || '/';

  return new Promise<void>((resolve, reject) => {
    app(req as any, res as any, (err?: Error) => {
      if (err) reject(err);
      else resolve();
    });
  });
}