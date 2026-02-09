# Sistema de Producción de Bloques de Concreto - Plan de Proyecto

## Visión General
Aplicación para automatizar la gestión de órdenes de producción de bloques de concreto, reemplazando el proceso manual de papel → Excel.

**Problema actual**:
- Personal escribe órdenes en papel
- Ingeniero transcribe manualmente a Excel diariamente
- Proceso lento, propenso a errores, duplicado de trabajo

**Solución**:
- App web con autenticación
- Creación/gestión de órdenes de producción digitales
- Dashboard ingeniero con reportes, gráficos, costos
- Dashboard personal operativo (solo sus órdenes)
- Inventario integrado (materiales, equipos, equipo humano)
- Automatización de reportes Excel, PDF, gráficos.

**Base**: Patrones probados de `inventario-app` (Supabase + Next.js)

---

## Stack Tecnológico

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, Tailwind CSS 4, Shadcn UI
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth
- **Gráficos**: Shadcn UI Charts
- **Icons**: Lucide React
- **Despliegue**: Vercel

---

## Arquitectura Base (de inventario-app)

### Estructura de Componentes (Adaptar)
```
src/
├── app/
│   ├── layout.tsx          # AuthProvider global
│   ├── page.tsx            # → Redirect según rol
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   └── auth/callback/route.ts
├── components/
│   ├── ProductionOrderForm.tsx      # Nueva: crear/editar orden
│   ├── ProductionOrderList.tsx      # Nueva: lista con filtros
│   ├── ProductionOrderDetails.tsx   # Nueva: detalles + costos
│   ├── UserDashboard.tsx            # Para personal operativo
│   ├── AdminDashboard.tsx           # Para ingeniero (reportes)
│   ├── InventoryPanel.tsx           # Inventario (materiales/equipos/equipo)
│   ├── CostAnalytics.tsx            # Análisis de costos
│   ├── ProductionCharts.tsx         # Gráficos de producción
│   └── ReportGenerator.tsx          # Generar reportes Excel
├── lib/
│   ├── hooks/
│   │   ├── useProductionOrders.ts   # CRUD + real-time (nuevo)
│   │   ├── useInventory.ts          # Inventario (nuevo/adaptado)
│   │   └── useAuth.ts               # Ya existe
│   └── supabase/                    # Clientes Supabase (igual)
└── types/
    ├── production-order.ts          # Nueva interfaz
    ├── inventory.ts                 # Nueva interfaz
    └── cost-breakdown.ts            # Nueva interfaz
```

---

## Patrones Clave (Reutilizar de inventario-app)

### 1. Optimistic UI + Rollback
**Igual**: Actualizar UI → Enviar a Supabase → Éxito mantener / Error rollback
**Aplicar a**: Crear/editar órdenes de producción, ajustes de inventario

### 2. Real-time Subscriptions
**Igual**: Subscribirse a cambios filtrados
**Filtros**:
- Personal operativo: `user_id = currentUser.id` (solo sus órdenes)
- Ingeniero: sin filtro (todas las órdenes)
- Inventario: `user_id` o global según rol

### 3. Field Mapping
** snake_case ↔ camelCase** igual que en inventario-app
Funciones: `transformOrderFromDB()`, `transformInventoryFromDB()`

### 4. Two-layer Filtering
**Backend**: Supabase filtra por `user_id` y `role`
**Frontend**: Búsqueda por fecha/tipo/planta, filtros adicionales

### 5. Role-based Access Control
**Nuevo patrón**:
- `user.role` en profiles (enum: 'operator', 'engineer', 'admin')
- Middleware / Frontend conditional rendering según rol
- Hooks: `useProductionOrders()` filtran automáticamente por rol

---

## Esquema de Base de Datos (Nuevo)

