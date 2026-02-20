-- Migration: 003_audit_logs
-- Creates the audit_logs table for tracking security-relevant events.
-- Run in: Supabase SQL Editor

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,          -- 'login', 'signup', 'login_failed', 'order_approved', etc.
  resource_type TEXT,            -- 'production_order', 'inventory_material', etc.
  resource_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only engineers and admins can read logs; nobody can UPDATE/DELETE
CREATE POLICY "Engineers and admins can read audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('engineer', 'admin')
    )
  );

-- No INSERT policy via anon/authenticated — only service role can insert
-- (audit-logger.ts uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS)

-- Index for efficient lookup by user and time
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action, created_at DESC);
