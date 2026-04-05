/**
 * 后台管理路由
 * 仪表盘、商品、订单、用户、合伙人、财务、营销、内容管理
 */

import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../utils/supabase';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// 所有管理接口都需要管理员权限
router.use(requireAdmin);

// ===========================================
// 验证工具函数
// ===========================================

/**
 * HTML 转义，防止 XSS
 */
const escapeHtml = (str: string): string => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * LIKE 模式消毒，防止特殊字符操纵搜索
 * 转义 %, _, \ 字符
 */
const sanitizeLikePattern = (str: string): string => {
  if (typeof str !== 'string') return str;
  return str.replace(/[%_\\]/g, '\\$&');
};

/**
 * 验证用户状态值
 */
const VALID_USER_STATUS = ['active', 'frozen'];
const isValidUserStatus = (status: string): boolean => {
  return VALID_USER_STATUS.includes(status);
};

/**
 * 验证合伙人等级值
 */
const VALID_PARTNER_LEVELS = ['none', 'junior', 'middle', 'senior'];
const isValidPartnerLevel = (level: string): boolean => {
  return VALID_PARTNER_LEVELS.includes(level);
};

/**
 * 验证日期格式 (YYYY-MM-DD)
 */
const isValidDateFormat = (date: string): boolean => {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
};

/**
 * 验证商品数据
 */
const validateProductData = (data: any, isUpdate: boolean = false): { valid: boolean; error?: string } => {
  const { name, price, stock, category_id, images, description } = data;

  // 名称验证
  if (!isUpdate || name !== undefined) {
    if (!name || typeof name !== 'string') {
      return { valid: false, error: '商品名称不能为空' };
    }
    if (name.trim().length === 0) {
      return { valid: false, error: '商品名称不能为空' };
    }
    if (name.length > 200) {
      return { valid: false, error: '商品名称不能超过 200 个字符' };
    }
  }

  // 价格验证
  if (!isUpdate || price !== undefined) {
    if (price === undefined || price === null) {
      if (!isUpdate) return { valid: false, error: '商品价格不能为空' };
    } else {
      const priceNum = Number(price);
      if (isNaN(priceNum) || priceNum < 0) {
        return { valid: false, error: '商品价格必须为非负数' };
      }
      if (priceNum > 99999999) {
        return { valid: false, error: '商品价格超出范围' };
      }
    }
  }

  // 库存验证
  if (stock !== undefined) {
    const stockNum = Number(stock);
    if (isNaN(stockNum) || !Number.isInteger(stockNum) || stockNum < 0) {
      return { valid: false, error: '库存必须为非负整数' };
    }
    if (stockNum > 99999999) {
      return { valid: false, error: '库存超出范围' };
    }
  }

  // 分类验证
  if (category_id !== undefined && category_id !== null) {
    if (typeof category_id !== 'string' || category_id.trim().length === 0) {
      return { valid: false, error: '分类ID格式无效' };
    }
  }

  // 图片验证
  if (images !== undefined) {
    if (!Array.isArray(images)) {
      return { valid: false, error: '图片必须为数组' };
    }
    if (images.length > 10) {
      return { valid: false, error: '最多上传 10 张图片' };
    }
    for (const img of images) {
      if (typeof img !== 'string') {
        return { valid: false, error: '图片URL格式无效' };
      }
      // 简单的 URL 格式验证
      if (!img.startsWith('/') && !img.startsWith('http://') && !img.startsWith('https://') && !img.startsWith('data:')) {
        return { valid: false, error: '图片URL格式无效' };
      }
    }
  }

  // 描述验证
  if (description !== undefined && description !== null) {
    if (typeof description !== 'string') {
      return { valid: false, error: '商品描述格式无效' };
    }
    if (description.length > 10000) {
      return { valid: false, error: '商品描述不能超过 10000 个字符' };
    }
  }

  return { valid: true };
};

/**
 * 清理商品数据（XSS 防护）
 */
const sanitizeProductData = (data: any): any => {
  const sanitized: any = {};

  if (data.name !== undefined) {
    sanitized.name = escapeHtml(data.name.trim());
  }
  if (data.description !== undefined) {
    sanitized.description = escapeHtml(data.description);
  }
  if (data.price !== undefined) {
    sanitized.price = Number(data.price);
  }
  if (data.original_price !== undefined) {
    sanitized.original_price = Number(data.original_price);
  }
  if (data.stock !== undefined) {
    sanitized.stock = Math.max(0, Math.floor(Number(data.stock)));
  }
  if (data.category_id !== undefined) {
    sanitized.category_id = data.category_id;
  }
  if (data.images !== undefined) {
    sanitized.images = data.images;
  }
  if (data.specs !== undefined) {
    // specs 保持原样，前端已处理
    sanitized.specs = data.specs;
  }
  if (data.tags !== undefined) {
    sanitized.tags = data.tags;
  }
  if (data.status !== undefined) {
    sanitized.status = data.status;
  }

  return sanitized;
};

// ===========================================
// 仪表盘
// ===========================================

