/**
 * 订单路由
 * 购物车、订单管理
 */

import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../utils/supabase';
import { requireAuth } from '../middleware/auth';

const router = Router();

// ===========================================
// 购物车相关
// ===========================================

/**
 * GET /api/orders/cart
 * 获取购物车
 */
router.get('/cart', requireAuth, async (req: Request, res: Response) => {
  try {
    const { data: cartItems, error } = await supabaseAdmin
      .from('cart_items')
      .select(`
        *,
        product:products(id, name, price, images, stock, status)
      `)
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'QUERY_ERROR',
          message: '获取购物车失败'
        }
      });
    }

    // 计算总价
    let totalAmount = 0;
    const items = cartItems?.map(item => {
      const price = item.product?.price || 0;
      totalAmount += price * item.quantity;
      return {
        ...item,
        subtotal: price * item.quantity,
        is_valid: item.product && item.product.status === 'on_shelves' && item.product.stock >= item.quantity
      };
    }) || [];

    res.json({
      success: true,
      data: {
        items,
        total_amount: totalAmount,
        item_count: items.length
      }
    });
  } catch (error) {
    console.error('Get cart error:', error);
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
 * POST /api/orders/cart
 * 添加到购物车
 */
router.post('/cart', requireAuth, async (req: Request, res: Response) => {
  try {
    const { product_id, spec, quantity = 1 } = req.body;

    if (!product_id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMS',
          message: '商品ID不能为空'
        }
      });
    }

    // 检查商品是否存在且上架
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', product_id)
      .eq('status', 'on_shelves')
      .single();

    if (productError || !product) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: '商品不存在或已下架'
        }
      });
    }

    // 检查购物车中是否已有该商品
    const { data: existingItem } = await supabaseAdmin
      .from('cart_items')
      .select('*')
      .eq('user_id', req.user!.id)
      .eq('product_id', product_id)
      .eq('spec', spec || null)
      .single();

    if (existingItem) {
      // 更新数量
      const newQuantity = existingItem.quantity + quantity;
      const { error: updateError } = await supabaseAdmin
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', existingItem.id);

      if (updateError) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'UPDATE_ERROR',
            message: '更新购物车失败'
          }
        });
      }
    } else {
      // 新增购物车项
      const { error: insertError } = await supabaseAdmin
        .from('cart_items')
        .insert({
          user_id: req.user!.id,
          product_id,
          spec,
          quantity
        });

      if (insertError) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'INSERT_ERROR',
            message: '添加到购物车失败'
          }
        });
      }
    }

    res.json({
      success: true,
      message: '已添加到购物车'
    });
  } catch (error) {
    console.error('Add to cart error:', error);
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
 * PUT /api/orders/cart/:id
 * 更新购物车项
 */
router.put('/cart/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { quantity, selected } = req.body;

    const updateData: any = {};
    if (quantity !== undefined) updateData.quantity = Math.max(1, quantity);
    if (selected !== undefined) updateData.selected = selected;

    const { error } = await supabaseAdmin
      .from('cart_items')
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
    console.error('Update cart error:', error);
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
 * DELETE /api/orders/cart/:id
 * 删除购物车项
 */
router.delete('/cart/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('cart_items')
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
      message: '已从购物车移除'
    });
  } catch (error) {
    console.error('Delete cart item error:', error);
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
// 订单相关
// ===========================================

/**
 * GET /api/orders
 * 订单列表
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { status, page = 1, pageSize = 10 } = req.query;

    let query = supabaseAdmin
      .from('orders')
      .select('*, items:order_items(*)', { count: 'exact' })
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    // 分页
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const pageSizeNum = Math.min(50, Math.max(1, parseInt(pageSize as string) || 10));
    const offset = (pageNum - 1) * pageSizeNum;

    query = query.range(offset, offset + pageSizeNum - 1);

    const { data: orders, error, count } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'QUERY_ERROR',
          message: '查询订单失败'
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
 * GET /api/orders/:id
 * 订单详情
 */
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        items:order_items(*),
        referrer:users!orders_referrer_id_fkey(id, name, phone)
      `)
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (error || !order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: '订单不存在'
        }
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order detail error:', error);
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
 * POST /api/orders
 * 创建订单
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      address_id,
      cart_item_ids,
      coupon_id,
      note,
      referrer_id
    } = req.body;

    // 获取购物车项
    let cartQuery = supabaseAdmin
      .from('cart_items')
      .select('*, product:products(*)')
      .eq('user_id', req.user!.id)
      .eq('selected', true);

    if (cart_item_ids && cart_item_ids.length > 0) {
      cartQuery = cartQuery.in('id', cart_item_ids);
    }

    const { data: cartItems, error: cartError } = await cartQuery;

    if (cartError || !cartItems || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CART_EMPTY',
          message: '购物车为空'
        }
      });
    }

    // 验证商品库存
    for (const item of cartItems) {
      if (!item.product || item.product.status !== 'on_shelves') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'PRODUCT_INVALID',
            message: `商品 ${item.product?.name || '未知商品'} 已下架`
          }
        });
      }
      if (item.product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'STOCK_INSUFFICIENT',
            message: `商品 ${item.product.name} 库存不足`
          }
        });
      }
    }

    // 获取地址
    const { data: address, error: addressError } = await supabaseAdmin
      .from('addresses')
      .select('*')
      .eq('id', address_id)
      .eq('user_id', req.user!.id)
      .single();

    if (addressError || !address) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ADDRESS_INVALID',
          message: '请选择收货地址'
        }
      });
    }

    // 计算金额
    let totalAmount = 0;
    const orderItems = cartItems.map(item => {
      const price = item.product.price;
      totalAmount += price * item.quantity;
      return {
        product_id: item.product_id,
        product_name: item.product.name,
        product_image: item.product.images?.[0] || '',
        spec: item.spec,
        price,
        quantity: item.quantity
      };
    });

    // 优惠券折扣
    let discountAmount = 0;
    if (coupon_id) {
      const { data: userCoupon } = await supabaseAdmin
        .from('user_coupons')
        .select('*, coupon:coupons(*)')
        .eq('id', coupon_id)
        .eq('user_id', req.user!.id)
        .eq('status', 'unused')
        .single();

      if (userCoupon && userCoupon.coupon) {
        if (userCoupon.coupon.min_amount <= totalAmount) {
          discountAmount = userCoupon.coupon.discount_amount || 0;
        }
      }
    }

    const paidAmount = totalAmount - discountAmount;

    // 生成订单号
    const orderNo = `ORD${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // 创建订单
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        order_no: orderNo,
        user_id: req.user!.id,
        status: 'pending_payment',
        total_amount: totalAmount,
        paid_amount: paidAmount,
        discount_amount: discountAmount,
        address_snapshot: {
          name: address.name,
          phone: address.phone,
          province: address.province,
          city: address.city,
          district: address.district,
          detail: address.detail
        },
        referrer_id,
        note
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('Create order error:', orderError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'ORDER_CREATE_FAILED',
          message: '创建订单失败'
        }
      });
    }

    // 创建订单商品
    const orderItemsData = orderItems.map(item => ({
      ...item,
      order_id: order.id
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItemsData);

    if (itemsError) {
      console.error('Create order items error:', itemsError);
      // 回滚订单
      await supabaseAdmin.from('orders').delete().eq('id', order.id);
      return res.status(500).json({
        success: false,
        error: {
          code: 'ORDER_ITEMS_FAILED',
          message: '创建订单商品失败'
        }
      });
    }

    // 删除购物车项
    await supabaseAdmin
      .from('cart_items')
      .delete()
      .in('id', cartItems.map(item => item.id));

    // 使用优惠券
    if (coupon_id) {
      await supabaseAdmin
        .from('user_coupons')
        .update({ status: 'used', used_at: new Date().toISOString(), order_id: order.id })
        .eq('id', coupon_id);
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Create order error:', error);
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
 * PUT /api/orders/:id/cancel
 * 取消订单
 */
router.put('/:id/cancel', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: order, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (fetchError || !order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: '订单不存在'
        }
      });
    }

    if (order.status !== 'pending_payment') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_CANCEL',
          message: '当前订单状态不能取消'
        }
      });
    }

    const { error } = await supabaseAdmin
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'CANCEL_FAILED',
          message: '取消订单失败'
        }
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
      error: {
        code: 'SERVER_ERROR',
        message: '服务器错误'
      }
    });
  }
});

