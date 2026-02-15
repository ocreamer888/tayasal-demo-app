// Test data seeder for production order system
// Run this in your browser console on localhost:3000 (after logging in)

// This script will create:
// - 1 Concrete Plant
// - 4 Materials (cement, sand, aggregate, additive)
// - 2 Equipment items
// - 3 Team members
// Everything is tied to your current user ID

async function seedTestData() {
  const { supabase } = await import('/@/lib/supabase/client');
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error('❌ You must be logged in to seed test data');
    alert('Please log in first');
    return;
  }

  console.log('👤 Current user:', user.email);

  // Create Concrete Plant
  const { data: plant, error: plantError } = await supabase
    .from('concrete_plants')
    .insert([{
      user_id: user.id,
      name: 'Planta Principal',
      location: 'Santiago - Zona Industrial',
      capacity_per_hour: 50,
      is_active: true
    }])
    .select()
    .single();

  if (plantError) {
    console.error('❌ Error creating plant:', plantError);
  } else {
    console.log('✅ Created plant:', plant.name);
  }

  // Create Materials
  const materials = [
    {
      user_id: user.id,
      material_name: 'Cemento Portland',
      category: 'cement',
      unit: 'kg',
      current_quantity: 5000,
      unit_cost: 180,
      min_stock_quantity: 1000,
      location: 'Bodega A'
    },
    {
      user_id: user.id,
      material_name: 'Arena de Río',
      category: 'sand',
      unit: 'm³',
      current_quantity: 25,
      unit_cost: 25000,
      min_stock_quantity: 10,
      location: 'Bodega B'
    },
    {
      user_id: user.id,
      material_name: 'Grava',
      category: 'aggregate',
      unit: 'm³',
      current_quantity: 30,
      unit_cost: 22000,
      min_stock_quantity: 15,
      location: 'Bodega B'
    },
    {
      user_id: user.id,
      material_name: 'Aditivo Plastificante',
      category: 'additive',
      unit: 'L',
      current_quantity: 200,
      unit_cost: 3500,
      min_stock_quantity: 50,
      location: 'Bodega C'
    }
  ];

  for (const material of materials) {
    const { data: m, error: mError } = await supabase
      .from('inventory_materials')
      .insert([material])
      .select()
      .single();

    if (mError) {
      console.error(`❌ Error creating material ${material.material_name}:`, mError);
    } else {
      console.log(`✅ Created material: ${m.material_name} (${m.current_quantity} ${m.unit})`);
    }
  }

  // Create Equipment
  const equipmentList = [
    {
      user_id: user.id,
      name: 'Mezcladora de Concreto H-350',
      model: 'H-350',
      serial_number: 'MX-2023-001',
      purchase_date: '2023-03-15',
      maintenance_schedule: 'Cada 500 horas',
      hourly_cost: 15000,
      fuel_consumption_rate: 8,
      status: 'active'
    },
    {
      user_id: user.id,
      name: 'Vibrador de Concreto',
      model: 'VB-200',
      serial_number: 'VB-2023-003',
      purchase_date: '2023-06-20',
      maintenance_schedule: 'Cada 300 horas',
      hourly_cost: 5000,
      fuel_consumption_rate: 2,
      status: 'active'
    }
  ];

  for (const eq of equipmentList) {
    const { data: e, error: eError } = await supabase
      .from('equipments')
      .insert([eq])
      .select()
      .single();

    if (eError) {
      console.error(`❌ Error creating equipment ${eq.name}:`, eError);
    } else {
      console.log(`✅ Created equipment: ${e.name} ($${e.hourly_cost}/h)`);
    }
  }

  // Create Team Members
  const teamMembers = [
    {
      user_id: user.id,
      name: 'Carlos Méndez',
      role: 'Operador Jefe',
      hourly_rate: 15000,
      contact_phone: '+56-9-1234-5678',
      hire_date: '2023-01-15'
    },
    {
      user_id: user.id,
      name: 'Roberto Fuentes',
      role: 'Ayudante',
      hourly_rate: 12000,
      contact_phone: '+56-9-8765-4321',
      hire_date: '2023-03-10'
    },
    {
      user_id: user.id,
      name: 'Luis Paredes',
      role: 'Operador de Grúa',
      hourly_rate: 16000,
      contact_phone: '+56-9-5555-1234',
      hire_date: '2022-11-05'
    }
  ];

  for (const member of teamMembers) {
    const { data: m, error: mError } = await supabase
      .from('team_members')
      .insert([member])
      .select()
      .single();

    if (mError) {
      console.error(`❌ Error creating team member ${member.name}:`, mError);
    } else {
      console.log(`✅ Created team member: ${m.name} (${m.role})`);
    }
  }

  console.log('\n🎉 Test data seeding complete!');
  console.log('You can now create production orders.');
  alert('✅ Test data created successfully!\n\nCreated:\n- 1 Concrete Plant\n- 4 Materials\n- 2 Equipment items\n- 3 Team members\n\nYou can now create production orders!');
}

// Run the seeder
seedTestData();