/**
 * GET /api/admin/dashboard
 * 仪表盘数据
 */
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // 今日交易额
    const { data: todayOrders } = await supabaseAdmin
      .from('orders')
      .select('paid_amount')
      .in('status', ['completed', 'shipped', 'pending_shipment'])
      .gte('created_at', todayStart);

    const todayRevenue = todayOrders?.reduce((sum, order) => sum + order.paid_amount, 0) || 0;

    // 今日新增合伙人
    const { count: todayPartners } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_partner', true)
      .gte('created_at', todayStart);

    // 待处理提现
    const { count: pendingWithdrawals } = await supabaseAdmin
      .from('withdrawals')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // 待发货订单
    const { count: pendingShipments } = await supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending_shipment');

    // 近7天交易额
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: weeklyOrders } = await supabaseAdmin
      .from('orders')
      .select('paid_amount, created_at')
      .in('status', ['completed', 'shipped', 'pending_shipment'])
      .gte('created_at', sevenDaysAgo);

    const dailyRevenue: { [key: string]: number } = {};
    weeklyOrders?.forEach(order => {
      const date = new Date(order.created_at).toLocaleDateString('zh-CN');
      dailyRevenue[date] = (dailyRevenue[date] || 0) + order.paid_amount;
    });

    // 近7天新增合伙人
    const { data: weeklyPartners } = await supabaseAdmin
      .from('users')
      .select('created_at')
      .eq('is_partner', true)
      .gte('created_at', sevenDaysAgo);

    const dailyPartners: { [key: string]: number } = {};
    weeklyPartners?.forEach(user => {
      const date = new Date(user.created_at).toLocaleDateString('zh-CN');
      dailyPartners[date] = (dailyPartners[date] || 0) + 1;
    });

    // 近7天新增订单
    const dailyOrders: { [key: string]: number } = {};
    weeklyOrders?.forEach(order => {
      const date = new Date(order.created_at).toLocaleDateString('zh-CN');
      dailyOrders[date] = (dailyOrders[date] || 0) + 1;
    });

    // 待审核提现列表
    const { data: pendingWithdrawalList } = await supabaseAdmin
      .from('withdrawals')
      .select(`
        id,
        withdrawal_no,
        amount,
        created_at,
        user:users(id, name, phone)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5);

    res.json({
      success: true,
      data: {
        stats: {
          today_revenue: todayRevenue,
          today_partners: todayPartners || 0,
          pending_withdrawals: pendingWithdrawals || 0,
          pending_shipments: pendingShipments || 0
        },
        charts: {
          daily_revenue: dailyRevenue,
          daily_partners: dailyPartners,
          daily_orders: dailyOrders
        },
        pending_withdrawal_list: pendingWithdrawalList || []
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '服务器错误'
      }
    });
  }
});

// ===========================================
// 商品管理
// ===========================================

/**
 * GET /api/admin/products
 * 商品列表
 */
router.get('/products', async (req: Request, res: Response) => {
  try {
    const { page = 1, pageSize = 20, keyword, category, status, tag } = req.query;

    let query = supabaseAdmin
      .from('products')
      .select('*, category:categories(id, name)', { count: 'exact' });

    if (keyword) {
      query = query.ilike('name', `%${keyword}%`);
    }
    if (category) {
      query = query.eq('category_id', category);
    }
    if (status) {
      query = query.eq('status', status);
    }
    // 标签筛选：使用 cs (contains) 操作符筛选包含指定标签的商品
    if (tag) {
      query = query.contains('tags', [tag]);
    }

    query = query.order('created_at', { ascending: false });

    // 分页
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize as string) || 20));
    const offset = (pageNum - 1) * pageSizeNum;

    query = query.range(offset, offset + pageSizeNum - 1);

    const { data: products, error, count } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'QUERY_ERROR',
          message: '查询失败'
        }
      });
    }

    res.json({
      success: true,
      data: {
        list: products || [],
        total: count || 0,
        page: pageNum,
        pageSize: pageSizeNum
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '服务器错误'
      }
    });
  }
});

/**
 * POST /api/admin/products
 * 创建商品
 */
router.post('/products', async (req: Request, res: Response) => {
  try {
    // 验证输入
    const validation = validateProductData(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMS',
          message: validation.error
        }
      });
    }

    // 清理数据
    const sanitizedData = sanitizeProductData(req.body);

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .insert({
        ...sanitizedData,
        status: sanitizedData.status || 'on_shelves'
      })
      .select()
      .single();

    if (error) {
      console.error('Create product error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INSERT_ERROR',
          message: '创建失败: ' + error.message
        }
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '服务器错误'
      }
    });
  }
});

/**
 * GET /api/admin/products/:id
 * 获取单个商品详情
 */
router.get('/products/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .select('*, category:categories(id, name)')
      .eq('id', id)
      .single();

    if (error || !product) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: '商品不存在'
        }
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '服务器错误'
      }
    });
  }
});

/**
 * PUT /api/admin/products/:id
 * 更新商品
 */
router.put('/products/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 验证输入（更新模式，允许部分字段）
    const validation = validateProductData(req.body, true);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMS',
          message: validation.error
        }
      });
    }

    // 清理数据
    const sanitizedData = sanitizeProductData(req.body);

    // 检查是否有需要更新的字段
    if (Object.keys(sanitizedData).length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_UPDATE_DATA',
          message: '没有需要更新的内容'
        }
      });
    }

    const { error } = await supabaseAdmin
      .from('products')
      .update(sanitizedData)
      .eq('id', id);

    if (error) {
      console.error('Update product error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: '更新失败: ' + error.message
        }
      });
    }

    res.json({
      success: true,
      message: '更新成功'
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '服务器错误'
      }
    });
  }
});

/**
 * DELETE /api/admin/products/:id
 * 删除商品
 */
router.delete('/products/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 检查商品是否在订单中被引用
    const { data: orderItems, error: orderError } = await supabaseAdmin
      .from('order_items')
      .select('id')
      .eq('product_id', id)
      .limit(1);

    if (orderError) {
      console.error('Check order items error:', orderError);
    }

    if (orderItems && orderItems.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'PRODUCT_IN_ORDERS',
          message: '该商品存在于订单中，无法删除'
        }
      });
    }

    // 检查商品是否在购物车中
    const { data: cartItems, error: cartError } = await supabaseAdmin
      .from('cart_items')
      .select('id')
      .eq('product_id', id)
      .limit(1);

    if (cartError) {
      console.error('Check cart items error:', cartError);
    }

    if (cartItems && cartItems.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'PRODUCT_IN_CART',
          message: '该商品存在于购物车中，无法删除'
        }
      });
    }

    // 检查商品是否参与秒杀活动
    const { data: flashSales, error: flashError } = await supabaseAdmin
      .from('flash_sales')
      .select('id')
      .eq('product_id', id)
      .limit(1);

    if (flashError) {
      console.error('Check flash sales error:', flashError);
    }

    if (flashSales && flashSales.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'PRODUCT_IN_FLASH_SALE',
          message: '该商品参与秒杀活动，请先删除活动'
        }
      });
    }

    // 检查商品是否参与团购活动
    const { data: groupBuys, error: groupError } = await supabaseAdmin
      .from('group_buys')
      .select('id')
      .eq('product_id', id)
      .limit(1);

    if (groupError) {
      console.error('Check group buys error:', groupError);
    }

    if (groupBuys && groupBuys.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'PRODUCT_IN_GROUP_BUY',
          message: '该商品参与团购活动，请先删除活动'
        }
      });
    }

    // 检查商品是否在酒窖中
    const { data: cellarItems, error: cellarError } = await supabaseAdmin
      .from('cellar_items')
      .select('id')
      .eq('product_id', id)
      .limit(1);

    if (cellarError) {
      console.error('Check cellar items error:', cellarError);
    }

    if (cellarItems && cellarItems.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'PRODUCT_IN_CELLAR',
          message: '该商品存在于用户酒窖中，无法删除'
        }
      });
    }

    // 执行删除
    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete product error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: '删除失败: ' + error.message
        }
      });
    }

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '服务器错误'
      }
    });
  }
});

// ===========================================
// 订单管理
// ===========================================

/**
 * GET /api/admin/orders
 * 订单列表
 */
router.get('/orders', async (req: Request, res: Response) => {
  try {
    const { page = 1, pageSize = 20, keyword, status, type, start_date, end_date } = req.query;

    let query = supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact' });

    if (keyword) {
      query = query.ilike('order_no', `%${keyword}%`);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (type) {
      query = query.eq('type', type);
    }
    if (start_date) {
      query = query.gte('created_at', start_date);
    }
    if (end_date) {
      query = query.lte('created_at', end_date);
    }

    query = query.order('created_at', { ascending: false });

    // 分页
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize as string) || 20));
    const offset = (pageNum - 1) * pageSizeNum;

    query = query.range(offset, offset + pageSizeNum - 1);

    const { data: orders, error, count } = await query;

    if (error) {
      console.error('Orders query error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'QUERY_ERROR',
          message: '查询失败'
        }
      });
    }

    // 获取订单用户信息
    const userIds = [...new Set((orders || []).map((o: any) => o.user_id))];
    let users: any[] = [];
    if (userIds.length > 0) {
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('id, name, phone')
        .in('id', userIds);
      users = userData || [];
    }

    // 获取订单商品信息
    const orderIds = (orders || []).map((o: any) => o.id);
    let orderItems: any[] = [];
    if (orderIds.length > 0) {
      const { data: itemsData } = await supabaseAdmin
        .from('order_items')
        .select('order_id, product_name, product_image, spec, price, quantity')
        .in('order_id', orderIds);
      orderItems = itemsData || [];
    }

    // 组装数据
    const ordersWithDetails = (orders || []).map((order: any) => ({
      ...order,
      user: users.find(u => u.id === order.user_id) || { name: '未知', phone: '-' },
      items: orderItems.filter(item => item.order_id === order.id)
    }));

    res.json({
      success: true,
      data: {
        list: ordersWithDetails || [],
        total: count || 0,
        page: pageNum,
        pageSize: pageSizeNum
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '服务器错误'
      }
    });
  }
});

/**
 * GET /api/admin/orders/:id
 * 订单详情
 */
router.get('/orders/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 获取订单基本信息
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !order) {
      return res.status(404).json({
        success: false,
        error: { code: 'ORDER_NOT_FOUND', message: '订单不存在' }
      });
    }

    // 获取用户信息
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, name, phone')
      .eq('id', order.user_id)
      .single();

    // 获取订单商品
    const { data: items } = await supabaseAdmin
      .from('order_items')
      .select('id, product_id, product_name, product_image, spec, price, quantity')
      .eq('order_id', id);

    // 获取推荐人信息
    let referrer = null;
    if (order.referrer_id) {
      const { data: referrerData } = await supabaseAdmin
        .from('users')
        .select('id, name, phone')
        .eq('id', order.referrer_id)
        .single();
      referrer = referrerData;
    }

    res.json({
      success: true,
      data: {
        ...order,
        user,
        items: items || [],
        referrer
      }
    });
  } catch (error) {
    console.error('Get order detail error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '服务器错误' }
    });
  }
});

/**
 * PUT /api/admin/orders/:id/ship
 * 发货
 */
router.put('/orders/:id/ship', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { logistics_company, logistics_no } = req.body;

    if (!logistics_company || !logistics_no) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMS',
          message: '物流公司和物流单号不能为空'
        }
      });
    }

    const now = new Date().toISOString();
    const { error } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'shipped',
        logistics_company,
        logistics_no,
        shipped_at: now
      })
      .eq('id', id);

    if (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: '发货失败'
        }
      });
    }

    res.json({
      success: true,
      message: '发货成功'
    });
  } catch (error) {
    console.error('Ship order error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '服务器错误'
      }
    });
  }
});

/**
 * PUT /api/admin/orders/:id/cancel
 * 取消订单（管理员）
 */
router.put('/orders/:id/cancel', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 检查订单是否存在
    const { data: order, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('id, status')
      .eq('id', id)
      .single();

    if (fetchError || !order) {
      return res.status(404).json({
        success: false,
        error: { code: 'ORDER_NOT_FOUND', message: '订单不存在' }
      });
    }

    // 只能取消待付款或待发货的订单
    if (order.status !== 'pending_payment' && order.status !== 'pending_shipment') {
      return res.status(400).json({
        success: false,
        error: { code: 'CANNOT_CANCEL', message: '当前订单状态不能取消' }
      });
    }

    const { error } = await supabaseAdmin
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (error) {
      return res.status(500).json({
        success: false,
        error: { code: 'CANCEL_FAILED', message: '取消订单失败' }
      });
    }

    res.json({
      success: true,
      message: '订单已取消'
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '服务器错误' }
    });
  }
});

// ===========================================
// 用户管理
// ===========================================

/**
 * GET /api/admin/users
 * 用户列表
 */
router.get('/users', async (req: Request, res: Response) => {
  try {
    const { page = 1, pageSize = 20, keyword, status, partner_level, start_date, end_date } = req.query;

    // 参数验证
    if (status && !isValidUserStatus(status as string)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: '无效的状态参数' }
      });
    }
    if (partner_level && !isValidPartnerLevel(partner_level as string)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_LEVEL', message: '无效的合伙人等级' }
      });
    }
    if (start_date && !isValidDateFormat(start_date as string)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_DATE', message: '无效的开始日期格式，应为 YYYY-MM-DD' }
      });
    }
    if (end_date && !isValidDateFormat(end_date as string)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_DATE', message: '无效的结束日期格式，应为 YYYY-MM-DD' }
      });
    }
    if (start_date && end_date && new Date(start_date as string) > new Date(end_date as string)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_DATE_RANGE', message: '开始日期不能晚于结束日期' }
      });
    }

    let query = supabaseAdmin
      .from('users')
      .select('*', { count: 'exact' });

    // 先应用简单筛选条件
    if (status) {
      query = query.eq('status', status);
    }
    if (partner_level) {
      query = query.eq('partner_level', partner_level);
    }
    if (start_date) {
      query = query.gte('created_at', start_date);
    }
    if (end_date) {
      query = query.lte('created_at', end_date);
    }

    // 关键词搜索 - 支持姓名和手机号
    if (keyword) {
      // 使用 or 条件搜索姓名或手机号
      query = query.or(`name.ilike.%${keyword}%,phone.ilike.%${keyword}%`);
    }

    query = query.order('created_at', { ascending: false });

    // 分页
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize as string) || 20));
    const offset = (pageNum - 1) * pageSizeNum;

    query = query.range(offset, offset + pageSizeNum - 1);

    const { data: users, error, count } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'QUERY_ERROR',
          message: '查询失败'
        }
      });
    }

    res.json({
      success: true,
      data: {
        list: users || [],
        total: count || 0,
        page: pageNum,
        pageSize: pageSizeNum
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '服务器错误'
      }
    });
  }
});

/**
 * GET /api/admin/users/:id
 * 用户详情
 */
router.get('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 获取用户基本信息
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select(`
        id, name, phone, avatar, status, is_partner, partner_level,
        invite_code, referrer_id, balance, total_income,
        gender, birthday, email, created_at, updated_at
      `)
      .eq('id', id)
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: '用户不存在' }
      });
    }

    // 获取推荐人信息
    let referrer = null;
    if (user.referrer_id) {
      const { data: referrerData } = await supabaseAdmin
        .from('users')
        .select('id, name, phone')
        .eq('id', user.referrer_id)
        .single();
      if (referrerData) {
        referrer = {
          id: referrerData.id,
          name: referrerData.name || '未设置',
          phone: referrerData.phone
        };
      }
    }

    // 获取团队人数（直接推荐的用户数）
    const { count: teamSize } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_id', id);

    // 获取订单统计
    const { data: orderStats } = await supabaseAdmin
      .from('orders')
      .select('paid_amount, status')
      .eq('user_id', id);

    const orderSummary = {
      total: orderStats?.length || 0,
      totalAmount: orderStats?.reduce((sum, o) => sum + (o.paid_amount || 0), 0) || 0,
      completed: orderStats?.filter(o => o.status === 'completed').length || 0,
      pending: orderStats?.filter(o => o.status === 'pending_payment' || o.status === 'pending_shipment').length || 0
    };

    res.json({
      success: true,
      data: {
        ...user,
        referrer,
        team_size: teamSize || 0,
        order_summary: orderSummary
      }
    });
  } catch (error) {
    console.error('Get user detail error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '服务器错误' }
    });
  }
});

/**
 * GET /api/admin/users/:id/orders
 * 用户订单列表
 */
router.get('/users/:id/orders', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = 1, pageSize = 10, status } = req.query;

    let query = supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact' })
      .eq('user_id', id);

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('created_at', { ascending: false });

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const pageSizeNum = Math.min(50, Math.max(1, parseInt(pageSize as string) || 10));
    const offset = (pageNum - 1) * pageSizeNum;

    query = query.range(offset, offset + pageSizeNum - 1);

    const { data: orders, error, count } = await query;

    if (error) {
      console.error('Get user orders error:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'QUERY_ERROR', message: '查询订单失败' }
      });
    }

    // 获取订单商品
    const orderIds = (orders || []).map((o: any) => o.id);
    let orderItems: any[] = [];

    if (orderIds.length > 0) {
      const { data: items } = await supabaseAdmin
        .from('order_items')
        .select('order_id, product_name, quantity, price')
        .in('order_id', orderIds);
      orderItems = items || [];
    }

    const ordersWithItems = (orders || []).map((order: any) => ({
      ...order,
      items: orderItems.filter(item => item.order_id === order.id)
    }));

    res.json({
      success: true,
      data: {
        list: ordersWithItems || [],
        total: count || 0,
        page: pageNum,
        pageSize: pageSizeNum
      }
    });
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '服务器错误' }
    });
  }
});

/**
 * GET /api/admin/users/:id/income
 * 用户收益记录
 */
router.get('/users/:id/income', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = 1, pageSize = 10, type } = req.query;

    let query = supabaseAdmin
      .from('income_records')
      .select('*', { count: 'exact' })
      .eq('user_id', id);

    if (type) {
      query = query.eq('type', type);
    }

    query = query.order('created_at', { ascending: false });

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const pageSizeNum = Math.min(50, Math.max(1, parseInt(pageSize as string) || 10));
    const offset = (pageNum - 1) * pageSizeNum;

    query = query.range(offset, offset + pageSizeNum - 1);

    const { data: records, error, count } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        error: { code: 'QUERY_ERROR', message: '查询收益记录失败' }
      });
    }

    res.json({
      success: true,
      data: {
        list: records || [],
        total: count || 0,
        page: pageNum,
        pageSize: pageSizeNum
      }
    });
  } catch (error) {
    console.error('Get user income error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '服务器错误' }
    });
  }
});

/**
 * GET /api/admin/users/:id/addresses
 * 用户收货地址
 */
router.get('/users/:id/addresses', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: addresses, error } = await supabaseAdmin
      .from('addresses')
      .select('*')
      .eq('user_id', id)
      .order('is_default', { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        error: { code: 'QUERY_ERROR', message: '查询地址失败' }
      });
    }

    res.json({
      success: true,
      data: addresses || []
    });
  } catch (error) {
    console.error('Get user addresses error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '服务器错误' }
    });
  }
});

/**
 * GET /api/admin/users/:id/cellar
 * 用户酒窖
 */
router.get('/users/:id/cellar', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: items, error } = await supabaseAdmin
      .from('cellar_items')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get user cellar error:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'QUERY_ERROR', message: '查询酒窖失败' }
      });
    }

    // 获取商品信息
    const productIds = (items || []).map((item: any) => item.product_id).filter(Boolean);
    let products: any[] = [];

    if (productIds.length > 0) {
      const { data: productData } = await supabaseAdmin
        .from('products')
        .select('id, name, images, price')
        .in('id', productIds);
      products = productData || [];
    }

    const itemsWithProducts = (items || []).map((item: any) => ({
      ...item,
      product: products.find(p => p.id === item.product_id) || null
    }));

    res.json({
      success: true,
      data: itemsWithProducts
    });
  } catch (error) {
    console.error('Get user cellar error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '服务器错误' }
    });
  }
});

/**
 * GET /api/admin/users/:id/team
 * 用户团队（推荐关系）
 */
router.get('/users/:id/team', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 获取直接推荐的用户（一级）
    const { data: directMembers, error } = await supabaseAdmin
      .from('users')
      .select('id, name, phone, partner_level, created_at')
      .eq('referrer_id', id);

    if (error) {
      return res.status(500).json({
        success: false,
        error: { code: 'QUERY_ERROR', message: '查询团队失败' }
      });
    }

    // 获取每个直接成员的团队人数
    const directWithTeamSize = await Promise.all(
      (directMembers || []).map(async (member) => {
        const { count } = await supabaseAdmin
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('referrer_id', member.id);
        return { ...member, team_size: count || 0 };
      })
    );

    res.json({
      success: true,
      data: {
        direct: directWithTeamSize,
        directCount: directMembers?.length || 0
      }
    });
  } catch (error) {
    console.error('Get user team error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '服务器错误' }
    });
  }
});

/**
 * PUT /api/admin/users/:id/status
 * 更新用户状态
 */
router.put('/users/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const adminId = (req as any).user?.id;

    if (!isValidUserStatus(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: '无效的状态，应为 active 或 frozen'
        }
      });
    }

    // 先获取用户当前状态
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id, status, name')
      .eq('id', id)
      .single();

    if (fetchError || !existingUser) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: '用户不存在'
        }
      });
    }

    const oldStatus = existingUser.status;

    // 如果状态相同，无需更新
    if (oldStatus === status) {
      return res.json({
        success: true,
        message: '用户状态未改变'
      });
    }

    // 更新状态
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, status');

    if (updateError) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: '更新失败'
        }
      });
    }

    // 记录操作日志
    try {
      await supabaseAdmin
        .from('operation_logs')
        .insert({
          admin_id: adminId,
          action: 'UPDATE_USER_STATUS',
          target_type: 'user',
          target_id: id,
          details: {
            user_name: existingUser.name,
            old_status: oldStatus,
            new_status: status
          },
          created_at: new Date().toISOString()
        });
    } catch (logError) {
      // 日志记录失败不影响主操作
      console.error('Failed to log operation:', logError);
    }

    res.json({
      success: true,
      message: '更新成功',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '服务器错误'
      }
    });
  }
});

// ===========================================
// 合伙人管理
// ===========================================

/**
 * GET /api/admin/partners
 * 合伙人列表
 */
router.get('/partners', async (req: Request, res: Response) => {
  try {
    const { page = 1, pageSize = 20, keyword, level, status } = req.query;

    let query = supabaseAdmin
      .from('users')
      .select('id, name, phone, avatar, partner_level, is_partner, status, referrer_id, created_at, balance, personal_sales, team_sales', { count: 'exact' })
      .eq('is_partner', true);

    if (keyword) {
      const sanitizedKeyword = sanitizeLikePattern(keyword as string);
      query = query.or(`name.ilike.%${sanitizedKeyword}%,phone.ilike.%${sanitizedKeyword}%`);
    }
    if (level) {
      if (!isValidPartnerLevel(level as string)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_LEVEL',
            message: '无效的合伙人等级'
          }
        });
      }
      query = query.eq('partner_level', level);
    }
    if (status) {
      if (!isValidUserStatus(status as string)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: '无效的状态'
          }
        });
      }
      query = query.eq('status', status);
    }

    query = query.order('created_at', { ascending: false });

    // 分页
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize as string) || 20));
    const offset = (pageNum - 1) * pageSizeNum;

    query = query.range(offset, offset + pageSizeNum - 1);

    const { data: partners, error, count } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'QUERY_ERROR',
          message: '查询失败'
        }
      });
    }

    // 获取推荐人信息
    const referrerIds = partners?.filter(p => p.referrer_id).map(p => p.referrer_id) || [];
    let referrers: Record<string, { id: string; name: string; phone: string; partner_level: string }> = {};

    if (referrerIds.length > 0) {
      const { data: referrerUsers } = await supabaseAdmin
        .from('users')
        .select('id, name, phone, partner_level')
        .in('id', referrerIds);

      if (referrerUsers) {
        referrerUsers.forEach(r => {
          referrers[r.id] = r;
        });
      }
    }

    // 合并推荐人信息
    const enrichedPartners = partners?.map(p => ({
      ...p,
      referrer: p.referrer_id ? referrers[p.referrer_id] || null : null
    })) || [];

    res.json({
      success: true,
      data: {
        list: enrichedPartners,
        total: count || 0,
        page: pageNum,
        pageSize: pageSizeNum
      }
    });
  } catch (error) {
    console.error('Get partners error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '服务器错误'
      }
    });
  }
});

/**
 * GET /api/admin/partners/:id
 * 合伙人详情
 */
router.get('/partners/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 获取合伙人基本信息
    const { data: partner, error } = await supabaseAdmin
      .from('users')
      .select('id, name, phone, avatar, partner_level, is_partner, status, referrer_id, created_at, balance, personal_sales, team_sales')
      .eq('id', id)
      .eq('is_partner', true)
      .single();

    if (error || !partner) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PARTNER_NOT_FOUND',
          message: '合伙人不存在'
        }
      });
    }

    // 获取推荐人信息
    let referrer = null;
    if (partner.referrer_id) {
      const { data: referrerUser } = await supabaseAdmin
        .from('users')
        .select('id, name, phone, partner_level')
        .eq('id', partner.referrer_id)
        .single();
      if (referrerUser) {
        referrer = {
          id: referrerUser.id,
          name: referrerUser.name,
          phone: referrerUser.phone,
          level: referrerUser.partner_level
        };
      }
    }

    // 统计直推人数
    const { count: directCount } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_id', id);

    // 统计团队总人数 (包括间推)
    // 先获取直推用户，再统计他们的直推人数
    const { data: directUsers } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('referrer_id', id);

    let indirectCount = 0;
    if (directUsers && directUsers.length > 0) {
      const directIds = directUsers.map(u => u.id);
      const { count: indirect } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .in('referrer_id', directIds);
      indirectCount = indirect || 0;
    }

    // 累计佣金收益
    const { data: incomeRecords } = await supabaseAdmin
      .from('income_records')
      .select('amount')
      .eq('user_id', id)
      .eq('status', 'completed');

    const totalCommission = incomeRecords?.reduce((sum, r) => sum + r.amount, 0) || 0;

    // 已提现金额
    const { data: withdrawals } = await supabaseAdmin
      .from('withdrawals')
      .select('amount')
      .eq('user_id', id)
      .eq('status', 'success');

    const withdrawnAmount = withdrawals?.reduce((sum, w) => sum + w.amount, 0) || 0;

    // 获取合伙人申请记录 (最近一次)
    const { data: application } = await supabaseAdmin
      .from('partner_applications')
      .select('level, applied_at, reviewed_at')
      .eq('user_id', id)
      .eq('status', 'approved')
      .order('reviewed_at', { ascending: false })
      .limit(1)
      .single();

    res.json({
      success: true,
      data: {
        ...partner,
        referrer,
        teamSize: (directCount || 0) + indirectCount,
        directInvites: directCount || 0,
        indirectInvites: indirectCount,
        totalCommission,
        currentBalance: partner.balance || 0,
        withdrawnAmount,
        joinDate: application?.applied_at || partner.created_at,
        upgradeDate: application?.reviewed_at || null
      }
    });
  } catch (error) {
    console.error('Get partner detail error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '服务器错误'
      }
    });
  }
});

/**
 * GET /api/admin/partners/:id/team
 * 合伙人团队成员
 */
router.get('/partners/:id/team', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = 1, pageSize = 20, type } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize as string) || 20));
    const offset = (pageNum - 1) * pageSizeNum;

    let teamMembers: any[] = [];
    let total = 0;

    if (type === 'direct' || type === 'all') {
      // 直推成员
      const { data: directUsers, count: directCount } = await supabaseAdmin
        .from('users')
        .select('id, name, phone, partner_level, created_at, referrer_id', { count: 'exact' })
        .eq('referrer_id', id)
        .range(offset, offset + pageSizeNum - 1);

      if (directUsers) {
        // 获取每个直推成员贡献的佣金
        for (const user of directUsers) {
          const { data: orders } = await supabaseAdmin
            .from('orders')
            .select('paid_amount')
            .eq('user_id', user.id)
            .in('status', ['completed', 'shipped']);

          const contribution = orders?.reduce((sum, o) => sum + o.paid_amount, 0) || 0;
          teamMembers.push({
            ...user,
            type: '直推',
            contribution
          });
        }
        if (type === 'direct') total = directCount || 0;
      }
    }

    if (type === 'indirect' || type === 'all') {
      // 先获取直推用户ID
      const { data: directUsers } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('referrer_id', id);

      if (directUsers && directUsers.length > 0) {
        const directIds = directUsers.map(u => u.id);
        const { data: indirectUsers, count: indirectCount } = await supabaseAdmin
          .from('users')
          .select('id, name, phone, partner_level, created_at, referrer_id', { count: 'exact' })
          .in('referrer_id', directIds)
          .range(type === 'indirect' ? offset : 0, type === 'indirect' ? offset + pageSizeNum - 1 : pageSizeNum - 1);

        if (indirectUsers) {
          for (const user of indirectUsers) {
            const { data: orders } = await supabaseAdmin
              .from('orders')
              .select('paid_amount')
              .eq('user_id', user.id)
              .in('status', ['completed', 'shipped']);

            const contribution = orders?.reduce((sum, o) => sum + o.paid_amount, 0) || 0;
            teamMembers.push({
              ...user,
              type: '间推',
              contribution
            });
          }
          if (type === 'indirect') total = indirectCount || 0;
        }
      }
    }

    if (type === 'all') {
      // 计算总数
      const { count: directCount } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('referrer_id', id);

      const { data: directUsers } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('referrer_id', id);

      let indirectCount = 0;
      if (directUsers && directUsers.length > 0) {
        const directIds = directUsers.map(u => u.id);
        const { count } = await supabaseAdmin
          .from('users')
          .select('*', { count: 'exact', head: true })
          .in('referrer_id', directIds);
        indirectCount = count || 0;
      }

      total = (directCount || 0) + indirectCount;
    }

    res.json({
      success: true,
      data: {
        list: teamMembers,
        total,
        page: pageNum,
        pageSize: pageSizeNum
      }
    });
  } catch (error) {
    console.error('Get partner team error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '服务器错误'
      }
    });
  }
});

/**
 * GET /api/admin/partners/:id/income
 * 合伙人佣金明细
 */
router.get('/partners/:id/income', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = 1, pageSize = 20, type } = req.query;

    let query = supabaseAdmin
      .from('income_records')
      .select('*', { count: 'exact' })
      .eq('user_id', id);

    if (type) {
      query = query.eq('type', type);
    }

    query = query.order('created_at', { ascending: false });

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize as string) || 20));
    const offset = (pageNum - 1) * pageSizeNum;

    query = query.range(offset, offset + pageSizeNum - 1);

    const { data: records, error, count } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'QUERY_ERROR',
          message: '查询失败'
        }
      });
    }

    // 补充订单和购买用户信息
    const enrichedRecords = await Promise.all((records || []).map(async (record) => {
      if (record.order_id) {
        const { data: order } = await supabaseAdmin
          .from('orders')
          .select('id, paid_amount, user_id')
          .eq('id', record.order_id)
          .single();

        if (order) {
          const { data: buyer } = await supabaseAdmin
            .from('users')
            .select('name, phone')
            .eq('id', order.user_id)
            .single();

          return {
            ...record,
            orderAmount: order.paid_amount,
            buyerName: buyer?.name || '未知',
            buyerPhone: buyer?.phone || ''
          };
        }
      }
      return record;
    }));

    res.json({
      success: true,
      data: {
        list: enrichedRecords,
        total: count || 0,
        page: pageNum,
        pageSize: pageSizeNum
      }
    });
  } catch (error) {
    console.error('Get partner income error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '服务器错误'
      }
    });
  }
});

/**
 * GET /api/admin/partner-applications
 * 合伙人申请列表
 */
router.get('/partner-applications', async (req: Request, res: Response) => {
  try {
    const { page = 1, pageSize = 20, status } = req.query;

    let query = supabaseAdmin
      .from('partner_applications')
      .select('*', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('applied_at', { ascending: false });

    // 分页
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize as string) || 20));
    const offset = (pageNum - 1) * pageSizeNum;

    query = query.range(offset, offset + pageSizeNum - 1);

    const { data: applications, error, count } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'QUERY_ERROR',
          message: '查询失败'
        }
      });
    }

    res.json({
      success: true,
      data: {
        list: applications || [],
        total: count || 0,
        page: pageNum,
        pageSize: pageSizeNum
      }
    });
  } catch (error) {
    console.error('Get partner applications error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '服务器错误'
      }
    });
  }
});

/**
 * PUT /api/admin/partner-applications/:id/review
 * 审核合伙人申请
 */
router.put('/partner-applications/:id/review', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: '无效的状态'
        }
      });
    }

    // 获取申请信息
    const { data: application } = await supabaseAdmin
      .from('partner_applications')
      .select('*')
      .eq('id', id)
      .single();

    if (!application) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'APPLICATION_NOT_FOUND',
          message: '申请不存在'
        }
      });
    }

    // 幂等性检查：防止重复审核
    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_REVIEWED',
          message: `该申请已审核，当前状态: ${application.status}`
        }
      });
    }

    // 验证合伙人等级
    if (status === 'approved' && !isValidPartnerLevel(application.level)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_LEVEL',
          message: '无效的合伙人等级'
        }
      });
    }

    const now = new Date().toISOString();

    // 更新申请状态
    const { error: updateError } = await supabaseAdmin
      .from('partner_applications')
      .update({
        status,
        note,
        reviewed_at: now
      })
      .eq('id', id);

    if (updateError) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: '审核失败'
        }
      });
    }

    // 如果通过，更新用户为合伙人
    if (status === 'approved') {
      await supabaseAdmin
        .from('users')
        .update({
          is_partner: true,
          partner_level: application.level
        })
        .eq('id', application.user_id);
    }

    // 记录操作日志
    const adminUser = (req as any).user;
    await supabaseAdmin
      .from('operation_logs')
      .insert({
        admin_id: adminUser?.id || 'unknown',
        action: 'review_partner_application',
        target_type: 'partner_application',
        target_id: id,
        details: {
          status,
          note,
          user_id: application.user_id,
          level: application.level
        },
        created_at: now
      });

    res.json({
      success: true,
      message: status === 'approved' ? '已通过审核' : '已拒绝申请'
    });
  } catch (error) {
    console.error('Review partner application error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '服务器错误'
      }
    });
  }
});

// ===========================================
// 财务管理
// ===========================================

/**
 * GET /api/admin/finance/stats
 * 财务统计数据
 */
router.get('/finance/stats', async (req: Request, res: Response) => {
  try {
    // 平台总收入 (已完成订单的实付金额)
    const { data: completedOrders } = await supabaseAdmin
      .from('orders')
      .select('paid_amount')
      .in('status', ['completed', 'shipped']);

    const totalRevenue = completedOrders?.reduce((sum, order) => sum + order.paid_amount, 0) || 0;

    // 累计产生佣金 (income_records 中已完成的金额)
    const { data: incomeRecords } = await supabaseAdmin
      .from('income_records')
      .select('amount')
      .eq('status', 'completed');

    const totalCommission = incomeRecords?.reduce((sum, record) => sum + record.amount, 0) || 0;

    // 待审核提现金额
    const { data: pendingWithdrawals } = await supabaseAdmin
      .from('withdrawals')
      .select('amount')
      .eq('status', 'pending');

    const pendingWithdrawalAmount = pendingWithdrawals?.reduce((sum, w) => sum + w.amount, 0) || 0;

    // 已打款金额
    const { data: successWithdrawals } = await supabaseAdmin
      .from('withdrawals')
      .select('amount')
      .eq('status', 'success');

    const withdrawnAmount = successWithdrawals?.reduce((sum, w) => sum + w.amount, 0) || 0;

    res.json({
      success: true,
      data: {
        total_revenue: totalRevenue,
        total_commission: totalCommission,
        pending_withdrawal: pendingWithdrawalAmount,
        withdrawn_amount: withdrawnAmount
      }
    });
  } catch (error) {
    console.error('Get finance stats error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '服务器错误'
      }
    });
  }
});

/**
 * GET /api/admin/transactions
 * 交易流水 (订单收入 + 退款)
 */
router.get('/transactions', async (req: Request, res: Response) => {
  try {
    const { page = 1, pageSize = 20, type, start_date, end_date, keyword } = req.query;

    let query = supabaseAdmin
      .from('orders')
      .select('id, order_no, paid_amount, payment_method, status, created_at, type', { count: 'exact' });

    // 筛选类型：income（订单收入）或 expense（退款）
    if (type === 'income') {
      query = query.in('status', ['completed', 'shipped', 'pending_shipment']);
    } else if (type === 'expense') {
      query = query.eq('status', 'refunded');
    }

    if (start_date) {
      query = query.gte('created_at', start_date);
    }
    if (end_date) {
      query = query.lte('created_at', end_date);
    }
    if (keyword) {
      query = query.ilike('order_no', `%${keyword}%`);
    }

    query = query.order('created_at', { ascending: false });

    // 分页
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize as string) || 20));
    const offset = (pageNum - 1) * pageSizeNum;

    query = query.range(offset, offset + pageSizeNum - 1);

    const { data: orders, error, count } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'QUERY_ERROR',
          message: '查询失败'
        }
      });
    }

    // 转换为交易流水格式
    const transactions = orders?.map(order => ({
      id: `TRX-${order.id.slice(0, 8)}`,
      order_id: order.id,
      order_no: order.order_no,
      type: order.status === 'refunded' ? '退款支出' : '订单收入',
      amount: order.status === 'refunded' ? -order.paid_amount : order.paid_amount,
      payment_method: order.payment_method || '未知',
      status: 'success',
      created_at: order.created_at
    })) || [];

    res.json({
      success: true,
      data: {
        list: transactions,
        total: count || 0,
        page: pageNum,
        pageSize: pageSizeNum
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '服务器错误'
      }
    });
  }
});

/**
 * GET /api/admin/withdrawals
 * 提现列表
 */
router.get('/withdrawals', async (req: Request, res: Response) => {
  try {
    const { page = 1, pageSize = 20, status, keyword } = req.query;

    let query = supabaseAdmin
      .from('withdrawals')
      .select('*, user:users(id, name, phone, avatar)', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }
    if (keyword) {
      const sanitizedKeyword = sanitizeLikePattern(keyword as string);
      query = query.or(`withdrawal_no.ilike.%${sanitizedKeyword}%`);
    }

    query = query.order('created_at', { ascending: false });

    // 分页
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize as string) || 20));
    const offset = (pageNum - 1) * pageSizeNum;

    query = query.range(offset, offset + pageSizeNum - 1);

    const { data: withdrawals, error, count } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'QUERY_ERROR',
          message: '查询失败'
        }
      });
    }

    res.json({
      success: true,
      data: {
        list: withdrawals || [],
        total: count || 0,
        page: pageNum,
        pageSize: pageSizeNum
      }
    });
  } catch (error) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '服务器错误'
      }
    });
  }
});

/**
 * PUT /api/admin/withdrawals/:id/process
 * 处理提现
 */
router.put('/withdrawals/:id/process', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!['success', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: '无效的状态'
        }
      });
    }

    // 获取提现信息
    const { data: withdrawal } = await supabaseAdmin
      .from('withdrawals')
      .select('*')
      .eq('id', id)
      .single();

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'WITHDRAWAL_NOT_FOUND',
          message: '提现记录不存在'
        }
      });
    }

    // 幂等性检查：防止重复处理
    if (withdrawal.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_PROCESSED',
          message: `该提现申请已处理，当前状态: ${withdrawal.status}`
        }
      });
    }

    const now = new Date().toISOString();

    // 如果拒绝，先退还余额（使用数据库原子函数）
    if (status === 'rejected') {
      const { data: balanceResult, error: balanceError } = await supabaseAdmin
        .rpc('increment_user_balance', {
          user_id: withdrawal.user_id,
          amount: withdrawal.amount
        });

      if (balanceError || !balanceResult?.success) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'BALANCE_UPDATE_FAILED',
            message: balanceResult?.message || '退还余额失败，请重试'
          }
        });
      }
    }

    // 更新提现状态
    const { error: updateError } = await supabaseAdmin
      .from('withdrawals')
      .update({
        status,
        reason,
        processed_at: now
      })
      .eq('id', id);

    if (updateError) {
      // 如果状态更新失败，需要回滚余额（如果是拒绝操作）
      if (status === 'rejected') {
        await supabaseAdmin.rpc('decrease_user_balance', {
          p_user_id: withdrawal.user_id,
          p_amount: withdrawal.amount
        });
      }
      return res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: '处理失败'
        }
      });
    }

    // 记录操作日志
    const adminUser = (req as any).user;
    await supabaseAdmin
      .from('operation_logs')
      .insert({
        admin_id: adminUser?.id || 'unknown',
        action: 'process_withdrawal',
        target_type: 'withdrawal',
        target_id: id,
        details: {
          status,
          reason,
          amount: withdrawal.amount,
          user_id: withdrawal.user_id
        },
        created_at: now
      });

    res.json({
      success: true,
      message: status === 'success' ? '已打款' : '已拒绝'
    });
  } catch (error) {
    console.error('Process withdrawal error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '服务器错误'
      }
    });
  }
});

// ===========================================
// 分类管理
// ===========================================

/**
 * GET /api/admin/withdrawal-settings
 * 获取提现规则配置
 */
router.get('/withdrawal-settings', async (req: Request, res: Response) => {
  try {
    const { data: settings } = await supabaseAdmin
      .from('settings')
      .select('key, value')
      .like('key', 'withdrawal_%');

    const config: Record<string, any> = {
      min_amount: 10,
      max_amount: 50000,
      max_daily_count: 5,
      fee_rate: 0.003,
      daily_limit: 100000,
      audit_enabled: true
    };

    settings?.forEach(s => {
      const key = s.key.replace('withdrawal_', '');
      if (key === 'fee_rate') {
        config[key] = parseFloat(s.value);
      } else if (key === 'audit_enabled') {
        config[key] = s.value === 'true';
      } else if (key === 'daily_limit' || key === 'min_amount' || key === 'max_amount' || key === 'max_daily_count') {
        config[key] = parseInt(s.value);
      } else {
        config[key] = s.value;
      }
    });

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Get withdrawal settings error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '服务器错误'
      }
    });
  }
});

/**
 * PUT /api/admin/withdrawal-settings
 * 更新提现规则配置
 */
router.put('/withdrawal-settings', async (req: Request, res: Response) => {
  try {
    const { min_amount, max_amount, max_daily_count, fee_rate, daily_limit, audit_enabled } = req.body;

    const settings = [
      { key: 'withdrawal_min_amount', value: String(min_amount || 10) },
      { key: 'withdrawal_max_amount', value: String(max_amount || 50000) },
      { key: 'withdrawal_max_daily_count', value: String(max_daily_count || 5) },
      { key: 'withdrawal_fee_rate', value: String(fee_rate || 0.003) },
      { key: 'withdrawal_daily_limit', value: String(daily_limit || 100000) },
      { key: 'withdrawal_audit_enabled', value: String(audit_enabled !== false) },
    ];

    for (const setting of settings) {
      await supabaseAdmin
        .from('settings')
        .upsert({ key: setting.key, value: setting.value }, { onConflict: 'key' });
    }

    // 记录操作日志
    const adminUser = (req as any).user;
    await supabaseAdmin
      .from('operation_logs')
      .insert({
        admin_id: adminUser?.id || 'unknown',
        action: 'update_withdrawal_settings',
        target_type: 'settings',
        target_id: 'withdrawal',
        details: { settings },
        created_at: new Date().toISOString()
      });

    res.json({
      success: true,
      message: '配置已更新'
    });
  } catch (error) {
    console.error('Update withdrawal settings error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '服务器错误'
      }
    });
  }
});

/**
 * GET /api/admin/categories
 * 分类列表
 */
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const { data: categories, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'QUERY_ERROR',
          message: '查询失败'
        }
      });
    }

    // 构建树形结构
    const categoryMap = new Map();
    const tree: any[] = [];

    categories?.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    categories?.forEach(cat => {
      const node = categoryMap.get(cat.id);
      if (cat.parent_id && categoryMap.has(cat.parent_id)) {
        categoryMap.get(cat.parent_id).children.push(node);
      } else if (!cat.parent_id) {
        tree.push(node);
      }
    });

    res.json({
      success: true,
      data: tree
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '服务器错误'
      }
    });
  }
});

/**
 * POST /api/admin/categories
 * 创建分类
 */
router.post('/categories', async (req: Request, res: Response) => {
  try {
    const { name, parent_id, sort_order } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMS',
          message: '分类名称不能为空'
        }
      });
    }

    const { data: category, error } = await supabaseAdmin
      .from('categories')
      .insert({
        name,
        parent_id,
        sort_order: sort_order || 0
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'INSERT_ERROR',
          message: '创建失败'
        }
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '服务器错误'
      }
    });
  }
});

/**
 * PUT /api/admin/categories/:id
 * 更新分类
 */
router.put('/categories/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, parent_id, sort_order } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMS',
          message: '分类名称不能为空'
        }
      });
    }

    const { data: category, error } = await supabaseAdmin
      .from('categories')
      .update({
        name: name.trim(),
        parent_id: parent_id || null,
        sort_order: sort_order || 1
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update category error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: '更新失败'
        }
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '服务器错误'
      }
    });
  }
});

/**
 * DELETE /api/admin/categories/:id
 * 删除分类
 */
router.delete('/categories/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 检查是否有子分类
    const { data: children, error: checkError } = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('parent_id', id);

    if (checkError) {
      console.error('Check children error:', checkError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: '服务器错误'
        }
      });
    }

    if (children && children.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'HAS_CHILDREN',
          message: '该分类下有子分类，无法删除'
        }
      });
    }

    // 检查是否有商品使用该分类
    const { data: products, error: productError } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('category_id', id);

    if (productError) {
      console.error('Check products error:', productError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: '服务器错误'
        }
      });
    }

    if (products && products.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'HAS_PRODUCTS',
          message: '该分类下有商品，无法删除'
        }
      });
    }

    const { error } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete category error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: '删除失败'
        }
      });
    }

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '服务器错误'
      }
    });
  }
});

// ===========================================
// 酒窖管理
// ===========================================

/**
 * GET /api/admin/cellar
 * 所有用户酒窖列表（管理员查看）
 */
router.get('/cellar', async (req: Request, res: Response) => {
  try {
    const { page = 1, pageSize = 20, keyword, user_id } = req.query;

    // UUID验证
    if (user_id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user_id as string)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_USER_ID',
          message: '无效的用户ID格式'
        }
      });
    }

    let query = supabaseAdmin
      .from('cellar_items')
      .select('*, user:users(id, name, phone), product:products(id, name, images)', { count: 'exact' });

    if (user_id) {
      query = query.eq('user_id', user_id);
    }
    if (keyword) {
      const sanitizedKeyword = sanitizeLikePattern(keyword as string);
      query = query.ilike('product_name', `%${sanitizedKeyword}%`);
    }

    query = query.order('created_at', { ascending: false });

    // 分页
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize as string) || 20));
    const offset = (pageNum - 1) * pageSizeNum;

    query = query.range(offset, offset + pageSizeNum - 1);

    const { data: items, error, count } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'QUERY_ERROR',
          message: '查询失败'
        }
      });
    }

    // 使用数据库聚合函数获取统计数据（高效）
    const { data: statsResult, error: statsError } = await supabaseAdmin.rpc('get_cellar_stats');

    let stats = {
      total_quantity: 0,
      total_value: 0,
      distinct_products: 0
    };

    if (!statsError && statsResult) {
      stats = statsResult;
    }

    res.json({
      success: true,
      data: {
        list: items || [],
        total: count || 0,
        stats,
        page: pageNum,
        pageSize: pageSizeNum
      }
    });
  } catch (error) {
    console.error('Get cellar items error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '服务器错误'
      }
    });
  }
});

/**
 * DELETE /api/admin/cellar/:id
 * 删除酒窖记录
 */
router.delete('/cellar/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // UUID格式验证
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: '无效的ID格式'
        }
      });
    }

    // 先查询记录是否存在
    const { data: existingItem, error: fetchError } = await supabaseAdmin
      .from('cellar_items')
      .select('id, product_name, user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingItem) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ITEM_NOT_FOUND',
          message: '酒窖记录不存在'
        }
      });
    }

    // 删除记录
    const { error: deleteError } = await supabaseAdmin
      .from('cellar_items')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: '删除失败'
        }
      });
    }

    // 记录操作日志
    await supabaseAdmin
      .from('operation_logs')
      .insert({
        operator_id: req.user!.id,
        type: 'cellar_item_delete',
        detail: `删除酒窖记录: ${existingItem.product_name || '未知商品'}`,
        target_id: id,
        metadata: {
          user_id: existingItem.user_id,
          product_name: existingItem.product_name
        }
      });

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('Delete cellar item error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '服务器错误'
      }
    });
  }
});

// ===========================================
// 分销管理
// ===========================================

/**
 * GET /api/admin/income-records
 * 收益记录列表
 */
router.get('/income-records', async (req: Request, res: Response) => {
  try {
    const { page = 1, pageSize = 20, type, status, start_date, end_date, keyword } = req.query;

    let query = supabaseAdmin
      .from('income_records')
      .select('*, user:users(id, name, phone, avatar)', { count: 'exact' });

    if (type) {
      query = query.eq('type', type);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (start_date) {
      if (!isValidDateFormat(start_date as string)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_DATE_FORMAT',
            message: '日期格式应为 YYYY-MM-DD'
          }
        });
      }
      query = query.gte('created_at', start_date);
    }
    if (end_date) {
      if (!isValidDateFormat(end_date as string)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_DATE_FORMAT',
            message: '日期格式应为 YYYY-MM-DD'
          }
        });
      }
      query = query.lte('created_at', end_date);
    }
    if (keyword) {
      const sanitizedKeyword = sanitizeLikePattern(keyword as string);
      query = query.or(`user_id.ilike.%${sanitizedKeyword}%`);
    }

    query = query.order('created_at', { ascending: false });

    // 分页
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize as string) || 20));
    const offset = (pageNum - 1) * pageSizeNum;

    query = query.range(offset, offset + pageSizeNum - 1);

    const { data: records, error, count } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'QUERY_ERROR',
          message: '查询失败'
        }
      });
    }

    res.json({
      success: true,
      data: {
        list: records || [],
        total: count || 0,
        page: pageNum,
        pageSize: pageSizeNum
      }
    });
  } catch (error) {
    console.error('Get income records error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '服务器错误'
      }
    });
  }
});

/**
 * GET /api/admin/sales-leaderboard
 * 销售龙虎榜
 */
router.get('/sales-leaderboard', async (req: Request, res: Response) => {
  try {
    const { period = 'month', limit = 50 } = req.query;

    // 根据 period 计算日期范围
    const now = new Date();
    let startDate: Date | null = null;

    switch (period as string) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        startDate = null; // 不限制日期
    }

    // 获取合伙人销售数据
    const { data: partners } = await supabaseAdmin
      .from('users')
      .select('id, name, phone, partner_level, team_sales, personal_sales')
      .eq('is_partner', true)
      .order('team_sales', { ascending: false })
      .limit(parseInt(limit as string) || 50);

    // 获取每个合伙人的累计收益（根据 period 过滤）
    let earningsQuery = supabaseAdmin
      .from('income_records')
      .select('user_id, amount')
      .eq('status', 'completed');

    if (startDate) {
      earningsQuery = earningsQuery.gte('created_at', startDate.toISOString());
    }

    const { data: earnings } = await earningsQuery;

    const earningsMap: Record<string, number> = {};
    earnings?.forEach(e => {
      earningsMap[e.user_id] = (earningsMap[e.user_id] || 0) + e.amount;
    });

    // 组合数据
    const leaderboard = partners?.map((partner, index) => ({
      rank: index + 1,
      id: partner.id,
      name: partner.name,
      phone: partner.phone,
      level: partner.partner_level,
      team_sales: partner.team_sales || 0,
      personal_sales: partner.personal_sales || 0,
      total_earnings: earningsMap[partner.id] || 0
    })) || [];

    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    console.error('Get sales leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '服务器错误'
      }
    });
  }
});

/**
 * GET /api/admin/distribution-settings
 * 分销规则配置
 */
router.get('/distribution-settings', async (req: Request, res: Response) => {
  try {
    const { data: settings } = await supabaseAdmin
      .from('settings')
      .select('key, value')
      .like('key', 'partner_%');

    const config: Record<string, any> = {};
    settings?.forEach(s => {
      config[s.key] = s.value;
    });

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Get distribution settings error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '服务器错误'
      }
    });
  }
});

/**
 * PUT /api/admin/distribution-settings
 * 更新分销规则配置
 */
router.put('/distribution-settings', async (req: Request, res: Response) => {
  try {
    const { settings } = req.body;

    if (!settings || !Array.isArray(settings)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMS',
          message: '配置数据格式错误'
        }
      });
    }

    // 批量更新配置
    for (const setting of settings) {
      await supabaseAdmin
        .from('settings')
        .upsert({ key: setting.key, value: setting.value }, { onConflict: 'key' });
    }

    res.json({
      success: true,
      message: '配置已更新'
    });
  } catch (error) {
    console.error('Update distribution settings error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '服务器错误'
      }
    });
  }
});

// ===========================================
// 排行榜配置
// ===========================================

// 排行榜奖励验证函数
interface RankReward {
  rank_start: number;
  rank_end: number;
  reward: string;
  reward_type: 'cash' | 'coupon' | 'points';
  reward_value: number;
}

const VALID_REWARD_TYPES = ['cash', 'coupon', 'points'];
const MAX_REWARD_VALUE = 1000000;
const MAX_REWARD_NAME_LENGTH = 100;

const validateRewards = (rewards: any[], fieldName: string): string | null => {
  if (!Array.isArray(rewards)) return `${fieldName} 必须是数组`;
  if (rewards.length > 50) return `${fieldName} 最多支持50个档位`;

  for (let i = 0; i < rewards.length; i++) {
    const r = rewards[i];
    if (typeof r.rank_start !== 'number' || r.rank_start < 1 || r.rank_start > 10000)
      return `${fieldName}[${i}] 排名起始值无效(1-10000)`;
    if (typeof r.rank_end !== 'number' || r.rank_end < r.rank_start || r.rank_end > 10000)
      return `${fieldName}[${i}] 排名结束值无效`;
    if (typeof r.reward !== 'string' || r.reward.length > MAX_REWARD_NAME_LENGTH)
      return `${fieldName}[${i}] 奖励名称无效(最多${MAX_REWARD_NAME_LENGTH}字符)`;
    if (!VALID_REWARD_TYPES.includes(r.reward_type))
      return `${fieldName}[${i}] 奖励类型无效(仅支持cash/coupon/points)`;
    if (typeof r.reward_value !== 'number' || r.reward_value < 0)
      return `${fieldName}[${i}] 奖励值不能为负数`;
    if (r.reward_value > MAX_REWARD_VALUE)
      return `${fieldName}[${i}] 奖励值超出限制(最大${MAX_REWARD_VALUE})`;
  }
  return null;
};

const validatePeriodWeights = (weights: any): string | null => {
  if (!weights || typeof weights !== 'object') return '周期权重格式错误';
  const validKeys = ['week', 'month', 'year'];
  for (const key of Object.keys(weights)) {
    if (!validKeys.includes(key)) return `无效的周期类型: ${key}`;
    const config = weights[key];
    if (typeof config.enabled !== 'boolean') return `${key}.enabled 必须是布尔值`;
    if (typeof config.weight !== 'number' || config.weight < 0 || config.weight > 100)
      return `${key}.weight 权重值无效(0-100)`;
  }
  return null;
};

const validateDisplaySettings = (settings: any): string | null => {
  if (!settings || typeof settings !== 'object') return '显示设置格式错误';
  if (typeof settings.show_real_name !== 'boolean') return 'show_real_name 必须是布尔值';
  if (typeof settings.show_sales_amount !== 'boolean') return 'show_sales_amount 必须是布尔值';
  if (typeof settings.show_income_amount !== 'boolean') return 'show_income_amount 必须是布尔值';
  if (typeof settings.top_count !== 'number' || settings.top_count < 1 || settings.top_count > 100)
    return 'top_count 无效(1-100)';
  if (!['realtime', 'hourly', 'daily'].includes(settings.update_frequency))
    return 'update_frequency 无效(仅支持realtime/hourly/daily)';
  return null;
};

const sanitizeRewards = (rewards: RankReward[]): RankReward[] => {
  return rewards.map(r => ({
    ...r,
    reward: escapeHtml(r.reward.slice(0, MAX_REWARD_NAME_LENGTH))
  }));
};

/**
 * GET /api/admin/leaderboard-settings
 * 获取排行榜配置
 */
router.get('/leaderboard-settings', async (req: Request, res: Response) => {
  try {
    const { data: settings } = await supabaseAdmin
      .from('settings')
      .select('key, value')
      .like('key', 'leaderboard_%');

    const config: Record<string, any> = {
      sales_rewards: [
        { rank_start: 1, rank_end: 1, reward: '月度销售冠军', reward_type: 'cash', reward_value: 1000 },
        { rank_start: 2, rank_end: 2, reward: '月度销售亚军', reward_type: 'cash', reward_value: 500 },
        { rank_start: 3, rank_end: 3, reward: '月度销售季军', reward_type: 'cash', reward_value: 300 },
        { rank_start: 4, rank_end: 10, reward: '月度销售前十', reward_type: 'coupon', reward_value: 100 },
        { rank_start: 11, rank_end: 50, reward: '月度销售前五十', reward_type: 'points', reward_value: 50 },
      ],
      income_rewards: [
        { rank_start: 1, rank_end: 1, reward: '月度收益冠军', reward_type: 'cash', reward_value: 800 },
        { rank_start: 2, rank_end: 2, reward: '月度收益亚军', reward_type: 'cash', reward_value: 400 },
        { rank_start: 3, rank_end: 3, reward: '月度收益季军', reward_type: 'cash', reward_value: 200 },
        { rank_start: 4, rank_end: 10, reward: '月度收益前十', reward_type: 'coupon', reward_value: 80 },
      ],
      period_weights: {
        week: { enabled: true, label: '周榜', weight: 0.3 },
        month: { enabled: true, label: '月榜', weight: 1.0 },
        year: { enabled: true, label: '年榜', weight: 3.0 },
      },
      display_settings: {
        show_real_name: false,
        show_sales_amount: true,
        show_income_amount: true,
        top_count: 10,
        update_frequency: 'daily',
      }
    };

    // 覆盖数据库中的配置
    settings?.forEach(s => {
      try {
        const key = s.key.replace('leaderboard_', '');
        config[key] = JSON.parse(s.value);
      } catch (parseError) {
        console.error(`Failed to parse leaderboard setting ${s.key}:`, parseError);
        // 使用默认值
      }
    });

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Get leaderboard settings error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '服务器错误'
      }
    });
  }
});

/**
 * PUT /api/admin/leaderboard-settings
 * 更新排行榜配置
 */
router.put('/leaderboard-settings', async (req: Request, res: Response) => {
  try {
    const { sales_rewards, income_rewards, period_weights, display_settings } = req.body;

    // 输入验证
    if (sales_rewards) {
      const err = validateRewards(sales_rewards, '销售榜奖励');
      if (err) return res.status(400).json({ success: false, error: { code: 'INVALID_DATA', message: err } });
    }
    if (income_rewards) {
      const err = validateRewards(income_rewards, '收益榜奖励');
      if (err) return res.status(400).json({ success: false, error: { code: 'INVALID_DATA', message: err } });
    }
    if (period_weights) {
      const err = validatePeriodWeights(period_weights);
      if (err) return res.status(400).json({ success: false, error: { code: 'INVALID_DATA', message: err } });
    }
    if (display_settings) {
      const err = validateDisplaySettings(display_settings);
      if (err) return res.status(400).json({ success: false, error: { code: 'INVALID_DATA', message: err } });
    }

    // XSS处理
    const sanitizedSalesRewards = sales_rewards ? sanitizeRewards(sales_rewards) : undefined;
    const sanitizedIncomeRewards = income_rewards ? sanitizeRewards(income_rewards) : undefined;

    const updates: Array<{ key: string; value: string }> = [];

    if (sanitizedSalesRewards) {
      updates.push({ key: 'leaderboard_sales_rewards', value: JSON.stringify(sanitizedSalesRewards) });
    }
    if (sanitizedIncomeRewards) {
      updates.push({ key: 'leaderboard_income_rewards', value: JSON.stringify(sanitizedIncomeRewards) });
    }
    if (period_weights) {
      updates.push({ key: 'leaderboard_period_weights', value: JSON.stringify(period_weights) });
    }
    if (display_settings) {
      updates.push({ key: 'leaderboard_display_settings', value: JSON.stringify(display_settings) });
    }

    // 批量原子操作（修复竞态条件）
    if (updates.length > 0) {
      const records = updates.map(u => ({ key: u.key, value: u.value }));
      const { error } = await supabaseAdmin
        .from('settings')
        .upsert(records, { onConflict: 'key' });

      if (error) {
        console.error('Batch upsert leaderboard settings error:', error);
        return res.status(500).json({
          success: false,
          error: { code: 'DB_ERROR', message: '配置保存失败' }
        });
      }
    }

    // 记录操作日志
    const adminUser = (req as any).user;
    await supabaseAdmin
      .from('operation_logs')
      .insert({
        operator_id: adminUser?.id || 'unknown',
        type: 'update_leaderboard_settings',
        target_type: 'settings',
        target_id: 'leaderboard',
        detail: JSON.stringify({
          sales_rewards_count: sanitizedSalesRewards?.length || 0,
          income_rewards_count: sanitizedIncomeRewards?.length || 0,
          period_weights_keys: period_weights ? Object.keys(period_weights) : [],
          display_settings_updated: !!display_settings
        }),
        created_at: new Date().toISOString()
      });

    res.json({
      success: true,
      message: '排行榜配置已保存'
    });
  } catch (error) {
    console.error('Update leaderboard settings error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '服务器错误'
      }
    });
  }
});

// ===========================================
// 系统设置
// ===========================================

/**
 * GET /api/admin/admins
 * 获取管理员列表
 */
router.get('/admins', async (req: Request, res: Response) => {
  try {
    // 从环境变量获取管理员手机号列表
    const adminPhones = process.env.ADMIN_PHONES?.split(',').map(p => p.trim()) || [];

    if (adminPhones.length === 0) {
      return res.json({
        success: true,
        data: { list: [], total: 0 }
      });
    }

    // 查询管理员用户信息
    const { data: admins, error } = await supabaseAdmin
      .from('users')
      .select('id, phone, name, status, created_at, updated_at')
      .in('phone', adminPhones);

    if (error) {
      console.error('Get admins error:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'DATABASE_ERROR', message: '查询管理员失败' }
      });
    }

    const formattedAdmins = (admins || []).map(admin => ({
      id: admin.id,
      phone: admin.phone,
      name: admin.name || '管理员',
      role: 'admin',
      last_login: admin.updated_at ? new Date(admin.updated_at).toLocaleString('zh-CN') : '-',
      status: admin.status || 'active'
    }));

    res.json({
      success: true,
      data: { list: formattedAdmins, total: formattedAdmins.length }
    });
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '服务器错误' }
    });
  }
});

/**
 * GET /api/admin/settings
 * 获取系统设置
 */
router.get('/settings', async (req: Request, res: Response) => {
  try {
    const { data: settings } = await supabaseAdmin
      .from('settings')
      .select('key, value');

    const config: Record<string, any> = {
      site_name: '名酒佳酿合伙人商城',
      customer_service_phone: '400-123-4567',
      site_logo: '',
      site_description: '专注于高端白酒、红酒及养生酒的社交电商平台。',
      copyright: '© 2026 名酒佳酿 版权所有',
      wechat_appid: '',
      wechat_appsecret: '',
    };

    settings?.forEach(s => {
      config[s.key] = s.value;
    });

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '服务器错误'
      }
    });
  }
});

/**
 * PUT /api/admin/settings
 * 更新系统设置
 */
router.put('/settings', async (req: Request, res: Response) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: '未授权' }
      });
    }

    const settings = req.body;

    // 允许的设置键名白名单
    const ALLOWED_SETTINGS_KEYS = [
      'site_name', 'customer_service_phone', 'site_logo', 'site_description', 'copyright',
      'wechat_appid', 'wechat_appsecret',
      'partner_pool_period', 'partner_pool_algorithm',
      'withdrawal_min_amount', 'withdrawal_max_amount', 'withdrawal_max_daily_count',
      'withdrawal_fee_rate', 'withdrawal_daily_limit', 'withdrawal_audit_enabled',
      'partner_commission_junior', 'partner_commission_middle', 'partner_commission_senior',
      'partner_referral_reward', 'partner_sales_commission_rate',
      'partner_one_star_direct', 'partner_two_star_direct_one', 'partner_two_star_direct',
      'partner_pool_inject_amount',
      // 支付配置
      'wechat_pay_mchid', 'wechat_pay_api_key', 'wechat_pay_enabled',
      'alipay_appid', 'alipay_private_key', 'alipay_enabled',
      // 消息模板配置
      'msg_template_income', 'msg_template_upgrade', 'msg_template_withdraw',
      'msg_template_order', 'msg_template_income_enabled', 'msg_template_upgrade_enabled',
      'msg_template_withdraw_enabled', 'msg_template_order_enabled',
      // 反作弊设置
      'anticheat_ip_limit_enabled', 'anticheat_ip_limit_minutes', 'anticheat_ip_limit_count',
      'anticheat_device_limit_enabled', 'anticheat_device_limit_count'
    ];

    // XSS 防护函数
    const escapeHtml = (str: string): string => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    // 验证和清理每个设置项
    const validSettings: Record<string, string> = {};
    const changedKeys: string[] = [];

    for (const [key, value] of Object.entries(settings)) {
      // 白名单检查
      if (!ALLOWED_SETTINGS_KEYS.includes(key)) {
        continue; // 跳过不允许的键
      }

      // 类型检查
      if (value === null || value === undefined) {
        continue;
      }

      let sanitizedValue: string;

      // 根据键类型进行不同验证
      if (key.includes('_enabled') || key.includes('_rate')) {
        // 布尔值或小数值
        sanitizedValue = String(value);
      } else if (key.includes('_amount') || key.includes('_count') || key.includes('_minutes') ||
                 key.includes('_reward') || key.includes('_rate') || key.includes('_limit')) {
        // 数值验证
        const numValue = Number(value);
        if (isNaN(numValue)) {
          continue;
        }
        if (key.includes('_amount') && numValue < 0) continue;
        if (key.includes('_count') && (numValue < 0 || !Number.isInteger(numValue))) continue;
        sanitizedValue = String(numValue);
      } else {
        // 字符串值 - XSS 防护和长度限制
        const strValue = String(value);
        if (strValue.length > 5000) {
          continue; // 跳过超长字符串
        }
        sanitizedValue = escapeHtml(strValue);
      }

      validSettings[key] = sanitizedValue;
      changedKeys.push(key);
    }

    // 批量更新设置
    if (Object.keys(validSettings).length > 0) {
      const upsertRecords = Object.entries(validSettings).map(([key, value]) => ({
        key,
        value
      }));

      const { error } = await supabaseAdmin
        .from('settings')
        .upsert(upsertRecords, { onConflict: 'key' });

      if (error) {
        console.error('Upsert settings error:', error);
        return res.status(500).json({
          success: false,
          error: { code: 'DATABASE_ERROR', message: '保存设置失败' }
        });
      }

      // 记录操作日志
      await supabaseAdmin
        .from('operation_logs')
        .insert({
          admin_id: adminId,
          action: 'UPDATE_SETTINGS',
          target_type: 'settings',
          details: {
            changed_keys: changedKeys,
            message: `更新系统设置: ${changedKeys.join(', ')}`
          }
        });
    }

    res.json({
      success: true,
      message: '设置已保存'
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '服务器错误' }
    });
  }
});

/**
 * GET /api/admin/operation-logs
 * 获取操作日志
 */
router.get('/operation-logs', async (req: Request, res: Response) => {
  try {
    const { page = 1, pageSize = 20, operator, type, date, startDate, endDate } = req.query;

    // 构建查询
    let query = supabaseAdmin
      .from('operation_logs')
      .select(`
        id,
        created_at,
        action,
        target_type,
        target_id,
        details,
        admin:users!admin_id(id, name, phone)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // 日期筛选
    if (date) {
      const dateStr = String(date);
      query = query.gte('created_at', `${dateStr} 00:00:00`)
                   .lte('created_at', `${dateStr} 23:59:59`);
    } else if (startDate || endDate) {
      if (startDate) {
        query = query.gte('created_at', `${String(startDate)} 00:00:00`);
      }
      if (endDate) {
        query = query.lte('created_at', `${String(endDate)} 23:59:59`);
      }
    }

    // 操作类型筛选
    if (type) {
      query = query.eq('action', String(type));
    }

    // 分页
    const pageNum = parseInt(page as string) || 1;
    const pageSizeNum = parseInt(pageSize as string) || 20;
    const offset = (pageNum - 1) * pageSizeNum;

    query = query.range(offset, offset + pageSizeNum - 1);

    const { data: logs, error, count } = await query;

    if (error) {
      console.error('Get operation logs error:', error);
      // 如果表不存在或查询失败，返回空列表
      return res.json({
        success: true,
        data: {
          list: [],
          total: 0,
          page: pageNum,
          pageSize: pageSizeNum
        }
      });
    }

    // 获取管理员名称映射（用于 operator 筛选）
    let filteredLogs = logs || [];

    // 操作人筛选（需要先获取管理员信息）
    if (operator && filteredLogs.length > 0) {
      const operatorName = String(operator);
      filteredLogs = filteredLogs.filter(log => {
        const adminName = log.admin?.name || log.admin?.phone || '未知';
        return adminName.includes(operatorName);
      });
    }

    // 格式化返回数据
    const formattedLogs = filteredLogs.map(log => ({
      id: log.id,
      date: log.created_at ? new Date(log.created_at).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).replace(/\//g, '-') : '',
      operator: log.admin?.name || log.admin?.phone || '未知',
      operator_id: log.admin?.id || '',
      type: log.action || '',
      detail: log.details?.message || JSON.stringify(log.details || {}),
      ip: log.details?.ip || '-'
    }));

    res.json({
      success: true,
      data: {
        list: formattedLogs,
        total: count || formattedLogs.length,
        page: pageNum,
        pageSize: pageSizeNum
      }
    });
  } catch (error) {
    console.error('Get operation logs error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '服务器错误' }
    });
  }
});

