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

    // 验证数量
    const validQuantity = Math.max(1, Math.floor(quantity));
    if (validQuantity !== quantity) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_QUANTITY',
          message: '数量必须为正整数'
        }
      });
    }

    // 检查商品是否存在且上架
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('id, name, stock, status')
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
    // 构建查询，正确处理 null spec
    let query = supabaseAdmin
      .from('cart_items')
      .select('*')
      .eq('user_id', req.user!.id)
      .eq('product_id', product_id);

    if (spec) {
      query = query.eq('spec', spec);
    } else {
      query = query.is('spec', null);
    }

    const { data: existingItems, error: queryError } = await query;

    // 如果查询出错或找到多个重复项，取第一个并清理其他重复项
    let existingItem = existingItems?.[0];

    if (existingItems && existingItems.length > 1) {
      // 发现多个重复项，清理多余的
      const duplicateIds = existingItems.slice(1).map(item => item.id);
      await supabaseAdmin
        .from('cart_items')
        .delete()
        .in('id', duplicateIds);
      // 合并重复项的数量
      const totalQuantity = existingItems.reduce((sum, item) => sum + item.quantity, 0);
      await supabaseAdmin
        .from('cart_items')
        .update({ quantity: Math.min(totalQuantity, product.stock) })
        .eq('id', existingItem.id);
      existingItem = { ...existingItem, quantity: Math.min(totalQuantity, product.stock) };
    }

    if (existingItem) {
      // 更新数量 - 验证不超过库存
      const newQuantity = existingItem.quantity + validQuantity;
      if (newQuantity > product.stock) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'QUANTITY_EXCEEDS_STOCK',
            message: `库存不足，当前库存 ${product.stock} 件，购物车已有 ${existingItem.quantity} 件`,
            stock: product.stock,
            cart_quantity: existingItem.quantity
          }
        });
      }

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
      // 新增购物车项 - 验证不超过库存
      if (validQuantity > product.stock) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'QUANTITY_EXCEEDS_STOCK',
            message: `库存不足，当前库存 ${product.stock} 件`,
            stock: product.stock
          }
        });
      }

      const { error: insertError } = await supabaseAdmin
        .from('cart_items')
        .insert({
          user_id: req.user!.id,
          product_id,
          spec,
          quantity: validQuantity
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

    // 如果更新数量，需要验证库存
    if (quantity !== undefined) {
      // 获取购物车项和商品信息
      const { data: cartItem, error: cartError } = await supabaseAdmin
        .from('cart_items')
        .select(`
          id,
          product_id,
          product:products(id, name, stock, status)
        `)
        .eq('id', id)
        .eq('user_id', req.user!.id)
        .single();

      if (cartError || !cartItem) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'CART_ITEM_NOT_FOUND',
            message: '购物车项不存在'
          }
        });
      }

      const product = cartItem.product as any;

      // 验证商品状态
      if (!product || product.status !== 'on_shelves') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'PRODUCT_NOT_AVAILABLE',
            message: '商品已下架或不存在'
          }
        });
      }

      // 验证库存
      const validQuantity = Math.max(1, Math.min(quantity, product.stock));
      if (validQuantity !== quantity) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'QUANTITY_EXCEEDS_STOCK',
            message: `库存不足，最多可购买 ${product.stock} 件`,
            max_quantity: product.stock
          }
        });
      }
    }

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
 * GET /api/orders/stats
 * 获取订单统计
 */
