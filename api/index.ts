/**
 * Vercel Serverless API - 诊断版
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const path = req.url?.replace('/api', '') || '/';

  try {
    // 初始化 Supabase
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return res.status(500).json({
        success: false,
        error: 'Missing Supabase credentials',
        env_check: {
          has_url: !!supabaseUrl,
          has_key: !!serviceKey
        }
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // 路由处理
    if (path === '/health' || path === '/') {
      return res.json({ status: 'ok', timestamp: new Date().toISOString() });
    }

    // 商品列表
    if (path === '/products') {
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(id, name)', { count: 'exact' })
        .eq('status', 'on_shelves')
        .limit(20);

      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }

      return res.json({ success: true, data: { list: data, total: data?.length || 0 } });
    }

    // 轮播图
    if (path === '/banners') {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('status', 'visible')
        .order('sort_order');

      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }

      return res.json({ success: true, data });
    }

    // 秒杀活动
    if (path === '/flash-sales') {
      const { data, error } = await supabase
        .from('flash_sales')
        .select('*, product:products(id, name, images, original_price)');

      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }

      return res.json({ success: true, data });
    }

    // 分类列表
    if (path === '/products/categories/list' || path === '/categories') {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order');

      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }

      return res.json({ success: true, data });
    }

    // 商品详情
    const productMatch = path.match(/^\/products\/([a-f0-9-]+)$/);
    if (productMatch) {
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(id, name)')
        .eq('id', productMatch[1])
        .single();

      if (error) {
        return res.status(404).json({ success: false, error: '商品不存在' });
      }

      return res.json({ success: true, data });
    }

    return res.status(404).json({ success: false, error: 'Not found', path });

  } catch (err: any) {
    console.error('API Error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Server error',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}