// ===========================================
// 营销活动管理
// ===========================================

// 验证优惠券类型
const VALID_COUPON_TYPES = ['discount', 'full_reduction'];
const isValidCouponType = (type: string): boolean => {
  return VALID_COUPON_TYPES.includes(type);
};

// 验证优惠券状态
const VALID_COUPON_STATUS = ['distributing', 'paused', 'ended'];
const isValidCouponStatus = (status: string): boolean => {
  return VALID_COUPON_STATUS.includes(status);
};

// 验证活动状态
const VALID_CAMPAIGN_STATUS = ['not_started', 'ongoing', 'ended'];
const isValidCampaignStatus = (status: string): boolean => {
  return VALID_CAMPAIGN_STATUS.includes(status);
};

/**
 * 验证优惠券数据
 */
const validateCouponData = (data: any, isUpdate: boolean = false): { valid: boolean; error?: string } => {
  const { name, type, discount_amount, min_amount, total_count, start_time, end_time } = data;

  // 名称验证
  if (!isUpdate || name !== undefined) {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return { valid: false, error: '优惠券名称不能为空' };
    }
    if (name.length > 100) {
      return { valid: false, error: '优惠券名称不能超过 100 个字符' };
    }
  }

  // 类型验证
  if (!isUpdate || type !== undefined) {
    if (!type || !isValidCouponType(type)) {
      return { valid: false, error: '优惠券类型无效' };
    }
  }

  // 面额验证
  if (!isUpdate || discount_amount !== undefined) {
    if (discount_amount === undefined || discount_amount === null) {
      if (!isUpdate) return { valid: false, error: '优惠券面额不能为空' };
    } else {
      const amount = Number(discount_amount);
      if (isNaN(amount) || amount <= 0) {
        return { valid: false, error: '优惠券面额必须大于 0' };
      }
      if (amount > 99999) {
        return { valid: false, error: '优惠券面额超出范围' };
      }
    }
  }

  // 使用门槛验证
  if (min_amount !== undefined) {
    const min = Number(min_amount);
    if (isNaN(min) || min < 0) {
      return { valid: false, error: '使用门槛必须为非负数' };
    }
  }

  // 总量验证
  if (!isUpdate || total_count !== undefined) {
    if (total_count === undefined || total_count === null) {
      if (!isUpdate) return { valid: false, error: '发放总量不能为空' };
    } else {
      const count = Number(total_count);
      if (isNaN(count) || !Number.isInteger(count) || count <= 0) {
        return { valid: false, error: '发放总量必须为正整数' };
      }
      if (count > 99999999) {
        return { valid: false, error: '发放总量超出范围' };
      }
    }
  }

  // 时间验证
  if (!isUpdate || start_time !== undefined || end_time !== undefined) {
    if (!isUpdate) {
      if (!start_time || !end_time) {
        return { valid: false, error: '活动时间不能为空' };
      }
    }
    if (start_time && end_time) {
      const start = new Date(start_time);
      const end = new Date(end_time);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return { valid: false, error: '时间格式无效' };
      }
      if (start >= end) {
        return { valid: false, error: '开始时间必须早于结束时间' };
      }
    }
  }

  return { valid: true };
};

