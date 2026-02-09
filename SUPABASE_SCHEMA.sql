-- =====================================================
-- SISTEMA DE PRODUCCIÓN DE BLOQUES - ESQUEMA SUPABASE
-- Execute this SQL in your Supabase SQL Editor
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROFILES TABLE (Extends auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'operator' CHECK (role IN ('operator', 'engineer', 'admin')),
  company_name text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role, company_name)
  VALUES (new.id, 'operator', new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- CONCRETE_PLANTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS concrete_plants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  location text NOT NULL,
  capacity_per_hour integer NOT NULL CHECK (capacity_per_hour > 0),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE concrete_plants ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_concrete_plants_user_id ON concrete_plants(user_id);

CREATE POLICY "Users can view own concrete plants"
ON concrete_plants FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own concrete plants"
ON concrete_plants FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own concrete plants"
ON concrete_plants FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own concrete plants"
ON concrete_plants FOR DELETE
USING (auth.uid() = user_id);

-- =====================================================
-- EQUIPMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS equipments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  model text,
  serial_number text,
  purchase_date date,
  maintenance_schedule text,
  hourly_cost numeric NOT NULL CHECK (hourly_cost >= 0),
  fuel_consumption_rate numeric,
  status text DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'retired')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE equipments ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_equipments_user_id ON equipments(user_id);

CREATE POLICY "Users can view own equipments"
ON equipments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own equipments"
ON equipments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own equipments"
ON equipments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own equipments"
ON equipments FOR DELETE
USING (auth.uid() = user_id);

-- =====================================================
-- TEAM_MEMBERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  role text NOT NULL,
  hourly_rate numeric NOT NULL CHECK (hourly_rate >= 0),
  contact_phone text,
  hire_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_team_members_user_id ON team_members(user_id);

CREATE POLICY "Users can view own team members"
ON team_members FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own team members"
ON team_members FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own team members"
ON team_members FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own team members"
ON team_members FOR DELETE
USING (auth.uid() = user_id);

-- =====================================================
-- INVENTORY_MATERIALS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS inventory_materials (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  material_name text NOT NULL,
  category text NOT NULL CHECK (category IN ('cement', 'sand', 'aggregate', 'additive', 'other')),
  unit text NOT NULL,
  current_quantity numeric NOT NULL DEFAULT 0 CHECK (current_quantity >= 0),
  unit_cost numeric NOT NULL CHECK (unit_cost >= 0),
  min_stock_quantity numeric NOT NULL DEFAULT 0 CHECK (min_stock_quantity >= 0),
  location text,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE inventory_materials ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_inventory_materials_user_id ON inventory_materials(user_id);
CREATE INDEX idx_inventory_materials_category ON inventory_materials(category);
CREATE INDEX idx_inventory_materials_name ON inventory_materials(material_name);

CREATE POLICY "Users can view own inventory materials"
ON inventory_materials FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own inventory materials"
ON inventory_materials FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inventory materials"
ON inventory_materials FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own inventory materials"
ON inventory_materials FOR DELETE
USING (auth.uid() = user_id);

-- =====================================================
-- PRODUCTION_ORDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS production_orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_by_name text NOT NULL,
  engineer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Production specs
  block_type text NOT NULL,
  block_size text NOT NULL,
  quantity_produced integer NOT NULL CHECK (quantity_produced > 0),
  production_date date NOT NULL,
  production_shift text NOT NULL CHECK (production_shift IN ('morning', 'afternoon', 'night')),

  -- Times
  start_time text,
  end_time text,
  duration_minutes integer NOT NULL,

  -- Resources
  concrete_plant_id uuid REFERENCES concrete_plants(id),
  materials_used jsonb DEFAULT '[]',
  equipment_used jsonb DEFAULT '[]',
  team_assigned jsonb DEFAULT '[]',

  -- Costs (all in numeric, currency units)
  material_cost numeric DEFAULT 0,
  labor_cost numeric DEFAULT 0,
  energy_cost numeric DEFAULT 0,
  maintenance_cost numeric DEFAULT 0,
  equipment_cost numeric DEFAULT 0,
  total_cost numeric DEFAULT 0,

  -- Metadata
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'archived')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE production_orders ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_production_orders_user_id ON production_orders(user_id);
CREATE INDEX idx_production_orders_engineer_id ON production_orders(engineer_id);
CREATE INDEX idx_production_orders_status ON production_orders(status);
CREATE INDEX idx_production_orders_date ON production_orders(production_date);
CREATE INDEX idx_production_orders_block_type ON production_orders(block_type);
CREATE INDEX idx_production_orders_created_at ON production_orders(created_at DESC);

-- RLS Policies based on user role
-- Operators can only see their own orders
CREATE POLICY "Operators can view own production orders"
ON production_orders FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('engineer', 'admin')
  )
);

CREATE POLICY "Users can insert own production orders"
ON production_orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own production orders"
ON production_orders FOR UPDATE
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('engineer', 'admin')
  )
);

CREATE POLICY "Users can delete own production orders"
ON production_orders FOR DELETE
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('engineer', 'admin')
  )
);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_concrete_plants_updated_at
  BEFORE UPDATE ON concrete_plants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipments_updated_at
  BEFORE UPDATE ON equipments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_materials_updated_at
  BEFORE UPDATE ON inventory_materials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_production_orders_updated_at
  BEFORE UPDATE ON production_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STORAGE BUCKETS (for future use - like plant images, etc)
-- =====================================================
-- Create these in Supabase Dashboard → Storage
-- Buckets: 'plant-images', 'documents'

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check all tables created
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'concrete_plants', 'equipments', 'team_members', 'inventory_materials', 'production_orders')
ORDER BY tablename;

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'concrete_plants', 'equipments', 'team_members', 'inventory_materials', 'production_orders');

-- List all policies
SELECT schemaname, tablename, policyname, permissive, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- SAMPLE DATA (Optional - for testing only)
-- =====================================================

-- Insert some sample concrete plants
-- INSERT INTO concrete_plants (id, user_id, name, location, capacity_per_hour, is_active)
-- VALUES
--   (uuid_generate_v4(), 'USER-UUID-HERE', 'Planta Central', 'Santiago', 50, true),
--   (uuid_generate_v4(), 'USER-UUID-HERE', 'Planta Norte', 'Valparaíso', 30, true);

-- Insert sample equipment
-- INSERT INTO equipments (id, user_id, name, model, hourly_cost, status)
-- VALUES
--   (uuid_generate_v4(), 'USER-UUID-HERE', 'Mezcladora 1', 'Model X', 15000, 'active'),
--   (uuid_generate_v4(), 'USER-UUID-HERE', 'Vibrador', 'Model V', 8000, 'active');

-- Insert sample team members
-- INSERT INTO team_members (id, user_id, name, role, hourly_rate)
-- VALUES
--   (uuid_generate_v4(), 'USER-UUID-HERE', 'Juan Pérez', 'operador', 12000),
--   (uuid_generate_v4(), 'USER-UUID-HERE', 'María González', 'ayudante', 10000);

-- =====================================================
-- INSTRUCTIONS
-- =====================================================
-- 1. Copy and paste this entire file into your Supabase SQL Editor
-- 2. Execute it
-- 3. Verify tables and RLS policies are created using the verification queries above
-- 4. Test by creating a user and checking if they can only see their own data
-- 5. For production, consider adding additional indexes for performance
-- 6. Enable Realtime in Supabase Dashboard for all tables
-- =====================================================
