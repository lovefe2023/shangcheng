/**
 * 执行数据库迁移：创建 operation_logs 表
 * 运行方式: npx tsx scripts/run-migration.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ 缺少 Supabase 配置');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  console.log('🚀 开始执行迁移...');

  const migrationSQL = `
    -- 创建 operation_logs 表
    CREATE TABLE IF NOT EXISTS operation_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
      action VARCHAR(100) NOT NULL,
      target_type VARCHAR(50) NOT NULL,
      target_id UUID,
      details JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 添加索引
    CREATE INDEX IF NOT EXISTS idx_operation_logs_admin_id ON operation_logs(admin_id);
    CREATE INDEX IF NOT EXISTS idx_operation_logs_action ON operation_logs(action);
    CREATE INDEX IF NOT EXISTS idx_operation_logs_target_id ON operation_logs(target_id);
    CREATE INDEX IF NOT EXISTS idx_operation_logs_created_at ON operation_logs(created_at DESC);
  `;

  try {
    // 使用 RPC 执行 SQL (需要先在 Supabase 中创建 exec_sql 函数)
    // 或者我们可以直接检查表是否存在

    // 检查表是否存在
    const { data, error } = await supabase
      .from('operation_logs')
      .select('id')
      .limit(1);

    if (error && error.code === '42P01') {
      console.log('📋 operation_logs 表不存在，请在 Supabase 控制台执行以下 SQL:');
      console.log('');
      console.log('--- SQL 开始 ---');
      console.log(migrationSQL);
      console.log('--- SQL 结束 ---');
      console.log('');
      console.log('📍 Supabase 控制台地址: https://supabase.com/dashboard/project/oyxnbmuezenvhpjgztys/sql');
    } else if (error) {
      console.error('❌ 检查表失败:', error.message);
    } else {
      console.log('✅ operation_logs 表已存在');
    }
  } catch (err) {
    console.error('❌ 执行失败:', err);
  }
}

runMigration();