/**
 * 验证秒杀活动数据
 */
const validateFlashSaleData = (data: any, isUpdate: boolean = false): { valid: boolean; error?: string } => {
  const { product_id, flash_price, stock, start_time, end_time, limit_per_user } = data;

  // 商品验证
  if (!isUpdate || product_id !== undefined) {
    if (!product_id) {
      if (!isUpdate) return { valid: false, error: '请选择秒杀商品' };
    }
  }

  // 秒杀价验证
  if (!isUpdate || flash_price !== undefined) {
    if (flash_price === undefined || flash_price === null) {
      if (!isUpdate) return { valid: false, error: '秒杀价格不能为空' };
    } else {
      const price = Number(flash_price);
      if (isNaN(price) || price <= 0) {
        return { valid: false, error: '秒杀价格必须大于 0' };
      }
    }
  }

  // 库存验证
  if (!isUpdate || stock !== undefined) {
    if (stock === undefined || stock === null) {
      if (!isUpdate) return { valid: false, error: '秒杀库存不能为空' };
    } else {
      const stockNum = Number(stock);
      if (isNaN(stockNum) || !Number.isInteger(stockNum) || stockNum <= 0) {
        return { valid: false, error: '秒杀库存必须为正整数' };
      }
      if (stockNum > 999999) {
        return { valid: false, error: '秒杀库存超出范围' };
      }
    }
  }

  // 时间验证
  if (!isUpdate || start_time !== undefined || end_time !== undefined) {
    if (!isUpdate && (!start_time || !end_time)) {
      return { valid: false, error: '活动时间不能为空' };
    }
    if (start_time && end_time) {
      const start = new Date(start_time);
      const end = new Date(end_time);
      if (start >= end) {
        return { valid: false, error: '开始时间必须早于结束时间' };
      }
    }
  }

  // 每人限购验证
  if (limit_per_user !== undefined) {
    const limit = Number(limit_per_user);
    if (isNaN(limit) || !Number.isInteger(limit) || limit < 0) {
      return { valid: false, error: '每人限购必须为非负整数' };
    }
  }

  return { valid: true };
};

