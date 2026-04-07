/**
 * Vercel Serverless API - 完整版
 * 静态导入所有路由模块
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

// 导入路由模块
import authRoutes from '../server/routes/auth';
import productsRoutes from '../server/routes/products';
import ordersRoutes from '../server/routes/orders';
import partnersRoutes from '../server/routes/partners';
import marketingRoutes from '../server/routes/marketing';
import adminRoutes from '../server/routes/admin';
import partnerPackagesRoutes from '../server/routes/partnerPackages';
import cellarRoutes from '../server/routes/cellar';
import uploadRoutes from '../server/routes/upload';

const app = express();

// ============================================
// 中间件配置
// ============================================

app.use(cors({ origin: true, credentials: true }));
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// 挂载路由
// ============================================

// 健康检查
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 认证路由
app.use('/auth', authRoutes);

// 商品路由
app.use('/products', productsRoutes);

// 订单和购物车路由
app.use('/orders', ordersRoutes);

// 合伙人路由
app.use('/partner', partnersRoutes);

// 营销活动路由（优惠券、秒杀、团购、轮播图、公告、地址）
app.use('/', marketingRoutes);

// 合伙人礼包路由
app.use('/partner-packages', partnerPackagesRoutes);

// 酒窖路由
app.use('/cellar', cellarRoutes);

// 上传路由
app.use('/upload', uploadRoutes);

// 后台管理路由
app.use('/admin', adminRoutes);

// ============================================
// 错误处理
// ============================================

// 404
app.use((_req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '接口不存在' } });
});

// 全局错误处理
app.use((err: Error, _req: any, res: any, _next: any) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: '服务器错误' } });
});

// ============================================
// Vercel Handler
// ============================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 移除 /api 前缀
  const originalUrl = req.url || '/';
  req.url = originalUrl.replace(/^\/api/, '') || '/';

  return new Promise<void>((resolve, reject) => {
    app(req as any, res as any, (err?: Error) => {
      if (err) reject(err);
      else resolve();
    });
  });
}