# Memory Index

## 项目进度

- [认证系统修复](project/auth-system-fix.md) — 登录注册重构完成，JWT认证替代Supabase Auth，个人信息页面对接API
- [登录功能测试](project/login-testing-complete.md) — 使用webapp-testing技能自动化测试登录，全部通过
- [Checkout页面重构](project/checkout-refactor.md) — 结算页面接入真实API，实现完整购买流程

## 用户偏好

- [测试流程](feedback/test-workflow.md) — 用户通过实际操作发现bug，报告具体错误现象

## 技术栈

- 前端: React + TypeScript + Vite (localhost:3000)
- 后端: Express + Supabase (localhost:3005)
- 认证: JWT + SHA256密码哈希
- 测试: Playwright (webapp-testing技能)

## 已完成功能

- ✅ 登录/注册认证系统
- ✅ 商品列表/详情/搜索
- ✅ 购物车增删改查
- ✅ 订单创建流程
- ✅ 结算页面完整对接

## 待办事项

- 执行数据库迁移添加gender/birthday/email字段到users表
- 测试注册流程
- 测试个人信息编辑功能
- 测试用户添加地址后的完整购买流程