### Tabla: production_orders
```sql
id (uuid, PK)
user_id (uuid, FK → auth.users) -- quién creó la orden
created_by_name (text) -- nombre del personal que produjo
engineer_id (uuid, FK → auth.users, nullable) -- ingeniero asignado

-- Specs de producción
block_type (text) -- tipo de bloque (ej: ladrillo, bloque, etc.)
block_size (text) -- dimensiones (ej: 10x20x40)
quantity_produced (integer) -- cantidad producida en esta sesión
production_date (date) -- fecha de producción
production_shift (text) -- turno: mañana/tarde/noche

-- Tiempos
start_time (timestamptz)
end_time (timestamptz)
duration_minutes (integer) -- calculado o manual

-- Recursos utilizados
concrete_plant_id (uuid, FK → concrete_plants) -- planta utilizada
materials_used (jsonb) -- {cement: quantity, sand: quantity, water: quantity, ...}
equipment_used (jsonb) -- [{equipment_id, hours_used, fuel_consumed}]
team_assigned (jsonb) -- [{worker_id, role, hours_worked}]

-- Costos (calculados o manuales)
material_cost (numeric)
labor_cost (numeric
energy_cost (numeric)
maintenance_cost (numeric)
equipment_cost (numeric)
total_cost (numeric)

-- Metadata
status (text) -- draft, submitted, approved, rejected, archived
notes (text, nullable)
created_at, updated_at (timestamps)
```

### Tabla: concrete_plants
```sql
id (uuid, PK)
user_id (uuid, FK → auth.users) -- quién creó/administra
name (text)
location (text)
capacity_per_hour (integer)
is_active (boolean)
created_at, updated_at
```

### Tabla: equipments (adaptar de materiales)
```sql
id (uuid, PK)
user_id (uuid, FK → auth.users)
name, model, serial_number
purchase_date, maintenance_schedule
hourly_cost (numeric)
fuel_consumption_rate (numeric)
status (text) -- active, maintenance, retired
created_at, updated_at
```

### Tabla: team_members (adaptar de profiles)
```sql
id (uuid, PK)
user_id (uuid, FK → auth.user, nullable) -- si tienen cuenta
name (text)
role (text) -- producer, operator, supervisor, etc.
hourly_rate (numeric)
contact_phone (text)
hire_date (date)
created_at, updated_at
```

### Tabla: inventory_materials (similar a inventario)
```sql
id (uuid, PK)
user_id (uuid, FK → auth.users)
material_name (text)
category (text) -- cement, sand, aggregate, additive
unit (text) -- kg, ton, m3, liters
current_quantity (numeric)
unit_cost (numeric)
min_stock_quantity (numeric)
location (text)
last_updated (timestamptz)
created_at, updated_at
```

### Tabla: profiles (ya existe en Supabase auth)
**Añadir campos**:
- `role` (text, enum: operator, engineer, admin)
- `company_name` (text)
- `phone` (text)

---

## Funcionalidades por Rol

### Personal Operativo (operator)
- ✅ Crear nueva orden de producción
- ✅ Editar sus propias órdenes (solo si status = 'draft')
- ✅ Ver lista de sus órdenes
- ✅ Ver detalles de sus órdenes
- ✅ Ver inventario de materiales (read-only)
- ❌ NO ve órdenes de otros
- ❌ NO ve costos/ganancias detallados
- ❌ NO accede al admin dashboard

### Ingeniero / Admin (engineer/admin)
- ✅ Ver todas las órdenes (todos los operadores)
- ✅ Filtrar por fecha/tipo/planta/operador
- ✅ Ver detalles completos + costos
- ✅ Aprobar/rechazar órdenes (cambiar status)
- ✅ Acceder a Admin Dashboard:
  - Reportes de producción (gráficos por período)
  - Análisis de costos vs. ingresos
  - Rentabilidad por tipo/tamaño/planta
  - Forecast de producción
  - Exportar datos a Excel, CSV, PDF, JSON
- ✅ Gestionar inventario (ajustar stocks)
- ✅ Gestionar plantas/equipos/equipo
- ✅ Gestionar usuarios (crear/desactivar)
- ✅ Configurar roles
- ✅ Acceder a settings del sistema

---

## Flujos de Usuario Clave

### 1. Crear Orden de Producción (Operador)
1. Login → Redirect a UserDashboard
2. Click "Nueva Orden"
3. Formulario:
   - Datos básicos: tipo, tamaño, cantidad, fecha, turno
   - Tiempos: hora inicio/fin (o duración manual)
   - Planta de concreto (dropdown)
   - Materiales usados (dinámico: cemento, arena, agua, etc.)
   - Equipos usados (select + horas)
   - Equipo asignado (select + horas)
4. Submit → Guardar en DB con status = 'draft'
5. Notificación: orden creada
6. inventario se descuenta automáticamente