/**
 * 验证团购活动数据
 */
const validateGroupBuyData = (data: any, isUpdate: boolean = false): { valid: boolean; error?: string } => {
  const { product_id, group_price, min_quantity, start_time, end_time } = data;

  // 商品验证
  if (!isUpdate || product_id !== undefined) {
    if (!product_id) {
      if (!isUpdate) return { valid: false, error: '请选择团购商品' };
    }
  }

  // 团购价验证
  if (!isUpdate || group_price !== undefined) {
    if (group_price === undefined || group_price === null) {
      if (!isUpdate) return { valid: false, error: '团购价格不能为空' };
    } else {
      const price = Number(group_price);
      if (isNaN(price) || price <= 0) {
        return { valid: false, error: '团购价格必须大于 0' };
      }
    }
  }

  // 成团人数验证
  if (!isUpdate || min_quantity !== undefined) {
    if (min_quantity === undefined || min_quantity === null) {
      if (!isUpdate) return { valid: false, error: '成团人数不能为空' };
    } else {
      const qty = Number(min_quantity);
      if (isNaN(qty) || !Number.isInteger(qty) || qty < 2) {
        return { valid: false, error: '成团人数至少为 2 人' };
      }
      if (qty > 999) {
        return { valid: false, error: '成团人数超出范围' };
      }
    }
  }

  // 时间验证
  if (!isUpdate || start_time !== undefined || end_time !== undefined) {
    if (!isUpdate && (!start_time || !end_time)) {
      return { valid: false, error: '活动时间不能为空' };
    }
    if (start_time && end_time) {
      const start = new Date(start_time);
      const end = new Date(end_time);
      if (start >= end) {
        return { valid: false, error: '开始时间必须早于结束时间' };
      }
    }
  }

  return { valid: true };
};