router.get('/stats', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // 统计各状态订单数量
    const { data: pendingPayment } = await supabaseAdmin
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'pending_payment');

    const { data: pendingShipment } = await supabaseAdmin
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'pending_shipment');

    const { data: shipped } = await supabaseAdmin
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'shipped');

    // 待评价：已完成且未评价的订单
    const { data: completedOrders } = await supabaseAdmin
      .from('orders')
      .select('id, items:order_items(reviewed)')
      .eq('user_id', userId)
      .eq('status', 'completed');

    let toReview = 0;
    completedOrders?.forEach(order => {
      const items = order.items as any[];
      if (items && items.some(item => !item.reviewed)) {
        toReview++;
      }
    });

    res.json({
      success: true,
      data: {
        pending_payment: (pendingPayment as any)?.length || 0,
        pending_shipment: (pendingShipment as any)?.length || 0,
        shipped: (shipped as any)?.length || 0,
        to_review: toReview
      }
    });
  } catch (error) {
    console.error('Get order stats error:', error);
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
      referrer_id,
      order_type = 'normal',
      activity_id
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

    // 秒杀/团购活动信息
    let flashSaleInfo: any = null;
    let groupBuyInfo: any = null;
    let activityPrice: number | null = null;
    let activityProductId: string | null = null;

    // 处理秒杀订单
    if (order_type === 'flash_sale' && activity_id) {
      const { data: flashSale, error: flashError } = await supabaseAdmin
        .from('flash_sales')
        .select('*')
        .eq('id', activity_id)
        .eq('status', 'ongoing')
        .single();

      if (flashError || !flashSale) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'FLASH_SALE_NOT_FOUND',
            message: '秒杀活动不存在或已结束'
          }
        });
      }

      // 检查秒杀库存
      if (flashSale.stock <= 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'FLASH_SALE_SOLD_OUT',
            message: '秒杀商品已售罄'
          }
        });
      }

      // 检查用户限购
      if (flashSale.limit_per_user) {
        const { data: userFlashOrders } = await supabaseAdmin
          .from('orders')
          .select('id')
          .eq('user_id', req.user!.id)
          .eq('type', 'flash_sale')
          .like('note', `%flash_sale_id:${activity_id}%`);

        const boughtCount = userFlashOrders?.length || 0;
        const cartQuantity = cartItems.reduce((sum: number, item: any) => {
          if (item.product_id === flashSale.product_id) return sum + item.quantity;
          return sum;
        }, 0);

        if (boughtCount + cartQuantity > flashSale.limit_per_user) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'FLASH_SALE_LIMIT_EXCEEDED',
              message: `秒杀限购${flashSale.limit_per_user}件，您已购买${boughtCount}件`
            }
          });
        }
      }

      flashSaleInfo = flashSale;
      activityPrice = flashSale.flash_price;
      activityProductId = flashSale.product_id;
    }

    // 处理团购订单
    if (order_type === 'group_buy' && activity_id) {
      const { data: groupBuy, error: groupError } = await supabaseAdmin
        .from('group_buys')
        .select('*')
        .eq('id', activity_id)
        .single();

      if (groupError || !groupBuy) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'GROUP_BUY_NOT_FOUND',
            message: '团购活动不存在'
          }
        });
      }

      // 检查团购状态
      if (groupBuy.status !== 'pending') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'GROUP_BUY_NOT_ACTIVE',
            message: groupBuy.status === 'success' ? '团购已成功结束' : '团购已结束'
          }
        });
      }

      groupBuyInfo = groupBuy;
      activityPrice = groupBuy.group_price;
      activityProductId = groupBuy.product_id;
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

      // 秒杀订单验证：购物车中只能有秒杀商品
      if (order_type === 'flash_sale' && activityProductId) {
        if (item.product_id !== activityProductId) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'FLASH_SALE_PRODUCT_MISMATCH',
              message: '秒杀订单只能包含秒杀商品'
            }
          });
        }
      }

      // 团购订单验证：购物车中只能有团购商品
      if (order_type === 'group_buy' && activityProductId) {
        if (item.product_id !== activityProductId) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'GROUP_BUY_PRODUCT_MISMATCH',
              message: '团购订单只能包含团购商品'
            }
          });
        }
      }

      // 普通订单检查库存，秒杀/团购检查活动库存
      if (order_type === 'normal') {
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
    }

    // 秒杀库存检查
    if (order_type === 'flash_sale' && flashSaleInfo) {
      const totalQuantity = cartItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
      if (flashSaleInfo.stock < totalQuantity) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'FLASH_SALE_STOCK_INSUFFICIENT',
            message: `秒杀库存不足，仅剩${flashSaleInfo.stock}件`
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

    // 计算金额（支持秒杀/团购价格）
    let totalAmount = 0;
    const orderItems = cartItems.map(item => {
      // 根据订单类型决定价格
      let price = item.product.price;
      if (order_type === 'flash_sale' && activityPrice !== null && item.product_id === activityProductId) {
        price = activityPrice;
      } else if (order_type === 'group_buy' && activityPrice !== null && item.product_id === activityProductId) {
        price = activityPrice;
      }

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

    // 计算销售佣金
    let salesCommission = 0;
    if (referrer_id) {
      try {
        // 获取推荐人信息
        const { data: referrerUser } = await supabaseAdmin
          .from('users')
          .select('id, is_partner, partner_level')
          .eq('id', referrer_id)
          .single();

        // 只有合伙人才有佣金
        if (referrerUser?.is_partner && referrerUser.partner_level !== 'none') {
          // 获取佣金比例配置
          const { data: settings } = await supabaseAdmin
            .from('settings')
            .select('key, value')
            .like('key', 'partner_commission_%');

          // 根据合伙人等级获取佣金比例
          const commissionKey = `partner_commission_${referrerUser.partner_level}`;
          const commissionSetting = settings?.find(s => s.key === commissionKey);

          if (commissionSetting?.value) {
            const rate = parseFloat(commissionSetting.value) / 100; // 百分比转小数
            if (!isNaN(rate) && rate > 0) {
              salesCommission = Math.round(paidAmount * rate * 100) / 100; // 保留两位小数
            }
          } else {
            // 默认佣金比例（如果未配置）
            const defaultRates: Record<string, number> = {
              'junior': 0.05,  // 5%
              'middle': 0.10,  // 10%
              'senior': 0.15   // 15%
            };
            const defaultRate = defaultRates[referrerUser.partner_level] || 0.05;
            salesCommission = Math.round(paidAmount * defaultRate * 100) / 100;
          }
        }
      } catch (err) {
        console.error('Calculate sales commission error:', err);
        // 佣金计算失败不影响订单创建
      }
    }

    // 生成订单号
    const orderNo = `ORD${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // 构建订单备注（包含活动ID用于后续查询）
    let orderNote = note || '';
    if (order_type === 'flash_sale' && activity_id) {
      orderNote = `${orderNote} [flash_sale_id:${activity_id}]`.trim();
    }
    if (order_type === 'group_buy' && activity_id) {
      orderNote = `${orderNote} [group_buy_id:${activity_id}]`.trim();
    }

    // 创建订单
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        order_no: orderNo,
        user_id: req.user!.id,
        type: order_type,
        status: 'pending_payment',
        total_amount: totalAmount,
        paid_amount: paidAmount,
        discount_amount: discountAmount,
        sales_commission: salesCommission,
        address_snapshot: {
          name: address.name,
          phone: address.phone,
          province: address.province,
          city: address.city,
          district: address.district,
          detail: address.detail
        },
        referrer_id,
        note: orderNote
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

    // 扣减库存
    if (order_type === 'flash_sale' && flashSaleInfo) {
      // 扣减秒杀库存
      const totalQuantity = cartItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
      const { error: flashStockError } = await supabaseAdmin
        .from('flash_sales')
        .update({
          stock: flashSaleInfo.stock - totalQuantity,
          sold_count: flashSaleInfo.sold_count + totalQuantity
        })
        .eq('id', activity_id);

      if (flashStockError) {
        console.error('Flash sale stock update error:', flashStockError);
      }

      // 同时扣减商品库存
      for (const item of cartItems) {
        await supabaseAdmin
          .from('products')
          .update({
            stock: item.product.stock - item.quantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.product_id);
      }
    } else if (order_type === 'group_buy' && groupBuyInfo) {
      // 团购：更新参团人数
      const totalQuantity = cartItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
      const newCurrentQuantity = (groupBuyInfo.current_quantity || 0) + totalQuantity;

      await supabaseAdmin
        .from('group_buys')
        .update({
          current_quantity: newCurrentQuantity,
          status: newCurrentQuantity >= groupBuyInfo.min_quantity ? 'success' : 'pending'
        })
        .eq('id', activity_id);

      // 扣减商品库存
      for (const item of cartItems) {
        await supabaseAdmin
          .from('products')
          .update({
            stock: item.product.stock - item.quantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.product_id);
      }
    } else {
      // 普通订单：扣减商品库存 (使用条件更新实现原子操作，防止超卖)
      for (const item of cartItems) {
        // 使用条件更新：只有当 stock >= quantity 时才更新
        const { data: updateResult, error: stockError } = await supabaseAdmin
          .from('products')
          .update({
            stock: item.product.stock - item.quantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.product_id)
          .gte('stock', item.quantity) // 条件：库存充足
          .select('stock');

        if (stockError || !updateResult || updateResult.length === 0) {
          console.error('Stock update failed for product:', item.product_id, stockError);
          // 回滚订单和订单商品
          await supabaseAdmin.from('order_items').delete().eq('order_id', order.id);
          await supabaseAdmin.from('orders').delete().eq('id', order.id);
          return res.status(400).json({
            success: false,
            error: {
              code: 'STOCK_INSUFFICIENT',
              message: `商品 ${item.product.name} 库存不足`
            }
          });
        }
      }
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

    // 获取订单商品项以恢复库存
    const { data: orderItems } = await supabaseAdmin
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', id);

    // 恢复库存
    if (orderItems && orderItems.length > 0) {
      for (const item of orderItems) {
        await supabaseAdmin
          .from('products')
          .update({
            stock: supabaseAdmin.rpc('increment_stock', { amount: item.quantity }),
            updated_at: new Date().toISOString()
          })
          .eq('id', item.product_id);

        // 直接执行 SQL 更新库存（更可靠的方式）
        await supabaseAdmin.rpc('increment_product_stock', {
          p_product_id: item.product_id,
          p_quantity: item.quantity
        });
      }
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

// ===========================================
// 退款相关
// ===========================================

/**
 * POST /api/orders/:id/refund
 * 申请退款
 */
router.post('/:id/refund', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // 验证订单
    const { data: order, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (fetchError || !order) {
      return res.status(404).json({
        success: false,
        error: { code: 'ORDER_NOT_FOUND', message: '订单不存在' }
      });
    }

    // 只有已支付或已发货的订单可以申请退款
    if (!['pending_shipment', 'shipped'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        error: { code: 'CANNOT_REFUND', message: '当前订单状态无法申请退款' }
      });
    }

    // 检查是否已有退款申请
    const { data: existingRefund } = await supabaseAdmin
      .from('refunds')
      .select('id')
      .eq('order_id', id)
      .eq('status', 'pending')
      .single();

    if (existingRefund) {
      return res.status(400).json({
        success: false,
        error: { code: 'REFUND_EXISTS', message: '该订单已有待处理的退款申请' }
      });
    }

    // 创建退款记录
    const { data: refund, error: refundError } = await supabaseAdmin
      .from('refunds')
      .insert({
        order_id: id,
        user_id: req.user!.id,
        amount: order.paid_amount,
        reason: reason || '用户申请退款',
        status: 'pending'
      })
      .select()
      .single();

    if (refundError) {
      console.error('Create refund error:', refundError);
      return res.status(500).json({
        success: false,
        error: { code: 'REFUND_CREATE_FAILED', message: '创建退款申请失败' }
      });
    }

    // 更新订单状态为退款中
    await supabaseAdmin
      .from('orders')
      .update({ status: 'refunding' })
      .eq('id', id);

    res.json({
      success: true,
      data: refund,
      message: '退款申请已提交，请等待审核'
    });
  } catch (error) {
    console.error('Request refund error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '服务器错误' }
    });
  }
});

/**
 * GET /api/orders/:id/refund
 * 获取订单退款信息
 */
router.get('/:id/refund', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: refund, error } = await supabaseAdmin
      .from('refunds')
      .select('*')
      .eq('order_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !refund) {
      return res.json({
        success: true,
        data: null
      });
    }

    res.json({
      success: true,
      data: refund
    });
  } catch (error) {
    console.error('Get refund error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '服务器错误' }
    });
  }
});

export default router;