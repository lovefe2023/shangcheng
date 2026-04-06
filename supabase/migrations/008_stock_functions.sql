-- ===========================================
-- 库存和余额操作函数
-- ===========================================

-- 先删除已存在的函数（解决返回类型冲突）
DROP FUNCTION IF EXISTS increment_product_stock(UUID, INT);
DROP FUNCTION IF EXISTS decrement_product_stock(UUID, INT);
DROP FUNCTION IF EXISTS increment_user_balance(UUID, DECIMAL);
DROP FUNCTION IF EXISTS decrement_user_balance(UUID, DECIMAL);

-- 创建库存增加函数（用于取消订单时恢复库存）
CREATE OR REPLACE FUNCTION increment_product_stock(
  p_product_id UUID,
  p_quantity INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_stock INT;
  v_new_stock INT;
BEGIN
  -- 获取当前库存
  SELECT stock INTO v_current_stock
  FROM products
  WHERE id = p_product_id;

  IF v_current_stock IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', '商品不存在'
    );
  END IF;

  -- 计算新库存
  v_new_stock := v_current_stock + p_quantity;

  -- 更新库存
  UPDATE products
  SET stock = v_new_stock,
      updated_at = NOW()
  WHERE id = p_product_id;

  RETURN jsonb_build_object(
    'success', true,
    'previous_stock', v_current_stock,
    'new_stock', v_new_stock,
    'increment', p_quantity
  );
END;
$$;

-- 创建库存减少函数（用于下单时扣减库存，带防超卖检查）
CREATE OR REPLACE FUNCTION decrement_product_stock(
  p_product_id UUID,
  p_quantity INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_stock INT;
  v_new_stock INT;
BEGIN
  -- 获取当前库存并锁定行
  SELECT stock INTO v_current_stock
  FROM products
  WHERE id = p_product_id
  FOR UPDATE;

  IF v_current_stock IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', '商品不存在'
    );
  END IF;

  -- 检查库存是否充足
  IF v_current_stock < p_quantity THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', '库存不足',
      'current_stock', v_current_stock,
      'requested', p_quantity
    );
  END IF;

  -- 计算新库存
  v_new_stock := v_current_stock - p_quantity;

  -- 更新库存
  UPDATE products
  SET stock = v_new_stock,
      updated_at = NOW()
  WHERE id = p_product_id;

  RETURN jsonb_build_object(
    'success', true,
    'previous_stock', v_current_stock,
    'new_stock', v_new_stock,
    'decrement', p_quantity
  );
END;
$$;

-- 创建用户余额增加函数
CREATE OR REPLACE FUNCTION increment_user_balance(
  p_user_id UUID,
  p_amount DECIMAL(10,2)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance DECIMAL(10,2);
  v_new_balance DECIMAL(10,2);
BEGIN
  -- 获取当前余额
  SELECT balance INTO v_current_balance
  FROM users
  WHERE id = p_user_id;

  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', '用户不存在'
    );
  END IF;

  -- 计算新余额
  v_new_balance := v_current_balance + p_amount;

  -- 更新余额
  UPDATE users
  SET balance = v_new_balance,
      updated_at = NOW()
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'previous_balance', v_current_balance,
    'new_balance', v_new_balance,
    'increment', p_amount
  );
END;
$$;

-- 创建用户余额减少函数（带余额不足检查）
CREATE OR REPLACE FUNCTION decrement_user_balance(
  p_user_id UUID,
  p_amount DECIMAL(10,2)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance DECIMAL(10,2);
  v_new_balance DECIMAL(10,2);
BEGIN
  -- 获取当前余额并锁定行
  SELECT balance INTO v_current_balance
  FROM users
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', '用户不存在'
    );
  END IF;

  -- 检查余额是否充足
  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', '余额不足',
      'current_balance', v_current_balance,
      'requested', p_amount
    );
  END IF;

  -- 计算新余额
  v_new_balance := v_current_balance - p_amount;

  -- 更新余额
  UPDATE users
  SET balance = v_new_balance,
      updated_at = NOW()
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'previous_balance', v_current_balance,
    'new_balance', v_new_balance,
    'decrement', p_amount
  );
END;
$$;

-- ===========================================
-- 退款表
-- ===========================================

-- 退款表（如果不存在）
CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  admin_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_user_id ON refunds(user_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);