// ===========================================
// 优惠券管理
// ===========================================

/**
 * GET /api/admin/coupons
 * 优惠券列表（管理后台）
 */
router.get('/coupons', async (req: Request, res: Response) => {
  try {
    const { page = 1, pageSize = 20, status, keyword } = req.query;

    let query = supabaseAdmin
      .from('coupons')
      .select('*', { count: 'exact' });

    if (status && isValidCouponStatus(status as string)) {
      query = query.eq('status', status);
    }
    if (keyword) {
      query = query.ilike('name', `%${sanitizeLikePattern(keyword as string)}%`);
    }

    query = query.order('created_at', { ascending: false });

    // 分页
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize as string) || 20));
    const offset = (pageNum - 1) * pageSizeNum;

    query = query.range(offset, offset + pageSizeNum - 1);

    const { data: coupons, error, count } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        error: { code: 'QUERY_ERROR', message: '查询失败' }
      });
    }

    res.json({
      success: true,
      data: {
        list: coupons || [],
        total: count || 0,
        page: pageNum,
        pageSize: pageSizeNum
      }
    });
  } catch (error) {
    console.error('Get admin coupons error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '服务器错误' }
    });
  }
});

/**
 * POST /api/admin/coupons
 * 创建优惠券
 */
router.post('/coupons', async (req: Request, res: Response) => {
  try {
    const validation = validateCouponData(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMS', message: validation.error }
      });
    }

    const { name, type, discount_amount, min_amount, total_count, start_time, end_time, limit_per_user, description } = req.body;

    const { data: coupon, error } = await supabaseAdmin
      .from('coupons')
      .insert({
        name: escapeHtml(name.trim()),
        type,
        discount_amount: Number(discount_amount),
        min_amount: Number(min_amount) || 0,
        total_count: Number(total_count),
        used_count: 0,
        start_time,
        end_time,
        limit_per_user: Number(limit_per_user) || 1,
        description: description ? escapeHtml(description) : null,
        status: 'distributing'
      })
      .select()
      .single();

    if (error) {
      console.error('Create coupon error:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'INSERT_ERROR', message: '创建失败: ' + error.message }
      });
    }

    // 记录操作日志
    await supabaseAdmin
      .from('operation_logs')
      .insert({
        operator_id: req.user!.id,
        type: 'coupon_create',
        detail: `创建优惠券: ${name}`,
        target_id: coupon.id
      });

    res.json({
      success: true,
      data: coupon,
      message: '优惠券创建成功'
    });
  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '服务器错误' }
    });
  }
});

/**
 * GET /api/admin/coupons/:id
 * 优惠券详情
 */
router.get('/coupons/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: coupon, error } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !coupon) {
      return res.status(404).json({
        success: false,
        error: { code: 'COUPON_NOT_FOUND', message: '优惠券不存在' }
      });
    }

    res.json({
      success: true,
      data: coupon
    });
  } catch (error) {
    console.error('Get coupon detail error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '服务器错误' }
    });
  }
});

/**
 * PUT /api/admin/coupons/:id
 * 更新优惠券
 */
router.put('/coupons/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 检查优惠券是否存在
    const { data: existingCoupon, error: fetchError } = await supabaseAdmin
      .from('coupons')
      .select('id, name, status')
      .eq('id', id)
      .single();

    if (fetchError || !existingCoupon) {
      return res.status(404).json({
        success: false,
        error: { code: 'COUPON_NOT_FOUND', message: '优惠券不存在' }
      });
    }

    // 验证输入
    const validation = validateCouponData(req.body, true);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMS', message: validation.error }
      });
    }

    // 构建更新数据
    const updateData: any = {};
    const { name, type, discount_amount, min_amount, total_count, start_time, end_time, limit_per_user, description, status } = req.body;

    if (name !== undefined) updateData.name = escapeHtml(name.trim());
    if (type !== undefined && isValidCouponType(type)) updateData.type = type;
    if (discount_amount !== undefined) updateData.discount_amount = Number(discount_amount);
    if (min_amount !== undefined) updateData.min_amount = Number(min_amount);
    if (total_count !== undefined) updateData.total_count = Number(total_count);
    if (start_time !== undefined) updateData.start_time = start_time;
    if (end_time !== undefined) updateData.end_time = end_time;
    if (limit_per_user !== undefined) updateData.limit_per_user = Number(limit_per_user);
    if (description !== undefined) updateData.description = description ? escapeHtml(description) : null;
    if (status !== undefined && isValidCouponStatus(status)) updateData.status = status;

    const { error } = await supabaseAdmin
      .from('coupons')
      .update(updateData)
      .eq('id', id);

    if (error) {
      return res.status(500).json({
        success: false,
        error: { code: 'UPDATE_ERROR', message: '更新失败' }
      });
    }

    // 记录操作日志
    await supabaseAdmin
      .from('operation_logs')
      .insert({
        operator_id: req.user!.id,
        type: 'coupon_update',
        detail: `更新优惠券: ${existingCoupon.name}`,
        target_id: id
      });

    res.json({
      success: true,
      message: '优惠券更新成功'
    });
  } catch (error) {
    console.error('Update coupon error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '服务器错误' }
    });
  }
});

/**
 * DELETE /api/admin/coupons/:id
 * 删除优惠券
 */
router.delete('/coupons/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 检查优惠券是否存在
    const { data: existingCoupon, error: fetchError } = await supabaseAdmin
      .from('coupons')
      .select('id, name, used_count')
      .eq('id', id)
      .single();

    if (fetchError || !existingCoupon) {
      return res.status(404).json({
        success: false,
        error: { code: 'COUPON_NOT_FOUND', message: '优惠券不存在' }
      });
    }

    // 检查是否已被领取
    if (existingCoupon.used_count > 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'COUPON_USED', message: '优惠券已被领取，无法删除' }
      });
    }

    const { error } = await supabaseAdmin
      .from('coupons')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({
        success: false,
        error: { code: 'DELETE_ERROR', message: '删除失败' }
      });
    }

    // 记录操作日志
    await supabaseAdmin
      .from('operation_logs')
      .insert({
        operator_id: req.user!.id,
        type: 'coupon_delete',
        detail: `删除优惠券: ${existingCoupon.name}`,
        target_id: id
      });

    res.json({
      success: true,
      message: '优惠券已删除'
    });
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '服务器错误' }
    });
  }
});

/**
 * GET /api/admin/coupons/:id/records
 * 优惠券发放记录
 */
router.get('/coupons/:id/records', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = 1, pageSize = 20, status } = req.query;

    // 检查优惠券是否存在
    const { data: coupon, error: couponError } = await supabaseAdmin
      .from('coupons')
      .select('id, name')
      .eq('id', id)
      .single();

    if (couponError || !coupon) {
      return res.status(404).json({
        success: false,
        error: { code: 'COUPON_NOT_FOUND', message: '优惠券不存在' }
      });
    }

    let query = supabaseAdmin
      .from('user_coupons')
      .select('*, user:users(id, name, phone, avatar)', { count: 'exact' })
      .eq('coupon_id', id);

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('created_at', { ascending: false });

    // 分页
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize as string) || 20));
    const offset = (pageNum - 1) * pageSizeNum;

    query = query.range(offset, offset + pageSizeNum - 1);

    const { data: records, error, count } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        error: { code: 'QUERY_ERROR', message: '查询失败' }
      });
    }

    res.json({
      success: true,
      data: {
        coupon,
        list: records || [],
        total: count || 0,
        page: pageNum,
        pageSize: pageSizeNum
      }
    });
  } catch (error) {
    console.error('Get coupon records error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '服务器错误' }
    });
  }
});

// ===========================================
// 秒杀活动管理
// ===========================================

/**
 * GET /api/admin/flash-sales
 * 秒杀活动列表（管理后台）
 */
router.get('/flash-sales', async (req: Request, res: Response) => {
  try {
    const { page = 1, pageSize = 20, status, keyword } = req.query;

    let query = supabaseAdmin
      .from('flash_sales')
      .select(`
        *,
        product:products(id, name, images, original_price, stock)
      `, { count: 'exact' });

    if (status && isValidCampaignStatus(status as string)) {
      query = query.eq('status', status);
    }

    query = query.order('start_time', { ascending: true });

    // 分页
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize as string) || 20));
    const offset = (pageNum - 1) * pageSizeNum;

    query = query.range(offset, offset + pageSizeNum - 1);

    const { data: flashSales, error, count } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        error: { code: 'QUERY_ERROR', message: '查询失败' }
      });
    }

    // 前端关键词搜索（商品名称）
    let filteredList = flashSales || [];
    if (keyword) {
      filteredList = filteredList.filter(item =>
        item.product?.name?.toLowerCase().includes((keyword as string).toLowerCase())
      );
    }

    res.json({
      success: true,
      data: {
        list: filteredList,
        total: count || 0,
        page: pageNum,
        pageSize: pageSizeNum
      }
    });
  } catch (error) {
    console.error('Get admin flash sales error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '服务器错误' }
    });
  }
});

/**
 * POST /api/admin/flash-sales
 * 创建秒杀活动
 */
router.post('/flash-sales', async (req: Request, res: Response) => {
  try {
    const validation = validateFlashSaleData(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMS', message: validation.error }
      });
    }

    const { product_id, flash_price, stock, start_time, end_time, limit_per_user } = req.body;

    // 检查商品是否存在
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('id, name, stock, price')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      return res.status(404).json({
        success: false,
        error: { code: 'PRODUCT_NOT_FOUND', message: '商品不存在' }
      });
    }

    // 检查秒杀库存是否超过商品库存
    if (Number(stock) > product.stock) {
      return res.status(400).json({
        success: false,
        error: { code: 'STOCK_EXCEED', message: '秒杀库存不能超过商品库存' }
      });
    }

    // 检查秒杀价是否低于原价
    if (Number(flash_price) >= product.price) {
      return res.status(400).json({
        success: false,
        error: { code: 'PRICE_INVALID', message: '秒杀价应低于商品原价' }
      });
    }

    // 确定活动状态
    const now = new Date();
    const startTime = new Date(start_time);
    let status = 'not_started';
    if (startTime <= now) {
      status = 'ongoing';
    }

    const { data: flashSale, error } = await supabaseAdmin
      .from('flash_sales')
      .insert({
        product_id,
        flash_price: Number(flash_price),
        stock: Number(stock),
        sold_count: 0,
        start_time,
        end_time,
        limit_per_user: Number(limit_per_user) || 0,
        status
      })
      .select()
      .single();

    if (error) {
      console.error('Create flash sale error:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'INSERT_ERROR', message: '创建失败: ' + error.message }
      });
    }

    // 记录操作日志
    await supabaseAdmin
      .from('operation_logs')
      .insert({
        operator_id: req.user!.id,
        type: 'flash_sale_create',
        detail: `创建秒杀活动: ${product.name}`,
        target_id: flashSale.id
      });

    res.json({
      success: true,
      data: flashSale,
      message: '秒杀活动创建成功'
    });
  } catch (error) {
    console.error('Create flash sale error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '服务器错误' }
    });
  }
});

/**
 * GET /api/admin/flash-sales/:id
 * 秒杀活动详情
 */
router.get('/flash-sales/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: flashSale, error } = await supabaseAdmin
      .from('flash_sales')
      .select(`
        *,
        product:products(id, name, images, original_price, stock, price)
      `)
      .eq('id', id)
      .single();

    if (error || !flashSale) {
      return res.status(404).json({
        success: false,
        error: { code: 'FLASH_SALE_NOT_FOUND', message: '秒杀活动不存在' }
      });
    }

    res.json({
      success: true,
      data: flashSale
    });
  } catch (error) {
    console.error('Get flash sale detail error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '服务器错误' }
    });
  }
});