### 2. Revisión de Órdenes (Ingeniero)
1. Login → AdminDashboard
2. Pestaña "Órdenes"
3. Click en orden → Ver detalles completos
4. Ver costos calculados automáticamente:
   - Materiales: cantidad_used × unit_cost (de inventory_materials)
   - Mano de obra: horas_team × hourly_rate (de team_members)
   - Equipos: horas × hourly_cost + fuel
   - Energía: calcular según horas × tarifa


### 3. Análisis de Producción (Ingeniero)
Dashboard con gráficos:
- Producción por período (barras)
- Tendencia de costos (línea)
- Rentabilidad por tipo de bloque (pie)
- Eficiencia por planta (tabla)
- Utilización de equipos (métrica)
- Forecast de demanda (regresión)

### 4. Gestión de Inventario
- Ver stocks actuales
- Ajustar cantidades (entradas/salidas manuales)
- Alertas de stock mínimo
- Historial de movimientos

---

## Adaptación de Patrones de inventario-app

### 1. Hooks de Datos (Reutilizar Estructura)

**useProductionOrders.ts** (similar a `useMaterials.ts`):
```typescript
// Patrón optimista idéntico
const { data: orders, addOrder, updateOrder, deleteOrder } = useProductionOrders({
  role: 'engineer' // o 'operator' → filtra por user_id
});

// Real-time: filter por user_id (si operator) o sin filtro (engineer)
useEffect(() => {
  if (!user) return;
  const filter = user.role === 'operator'
    ? `user_id=eq.${user.id}`
    : null; // todos

  const channel = supabase
    .channel(`orders-${user.role}`)
    .on('postgres_changes', {..., filter: filter}, handleChange)
    .subscribe();
}, [user]);
```

**useInventory.ts** (similar estructura):
- readInventory()
- updateStock(itemId, delta, reason)
- optimistic updates + rollback

### 2. Componentes (Adaptar)

**ProductionOrderForm** (basado en MaterialForm):
- Similar estructura con campos nuevos
- Sub-formularios anidados para materials_used, equipment_used, team_assigned
- Validación de campos requeridos
- Auto-cálculo de tiempos (start/end → duration)

**AdminDashboard** (basado en ProjectDashboard):
- Múltiples gráficos de ProductionCharts
- KPIs: Total órdenes, unidades producidas, costo promedio, utilidad
- Filtros globales: fecha, planta, tipo
- Tabla resumida con export a Excel, CSV, PDF, JSON


**ProductionCharts** (similar a DashboardCharts):
- Recibir `orders: ProductionOrder[]`
- `useMemo` para procesar datos
- Recharts:
  - BarChart: producción por día/semana
  - LineChart: tendencia costos
  - PieChart: distribución por tipo
  - AreaChart: utilización de capacidad

### 3. Role-based Rendering (Nuevo)

**En hooks**:
```typescript
const { user } = useAuth();

// hooks filtran automáticamente
const orders = useProductionOrders({ role: user?.role });
```

**En componentes**:
```tsx
{user.role === 'operator' && <UserDashboard />}
{['engineer'].includes(user.role) && <AdminDashboard />}
```

**Middleware**:
```typescript
// middleware.ts
export const config = { matcher: ['/engineer/:path*'] };
// Proteger rutas de admin solo para roles engineer/admin
```

---

## Esquema de Tipos TypeScript

### production-order.ts
```typescript
interface ProductionOrder {
  id: string;
  userId: string;
  createdByName: string;
  engineerId?: string;

  blockType: string;
  blockSize: string;
  quantityProduced: number;
  productionDate: string;
  productionShift: 'morning' | 'afternoon' | 'night';

  startTime: string;
  endTime: string;
  durationMinutes: number;

  concretePlantId: string;
  materialsUsed: MaterialUsage[]; // {materialId, quantity, unitCost}
  equipmentUsed: EquipmentUsage[]; // {equipmentId, hours, fuelConsumed}
  teamAssigned: TeamAssignment[]; // {memberId, role, hoursWorked}

  materialCost: number;
  laborCost: number;
  energyCost: number;
  maintenanceCost: number;
  equipmentCost: number;
  totalCost: number;

  status: 'draft' | 'submitted' | 'archived';
  notes?: string;

  createdAt: string;
  updatedAt: string;
}
```

