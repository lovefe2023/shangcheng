/**
 * API 接口测试
 * 测试所有后端 API 接口
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { api } from './setup';

describe('API 接口测试', () => {
  describe('健康检查', () => {
    it('GET /api/health - 服务状态检查', async () => {
      const res = await api.get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('商品接口', () => {
    it('GET /api/products - 获取商品列表', async () => {
      const res = await api.get('/api/products');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data.list)).toBe(true);
    });

    it('GET /api/products?page=1&pageSize=5 - 分页查询', async () => {
      const res = await api.get('/api/products?page=1&pageSize=5');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.list.length).toBeLessThanOrEqual(5);
    });

    it('GET /api/products/categories/list - 获取分类列表', async () => {
      const res = await api.get('/api/products/categories/list');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/products/search/suggest?keyword=酒 - 搜索建议', async () => {
      const res = await api.get('/api/products/search/suggest?keyword=酒');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('营销接口', () => {
    it('GET /api/coupons - 获取可领取优惠券', async () => {
      const res = await api.get('/api/coupons');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/flash-sales - 获取秒杀活动', async () => {
      const res = await api.get('/api/flash-sales');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/group-buys - 获取团购活动', async () => {
      const res = await api.get('/api/group-buys');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/banners - 获取轮播图', async () => {
      const res = await api.get('/api/banners');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/notifications - 获取公告列表', async () => {
      const res = await api.get('/api/notifications');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('合伙人礼包接口', () => {
    it('GET /api/partner-packages - 获取礼包列表', async () => {
      const res = await api.get('/api/partner-packages');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('认证接口', () => {
    it('POST /api/auth/register - 注册需要验证参数', async () => {
      const res = await api.post('/api/auth/register', {});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/auth/login - 登录需要验证参数', async () => {
      const res = await api.post('/api/auth/login', {});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/auth/me - 未登录返回错误', async () => {
      const res = await api.get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('购物车接口（需认证）', () => {
    it('GET /api/orders/cart - 未登录返回错误', async () => {
      const res = await api.get('/api/orders/cart');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/orders/cart - 未登录返回错误', async () => {
      const res = await api.post('/api/orders/cart', { product_id: 'test' });
      expect(res.status).toBe(401);
    });
  });

  describe('订单接口（需认证）', () => {
    it('GET /api/orders - 未登录返回错误', async () => {
      const res = await api.get('/api/orders');
      expect(res.status).toBe(401);
    });
  });

  describe('合伙人接口（需认证）', () => {
    it('GET /api/partner/profile - 未登录返回错误', async () => {
      const res = await api.get('/api/partner/profile');
      expect(res.status).toBe(401);
    });

    it('GET /api/partner/leaderboard - 排行榜公开访问', async () => {
      const res = await api.get('/api/partner/leaderboard');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('酒窖接口（需认证）', () => {
    it('GET /api/cellar - 未登录返回错误', async () => {
      const res = await api.get('/api/cellar');
      expect(res.status).toBe(401);
    });

    it('GET /api/cellar/stats - 未登录返回错误', async () => {
      const res = await api.get('/api/cellar/stats');
      expect(res.status).toBe(401);
    });
  });

  describe('地址接口（需认证）', () => {
    it('GET /api/addresses - 未登录返回错误', async () => {
      const res = await api.get('/api/addresses');
      expect(res.status).toBe(401);
    });
  });

  describe('我的优惠券接口（需认证）', () => {
    it('GET /api/my-coupons - 未登录返回错误', async () => {
      const res = await api.get('/api/my-coupons');
      expect(res.status).toBe(401);
    });
  });

  describe('后台管理接口（需认证）', () => {
    it('GET /api/admin/dashboard - 未登录返回错误', async () => {
      const res = await api.get('/api/admin/dashboard');
      expect(res.status).toBe(401);
    });

    it('GET /api/admin/products - 未登录返回错误', async () => {
      const res = await api.get('/api/admin/products');
      expect(res.status).toBe(401);
    });

    it('GET /api/admin/orders - 未登录返回错误', async () => {
      const res = await api.get('/api/admin/orders');
      expect(res.status).toBe(401);
    });
  });

  describe('404 处理', () => {
    it('GET /api/unknown - 返回404', async () => {
      const res = await api.get('/api/unknown');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});