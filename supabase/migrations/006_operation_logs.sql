-- 006_operation_logs.sql
-- 操作日志表，用于记录管理员操作审计

CREATE TABLE IF NOT EXISTS operation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id UUID,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 添加索引以优化查询
CREATE INDEX IF NOT EXISTS idx_operation_logs_admin_id ON operation_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_operation_logs_action ON operation_logs(action);
CREATE INDEX IF NOT EXISTS idx_operation_logs_target_id ON operation_logs(target_id);
CREATE INDEX IF NOT EXISTS idx_operation_logs_created_at ON operation_logs(created_at DESC);

-- 添加注释
COMMENT ON TABLE operation_logs IS '管理员操作日志表';
COMMENT ON COLUMN operation_logs.admin_id IS '执行操作的管理员ID';
COMMENT ON COLUMN operation_logs.action IS '操作类型，如 UPDATE_USER_STATUS, DELETE_PRODUCT 等';
COMMENT ON COLUMN operation_logs.target_type IS '操作目标类型，如 user, product, order 等';
COMMENT ON COLUMN operation_logs.target_id IS '操作目标ID';
COMMENT ON COLUMN operation_logs.details IS '操作详情，包含变更前后数据';