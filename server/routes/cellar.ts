/**
 * 酒窖管理路由
 */

import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../utils/supabase';
import { requireAuth } from '../middleware/auth';

const router = Router();

/**
 * GET /api/cellar
 * 获取用户酒窖列表
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { page = 1, pageSize = 20, sort = 'created_at' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize as string) || 20));
    const offset = (pageNum - 1) * pageSizeNum;

    let query = supabaseAdmin
      .from('cellar_items')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user!.id);

    // 排序
    if (sort === 'quantity') {
      query = query.order('quantity', { ascending: false });
    } else if (sort === 'purchase_date') {
      query = query.order('purchase_date', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

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

    // 计算总数
    const totalQuantity = items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

    res.json({
      success: true,
      data: {
        list: items || [],
        total: count || 0,
        total_quantity: totalQuantity,
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
 * POST /api/cellar
 * 添加藏酒到酒窖（手动添加或订单完成后自动添加）
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { product_id, vintage, quantity, purchase_price, purchase_date, order_id, note } = req.body;

    if (!product_id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMS',
          message: '商品ID不能为空'
        }
      });
    }

    // 获取商品信息
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('id, name, images, price')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: '商品不存在'
        }
      });
    }

    // 检查是否已有该商品在酒窖中
    const { data: existingItem } = await supabaseAdmin
      .from('cellar_items')
      .select('*')
      .eq('user_id', req.user!.id)
      .eq('product_id', product_id)
      .eq('vintage', vintage || null)
      .single();

    if (existingItem) {
      // 更新数量
      const { data: updatedItem, error: updateError } = await supabaseAdmin
        .from('cellar_items')
        .update({
          quantity: existingItem.quantity + (quantity || 1),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingItem.id)
        .select()
        .single();

      if (updateError) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'UPDATE_FAILED',
            message: '更新失败'
          }
        });
      }

      return res.json({
        success: true,
        data: updatedItem,
        message: '藏酒数量已更新'
      });
    }

    // 创建新的藏酒记录
    const { data: newItem, error: insertError } = await supabaseAdmin
      .from('cellar_items')
      .insert({
        user_id: req.user!.id,
        product_id,
        product_name: product.name,
        product_image: product.images?.[0],
        vintage,
        quantity: quantity || 1,
        purchase_price: purchase_price || product.price,
        purchase_date: purchase_date ? new Date(purchase_date).toISOString() : new Date().toISOString(),
        order_id,
        note
      })
      .select()
      .single();

    if (insertError) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'INSERT_FAILED',
          message: '添加失败'
        }
      });
    }

    res.json({
      success: true,
      data: newItem,
      message: '藏酒已添加到酒窖'
    });
  } catch (error) {
    console.error('Add cellar item error:', error);
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
 * PUT /api/cellar/:id
 * 更新藏酒信息
 */
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { quantity, vintage, note } = req.body;

    const updateData: any = {};
    if (quantity !== undefined) updateData.quantity = quantity;
    if (vintage !== undefined) updateData.vintage = vintage;
    if (note !== undefined) updateData.note = note;
    updateData.updated_at = new Date().toISOString();

    const { data: updatedItem, error } = await supabaseAdmin
      .from('cellar_items')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .select()
      .single();

    if (error || !updatedItem) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ITEM_NOT_FOUND',
          message: '藏酒不存在'
        }
      });
    }

    res.json({
      success: true,
      data: updatedItem,
      message: '更新成功'
    });
  } catch (error) {
    console.error('Update cellar item error:', error);
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
 * DELETE /api/cellar/:id
 * 从酒窖删除藏酒
 */
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('cellar_items')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user!.id);

    if (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'DELETE_FAILED',
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

/**
 * GET /api/cellar/stats
 * 获取酒窖统计信息
 */
router.get('/stats', requireAuth, async (req: Request, res: Response) => {
  try {
    const { data: items, error } = await supabaseAdmin
      .from('cellar_items')
      .select('quantity, purchase_price')
      .eq('user_id', req.user!.id);

    if (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'QUERY_ERROR',
          message: '查询失败'
        }
      });
    }

    const totalQuantity = items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    const totalValue = items?.reduce((sum, item) => sum + (item.purchase_price || 0) * item.quantity, 0) || 0;
    const distinctProducts = items?.length || 0;

    res.json({
      success: true,
      data: {
        total_quantity: totalQuantity,
        total_value: totalValue,
        distinct_products: distinctProducts
      }
    });
  } catch (error) {
    console.error('Get cellar stats error:', error);
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