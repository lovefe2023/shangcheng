/**
 * 酒窖管理路由
 */

import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../utils/supabase';
import { requireAuth } from '../middleware/auth';

const router = Router();

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
 * LIKE 查询模式安全化，防止 SQL 注入
 */
const sanitizeLikePattern = (str: string): string => {
  return str.replace(/[%_\\]/g, '\\$&');
};

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
 * 使用原子操作防止并发竞态条件
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { product_id, vintage, quantity, purchase_price, purchase_date, order_id, note } = req.body;

    // 参数验证
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
    const quantityNum = Math.max(1, Math.min(1000, parseInt(quantity) || 1));
    if (quantityNum < 1) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMS',
          message: '数量必须大于0'
        }
      });
    }

    // 验证购买价格
    let purchasePriceNum = purchase_price ? parseFloat(purchase_price) : null;
    if (purchasePriceNum !== null && (isNaN(purchasePriceNum) || purchasePriceNum < 0 || purchasePriceNum > 9999999.99)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMS',
          message: '购买价格无效'
        }
      });
    }

    // 验证年份格式
    if (vintage && !/^\d{4}(-\d{4})?$/.test(vintage)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMS',
          message: '年份格式无效，应为YYYY或YYYY-YYYY'
        }
      });
    }

    // 验证备注长度并转义HTML防止XSS
    const sanitizedNote = note ? (typeof note === 'string' ? escapeHtml(note.slice(0, 500)) : '') : null;

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

    // 使用数据库函数进行原子操作（防止竞态条件）
    const { data: result, error: rpcError } = await supabaseAdmin.rpc('upsert_cellar_item', {
      p_user_id: req.user!.id,
      p_product_id: product_id,
      p_product_name: product.name,
      p_product_image: product.images?.[0] || null,
      p_vintage: vintage || null,
      p_quantity: quantityNum,
      p_purchase_price: purchasePriceNum || product.price,
      p_purchase_date: purchase_date ? new Date(purchase_date).toISOString() : new Date().toISOString(),
      p_order_id: order_id || null,
      p_note: sanitizedNote
    });

    if (rpcError) {
      console.error('Upsert cellar item error:', rpcError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'UPSERT_FAILED',
          message: '添加失败'
        }
      });
    }

    const action = result?.action || 'inserted';
    const item = result?.item;

    res.json({
      success: true,
      data: item,
      message: action === 'updated' ? '藏酒数量已更新' : '藏酒已添加到酒窖'
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

    const updateData: any = {};

    // 数量验证
    if (quantity !== undefined) {
      const quantityNum = parseInt(quantity);
      if (isNaN(quantityNum) || quantityNum < 1 || quantityNum > 1000) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMS',
            message: '数量必须在1-1000之间'
          }
        });
      }
      updateData.quantity = quantityNum;
    }

    // 年份验证
    if (vintage !== undefined) {
      if (vintage && !/^\d{4}(-\d{4})?$/.test(vintage)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMS',
            message: '年份格式无效'
          }
        });
      }
      updateData.vintage = vintage || null;
    }

    // 备注验证并转义HTML防止XSS
    if (note !== undefined) {
      updateData.note = note ? (typeof note === 'string' ? escapeHtml(note.slice(0, 500)) : '') : null;
    }

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

    const { data: deletedItem, error } = await supabaseAdmin
      .from('cellar_items')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .select()
      .single();

    if (error || !deletedItem) {
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
 * 获取酒窖统计信息（使用数据库聚合函数优化性能）
 */
router.get('/stats', requireAuth, async (req: Request, res: Response) => {
  try {
    const { data: result, error } = await supabaseAdmin.rpc('get_user_cellar_stats', {
      p_user_id: req.user!.id
    });

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
      data: result || {
        total_quantity: 0,
        total_value: 0,
        distinct_products: 0
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