export interface InventoryMaterial {
  id: string;
  user_id: string;
  material_name: string;
  category: 'cement' | 'sand' | 'aggregate' | 'additive' | 'other';
  unit: string;
  current_quantity: number;
  unit_cost: number;
  min_stock_quantity: number;
  location: string;
  last_updated: string;
  created_at: string;
  updated_at: string;
}

export interface ConcretePlant {
  id: string;
  user_id: string;
  name: string;
  location: string;
  capacity_per_hour: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Equipment {
  id: string;
  user_id: string;
  name: string;
  model?: string;
  serial_number?: string;
  purchase_date?: string;
  maintenance_schedule?: string;
  hourly_cost: number;
  fuel_consumption_rate?: number;
  status: 'active' | 'maintenance' | 'retired';
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  user_id?: string;
  name: string;
  role: string;
  hourly_rate: number;
  contact_phone?: string;
  hire_date?: string;
  created_at: string;
  updated_at: string;
}