/**
 * PUT /api/admin/flash-sales/:id
 * 更新秒杀活动
 */
router.put('/flash-sales/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 检查活动是否存在
    const { data: existingFlashSale, error: fetchError } = await supabaseAdmin
      .from('flash_sales')
      .select('id, product_id, sold_count, status')
      .eq('id', id)
      .single();

    if (fetchError || !existingFlashSale) {
      return res.status(404).json({
        success: false,
        error: { code: 'FLASH_SALE_NOT_FOUND', message: '秒杀活动不存在' }
      });
    }

    // 已结束的活动不能修改
    if (existingFlashSale.status === 'ended') {
      return res.status(400).json({
        success: false,
        error: { code: 'FLASH_SALE_ENDED', message: '活动已结束，无法修改' }
      });
    }

    // 验证输入
    const validation = validateFlashSaleData(req.body, true);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMS', message: validation.error }
      });
    }

    // 构建更新数据
    const updateData: any = {};
    const { flash_price, stock, start_time, end_time, limit_per_user, status } = req.body;

    // 已售出的活动不能修改库存低于已售数量
    if (stock !== undefined) {
      const newStock = Number(stock);
      if (newStock < existingFlashSale.sold_count) {
        return res.status(400).json({
          success: false,
          error: { code: 'STOCK_INSUFFICIENT', message: '库存不能低于已售数量' }
        });
      }
      updateData.stock = newStock;
    }

    if (flash_price !== undefined) updateData.flash_price = Number(flash_price);
    if (start_time !== undefined) updateData.start_time = start_time;
    if (end_time !== undefined) updateData.end_time = end_time;
    if (limit_per_user !== undefined) updateData.limit_per_user = Number(limit_per_user);
    if (status !== undefined && isValidCampaignStatus(status)) updateData.status = status;

    const { error } = await supabaseAdmin
      .from('flash_sales')
      .update(updateData)
      .eq('id', id);

    if (error) {
      return res.status(500).json({
        success: false,
        error: { code: 'UPDATE_ERROR', message: '更新失败' }
      });
    }

    // 记录操作日志
    await supabaseAdmin
      .from('operation_logs')
      .insert({
        operator_id: req.user!.id,
        type: 'flash_sale_update',
        detail: `更新秒杀活动`,
        target_id: id
      });

    res.json({
      success: true,
      message: '秒杀活动更新成功'
    });
  } catch (error) {
    console.error('Update flash sale error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '服务器错误' }
    });
  }
});

/**
 * DELETE /api/admin/flash-sales/:id
 * 删除秒杀活动
 */
router.delete('/flash-sales/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 检查活动是否存在
    const { data: existingFlashSale, error: fetchError } = await supabaseAdmin
      .from('flash_sales')
      .select('id, sold_count, status')
      .eq('id', id)
      .single();

    if (fetchError || !existingFlashSale) {
      return res.status(404).json({
        success: false,
        error: { code: 'FLASH_SALE_NOT_FOUND', message: '秒杀活动不存在' }
      });
    }

    // 已售出商品的活动不能删除
    if (existingFlashSale.sold_count > 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'FLASH_SALE_HAS_ORDERS', message: '活动已有订单，无法删除' }
      });
    }

    const { error } = await supabaseAdmin
      .from('flash_sales')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({
        success: false,
        error: { code: 'DELETE_ERROR', message: '删除失败' }
      });
    }

    // 记录操作日志
    await supabaseAdmin
      .from('operation_logs')
      .insert({
        operator_id: req.user!.id,
        type: 'flash_sale_delete',
        detail: `删除秒杀活动`,
        target_id: id
      });

    res.json({
      success: true,
      message: '秒杀活动已删除'
    });
  } catch (error) {
    console.error('Delete flash sale error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '服务器错误' }
    });
  }
});

// ===========================================
// 团购活动管理
// ===========================================

/**
 * GET /api/admin/group-buys
 * 团购活动列表（管理后台）
 */
router.get('/group-buys', async (req: Request, res: Response) => {
  try {
    const { page = 1, pageSize = 20, status, keyword } = req.query;

    let query = supabaseAdmin
      .from('group_buys')
      .select(`
        *,
        product:products(id, name, images, original_price)
      `, { count: 'exact' });

    if (status && isValidCampaignStatus(status as string)) {
      query = query.eq('status', status);
    }

    query = query.order('created_at', { ascending: false });

    // 分页
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize as string) || 20));
    const offset = (pageNum - 1) * pageSizeNum;

    query = query.range(offset, offset + pageSizeNum - 1);

    const { data: groupBuys, error, count } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        error: { code: 'QUERY_ERROR', message: '查询失败' }
      });
    }

    // 前端关键词搜索（商品名称）
    let filteredList = groupBuys || [];
    if (keyword) {
      filteredList = filteredList.filter(item =>
        item.product?.name?.toLowerCase().includes((keyword as string).toLowerCase())
      );
    }

    res.json({
      success: true,
      data: {
        list: filteredList,
        total: count || 0,
        page: pageNum,
        pageSize: pageSizeNum
      }
    });
  } catch (error) {
    console.error('Get admin group buys error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '服务器错误' }
    });
  }
});

/**
 * POST /api/admin/group-buys
 * 创建团购活动
 */
router.post('/group-buys', async (req: Request, res: Response) => {
  try {
    const validation = validateGroupBuyData(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMS', message: validation.error }
      });
    }

    const { product_id, group_price, min_quantity, start_time, end_time } = req.body;

    // 检查商品是否存在
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('id, name, price')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      return res.status(404).json({
        success: false,
        error: { code: 'PRODUCT_NOT_FOUND', message: '商品不存在' }
      });
    }

    // 检查团购价是否低于原价
    if (Number(group_price) >= product.price) {
      return res.status(400).json({
        success: false,
        error: { code: 'PRICE_INVALID', message: '团购价应低于商品原价' }
      });
    }

    // 确定活动状态
    const now = new Date();
    const startTime = new Date(start_time);
    let status = 'not_started';
    if (startTime <= now) {
      status = 'ongoing';
    }

    const { data: groupBuy, error } = await supabaseAdmin
      .from('group_buys')
      .insert({
        product_id,
        group_price: Number(group_price),
        min_quantity: Number(min_quantity),
        current_quantity: 0,
        start_time,
        end_time,
        status
      })
      .select()
      .single();

    if (error) {
      console.error('Create group buy error:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'INSERT_ERROR', message: '创建失败: ' + error.message }
      });
    }

    // 记录操作日志
    await supabaseAdmin
      .from('operation_logs')
      .insert({
        operator_id: req.user!.id,
        type: 'group_buy_create',
        detail: `创建团购活动: ${product.name}`,
        target_id: groupBuy.id
      });

    res.json({
      success: true,
      data: groupBuy,
      message: '团购活动创建成功'
    });
  } catch (error) {
    console.error('Create group buy error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '服务器错误' }
    });
  }
});

/**
 * GET /api/admin/group-buys/:id
 * 团购活动详情
 */
router.get('/group-buys/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: groupBuy, error } = await supabaseAdmin
      .from('group_buys')
      .select(`
        *,
        product:products(id, name, images, original_price, price)
      `)
      .eq('id', id)
      .single();

    if (error || !groupBuy) {
      return res.status(404).json({
        success: false,
        error: { code: 'GROUP_BUY_NOT_FOUND', message: '团购活动不存在' }
      });
    }

    res.json({
      success: true,
      data: groupBuy
    });
  } catch (error) {
    console.error('Get group buy detail error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '服务器错误' }
    });
  }
});

/**
 * PUT /api/admin/group-buys/:id
 * 更新团购活动
 */
router.put('/group-buys/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 检查活动是否存在
    const { data: existingGroupBuy, error: fetchError } = await supabaseAdmin
      .from('group_buys')
      .select('id, current_quantity, status')
      .eq('id', id)
      .single();

    if (fetchError || !existingGroupBuy) {
      return res.status(404).json({
        success: false,
        error: { code: 'GROUP_BUY_NOT_FOUND', message: '团购活动不存在' }
      });
    }

    // 已结束的活动不能修改
    if (existingGroupBuy.status === 'ended') {
      return res.status(400).json({
        success: false,
        error: { code: 'GROUP_BUY_ENDED', message: '活动已结束，无法修改' }
      });
    }

    // 验证输入
    const validation = validateGroupBuyData(req.body, true);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMS', message: validation.error }
      });
    }

    // 构建更新数据
    const updateData: any = {};
    const { group_price, min_quantity, start_time, end_time, status } = req.body;

    if (group_price !== undefined) updateData.group_price = Number(group_price);
    if (min_quantity !== undefined) updateData.min_quantity = Number(min_quantity);
    if (start_time !== undefined) updateData.start_time = start_time;
    if (end_time !== undefined) updateData.end_time = end_time;
    if (status !== undefined && isValidCampaignStatus(status)) updateData.status = status;

    const { error } = await supabaseAdmin
      .from('group_buys')
      .update(updateData)
      .eq('id', id);

    if (error) {
      return res.status(500).json({
        success: false,
        error: { code: 'UPDATE_ERROR', message: '更新失败' }
      });
    }

    // 记录操作日志
    await supabaseAdmin
      .from('operation_logs')
      .insert({
        operator_id: req.user!.id,
        type: 'group_buy_update',
        detail: `更新团购活动`,
        target_id: id
      });

    res.json({
      success: true,
      message: '团购活动更新成功'
    });
  } catch (error) {
    console.error('Update group buy error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '服务器错误' }
    });
  }
});

/**
 * DELETE /api/admin/group-buys/:id
 * 删除团购活动
 */
router.delete('/group-buys/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 检查活动是否存在
    const { data: existingGroupBuy, error: fetchError } = await supabaseAdmin
      .from('group_buys')
      .select('id, current_quantity, status')
      .eq('id', id)
      .single();

    if (fetchError || !existingGroupBuy) {
      return res.status(404).json({
        success: false,
        error: { code: 'GROUP_BUY_NOT_FOUND', message: '团购活动不存在' }
      });
    }

    // 已有参团的活动不能删除
    if (existingGroupBuy.current_quantity > 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'GROUP_BUY_HAS_PARTICIPANTS', message: '活动已有参与者，无法删除' }
      });
    }

    const { error } = await supabaseAdmin
      .from('group_buys')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({
        success: false,
        error: { code: 'DELETE_ERROR', message: '删除失败' }
      });
    }

    // 记录操作日志
    await supabaseAdmin
      .from('operation_logs')
      .insert({
        operator_id: req.user!.id,
        type: 'group_buy_delete',
        detail: `删除团购活动`,
        target_id: id
      });

    res.json({
      success: true,
      message: '团购活动已删除'
    });
  } catch (error) {
    console.error('Delete group buy error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '服务器错误' }
    });
  }
});

/**
 * GET /api/admin/group-buys/:id/records
 * 团购参团记录
 */
