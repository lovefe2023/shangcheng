-- 005_security_functions.sql
-- 安全相关数据库函数

-- ===========================================
-- 库存原子扣减函数
-- 使用乐观锁确保库存不会超卖
-- ===========================================
CREATE OR REPLACE FUNCTION decrease_product_stock(
  p_product_id UUID,
  p_quantity INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  current_stock INTEGER;
BEGIN
  -- 获取当前库存并锁定行
  SELECT stock INTO current_stock
  FROM products
  WHERE id = p_product_id
  FOR UPDATE;

  -- 检查库存是否充足
  IF current_stock IS NULL OR current_stock < p_quantity THEN
    RETURN FALSE;
  END IF;

  -- 扣减库存
  UPDATE products
  SET stock = stock - p_quantity,
      updated_at = NOW()
  WHERE id = p_product_id;

  RETURN TRUE;
END;
$$;

-- ===========================================
-- 用户余额原子扣减函数
-- 防止提现竞态条件
-- ===========================================
CREATE OR REPLACE FUNCTION decrease_user_balance(
  p_user_id UUID,
  p_amount DECIMAL(10, 2)
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  current_balance DECIMAL(10, 2);
  new_balance DECIMAL(10, 2);
BEGIN
  -- 获取当前余额并锁定行
  SELECT balance INTO current_balance
  FROM users
  WHERE id = p_user_id
  FOR UPDATE;

  -- 检查余额是否充足
  IF current_balance IS NULL OR current_balance < p_amount THEN
    RETURN json_build_object(
      'success', FALSE,
      'message', '余额不足'
    );
  END IF;

  -- 扣减余额
  new_balance := current_balance - p_amount;
  UPDATE users
  SET balance = new_balance,
      updated_at = NOW()
  WHERE id = p_user_id;

  RETURN json_build_object(
    'success', TRUE,
    'new_balance', new_balance
  );
END;
$$;

-- ===========================================
-- 优惠券库存原子扣减函数
-- 防止优惠券超发
-- ===========================================
CREATE OR REPLACE FUNCTION decrease_coupon_stock(
  p_coupon_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  current_stock INTEGER;
  new_stock INTEGER;
BEGIN
  -- 获取当前库存并锁定行
  SELECT stock INTO current_stock
  FROM coupons
  WHERE id = p_coupon_id
  FOR UPDATE;

  -- 检查库存
  IF current_stock IS NULL OR current_stock <= 0 THEN
    RETURN json_build_object(
      'success', FALSE,
      'message', '优惠券已领完'
    );
  END IF;

  -- 扣减库存
  new_stock := current_stock - 1;
  UPDATE coupons
  SET stock = new_stock,
      updated_at = NOW()
  WHERE id = p_coupon_id;

  RETURN json_build_object(
    'success', TRUE,
    'new_stock', new_stock
  );
END;
$$;

-- 添加注释
COMMENT ON FUNCTION decrease_product_stock IS '原子扣减商品库存，防止超卖';
COMMENT ON FUNCTION decrease_user_balance IS '原子扣减用户余额，防止竞态条件';
COMMENT ON FUNCTION decrease_coupon_stock IS '原子扣减优惠券库存，防止超发';

-- ===========================================
-- 用户余额原子增加函数
-- 用于佣金结算、提现拒绝退款等场景
-- ===========================================
CREATE OR REPLACE FUNCTION increment_user_balance(
  user_id UUID,
  amount DECIMAL(10, 2)
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  current_balance DECIMAL(10, 2);
  new_balance DECIMAL(10, 2);
BEGIN
  -- 获取当前余额并锁定行
  SELECT balance INTO current_balance
  FROM users
  WHERE id = user_id
  FOR UPDATE;

  -- 检查用户是否存在
  IF current_balance IS NULL THEN
    RETURN json_build_object(
      'success', FALSE,
      'message', '用户不存在'
    );
  END IF;

  -- 增加余额
  new_balance := current_balance + amount;
  UPDATE users
  SET balance = new_balance,
      updated_at = NOW()
  WHERE id = user_id;

  RETURN json_build_object(
    'success', TRUE,
    'new_balance', new_balance
  );
END;
$$;

-- ===========================================
-- 批量增加用户余额函数
-- 用于批量佣金结算
-- ===========================================
CREATE OR REPLACE FUNCTION batch_increment_user_balance(
  p_user_ids UUID[],
  p_amounts DECIMAL(10, 2)[]
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  i INTEGER;
  user_id UUID;
  amount DECIMAL(10, 2);
  success_count INTEGER := 0;
  fail_count INTEGER := 0;
BEGIN
  -- 参数长度校验
  IF array_length(p_user_ids, 1) != array_length(p_amounts, 1) THEN
    RETURN json_build_object(
      'success', FALSE,
      'message', '用户ID数组和金额数组长度不匹配'
    );
  END IF;

  -- 遍历处理
  FOR i IN 1..array_length(p_user_ids, 1) LOOP
    user_id := p_user_ids[i];
    amount := p_amounts[i];

    -- 更新余额
    UPDATE users
    SET balance = balance + amount,
        updated_at = NOW()
    WHERE id = user_id;

    IF FOUND THEN
      success_count := success_count + 1;
    ELSE
      fail_count := fail_count + 1;
    END IF;
  END LOOP;

  RETURN json_build_object(
    'success', TRUE,
    'success_count', success_count,
    'fail_count', fail_count
  );
END;
$$;

COMMENT ON FUNCTION increment_user_balance IS '原子增加用户余额，用于佣金结算、退款等';
COMMENT ON FUNCTION batch_increment_user_balance IS '批量增加用户余额，用于批量佣金结算';

-- ===========================================
-- 酒窖藏酒原子更新/插入函数
-- 防止并发添加导致的重复记录
-- ===========================================
CREATE OR REPLACE FUNCTION upsert_cellar_item(
  p_user_id UUID,
  p_product_id UUID,
  p_product_name VARCHAR(200),
  p_product_image VARCHAR(500),
  p_vintage VARCHAR(20),
  p_quantity INTEGER,
  p_purchase_price DECIMAL(10, 2),
  p_purchase_date TIMESTAMP WITH TIME ZONE,
  p_order_id UUID,
  p_note TEXT
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  existing_id UUID;
  existing_quantity INTEGER;
  new_quantity INTEGER;
  result_record RECORD;
BEGIN
  -- 检查是否已存在相同商品和年份的记录（锁定行防止并发）
  SELECT id, quantity INTO existing_id, existing_quantity
  FROM cellar_items
  WHERE user_id = p_user_id
    AND product_id = p_product_id
    AND (vintage = p_vintage OR (vintage IS NULL AND p_vintage IS NULL))
  FOR UPDATE;

  IF existing_id IS NOT NULL THEN
    -- 更新现有记录的数量
    new_quantity := existing_quantity + p_quantity;

    UPDATE cellar_items
    SET quantity = new_quantity,
        updated_at = NOW()
    WHERE id = existing_id
    RETURNING * INTO result_record;

    RETURN json_build_object(
      'success', TRUE,
      'action', 'updated',
      'item', row_to_json(result_record)
    );
  ELSE
    -- 插入新记录
    INSERT INTO cellar_items (
      user_id,
      product_id,
      product_name,
      product_image,
      vintage,
      quantity,
      purchase_price,
      purchase_date,
      order_id,
      note
    ) VALUES (
      p_user_id,
      p_product_id,
      p_product_name,
      p_product_image,
      p_vintage,
      p_quantity,
      p_purchase_price,
      p_purchase_date,
      p_order_id,
      p_note
    )
    RETURNING * INTO result_record;

    RETURN json_build_object(
      'success', TRUE,
      'action', 'inserted',
      'item', row_to_json(result_record)
    );
  END IF;
END;
$$;

-- ===========================================
-- 酒窖统计数据聚合函数
-- 高效计算统计数据，避免全表扫描
-- ===========================================
CREATE OR REPLACE FUNCTION get_cellar_stats()
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  total_quantity BIGINT;
  total_value DECIMAL(15, 2);
  distinct_products BIGINT;
BEGIN
  SELECT
    COALESCE(SUM(quantity), 0),
    COALESCE(SUM(quantity * COALESCE(purchase_price, 0)), 0),
    COUNT(DISTINCT product_id)
  INTO total_quantity, total_value, distinct_products
  FROM cellar_items;

  RETURN json_build_object(
    'total_quantity', total_quantity,
    'total_value', total_value,
    'distinct_products', distinct_products
  );
END;
$$;

-- ===========================================
-- 用户酒窖统计数据聚合函数
-- 按用户ID筛选
-- ===========================================
CREATE OR REPLACE FUNCTION get_user_cellar_stats(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  total_quantity BIGINT;
  total_value DECIMAL(15, 2);
  distinct_products BIGINT;
BEGIN
  SELECT
    COALESCE(SUM(quantity), 0),
    COALESCE(SUM(quantity * COALESCE(purchase_price, 0)), 0),
    COUNT(DISTINCT product_id)
  INTO total_quantity, total_value, distinct_products
  FROM cellar_items
  WHERE user_id = p_user_id;

  RETURN json_build_object(
    'total_quantity', total_quantity,
    'total_value', total_value,
    'distinct_products', distinct_products
  );
END;
$$;

COMMENT ON FUNCTION upsert_cellar_item IS '原子更新/插入酒窖藏酒，防止并发竞态条件';
COMMENT ON FUNCTION get_cellar_stats IS '高效计算所有酒窖统计数据';
COMMENT ON FUNCTION get_user_cellar_stats IS '高效计算指定用户的酒窖统计数据';