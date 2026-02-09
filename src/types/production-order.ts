export interface ProductionOrder {
  id: string;
  user_id: string;
  created_by_name: string;
  engineer_id?: string;

  // Specs de producción
  block_type: string;
  block_size: string;
  quantity_produced: number;
  production_date: string;
  production_shift: 'morning' | 'afternoon' | 'night';

  // Tiempos
  start_time: string;
  end_time: string;
  duration_minutes: number;

  // Recursos utilizados
  concrete_plant_id: string;
  materials_used: MaterialUsage[];
  equipment_used: EquipmentUsage[];
  team_assigned: TeamAssignment[];

  // Costos
  material_cost: number;
  labor_cost: number;
  energy_cost: number;
  maintenance_cost: number;
  equipment_cost: number;
  total_cost: number;

  // Metadata
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'archived';
  notes?: string;

  createdAt: string;
  updatedAt: string;
}

export interface MaterialUsage {
  materialId: string;
  materialName: string;
  quantity: number;
  unit: string;
  unitCost: number;
}

export interface EquipmentUsage {
  equipmentId: string;
  equipmentName: string;
  hoursUsed: number;
  fuelConsumed?: number;
  hourlyCost: number;
}

export interface TeamAssignment {
  memberId: string;
  memberName: string;
  role: string;
  hoursWorked: number;
  hourlyRate: number;
}

export interface ProductionOrderFormData {
  block_type: string;
  block_size: string;
  quantity_produced: number;
  production_date: string;
  production_shift: 'morning' | 'afternoon' | 'night';
  start_time: string;
  end_time: string;
  duration_minutes: number;
  concrete_plant_id: string;
  materials_used: MaterialUsage[];
  equipment_used: EquipmentUsage[];
  team_assigned: TeamAssignment[];
  notes?: string;
}