### inventory.ts
```typescript
interface InventoryItem {
  id: string;
  userId: string;
  name: string;
  category: 'cement' | 'sand' | 'aggregate' | 'additive' | 'other';
  unit: string;
  currentQuantity: number;
  unitCost: number;
  minStockQuantity: number;
  location: string;
  lastUpdated: string;
}
```

---

## Implementación por Fases

### Fase 1: Setup Base
- [ ] Clonar/inicializar proyecto desde inventario-app
- [ ] Configurar Supabase: crear tablas nuevas (production_orders, concrete_plants, equipments, team_members) + RLS policies
- [ ] Actualizar `profiles` tabla: añadir `role`
- [ ] Configurar `.env` con credenciales
- [ ] Verificar RLS policies (4 por tabla)

### Fase 2: Auth & Roles
- [ ] Adaptar signup/login existentes
- [ ] Añadir campo `role` en registro (selector: operator/engineer)
- [ ] Modificar `AuthContext` para incluir `user.role`
- [ ] Middleware: proteger rutas `/engineer/*` solo para engineer/admin
- [ ] Conditional rendering según rol

### Fase 3: Production Orders CRUD
- [ ] Crear `types/production-order.ts`
- [ ] Crear `useProductionOrders.ts` (patrón `useMaterials.ts`)
- [ ] Crear `ProductionOrderForm` (basado en `MaterialForm`)
- [ ] Crear `ProductionOrderList` (con filtros por fecha/tipo)
- [ ] Crear `ProductionOrderDetails` (vista completa)
- [ ] Implementar optimistic UI + rollback
- [ ] Real-time subscriptions (filtradas por rol)

### Fase 4: Engineer Dashboard & Analytics
- [ ] Crear `EngineerDashboard` (basado en `ProjectDashboard`)
- [ ] Crear `ProductionCharts`:
  - Producción por período (bar)
  - Tendencia costos (line)
  - Distribución tipo (pie)
  - Eficiencia planta (table)
- [ ] Calcular KPIs automáticos desde `orders`:
  - Total producido, costo promedio, rentabilidad
- [ ] Filtrar por fecha/rango personalizado

### Fase 5: Cost Calculation Engine
- [ ] Auto-calcular costos al crear/editar orden:
  - Materiales: sumar (quantity × unit_cost) desde inventory
  - Labor: sumar (hours × hourly_rate) desde team_members
  - Equipment: sumar (hours × hourly_cost) + fuel
  - Energy: tarifa fija × duration_hours
- [ ] Descontar inventario automáticamente al aprobar orden
- [ ] Historial de costos por período
- [ ] Comparativo: costo vs. valor de producción (si hay precio de venta)

### Fase 6: Inventory Management
- [ ] Crear `useInventory.ts`
- [ ] Componente `InventoryPanel`:
  - Ver todos los items →cantidad actual vs. mínimo
  - Alertas stock bajo
  - Ajustar cantidades (+/-)
  - Historial movimientos
- [ ] Integrar con órdenes: al aprobar → auto-descontar materiales usados
- [ ] Alertas: si stock < min_quantity en orden → warning

### Fase 7: Reports & Export
- [ ] `ReportGenerator`:
  - Exportar órdenes a Excel, CSV, PDF o JSON (misma estructura que manual actual)
  - Exportar costos a Excel, CSV, PDF o JSON
  - Exportar inventario a Excel, CSV, PDF o JSON
  - Generar reporte diario/semanal/mensual automático
- [ ] Usar librería `xlsx` (igual que inventario-app)
- [ ] Plantillas predefinidas

### Fase 8: Polish & Testing
- [ ] Testing completo (2 pestañas, real-time)
- [ ] Rollback: desconectar internet, verificar
- [ ] RLS: probar 2 usuarios distintos
- [ ] Roles: verificar aislamiento operator/engineer
- [ ] Validación formularios
- [ ] Responsive: Tailwind breakpoints
- [ ] Lint: `npm run lint` → 0 errores

---

## Checklist de Setup (Modificado)

### Requisitos
- [ ] Node.js 18+
- [ ] Cuenta Supabase (con Realtime habilitado)
- [ ] Acceso a SQL Editor en Supabase