/**
 * PUT /api/orders/:id/confirm
 * 确认收货
 */
router.put('/:id/confirm', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: order, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (fetchError || !order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: '订单不存在'
        }
      });
    }

    if (order.status !== 'shipped') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_CONFIRM',
          message: '当前订单状态不能确认收货'
        }
      });
    }

    const now = new Date().toISOString();
    const { error } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'completed',
        completed_at: now
      })
      .eq('id', id);

    if (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'CONFIRM_FAILED',
          message: '确认收货失败'
        }
      });
    }

    // 处理佣金
    if (order.referrer_id && order.sales_commission > 0) {
      await supabaseAdmin.from('income_records').insert({
        user_id: order.referrer_id,
        type: 'sales_commission',
        amount: order.sales_commission,
        status: 'settled',
        order_id: order.id,
        source_user_id: order.user_id,
        description: '销售提成'
      });

      // 更新用户余额
      await supabaseAdmin.rpc('increment_user_balance', {
        user_id: order.referrer_id,
        amount: order.sales_commission
      });
    }

    res.json({
      success: true,
      message: '已确认收货'
    });
  } catch (error) {
    console.error('Confirm order error:', error);
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
 * PUT /api/orders/:id/pay
 * 支付订单（模拟支付）
 */
router.put('/:id/pay', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log('Pay order request - order_id:', id, 'user_id:', req.user!.id);

    const { data: order, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    console.log('Fetch order result - error:', fetchError, 'order:', order ? 'found' : 'not found');

    if (fetchError || !order) {
      console.log('Order not found for user');
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: '订单不存在'
        }
      });
    }

    console.log('Order status:', order.status);

    if (order.status !== 'pending_payment') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_PAY',
          message: '当前订单状态不能支付'
        }
      });
    }

    // 更新订单状态为待发货，并设置支付时间
    const updateData = {
      status: 'pending_shipment',
      payment_time: new Date().toISOString()
    };
    console.log('Updating order with:', updateData);

    const { error } = await supabaseAdmin
      .from('orders')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Pay order update error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'PAY_FAILED',
          message: '支付失败: ' + error.message
        }
      });
    }

    console.log('Payment successful for order:', id);
    res.json({
      success: true,
      message: '支付成功'
    });
  } catch (error) {
    console.error('Pay order error:', error);
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