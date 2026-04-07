/**
 * 测试工具函数
 * 创建测试服务器和辅助函数
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import request from 'supertest';
import type { Express } from 'express';

// 加载环境变量
config({ path: resolve(process.cwd(), '.env') });

// 动态导入 app（避免启动监听）
let app: Express;

export async function getApp(): Promise<Express> {
  if (!app) {
    // 重新构建 app 而不启动监听
    const express = await import('express');
    const cors = await import('cors');
    const helmet = await import('helmet');
    const compression = await import('compression');

    const authRoutes = await import('../routes/auth');
    const productsRoutes = await import('../routes/products');
    const ordersRoutes = await import('../routes/orders');
    const partnersRoutes = await import('../routes/partners');
    const marketingRoutes = await import('../routes/marketing');
    const adminRoutes = await import('../routes/admin');
    const partnerPackagesRoutes = await import('../routes/partnerPackages');
    const cellarRoutes = await import('../routes/cellar');

    app = express.default();

    app.use(helmet.default({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false
    }));

    app.use(cors.default({
      origin: '*',
      credentials: true
    }));

    app.use(compression.default());
    app.use(express.default.json({ limit: '10mb' }));
    app.use(express.default.urlencoded({ extended: true, limit: '10mb' }));

    // 健康检查
    app.get('/api/health', (_req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString()
      });
    });

    // 挂载路由
    app.use('/api/auth', authRoutes.default);
    app.use('/api/products', productsRoutes.default);
    app.use('/api/orders', ordersRoutes.default);
    app.use('/api/partner', partnersRoutes.default);
    app.use('/api', marketingRoutes.default);
    app.use('/api/admin', adminRoutes.default);
    app.use('/api/partner-packages', partnerPackagesRoutes.default);
    app.use('/api/cellar', cellarRoutes.default);

    // 404 处理
    app.use((_req, res) => {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: '请求的资源不存在' }
      });
    });
  }

  return app;
}

// 测试请求客户端
export const api = {
  get: async (path: string) => {
    const server = await getApp();
    return request(server).get(path);
  },

  post: async (path: string, body?: any) => {
    const server = await getApp();
    return request(server).post(path).send(body);
  },

  put: async (path: string, body?: any, token?: string) => {
    const server = await getApp();
    const req = request(server).put(path).send(body);
    if (token) req.set('Authorization', `Bearer ${token}`);
    return req;
  },

  delete: async (path: string, token?: string) => {
    const server = await getApp();
    const req = request(server).delete(path);
    if (token) req.set('Authorization', `Bearer ${token}`);
    return req;
  },

  // 带 Token 的请求
  authGet: async (path: string, token: string) => {
    const server = await getApp();
    return request(server).get(path).set('Authorization', `Bearer ${token}`);
  },

  authPost: async (path: string, body: any, token: string) => {
    const server = await getApp();
    return request(server).post(path).send(body).set('Authorization', `Bearer ${token}`);
  }
};

// 测试用户数据
export const testUsers = {
  newUser: {
    phone: '13800000001',
    password: 'test123456',
    name: '测试用户'
  }
};