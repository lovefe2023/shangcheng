/**
 * 商品路由
 * 商品列表、详情、分类、搜索
 */

import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../utils/supabase';

const router = Router();

/**
 * GET /api/products
 * 商品列表（支持分页、筛选）
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      category,
      keyword,
      minPrice,
      maxPrice,
      status,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    let query = supabaseAdmin
      .from('products')
      .select('*, category:categories(id, name)', { count: 'exact' });

    // 状态筛选
    if (status) {
      query = query.eq('status', status);
    } else {
      // 默认只显示上架商品
      query = query.eq('status', 'on_shelves');
    }

    // 分类筛选
    if (category) {
      // 获取分类及其子分类
      const { data: categories } = await supabaseAdmin
        .from('categories')
        .select('id, parent_id');

      const categoryIds = [category as string];
      categories?.forEach(cat => {
        if (cat.parent_id === category) {
          categoryIds.push(cat.id);
        }
      });

      query = query.in('category_id', categoryIds);
    }

    // 关键词搜索
    if (keyword) {
      query = query.ilike('name', `%${keyword}%`);
    }

    // 价格范围
    if (minPrice) {
      query = query.gte('price', parseFloat(minPrice as string));
    }
    if (maxPrice) {
      query = query.lte('price', parseFloat(maxPrice as string));
    }

    // 排序
    const validSortFields = ['created_at', 'price', 'sales'];
    const sortField = validSortFields.includes(sortBy as string) ? sortBy as string : 'created_at';
    const order = sortOrder === 'asc' ? true : false;
    query = query.order(sortField, { ascending: order });

    // 分页
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize as string) || 20));
    const offset = (pageNum - 1) * pageSizeNum;

    query = query.range(offset, offset + pageSizeNum - 1);

    const { data: products, error, count } = await query;

    if (error) {
      console.error('Get products error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'QUERY_ERROR',
          message: '查询商品失败'
        }
      });
    }

    res.json({
      success: true,
      data: {
        list: products || [],
        total: count || 0,
        page: pageNum,
        pageSize: pageSizeNum,
        totalPages: Math.ceil((count || 0) / pageSizeNum)
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
 * GET /api/products/categories
 * 分类列表 (兼容路径，重定向到 /categories/list)
 */
router.get('/categories', async (_req: Request, res: Response) => {
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
          message: '查询分类失败'
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
      if (cat.parent_id) {
        const parent = categoryMap.get(cat.parent_id);
        if (parent) {
          parent.children.push(node);
        }
      } else {
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
 * GET /api/products/categories/list
 * 分类列表 (必须在 /:id 之前)
 */
router.get('/categories/list', async (_req: Request, res: Response) => {
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
          message: '查询分类失败'
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
 * GET /api/products/search/suggest
 * 搜索建议 (必须在 /:id 之前)
 */
router.get('/search/suggest', async (req: Request, res: Response) => {
  try {
    const { keyword } = req.query;

    if (!keyword || (keyword as string).length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }

    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('id, name, price, images')
      .eq('status', 'on_shelves')
      .ilike('name', `%${keyword}%`)
      .limit(10);

    if (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'QUERY_ERROR',
          message: '搜索失败'
        }
      });
    }

    res.json({
      success: true,
      data: products || []
    });
  } catch (error) {
    console.error('Search suggest error:', error);
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
 * GET /api/products/:id
 * 商品详情
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .select(`
        *,
        category:categories(id, name, parent_id)
      `)
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

    // 获取相关的秒杀活动
    const now = new Date().toISOString();
    const { data: flashSale } = await supabaseAdmin
      .from('flash_sales')
      .select('*')
      .eq('product_id', id)
      .eq('status', 'ongoing')
      .gte('end_time', now)
      .single();

    // 获取相关的团购活动
    const { data: groupBuy } = await supabaseAdmin
      .from('group_buys')
      .select('*')
      .eq('product_id', id)
      .eq('status', 'pending')
      .single();

    res.json({
      success: true,
      data: {
        ...product,
        flash_sale: flashSale || null,
        group_buy: groupBuy || null
      }
    });
  } catch (error) {
    console.error('Get product detail error:', error);
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