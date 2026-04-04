-- ===========================================
-- FAQ表迁移
-- ===========================================

-- 创建FAQ表
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) DEFAULT '其他问题',
  question VARCHAR(500) NOT NULL,
  answer TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'visible' CHECK (status IN ('visible', 'hidden')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_status ON faqs(status);
CREATE INDEX IF NOT EXISTS idx_faqs_sort_order ON faqs(sort_order);

-- 启用RLS
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

-- RLS策略：公开访问visible状态的FAQ
CREATE POLICY "FAQs are viewable by everyone" ON faqs
  FOR SELECT USING (status = 'visible');

-- RLS策略：管理员可以管理FAQ
CREATE POLICY "Admins can manage FAQs" ON faqs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );