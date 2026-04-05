/**
 * Vercel 调试 API - 检查环境变量配置
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 检查环境变量配置情况
  const envCheck = {
    VITE_SUPABASE_URL: !!process.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: !!process.env.VITE_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    JWT_SECRET: !!process.env.JWT_SECRET,
    ADMIN_PHONES: !!process.env.ADMIN_PHONES,
    // 显示 URL 的前缀（用于调试）
    SUPABASE_URL_PREFIX: process.env.VITE_SUPABASE_URL?.substring(0, 30) + '...',
  };

  res.status(200).json({
    status: 'debug',
    timestamp: new Date().toISOString(),
    environmentVariables: envCheck,
    nodeVersion: process.version,
  });
}