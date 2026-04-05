/**
 * Vercel Serverless Function 入口
 */

import express from 'express';
import cors from 'cors';

// 简单测试
const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// 健康检查
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 测试 Supabase 连接
app.get('/test-db', async (_req, res) => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      return res.json({ error: 'Missing env vars', hasUrl: !!url, hasKey: !!key });
    }

    const supabase = createClient(url, key);
    const { data, error } = await supabase.from('products').select('count').limit(1);

    res.json({ success: !error, data, error: error?.message });
  } catch (e: any) {
    res.json({ error: e.message });
  }
});

// 产品列表
app.get('/products', async (req, res) => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'on_shelves')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    res.json({ success: true, data: { list: data, total: data.length } });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// 轮播图
app.get('/banners', async (_req, res) => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('status', 'visible')
      .order('sort_order');

    if (error) throw error;
    res.json({ success: true, data });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// 秒杀活动
app.get('/flash-sales', async (_req, res) => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('flash_sales')
      .select('*, product:products(id, name, images, original_price)')
      .eq('status', 'ongoing');

    if (error) throw error;
    res.json({ success: true, data });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// 404
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

export default app;