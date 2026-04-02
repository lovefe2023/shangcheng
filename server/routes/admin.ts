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

    res.json({
      success: true,
      data: {
        list: orders || [],
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

    let query = supabaseAdmin
      .from('users')
      .select('*', { count: 'exact' });

    if (keyword) {
      query = query.or(`name.ilike.%${keyword}%,phone.ilike.%${keyword}%,id.ilike.%${keyword}%`);
    }
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
 * PUT /api/admin/users/:id/status
 * 更新用户状态
 */
router.put('/users/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'frozen'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: '无效的状态'
        }
      });
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update({ status })
      .eq('id', id);

    if (error) {
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
      message: '更新成功'
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
      .select('*', { count: 'exact' })
      .eq('is_partner', true);

    if (keyword) {
      query = query.or(`name.ilike.%${keyword}%,phone.ilike.%${keyword}%`);
    }
    if (level) {
      query = query.eq('partner_level', level);
    }
    if (status) {
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

    res.json({
      success: true,
      data: {
        list: partners || [],
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
      query = query.or(`withdrawal_no.ilike.%${keyword}%`);
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

    const now = new Date().toISOString();

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
      return res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: '处理失败'
        }
      });
    }

    // 如果拒绝，退还余额
    if (status === 'rejected') {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('balance')
        .eq('id', withdrawal.user_id)
        .single();

      if (user) {
        await supabaseAdmin
          .from('users')
          .update({ balance: user.balance + withdrawal.amount })
          .eq('id', withdrawal.user_id);
      }
    }

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

    let query = supabaseAdmin
      .from('cellar_items')
      .select('*, user:users(id, name, phone), product:products(id, name, images)', { count: 'exact' });

    if (user_id) {
      query = query.eq('user_id', user_id);
    }
    if (keyword) {
      query = query.or(`product_name.ilike.%${keyword}%`);
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

    // 统计数据
    const { data: stats } = await supabaseAdmin
      .from('cellar_items')
      .select('quantity, purchase_price');

    const totalQuantity = stats?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    const totalValue = stats?.reduce((sum, item) => sum + (item.purchase_price || 0) * item.quantity, 0) || 0;

    res.json({
      success: true,
      data: {
        list: items || [],
        total: count || 0,
        stats: {
          total_quantity: totalQuantity,
          total_value: totalValue,
          distinct_products: stats?.length || 0
        },
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

    const { error } = await supabaseAdmin
      .from('cellar_items')
      .delete()
      .eq('id', id);

    if (error) {
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
      .select('*', { count: 'exact' });

    if (type) {
      query = query.eq('type', type);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (start_date) {
      query = query.gte('created_at', start_date);
    }
    if (end_date) {
      query = query.lte('created_at', end_date);
    }
    if (keyword) {
      query = query.or(`user_id.ilike.%${keyword}%`);
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

    // 获取合伙人销售数据
    const { data: partners } = await supabaseAdmin
      .from('users')
      .select('id, name, phone, partner_level, team_sales, personal_sales')
      .eq('is_partner', true)
      .order('team_sales', { ascending: false })
      .limit(parseInt(limit as string) || 50);

    // 获取每个合伙人的累计收益
    const { data: earnings } = await supabaseAdmin
      .from('income_records')
      .select('user_id, amount')
      .eq('status', 'completed');

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
      } catch {
        // ignore parse error
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

    const updates: Array<{ key: string; value: string }> = [];

    if (sales_rewards) {
      updates.push({ key: 'leaderboard_sales_rewards', value: JSON.stringify(sales_rewards) });
    }
    if (income_rewards) {
      updates.push({ key: 'leaderboard_income_rewards', value: JSON.stringify(income_rewards) });
    }
    if (period_weights) {
      updates.push({ key: 'leaderboard_period_weights', value: JSON.stringify(period_weights) });
    }
    if (display_settings) {
      updates.push({ key: 'leaderboard_display_settings', value: JSON.stringify(display_settings) });
    }

    for (const update of updates) {
      await supabaseAdmin
        .from('settings')
        .upsert({ key: update.key, value: update.value }, { onConflict: 'key' });
    }

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
    const settings = req.body;

    for (const [key, value] of Object.entries(settings)) {
      await supabaseAdmin
        .from('settings')
        .upsert({ key, value: String(value) }, { onConflict: 'key' });
    }

    res.json({
      success: true,
      message: '设置已保存'
    });
  } catch (error) {
    console.error('Update settings error:', error);
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
 * GET /api/admin/operation-logs
 * 获取操作日志
 */
router.get('/operation-logs', async (req: Request, res: Response) => {
  try {
    const { page = 1, pageSize = 20, operator, type, date } = req.query;

    // 由于没有操作日志表，返回示例数据
    // 在实际项目中应该从操作日志表查询
    const logs = [
      {
        id: '1',
        date: new Date().toISOString().replace('T', ' ').slice(0, 19),
        operator: 'admin',
        operator_id: 'admin',
        type: '系统登录',
        detail: '管理员登录系统',
        ip: '127.0.0.1'
      }
    ];

    res.json({
      success: true,
      data: {
        list: logs,
        total: logs.length,
        page: parseInt(page as string) || 1,
        pageSize: parseInt(pageSize as string) || 20
      }
    });
  } catch (error) {
    console.error('Get operation logs error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '服务器错误'
      }
    });
  }
});

export default router;