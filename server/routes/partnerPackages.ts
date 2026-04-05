/**
 * 合伙人礼包路由
 */

import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../utils/supabase';
import { requireAuth } from '../middleware/auth';

const router = Router();

/**
 * GET /api/partner-packages
 * 获取合伙人礼包列表（公开接口）
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { data: packages, error } = await supabaseAdmin
      .from('partner_packages')
      .select('*')
      .eq('status', 'on_shelves')
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
      data: packages || []
    });
  } catch (error) {
    console.error('Get partner packages error:', error);
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
 * GET /api/partner-packages/:id
 * 获取单个礼包详情
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: packageData, error } = await supabaseAdmin
      .from('partner_packages')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !packageData) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PACKAGE_NOT_FOUND',
          message: '礼包不存在'
        }
      });
    }

    // 获取包含的商品详情
    if (packageData.includes && packageData.includes.length > 0) {
      const productIds = packageData.includes.map((item: any) => item.product_id);
      const { data: products } = await supabaseAdmin
        .from('products')
        .select('id, name, images, price')
        .in('id', productIds);

      // 合并商品信息
      const includesWithProducts = packageData.includes.map((item: any) => {
        const product = products?.find(p => p.id === item.product_id);
        return {
          ...item,
          product_name: product?.name,
          product_image: product?.images?.[0],
          product_price: product?.price
        };
      });

      packageData.includes_details = includesWithProducts;
    }

    res.json({
      success: true,
      data: packageData
    });
  } catch (error) {
    console.error('Get partner package detail error:', error);
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
 * POST /api/partner-packages/:id/buy
 * 购买合伙人礼包（需要登录）
 */
router.post('/:id/buy', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { address_id } = req.body;

    // 检查礼包
    const { data: packageData, error: packageError } = await supabaseAdmin
      .from('partner_packages')
      .select('*')
      .eq('id', id)
      .eq('status', 'on_shelves')
      .single();

    if (packageError || !packageData) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PACKAGE_NOT_FOUND',
          message: '礼包不存在或已下架'
        }
      });
    }

    // 检查库存
    if (packageData.stock <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'OUT_OF_STOCK',
          message: '礼包已售罄'
        }
      });
    }

    // 检查用户状态
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, status, is_partner')
      .eq('id', req.user!.id)
      .single();

    if (!user || user.status === 'frozen') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'USER_FROZEN',
          message: '账号已冻结'
        }
      });
    }

    // 获取地址
    let addressSnapshot = null;
    if (address_id) {
      const { data: address } = await supabaseAdmin
        .from('addresses')
        .select('*')
        .eq('id', address_id)
        .eq('user_id', req.user!.id)
        .single();
      if (address) {
        addressSnapshot = address;
      }
    }

    // 创建订单
    const orderNo = `PKG${Date.now()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        order_no: orderNo,
        user_id: req.user!.id,
        type: 'normal',
        status: 'pending_payment',
        total_amount: packageData.price,
        paid_amount: packageData.price,
        discount_amount: 0,
        address_snapshot: addressSnapshot,
        note: `购买合伙人礼包: ${packageData.name}`
      })
      .select()
      .single();

    if (orderError) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'CREATE_ORDER_FAILED',
          message: '创建订单失败'
        }
      });
    }

    // 创建订单商品项
    const orderItems = packageData.includes.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: packageData.name,
      product_image: packageData.images?.[0],
      spec: `礼包包含 × ${item.quantity}`,
      price: packageData.price,
      quantity: 1
    }));

    await supabaseAdmin
      .from('order_items')
      .insert(orderItems);

    // 更新礼包销量（使用条件更新防止超卖）
    const { data: updateResult, error: stockUpdateError } = await supabaseAdmin
      .from('partner_packages')
      .update({ sales: packageData.sales + 1, stock: packageData.stock - 1 })
      .eq('id', id)
      .gte('stock', 1) // 只有库存 >= 1 时才更新
      .select('stock');

    // 如果库存更新失败（超卖），回滚订单
    if (stockUpdateError || !updateResult || updateResult.length === 0) {
      // 删除已创建的订单
      await supabaseAdmin
        .from('order_items')
        .delete()
        .eq('order_id', order.id);
      await supabaseAdmin
        .from('orders')
        .delete()
        .eq('id', order.id);

      return res.status(400).json({
        success: false,
        error: {
          code: 'OUT_OF_STOCK',
          message: '礼包已售罄，请稍后再试'
        }
      });
    }

    res.json({
      success: true,
      data: order,
      message: '订单创建成功'
    });
  } catch (error) {
    console.error('Buy partner package error:', error);
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