router.get('/group-buys/:id/records', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = 1, pageSize = 20 } = req.query;

    // 检查团购活动是否存在
    const { data: groupBuy, error: groupBuyError } = await supabaseAdmin
      .from('group_buys')
      .select('id, product_id, min_quantity, current_quantity, status')
      .eq('id', id)
      .single();

    if (groupBuyError || !groupBuy) {
      return res.status(404).json({
        success: false,
        error: { code: 'GROUP_BUY_NOT_FOUND', message: '团购活动不存在' }
      });
    }

    // 由于没有专门的团购参团表，从订单中查找该团购的订单
    // 这里需要根据实际业务逻辑调整
    // 假设订单有 group_buy_id 字段
    const { data: orders, error, count } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        order_no,
        user_id,
        paid_amount,
        created_at,
        status,
        user:users(id, name, phone, avatar)
      `, { count: 'exact' })
      .eq('group_buy_id', id)
      .order('created_at', { ascending: false });

    // 分页
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize as string) || 20));

    if (error) {
      // 如果 group_buy_id 字段不存在，返回空列表
      console.error('Get group buy records error:', error);
      return res.json({
        success: true,
        data: {
          groupBuy,
          list: [],
          total: 0,
          page: pageNum,
          pageSize: pageSizeNum
        }
      });
    }

    res.json({
      success: true,
      data: {
        groupBuy,
        list: orders || [],
        total: count || 0,
        page: pageNum,
        pageSize: pageSizeNum
      }
    });
  } catch (error) {
    console.error('Get group buy records error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '服务器错误' }
    });
  }
});

// ===========================================
// 内容管理 - Banner管理
// ===========================================

/**
 * GET /api/admin/banners
 * 获取Banner列表
 */
router.get('/banners', async (req: Request, res: Response) => {
  try {
    const { keyword, status, page = 1, pageSize = 20 } = req.query;

    let query = supabaseAdmin
      .from('banners')
      .select('*', { count: 'exact' })
      .order('sort_order', { ascending: true });

    if (keyword) {
      query = query.ilike('title', `%${sanitizeLikePattern(keyword as string)}%`);
    }
    if (status && ['visible', 'hidden'].includes(status as string)) {
      query = query.eq('status', status);
    }

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize as string) || 20));
    const from = (pageNum - 1) * pageSizeNum;
    const to = from + pageSizeNum - 1;

    const { data: banners, error, count } = await query.range(from, to);

    if (error) {
      console.error('Get banners error:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'QUERY_ERROR', message: '查询失败' }
      });
    }

    res.json({
      success: true,
      data: { list: banners || [], total: count || 0, page: pageNum, pageSize: pageSizeNum }
    });
  } catch (error) {
    console.error('Get banners error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '服务器错误' }
    });
  }
});

/**
 * POST /api/admin/banners
 * 创建Banner
 */
router.post('/banners', async (req: Request, res: Response) => {
  try {
    const { title, image_url, link_url, sort_order, status } = req.body;

    // 验证
    if (!image_url || typeof image_url !== 'string') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMS', message: '图片URL不能为空' }
      });
    }
    if (image_url.length > 500) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMS', message: '图片URL长度超出限制' }
      });
    }

    const sanitizedTitle = title ? escapeHtml(title.slice(0, 100)) : null;
    const sanitizedLinkUrl = link_url ? link_url.slice(0, 500) : null;

    const { data: banner, error } = await supabaseAdmin
      .from('banners')
      .insert({
        title: sanitizedTitle,
        image_url,
        link_url: sanitizedLinkUrl,
        sort_order: typeof sort_order === 'number' ? sort_order : 0,
        status: status === 'hidden' ? 'hidden' : 'visible'
      })
      .select()
      .single();

    if (error) {
      console.error('Create banner error:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'CREATE_ERROR', message: '创建失败' }
      });
    }

    // 操作日志
    await supabaseAdmin.from('operation_logs').insert({
      operator_id: (req as any).user?.id || 'unknown',
      type: 'banner_create',
      target_type: 'banner',
      target_id: banner.id,
      detail: `创建Banner: ${sanitizedTitle || '无标题'}`,
      created_at: new Date().toISOString()
    });

    res.json({ success: true, data: banner });
  } catch (error) {
    console.error('Create banner error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '服务器错误' }
    });
  }
});

/**
 * PUT /api/admin/banners/:id
 * 更新Banner
 */
router.put('/banners/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, image_url, link_url, sort_order } = req.body;

    // 验证ID格式
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMS', message: '无效的Banner ID' }
      });
    }

    // 检查存在
    const { data: existing } = await supabaseAdmin
      .from('banners')
      .select('id, title')
      .eq('id', id)
      .single();

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Banner不存在' }
      });
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    if (title !== undefined) updateData.title = escapeHtml(String(title).slice(0, 100));
    if (image_url !== undefined) {
      if (typeof image_url !== 'string' || image_url.length > 500) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_PARAMS', message: '图片URL无效' }
        });
      }
      updateData.image_url = image_url;
    }
    if (link_url !== undefined) updateData.link_url = String(link_url).slice(0, 500);
    if (sort_order !== undefined) updateData.sort_order = parseInt(sort_order) || 0;

    const { data: banner, error } = await supabaseAdmin
      .from('banners')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update banner error:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'UPDATE_ERROR', message: '更新失败' }
      });
    }

    // 操作日志
    await supabaseAdmin.from('operation_logs').insert({
      operator_id: (req as any).user?.id || 'unknown',
      type: 'banner_update',
      target_type: 'banner',
      target_id: id,
      detail: `更新Banner: ${existing.title || '无标题'}`,
      created_at: new Date().toISOString()
    });

    res.json({ success: true, data: banner });
  } catch (error) {
    console.error('Update banner error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '服务器错误' }
    });
  }
});

/**
 * PUT /api/admin/banners/:id/status
 * 切换Banner状态
 */
router.put('/banners/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['visible', 'hidden'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMS', message: '状态值无效' }
      });
    }

    const { data: existing } = await supabaseAdmin
      .from('banners')
      .select('id, title, status')
      .eq('id', id)
      .single();

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Banner不存在' }
      });
    }

    const { error } = await supabaseAdmin
      .from('banners')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Update banner status error:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'UPDATE_ERROR', message: '更新失败' }
      });
    }

    await supabaseAdmin.from('operation_logs').insert({
      operator_id: (req as any).user?.id || 'unknown',
      type: 'banner_status_change',
      target_type: 'banner',
      target_id: id,
      detail: `Banner状态: ${existing.status} → ${status}`,
      created_at: new Date().toISOString()
    });

    res.json({ success: true, message: '状态已更新' });
  } catch (error) {
    console.error('Update banner status error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '服务器错误' }
    });
  }
});

/**
 * DELETE /api/admin/banners/:id
 * 删除Banner
 */
router.delete('/banners/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: existing } = await supabaseAdmin
      .from('banners')
      .select('id, title')
      .eq('id', id)
      .single();

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Banner不存在' }
      });
    }

    const { error } = await supabaseAdmin
      .from('banners')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete banner error:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'DELETE_ERROR', message: '删除失败' }
      });
    }

    await supabaseAdmin.from('operation_logs').insert({
      operator_id: (req as any).user?.id || 'unknown',
      type: 'banner_delete',
      target_type: 'banner',
      target_id: id,
      detail: `删除Banner: ${existing.title || '无标题'}`,
      created_at: new Date().toISOString()
    });

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('Delete banner error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '服务器错误' }
    });
  }
});

// ===========================================
// 内容管理 - 公告管理
// ===========================================

/**
 * GET /api/admin/notifications
 * 获取公告列表
 */
router.get('/notifications', async (req: Request, res: Response) => {
  try {
    const { keyword, type, status, page = 1, pageSize = 20 } = req.query;

    let query = supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (keyword) {
      query = query.or(`title.ilike.%${sanitizeLikePattern(keyword as string)}%,content.ilike.%${sanitizeLikePattern(keyword as string)}%`);
    }
    if (type && ['announcement', 'notice', 'faq'].includes(type as string)) {
      query = query.eq('type', type);
    }
    if (status && ['published', 'draft'].includes(status as string)) {
      query = query.eq('status', status);
    }

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize as string) || 20));
    const from = (pageNum - 1) * pageSizeNum;
    const to = from + pageSizeNum - 1;

    const { data: notifications, error, count } = await query.range(from, to);

    if (error) {
      console.error('Get notifications error:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'QUERY_ERROR', message: '查询失败' }
      });
    }

    res.json({
      success: true,
      data: { list: notifications || [], total: count || 0, page: pageNum, pageSize: pageSizeNum }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '服务器错误' }
    });
  }
});

/**
 * POST /api/admin/notifications
 * 创建公告
 */
router.post('/notifications', async (req: Request, res: Response) => {
  try {
    const { title, content, type, status } = req.body;

    // 验证
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMS', message: '公告标题不能为空' }
      });
    }
    if (title.length > 200) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMS', message: '标题长度超出限制(200字符)' }
      });
    }

    const sanitizedTitle = escapeHtml(title.trim());
    const sanitizedContent = content ? escapeHtml(String(content).slice(0, 5000)) : null;

    const { data: notification, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        title: sanitizedTitle,
        content: sanitizedContent,
        type: type && ['announcement', 'notice', 'faq'].includes(type) ? type : 'announcement',
        status: status === 'draft' ? 'draft' : 'published'
      })
      .select()
      .single();

    if (error) {
      console.error('Create notification error:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'CREATE_ERROR', message: '创建失败' }
      });
    }

    await supabaseAdmin.from('operation_logs').insert({
      operator_id: (req as any).user?.id || 'unknown',
      type: 'notification_create',
      target_type: 'notification',
      target_id: notification.id,
      detail: `创建公告: ${sanitizedTitle}`,
      created_at: new Date().toISOString()
    });

    res.json({ success: true, data: notification });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '服务器错误' }
    });
  }
});

/**
 * PUT /api/admin/notifications/:id
 * 更新公告
 */
router.put('/notifications/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, type } = req.body;

    const { data: existing } = await supabaseAdmin
      .from('notifications')
      .select('id, title')
      .eq('id', id)
      .single();

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: '公告不存在' }
      });
    }

    const updateData: any = {};
    if (title !== undefined) {
      if (!title || title.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_PARAMS', message: '公告标题不能为空' }
        });
      }
      updateData.title = escapeHtml(String(title).trim().slice(0, 200));
    }
    if (content !== undefined) updateData.content = escapeHtml(String(content).slice(0, 5000));
    if (type !== undefined && ['announcement', 'notice', 'faq'].includes(type)) {
      updateData.type = type;
    }

    const { data: notification, error } = await supabaseAdmin
      .from('notifications')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update notification error:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'UPDATE_ERROR', message: '更新失败' }
      });
    }

    await supabaseAdmin.from('operation_logs').insert({
      operator_id: (req as any).user?.id || 'unknown',
      type: 'notification_update',
      target_type: 'notification',
      target_id: id,
      detail: `更新公告: ${existing.title}`,
      created_at: new Date().toISOString()
    });

    res.json({ success: true, data: notification });
  } catch (error) {
    console.error('Update notification error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '服务器错误' }
    });
  }
});

/**
 * PUT /api/admin/notifications/:id/status
 * 切换公告状态
 */
router.put('/notifications/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['published', 'draft'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMS', message: '状态值无效' }
      });
    }

    const { data: existing } = await supabaseAdmin
      .from('notifications')
      .select('id, title, status')
      .eq('id', id)
      .single();

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: '公告不存在' }
      });
    }

    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('Update notification status error:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'UPDATE_ERROR', message: '更新失败' }
      });
    }

    await supabaseAdmin.from('operation_logs').insert({
      operator_id: (req as any).user?.id || 'unknown',
      type: 'notification_status_change',
      target_type: 'notification',
      target_id: id,
      detail: `公告状态: ${existing.status} → ${status}`,
      created_at: new Date().toISOString()
    });

    res.json({ success: true, message: '状态已更新' });
  } catch (error) {
    console.error('Update notification status error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '服务器错误' }
    });
  }
});

/**
 * DELETE /api/admin/notifications/:id
 * 删除公告
 */
router.delete('/notifications/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: existing } = await supabaseAdmin
      .from('notifications')
      .select('id, title')
      .eq('id', id)
      .single();

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: '公告不存在' }
      });
    }

    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete notification error:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'DELETE_ERROR', message: '删除失败' }
      });
    }

    await supabaseAdmin.from('operation_logs').insert({
      operator_id: (req as any).user?.id || 'unknown',
      type: 'notification_delete',
      target_type: 'notification',
      target_id: id,
      detail: `删除公告: ${existing.title}`,
      created_at: new Date().toISOString()
    });

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '服务器错误' }
    });
  }
});

// ===========================================
// 内容管理 - FAQ管理
// ===========================================

/**
 * GET /api/admin/faqs
 * 获取FAQ列表
 */
router.get('/faqs', async (req: Request, res: Response) => {
  try {
    const { keyword, category, page = 1, pageSize = 20 } = req.query;

    let query = supabaseAdmin
      .from('faqs')
      .select('*', { count: 'exact' })
      .order('sort_order', { ascending: true });

    if (keyword) {
      query = query.or(`question.ilike.%${sanitizeLikePattern(keyword as string)}%,answer.ilike.%${sanitizeLikePattern(keyword as string)}%`);
    }
    if (category) {
      query = query.eq('category', category);
    }

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize as string) || 20));
    const from = (pageNum - 1) * pageSizeNum;
    const to = from + pageSizeNum - 1;

    const { data: faqs, error, count } = await query.range(from, to);

    if (error) {
      console.error('Get faqs error:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'QUERY_ERROR', message: '查询失败' }
      });
    }

    res.json({
      success: true,
      data: { list: faqs || [], total: count || 0, page: pageNum, pageSize: pageSizeNum }
    });
  } catch (error) {
    console.error('Get faqs error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '服务器错误' }
    });
  }
});

/**
 * POST /api/admin/faqs
 * 创建FAQ
 */
router.post('/faqs', async (req: Request, res: Response) => {
  try {
    const { category, question, answer, sort_order, status } = req.body;

    // 验证
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMS', message: '问题不能为空' }
      });
    }
    if (!answer || typeof answer !== 'string' || answer.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMS', message: '回答不能为空' }
      });
    }

    const sanitizedQuestion = escapeHtml(question.trim().slice(0, 500));
    const sanitizedAnswer = escapeHtml(answer.trim().slice(0, 2000));
    const sanitizedCategory = category ? escapeHtml(String(category).slice(0, 50)) : '其他问题';

    const { data: faq, error } = await supabaseAdmin
      .from('faqs')
      .insert({
        category: sanitizedCategory,
        question: sanitizedQuestion,
        answer: sanitizedAnswer,
        sort_order: typeof sort_order === 'number' ? sort_order : 0,
        status: status === 'hidden' ? 'hidden' : 'visible'
      })
      .select()
      .single();

    if (error) {
      console.error('Create faq error:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'CREATE_ERROR', message: '创建失败' }
      });
    }

    await supabaseAdmin.from('operation_logs').insert({
      operator_id: (req as any).user?.id || 'unknown',
      type: 'faq_create',
      target_type: 'faq',
      target_id: faq.id,
      detail: `创建FAQ: ${sanitizedQuestion.slice(0, 50)}...`,
      created_at: new Date().toISOString()
    });

    res.json({ success: true, data: faq });
  } catch (error) {
    console.error('Create faq error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '服务器错误' }
    });
  }
});

/**
 * PUT /api/admin/faqs/:id
 * 更新FAQ
 */
router.put('/faqs/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { category, question, answer, sort_order } = req.body;

    const { data: existing } = await supabaseAdmin
      .from('faqs')
      .select('id, question')
      .eq('id', id)
      .single();

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'FAQ不存在' }
      });
    }

    const updateData: any = {};
    if (category !== undefined) updateData.category = escapeHtml(String(category).slice(0, 50));
    if (question !== undefined) {
      if (!question || question.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_PARAMS', message: '问题不能为空' }
        });
      }
      updateData.question = escapeHtml(String(question).trim().slice(0, 500));
    }
    if (answer !== undefined) {
      if (!answer || answer.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_PARAMS', message: '回答不能为空' }
        });
      }
      updateData.answer = escapeHtml(String(answer).trim().slice(0, 2000));
    }
    if (sort_order !== undefined) updateData.sort_order = parseInt(sort_order) || 0;

    const { data: faq, error } = await supabaseAdmin
      .from('faqs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update faq error:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'UPDATE_ERROR', message: '更新失败' }
      });
    }

    await supabaseAdmin.from('operation_logs').insert({
      operator_id: (req as any).user?.id || 'unknown',
      type: 'faq_update',
      target_type: 'faq',
      target_id: id,
      detail: `更新FAQ: ${existing.question.slice(0, 50)}...`,
      created_at: new Date().toISOString()
    });

    res.json({ success: true, data: faq });
  } catch (error) {
    console.error('Update faq error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '服务器错误' }
    });
  }
});

/**
 * DELETE /api/admin/faqs/:id
 * 删除FAQ
 */
router.delete('/faqs/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: existing } = await supabaseAdmin
      .from('faqs')
      .select('id, question')
      .eq('id', id)
      .single();

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'FAQ不存在' }
      });
    }

    const { error } = await supabaseAdmin
      .from('faqs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete faq error:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'DELETE_ERROR', message: '删除失败' }
      });
    }

    await supabaseAdmin.from('operation_logs').insert({
      operator_id: (req as any).user?.id || 'unknown',
      type: 'faq_delete',
      target_type: 'faq',
      target_id: id,
      detail: `删除FAQ: ${existing.question.slice(0, 50)}...`,
      created_at: new Date().toISOString()
    });

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('Delete faq error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '服务器错误' }
    });
  }
});

// ===========================================
// 内容管理 - 招募页配置
// ===========================================

/**
 * GET /api/admin/recruit-settings
 * 获取招募页配置
 */
router.get('/recruit-settings', async (req: Request, res: Response) => {
  try {
    const { data: settings } = await supabaseAdmin
      .from('settings')
      .select('key, value')
      .like('key', 'recruit_%');

    const config: Record<string, any> = {
      title: '成为我们的合伙人',
      description: '加入我们，共享财富盛宴。名酒商城为您提供优质的货源、丰厚的佣金和全方位的支持。',
      imageUrl: 'https://images.unsplash.com/photo-1556761175-5973dc0f32d7?auto=format&fit=crop&q=80&w=1200',
      benefits: [
        '高额佣金回报',
        '专属客服支持',
        '定期培训指导',
        '一件代发，零库存压力'
      ]
    };

    settings?.forEach(s => {
      try {
        const key = s.key.replace('recruit_', '');
        config[key] = JSON.parse(s.value);
      } catch {
        // ignore
      }
    });

    res.json({ success: true, data: config });
  } catch (error) {
    console.error('Get recruit settings error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '服务器错误' }
    });
  }
});

/**
 * PUT /api/admin/recruit-settings
 * 更新招募页配置
 */
router.put('/recruit-settings', async (req: Request, res: Response) => {
  try {
    const { title, description, imageUrl, benefits } = req.body;

    const updates: Array<{ key: string; value: string }> = [];

    if (title !== undefined) {
      updates.push({ key: 'recruit_title', value: JSON.stringify(escapeHtml(String(title).slice(0, 200))) });
    }
    if (description !== undefined) {
      updates.push({ key: 'recruit_description', value: JSON.stringify(escapeHtml(String(description).slice(0, 2000))) });
    }
    if (imageUrl !== undefined) {
      updates.push({ key: 'recruit_imageUrl', value: JSON.stringify(String(imageUrl).slice(0, 500)) });
    }
    if (benefits !== undefined && Array.isArray(benefits)) {
      const sanitizedBenefits = benefits.map(b => escapeHtml(String(b).slice(0, 100))).slice(0, 10);
      updates.push({ key: 'recruit_benefits', value: JSON.stringify(sanitizedBenefits) });
    }

    if (updates.length > 0) {
      const records = updates.map(u => ({ key: u.key, value: u.value }));
      const { error } = await supabaseAdmin
        .from('settings')
        .upsert(records, { onConflict: 'key' });

      if (error) {
        console.error('Update recruit settings error:', error);
        return res.status(500).json({
          success: false,
          error: { code: 'UPDATE_ERROR', message: '更新失败' }
        });
      }
    }

    await supabaseAdmin.from('operation_logs').insert({
      operator_id: (req as any).user?.id || 'unknown',
      type: 'recruit_settings_update',
      target_type: 'settings',
      target_id: 'recruit',
      detail: '更新招募页配置',
      created_at: new Date().toISOString()
    });

    res.json({ success: true, message: '配置已保存' });
  } catch (error) {
    console.error('Update recruit settings error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '服务器错误' }
    });
  }
});

export default router;