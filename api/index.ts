/**
 * Vercel Serverless Function 入口
 * 将 Express 应用适配为 Vercel 函数
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

// 导入路由
import authRoutes from '../server/routes/auth';
import productsRoutes from '../server/routes/products';
import ordersRoutes from '../server/routes/orders';
import partnersRoutes from '../server/routes/partners';
import marketingRoutes from '../server/routes/marketing';
import adminRoutes from '../server/routes/admin';
import partnerPackagesRoutes from '../server/routes/partnerPackages';
import cellarRoutes from '../server/routes/cellar';
import uploadRoutes from '../server/routes/upload';

// 创建 Express 应用
const app = express();

// 信任代理 - Vercel 使用代理
app.set('trust proxy', 1);

// 安全头部
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS 配置
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 压缩响应
app.use(compression());

// JSON 解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 健康检查
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// 挂载路由
app.use('/auth', authRoutes);
app.use('/products', productsRoutes);
app.use('/orders', ordersRoutes);
app.use('/partner', partnersRoutes);
app.use('/partner-packages', partnerPackagesRoutes);
app.use('/cellar', cellarRoutes);
app.use('/admin', adminRoutes);
app.use('/upload', uploadRoutes);

// 公开营销 API
app.get('/coupons', marketingRoutes);
app.post('/coupons/:id/claim', marketingRoutes);
app.get('/my-coupons', marketingRoutes);
app.get('/flash-sales', marketingRoutes);
app.get('/group-buys', marketingRoutes);
app.get('/banners', marketingRoutes);
app.get('/notifications', marketingRoutes);
app.get('/addresses', marketingRoutes);
app.post('/addresses', marketingRoutes);
app.put('/addresses/:id', marketingRoutes);
app.delete('/addresses/:id', marketingRoutes);

// 404 处理
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: '请求的资源不存在'
    }
  });
});

// 全局错误处理
app.use((err: Error, _req: any, res: any, _next: any) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development' ? err.message : '服务器内部错误'
    }
  });
});

// Vercel Serverless Function handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 将请求传递给 Express 应用
  return new Promise<void>((resolve, reject) => {
    app(req as any, res as any, (err: Error) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}