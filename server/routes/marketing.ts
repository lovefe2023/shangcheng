/**
 * 营销路由
 * 优惠券、秒杀、团购
 */

import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../utils/supabase';
import { requireAuth } from '../middleware/auth';

const router = Router();

// ===========================================
// 优惠券
// ===========================================

/**
 * GET /api/coupons
 * 可领取的优惠券列表
 */
router.get('/coupons', async (req: Request, res: Response) => {
  try {
    const now = new Date().toISOString();

    const { data: coupons, error } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .eq('status', 'distributing')
      .gte('end_time', now)
      .order('created_at', { ascending: false });

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
      data: coupons || []
    });
  } catch (error) {
    console.error('Get coupons error:', error);
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
 * POST /api/coupons/:id/claim
 * 领取优惠券
 */
router.post('/coupons/:id/claim', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 检查优惠券
    const { data: coupon, error: couponError } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .eq('id', id)
      .eq('status', 'distributing')
      .single();

    if (couponError || !coupon) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'COUPON_NOT_FOUND',
          message: '优惠券不存在或已结束'
        }
      });
    }

    // 检查是否已领取
    const { data: existingCoupon } = await supabaseAdmin
      .from('user_coupons')
      .select('*')
      .eq('user_id', req.user!.id)
      .eq('coupon_id', id)
      .single();

    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_CLAIMED',
          message: '您已领取过该优惠券'
        }
      });
    }

    // 检查库存
    if (coupon.used_count >= coupon.total_count) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'COUPON_SOLD_OUT',
          message: '优惠券已领完'
        }
      });
    }

    // 领取优惠券
    const { error: insertError } = await supabaseAdmin
      .from('user_coupons')
      .insert({
        user_id: req.user!.id,
        coupon_id: id,
        status: 'unused'
      });

    if (insertError) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'CLAIM_FAILED',
          message: '领取失败'
        }
      });
    }

    // 更新已领取数量
    await supabaseAdmin
      .from('coupons')
      .update({ used_count: coupon.used_count + 1 })
      .eq('id', id);

    res.json({
      success: true,
      message: '领取成功'
    });
  } catch (error) {
    console.error('Claim coupon error:', error);
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
 * GET /api/my-coupons
 * 我的优惠券
 */
router.get('/my-coupons', requireAuth, async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    let query = supabaseAdmin
      .from('user_coupons')
      .select('*, coupon:coupons(*)')
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: coupons, error } = await query;

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
      data: coupons || []
    });
  } catch (error) {
    console.error('Get my coupons error:', error);
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
// 秒杀活动
// ===========================================

/**
 * GET /api/flash-sales
 * 秒杀活动列表
 */
router.get('/flash-sales', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    let query = supabaseAdmin
      .from('flash_sales')
      .select(`
        *,
        product:products(id, name, images, original_price)
      `)
      .order('start_time', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: flashSales, error } = await query;

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
      data: flashSales || []
    });
  } catch (error) {
    console.error('Get flash sales error:', error);
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
// 团购活动
// ===========================================

/**
 * GET /api/group-buys
 * 团购活动列表
 */
router.get('/group-buys', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    let query = supabaseAdmin
      .from('group_buys')
      .select(`
        *,
        product:products(id, name, images, original_price)
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: groupBuys, error } = await query;

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
      data: groupBuys || []
    });
  } catch (error) {
    console.error('Get group buys error:', error);
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
// 其他公开接口
// ===========================================

/**
 * GET /api/banners
 * 获取轮播图
 */
router.get('/banners', async (req: Request, res: Response) => {
  try {
    const { data: banners, error } = await supabaseAdmin
      .from('banners')
      .select('*')
      .eq('status', 'visible')
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

    res.json({
      success: true,
      data: banners || []
    });
  } catch (error) {
    console.error('Get banners error:', error);
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
 * GET /api/notifications
 * 获取公告
 */
router.get('/notifications', async (req: Request, res: Response) => {
  try {
    const { type } = req.query;

    let query = supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    const { data: notifications, error } = await query;

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
      data: notifications || []
    });
  } catch (error) {
    console.error('Get notifications error:', error);
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
 * GET /api/addresses
 * 获取用户地址列表
 */
router.get('/addresses', requireAuth, async (req: Request, res: Response) => {
  try {
    const { data: addresses, error } = await supabaseAdmin
      .from('addresses')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

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
      data: addresses || []
    });
  } catch (error) {
    console.error('Get addresses error:', error);
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
 * POST /api/addresses
 * 新增地址
 */
router.post('/addresses', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, phone, province, city, district, detail, is_default } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMS',
          message: '姓名和手机号不能为空'
        }
      });
    }

    // 如果设为默认，取消其他默认地址
    if (is_default) {
      await supabaseAdmin
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', req.user!.id);
    }

    const { data: address, error } = await supabaseAdmin
      .from('addresses')
      .insert({
        user_id: req.user!.id,
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

    if (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'INSERT_ERROR',
          message: '添加失败'
        }
      });
    }

    res.json({
      success: true,
      data: address
    });
  } catch (error) {
    console.error('Add address error:', error);
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
 * PUT /api/addresses/:id
 * 更新地址
 */
router.put('/addresses/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, phone, province, city, district, detail, is_default } = req.body;

    // 如果设为默认，取消其他默认地址
    if (is_default) {
      await supabaseAdmin
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', req.user!.id);
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (province !== undefined) updateData.province = province;
    if (city !== undefined) updateData.city = city;
    if (district !== undefined) updateData.district = district;
    if (detail !== undefined) updateData.detail = detail;
    if (is_default !== undefined) updateData.is_default = is_default;

    const { error } = await supabaseAdmin
      .from('addresses')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', req.user!.id);

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
    console.error('Update address error:', error);
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
 * DELETE /api/addresses/:id
 * 删除地址
 */
router.delete('/addresses/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('addresses')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user!.id);

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
    console.error('Delete address error:', error);
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