/**
 * 密码迁移脚本
 * 将旧用户密码从 SHA256 迁移到 bcrypt
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env') });

import bcrypt from 'bcrypt';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BCRYPT_SALT_ROUNDS = 12;

async function migratePasswords() {
  console.log('🔄 开始迁移用户密码...\n');

  // 获取所有用户
  const { data: users, error } = await supabase
    .from('users')
    .select('id, phone, name, password_hash');

  if (error) {
    console.error('获取用户失败:', error);
    process.exit(1);
  }

  console.log(`找到 ${users?.length || 0} 个用户\n`);

  // 需要重置的密码 (手机号 -> 新密码)
  const passwordMap: Record<string, string> = {
    '13800138001': '123456', // 测试管理员账号
  };

  let updated = 0;
  let skipped = 0;

  for (const user of users || []) {
    const newPassword = passwordMap[user.phone];

    if (!newPassword) {
      console.log(`⏭️  跳过用户 ${user.phone} (${user.name || '未命名'}) - 未指定新密码`);
      skipped++;
      continue;
    }

    // 检查是否已经是 bcrypt 哈希 (bcrypt 哈希以 $2b$ 开头)
    if (user.password_hash.startsWith('$2b$')) {
      console.log(`✅ 用户 ${user.phone} (${user.name || '未命名'}) 已是 bcrypt 哈希，跳过`);
      skipped++;
      continue;
    }

    // 生成新的 bcrypt 哈希
    const newHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

    // 更新密码
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: newHash })
      .eq('id', user.id);

    if (updateError) {
      console.error(`❌ 更新用户 ${user.phone} 失败:`, updateError);
    } else {
      console.log(`✅ 已更新用户 ${user.phone} (${user.name || '未命名'}) 的密码`);
      updated++;
    }
  }

  console.log(`\n📊 迁移完成:`);
  console.log(`   - 已更新: ${updated} 个用户`);
  console.log(`   - 已跳过: ${skipped} 个用户`);
  console.log(`\n💡 重置后的密码:`);
  console.log(`   - 13800138001 (管理员): 123456`);
}

migratePasswords().catch(console.error);