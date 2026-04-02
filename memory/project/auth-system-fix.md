---
name: auth-system-fix
description: 登录注册认证系统修复完成，使用JWT替代Supabase Auth
type: project
---

## 认证系统重构完成 (2026-04-01)

**修复的问题：**
1. 登录模块 - 原来点击登录直接跳转首页，无验证。现已添加完整的表单验证和API调用
2. 注册模块 - 原来未写入数据库。现已修复，使用自定义密码哈希(SHA256)和JWT token
3. 设置页面(Settings.tsx) - 原来显示硬编码mock数据。现已从authApi.getMe()获取真实数据
4. 个人信息页面(PersonalInfo.tsx) - 原来显示硬编码数据。现已从API获取并支持编辑昵称/性别/生日

**技术改动：**
- `server/middleware/auth.ts` - 重写为JWT验证（替代Supabase Auth）
- `server/routes/auth.ts` - 使用jsonwebtoken生成token，SHA256哈希密码
- `src/pages/Login.tsx` - 添加完整的表单验证和错误提示
- `src/pages/Register.tsx` - 添加确认密码、条款同意验证
- `src/pages/Settings.tsx` - 从API获取用户数据，正确的登出处理
- `src/pages/PersonalInfo.tsx` - 从API获取数据，添加编辑模态框

**数据库迁移待执行：**
```sql
ALTER TABLE users ADD COLUMN gender VARCHAR(10);
ALTER TABLE users ADD COLUMN birthday DATE;
ALTER TABLE users ADD COLUMN email VARCHAR(100);
```
文件位置: `supabase/migrations/004_add_user_profile_fields.sql`

**Why:** 原认证系统使用Supabase Auth但不工作，导致登录注册失败，个人信息显示错误
**How to apply:** 测试账号: 13800138001 / 123456，验证登录注册和个人信息页面