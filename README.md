# Sistema de Producción de Bloques de Concreto

Sistema web para automatizar la gestión de órdenes de producción de bloques de concreto. Reemplaza el proceso manual de papel → Excel con una solución digital completa.

## 🎯 Problema que Resuelve

**Proceso Actual:**
- Personal escribe órdenes en papel
- Ingeniero transcribe manualmente a Excel diariamente
- Proceso lento, propenso a errores, duplicado de trabajo

**Solución:**
- App web con autenticación
- Creación/gestión de órdenes de producción digitales
- Dashboard ingeniero con reportes, gráficos, costos
- Dashboard personal operativo (solo sus órdenes)
- Inventario integrado (materiales, equipos, equipo humano)
- Automatización de reportes Excel, PDF, gráficos

## 🚀 Stack Tecnológico

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, Tailwind CSS 4, Shadcn UI
- **Base de Datos:** Supabase PostgreSQL
- **Autenticación:** Supabase Auth
- **Gráficos:** Recharts
- **Iconos:** Lucide React
- **Exportación:** xlsx (Excel), CSV, JSON
- **Despliegue:** Vercel

## 📋 Requisitos Previos

- Node.js 18+
- Cuenta en [Supabase](https://supabase.com) (gratis)
- npm o yarn

## 🛠️ Instalación y Configuración

### 1. Clonar e Instalar Dependencias

```bash
cd tayasal-demo-app
npm install
```

### 2. Configurar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com)
2. En tu proyecto de Supabase, ve a **SQL Editor**
3. Copia y pega el contenido de `SUPABASE_SCHEMA.sql`
4. Ejecuta el SQL para crear todas las tablas y políticas RLS
5. En **Authentication → Settings**, asegúrate de que:
   - Email confirmations esté deshabilitado (para desarrollo)
   - OAuth providers configurados según necesites

6. Habilita **Realtime** en Supabase:
   - Ve a Database → Replication
   - Activa Realtime para todas las tablas

7. Obtén tus credenciales:
   - Settings → API
   - Copia `SUPABASE_ANON_KEY` y `SUPABASE_URL`

### 3. Configurar Variables de Entorno

```bash
# Copia el archivo de ejemplo
cp .env.local.example .env.local

# Edita .env.local con tus valores de Supabase
NEXT_PUBLIC_SUPABASE_URL=tu-url-de-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### 4. Ejecutar en Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📊 Esquema de Base de Datos

### Tablas Principales

1. **profiles** - Perfiles de usuario (extiende auth.users)
   - `id` (uuid, FK → auth.users)
   - `role` (operator, engineer, admin)
   - `company_name`, `phone`

2. **concrete_plants** - Plantas de concreto
   - `name`, `location`, `capacity_per_hour`, `is_active`

3. **equipments** - Equipos disponibles
   - `name`, `model`, `hourly_cost`, `status`

4. **team_members** - Personal de trabajo
   - `name`, `role`, `hourly_rate`, `contact_phone`

5. **inventory_materials** - Inventario de materiales
   - `material_name`, `category`, `unit`, `current_quantity`, `unit_cost`

6. **production_orders** - Órdenes de producción (tabla principal)
   - Especificaciones: `block_type`, `block_size`, `quantity_produced`
   - Tiempos: `start_time`, `end_time`, `duration_minutes`
   - Recursos: `concrete_plant_id`, `materials_used`, `equipment_used`, `team_assigned` (JSONB)
   - Costos: `material_cost`, `labor_cost`, `equipment_cost`, `total_cost`
   - Estado: `status` (draft, submitted, approved, rejected, archived)

### Políticas RLS (Row Level Security)

Todas las tablas tienen políticas RLS que garantizan:
- Los usuarios solo ven y modifican sus propios datos
- Los ingenieros/admins pueden ver todas las órdenes de producción
- Aislamiento completo entre usuarios

## 🎨 Roles de Usuario

### **Operario (operator)**
- ✅ Crear nuevas órdenes de producción
- ✅ Editar sus propias órdenes (solo si estado = 'draft')
- ✅ Ver lista de sus órdenes
- ✅ Ver detalles de sus órdenes
- ✅ Ver inventario de materiales (read-only)
- ❌ NO ve órdenes de otros
- ❌ NO ve costos/ganancias detallados

### **Ingeniero/Admin (engineer/admin)**
- ✅ Ver todas las órdenes (todos los operarios)
- ✅ Filtrar por fecha/tipo/planta/operario
- ✅ Ver detalles completos + costos
- ✅ Aprobar/rechazar órdenes (cambiar status)
- ✅ Acceder a Dashboard con reportes y gráficos
- ✅ Gestionar inventario
- ✅ Gestionar plantas/equipos/personal
- ✅ Exportar datos a Excel, CSV, JSON

## 🗺️ Estructura del Proyecto

```
src/
├── app/
│   ├── layout.tsx              # Layout principal con AuthProvider
│   ├── page.tsx                # Redirect a /dashboard
│   ├── globals.css             # Estilos globales
│   ├── login/page.tsx          # Login
│   ├── signup/page.tsx         # Registro con selector de rol
│   ├── dashboard/page.tsx      # Dashboard ( Ingeniero )
│   ├── orders/page.tsx         # Lista y gestión de órdenes
│   ├── inventory/page.tsx      # Panel de inventario
│   ├── (engineer)/             # Futuras rutas de ingeniero
│   ├── (operator)/             # Futuras rutas de operario
│   └── contexts/
│       └── AuthContext.tsx     # Contexto de autenticación
├── components/
│   ├── ui/                     # Componentes UI (Button, Input, Card)
│   ├── production/
│   │   ├── ProductionOrderForm.tsx    # Formulario crear/editar orden
│   │   ├── ProductionOrderList.tsx    # Lista tabla con filtros
│   │   └── ProductionOrderDetails.tsx # Modal detalles + costos
│   ├── inventory/
│   │   └── InventoryPanel.tsx        # Panel de inventario con tabs
│   └── dashboard/
│       └── ProductionDashboard.tsx    # Dashboard con gráficos KPIs
├── lib/
│   ├── hooks/
│   │   ├── useProductionOrders.ts     # Hook CRUD + realtime + filters
│   │   ├── useInventoryMaterials.ts   # Hook inventario materiales
│   │   ├── useConcretePlants.ts       # Hook plantas de concreto
│   │   ├── useEquipment.ts            # Hook equipos
│   │   └── useTeamMembers.ts          # Hook miembros equipo
│   ├── supabase/
│   │   ├── client.ts                  # Cliente Supabase
│   │   └── middleware.ts              # Middleware sesión
│   └── constants/
│       └── production.ts              # Constantes (tipos, turnos, etc)
└── types/
    ├── production-order.ts            # Interfaces órdenes
    ├── inventory.ts                   # Interfaces inventario
    ├── profile.ts                     # Interface perfil
    └── index.ts                       # Barrel exports
```

## 📈 Flujos de Usuario

### 1. Crear Orden de Producción (Operario)
1. Login → Redirect a `/orders`
2. Click "Nueva Orden"
3. Completar formulario:
   - Datos básicos: tipo, tamaño, cantidad, fecha, turno
   - Tiempos: hora inicio/fin (calcula duración automática)
   - Planta de concreto (dropdown)
   - Materiales usados (agregar dinámicamente)
   - Equipos usados (select + horas)
   - Equipo asignado (select + horas)
4. Submit → Guardar en DB con status = 'draft'
5. Orden aparece en lista

### 2. Revisión de Órdenes (Ingeniero)
1. Login → Ver todas las órdenes en `/orders`
2. Click en orden → Modal con detalles completos y costos
3. Ver costos calculados automáticamente:
   - Materiales: cantidad_used × unit_cost
   - Mano de obra: horas_team × hourly_rate
   - Equipos: horas × hourly_cost + fuel
4. Aprobar o Rechazar

### 3. Análisis de Producción (Ingeniero)
1. Dashboard (`/dashboard`) con gráficos:
   - Producción por período (barras y tendencia)
   - Distribución por tipo de bloque (pie)
   - Alertas de stock bajo (materials)
   - Órdenes recientes
2. KPIs clave visibles

### 4. Gestión de Inventario
1. Ir a `/inventory`
2. Ver tabs:
   - **Materiales**: Lista completa con estado de stock
   - **Plantas**: Gestionar plantas de concreto
   - **Equipos**: Gestionar equipos y costos
   - **Equipo**: Gestionar personal y tarifas
3. Agregar/editar/eliminar registros

## 🔄 Patrones Implementados

### 1. Optimistic UI + Rollback
- Actualizar UI inmediatamente → Enviar a Supabase
- Si éxito: mantener cambios
- Si error: rollback al estado anterior
- Se implementa en todos los hooks (useProductionOrders, useInventoryMaterials, etc.)

### 2. Real-time Subscriptions
- Suscripción a cambios en tablas filtradas por user_id
- Operarios ven solo sus órdenes
- Ingenieros ven todas las órdenes
- Actualizaciones sincronizadas en tiempo real entre pestañas

### 3. Field Mapping (snake_case ↔ camelCase)
- Funciones `transform*FromDB()` en cada hook
- Conversión automática de campos de BD a TypeScript interfaces

### 4. Two-layer Filtering
- **Backend:** Supabase filtra por `user_id` y RLS
- **Frontend:** Búsqueda por texto, filtros por estado, categoría, etc.

### 5. Role-based Access Control
- Campo `role` en `profiles` (operator, engineer, admin)
- Middleware protege rutas
- Hooks filtran automáticamente según rol
- Componentes renderizan acciones según rol

## 🧪 Testing

### Pruebas Manuales Recomendadas

1. **Real-time (2 pestañas)**
   - Operario crea orden → aparece inmediatamente en dashboard de ingeniero
   - Ingeniero aprueba orden → status cambia en pestaña de operario

2. **RLS & Roles**
   - Operario solo ve sus órdenes
   - Ingeniero ve todas
   - Operario NO accede a rutas de admin

3. **Rollback**
   - Desconectar internet
   - Crear orden → error → UI revierte

4. **Cost Calculation**
   - Crear orden con materiales/equipo/team
   - Verificar costos calculados automáticamente

5. **Inventory Sync**
   - Stock insuficiente → warning
   - (Futuro) Aprobar orden → inventory se descuenta

### Comandos Útiles

```bash
npm run dev       # Desarrollo
npm run build     # Build producción
npm run lint      # Linter
```

## 🔧 Scripts SQL Importantes

- **SUPABASE_SCHEMA.sql** - Todo el esquema completo con RLS policies
- Ejecutar una sola vez en Supabase SQL Editor

## 📱 Responsive Design

- Mobile-first con Tailwind CSS
- Tablas responsive con scroll horizontal en móvil
- Touch targets ≥ 44px
- Layout adaptable a todos los dispositivos

## 🔒 Seguridad

- **RLS (Row Level Security)** habilitado en todas las tablas
- **Autenticación** con Supabase Auth
- **Validación** tanto frontend como backend
- **Policies** que aíslan datos por usuario
- **Sanitización** de inputs automática con parámetros

## 📊 Dashboard KPIs

- Total órdenes de producción
- Bloques producidos totales
- Costo promedio por orden
- Órdenes pendientes de aprobación
- Gráficos de producción por mes
- Distribución por tipo de bloque
- Alertas de stock bajo

## 🚀 Despliegue en Vercel

1. Push a GitHub
2. En Vercel, importar proyecto
3. Configurar Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy automático en push a main

## 📝 Convenciones de Código

- TypeScript strict mode
- Componentes con `'use client'` explícito
- snake_case en BD ↔ camelCase en app
- PascalCase para componentes
- Funciones `useCallback` para handlers
- Async/await siempre
- Comentarios solo cuando sea necesario

## 🐛 Troubleshooting

### Error de autenticación
- Verificar variables de entorno en Supabase
- Asegurarse de que RLS policies estén aplicadas

### Real-time no funciona
- Habilitar Realtime en Supabase Dashboard → Database → Replication
- Verificar que estén marcadas todas las tablas

### No ve mis propios datos
- Verificar que el `user_id` en las tablas coincida con `auth.uid()`
- Revisar RLS policies

## 📄 Licencia

Propietario - Tayasal Studio

## 👥 Contacto y Soporte

Para soporte técnico o consultas:
- Email: soporte@tayasal.com
- Teléfono: +1 234 567 890

---

**Desarrollado con ❤️ para la industria de la construcción.**