### Pasos Iniciales
1. **Clonar/inicializar** desde inventario-app o crear nuevo Next.js
2. **Instalar dependencias**: `npm install`
3. **Configurar Supabase**:
   - Ejecutar `SUPABASE_RLS_POLICIES_BLOQUES.sql` (nuevo, adaptado)
   - Habilitar Realtime
   - Crear tablas: production_orders, concrete_plants, equipments, team_members, inventory_materials
   - Añadir `role` a `profiles`
4. **Variables entorno** `.env`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=tu-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
   ```
5. **Desarrollo**: `npm run dev`

---

## Convenciones de Código (Mantener)

- TypeScript strict
- `useCallback` para handlers
- async/await siempre
- snake_case DB ↔ camelCase app
- PascalCase componentes
- Tailwind CSS 4
- Todos componentes `'use client'`
- Spanish en UI

---

## Testing Crítico

### 1. Real-time (2 pestañas)
- Operator crea orden → aparece en engineer dashboard inmediatamente

### 2. RLS & Roles
- Operator solo ve sus órdenes
- Engineer ve todas
- Operator NO accede a `/engineer/*`

### 3. Rollback
- Desconectar internet
- Crear orden sin conexión → error, UI revierte

### 4. Cost Calculation
- Crear orden con materiales/equipo/team configurados
- Verificar que costos se calculan automáticamente
- Aprobar → inventario se descuenta

### 5. Inventory Sync
- Stock insuficiente → warning en order form
- Aprobar orden → inventory.current_quantity disminuye

### 6. Export/Report
- Generar Excel → abrir en Excel, datos correctos
- CSV import/export (si aplica)
- PDF export (si aplica)
- JSON export (si aplica)

---

## Conversión de Columnas CLAUDE.md → PROJECT_PLAN.md

### De inventario → bloques:
- `projects` → `production_orders` (entidad principal)
- `materials` → `inventory_materials` + `materials_used` (JSONB en órdenes)
- Añadir: `equipments`, `team_members`, `concrete_plants`
- Añadir: `cost_*` fields en órdenes
- Añadir: `role` en `profiles`

### Componentes nuevos:
- `ProductionOrderForm` (reemplaza `MaterialForm`)
- `ProductionOrderList` (reemplaza `MaterialList`)
- `EngineerDashboard` (reemplaza `ProjectDashboard`)
- `ProductionCharts` (reemplaza `DashboardCharts`)
- `InventoryPanel` (nuevo)

### Flujos nuevos:
- Operator → crear orden → Dashboard
- Cost auto-calculation al guardar orden
- Inventory deduction al crear orden

---

## Comandos Útiles (Igual)

```bash
npm run dev       # desarrollo
npm run build     # producción
npm run lint      # lint
npx eslint src/components/ProductionOrderForm.tsx  # archivo específico
```

---

## Estado del Proyecto (Plantilla)

- [ ] Fase 1: Setup Base
- [ ] Fase 2: Auth & Roles
- [ ] Fase 3: Production Orders CRUD
- [ ] Fase 4: Engineer Dashboard & Analytics
- [ ] Fase 5: Cost Calculation Engine
- [ ] Fase 6: Inventory Management
- [ ] Fase 7: Reports & Export
- [ ] Fase 8: Testing & Polish

---

## Referencias (de CLAUDE.md)

- **Supabase RLS Policies**: ejecutar antes de probar
- **Real-time pattern**: `useMaterials.ts:88-137`
- **Optimistic pattern**: `useMaterials.ts:158-261`
- **Chart pattern**: `DashboardCharts.tsx`
- **Testing**: dos pestañas, verificar sync
- **Troubleshooting**: same as inventario-app

---

## Notas Importantes

- **RLS CRÍTICO**: Sin políticas RLS, usuarios ven datos de otros
- **Realtime**: Habilitar en Supabase Dashboard → Settings
- **Cost Calculation**: Basado en tablas `inventory_materials`, `team_members`, `equipments` (precios actualizados)
- **Inventory Sync**: Al aprobar orden → transacción atómica (update inventory)
- **Roles**: Implementar server-side checks también (middleware + RLS)
- **Shadcn UI**: Instalar components necesarios (Button, Input, Select, Card, Table, etc.)
- **Responsive**: Verificar en móvil (operators en campo pueden usar phone)

---

**Target**: MVP en 2-3 semanas siguiendo fases
**Tech debt**: Mantener patterns de inventario-app (probados en producción)
