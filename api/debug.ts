/**
 * Vercel 调试 API - 简化版本
 */

export default function handler(req: any, res: any) {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasSupabaseUrl: !!process.env.VITE_SUPABASE_URL,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    nodeVersion: process.version
  });
}