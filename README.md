# Sistema de Producción de Bloques de Concreto

**Estado:** 🟡 75% Completo - En Hardening de Seguridad

Sistema web para automatizar la gestión de órdenes de producción de bloques de concreto. Reemplaza el proceso manual de papel → Excel con una solución digital completa.

## 🎯 Problema que Resuelve

**Proceso Actual:**
- Personal escribe órdenes en papel
- Ingeniero transcribe manualmente a Excel diariamente
- Proceso lento, propenso a errores, duplicado de trabajo
- No hay visibilidad en tiempo real

**Solución:**
- App web con autenticación (Supabase Auth)
- Creación/gestión de órdenes de producción digitales
- Dashboard ingeniero con reportes, gráficos, **costos confidenciales**
- Dashboard personal operativo (solo sus órdenes, **sin ver costos**)
- Inventario integrado (materiales, equipos, equipo humano)
- Automatización de reportes (Excel, CSV, JSON)
- Real-time sync entre dispositivos

## ⚠️ Estado de Implementación

### ✅ Completado (75%)
- Autenticación completa con roles (operator/engineer/admin)
- CRUD de órdenes con validación y cálculos automáticos
- Dashboard con gráficos de producción
- Gestión de inventario (4 entidades)
- Real-time subscriptions
- Optimistic UI con rollback
- 45+ componentes Shadcn UI

### 🔴 En Progreso - Seguridad Crítica
**No desplegar a producción sin completar estas tareas:**

1. **Confidencialidad de costos** - Operadores accidentalmente ven costos (debería ser solo ingenieros)
2. **Auditoría** - No hay logging de acciones críticas (quiénes aprobaron órdenes, cambios de inventario)
3. **Hardening de autenticación** - Falta rate limiting y bloqueo de cuentas
4. **Headers de seguridad** - Falta CSP, HSTS, X-Frame-Options
5. **Verificación RLS** - Confirmar políticas en Supabase Dashboard
6. **Transacciones atómicas** - Aprobación de orden debe ser transacción única

**Ver:** `memory/SECURITY_FIRST_SUMMARY.md` para análisis completo.

### 🟡 Pendiente (UX/Features)
- Diálogos "Agregar" en inventario (placeholders actuales)
- Exportación a Excel/CSV/JSON (código xlsx instalado pero sin usar)
- Debounce en búsqueda de órdenes
- Navegación: corregir links rotos en header (`/production` → `/orders`)
- Formato de moneda CLP (actualmente usa `$`)
- Paginación a 50 items (actual 25)

### 🔵 Post-MVP
- Testing automático
- Optimización de performance
- MFA (multi-factor authentication)
- Reportes PDF

## 🚀 Stack Tecnológico

- **Framework:** Next.js 16 (App Router) + React 19
- **UI/Estilos:** Tailwind CSS 4, Shadcn UI (45+ componentes)
- **Base de Datos:** Supabase PostgreSQL con RLS (Row Level Security)
- **Autenticación:** Supabase Auth (email/password, gestión de roles)
- **Gráficos:** Recharts
- **Iconos:** Lucide React
- **Exportación:** xlsx (librería instalada, integración pendiente)
- **Validación:** React Hook Form + Zod
- **Notificaciones:** Sonner (toasts)
- **Despliegue:** Vercel (recomendado)
- **TypeScript:** Strict mode

## 🔒 Arquitectura de Seguridad

### Capas de Defensa

```
┌─────────────────────────────────────────────┐
│  UI Layer (userRole checks)                │ ✅ Implementado
├─────────────────────────────────────────────┤
│  Hook Layer (filters by userRole)          │ ✅ Implementado
├─────────────────────────────────────────────┤
│  Supabase Client (parameterized queries)   │ ✅ Implementado
├─────────────────────────────────────────────┤
│  RLS Policies (DB enforcement)             │ ⚠️  Requiere verificación
├─────────────────────────────────────────────┤
│  Infraestructura (Vercel + Supabase)       │ ✅ Sólido
└─────────────────────────────────────────────┘
```

### Estado de Seguridad (OWASP Top 10)

| Vulnerabilidad | Estado | Notas |
|----------------|--------|-------|
| A01: Broken Access Control | 🟡 Parcial | Costos visibles a operarios (deben ocultarse) |
| A02: Cryptographic Failures | 🟡 Parcial | Falta validación de fuerza de contraseña |
| A03: Injection | ✅ OK | Queries parametrizadas (Supabase) |
| A04: Insecure Design | 🔴 Crítico | Sin rate limiting, account lockout, headers |
| A05: Misconfiguration | 🔴 Crítico | Falta validación de env vars, sanitización de errores |
| A06: Vulnerable Components | 🟡 Parcial | Dependabot no configurado |
| A07: Auth Failures | 🟡 Parcial | Sin lockout, passwords débiles permitidos |
| A08: Integrity Failures | ✅ OK | Sin uploads de archivos |
| A09: Logging Failures | 🔴 Crítico | Sin logging de auditoría |
| A10: SSRF | ✅ OK | Sin vectores SSRF |

**Cumplimiento general:** 🟡 50% - Requiere hardening antes de producción.

**Documentación detallada:** `memory/cybersecurity-compliance.md`

---

### Políticas RLS (Row Level Security)

**Objetivo:** Aislamiento total de datos por usuario.

- **Operators:** Ven solo sus propias órdenes (`WHERE user_id = auth.uid()`)
- **Engineers/Admins:** Ven todas las órdenes (sin filtro)
- ** Todas las tablas** tienen RLS activado

**⚠️ IMPORTANTE:** Verificar en Supabase Dashboard que las políticas RLS existan y funcionen correctamente antes de despliegue.

## 🎨 Roles de Usuario

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

## 👥 Roles de Usuario

### **Operario (Personal Operativo)**
**Propósito:** Personal en campo que registra producción.

**Permisos:**
- ✅ Crear nuevas órdenes de producción
- ✅ Editar sus propias órdenes (solo si estado = 'draft')
- ✅ Ver lista de sus órdenes (solo propias)
- ✅ Ver detalles de sus órdenes (sin ver costos)
- ✅ Ver inventario de materiales (solo lectura)
- ❌ **NO** ve órdenes de otros operarios
- ❌ **NO** ve costos/ganancias (¡confidencial!)
- ❌ **NO** puede aprobar/rechazar órdenes
- ❌ **NO** tiene acceso a dashboard de ingeniero

**⚠️ Bug actual:** Los costos son visibles en la UI (deben ocultarse). Ver `memory/role-separation-analysis.md`.

---

### **Ingeniero/Admin**
**Propósito:** Personal en oficina que revisa, aprueba, y analiza.

**Permisos:**
- ✅ Ver **todas** las órdenes (de todos los operarios)
- ✅ Filtrar por fecha/tipo/planta/operario
- ✅ Ver detalles completos **incluyendo costos**
- ✅ Aprobar/rechazar órdenes (cambiar status)
- ✅ Acceder a Dashboard con reportes y gráficos
- ✅ Gestionar inventario (ajustar stocks)
- ✅ Gestionar plantas/equipos/personal
- ✅ Exportar datos a Excel, CSV, JSON
- ✅ (Admin) Gestionar usuarios y roles

---

### **Diferencias Clave**

| Capacidad | Operario | Ingeniero/Admin |
|-----------|----------|-----------------|
| **Órdenes vistas** | Solo propias | Todas |
| **Ver costos** | ❌ No | ✅ Sí |
| **Aprobar órdenes** | ❌ No | ✅ Sí |
| **Dashboard analítico** | ❌ No | ✅ Sí |
| **Gestionar inventario** | ❌ Solo lectura | ✅ CRUD completo |
| **Exportar datos** | ❌ No | ✅ Sí |

**Nota:** El acceso a datos está protegido por **RLS (Row Level Security)** en la base de datos. Incluso si la UIfallara, un operario nunca vería órdenes de otros gracias a las políticas RLS.

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
**Objetivo:** Percepción de velocidad (<50ms).

- Actualizar UI inmediatamente → Enviar a Supabase
- Si éxito: mantener cambios
- Si error: rollback al estado anterior + mostrar error
- Se implementa en todos los hooks (useProductionOrders, useInventoryMaterials, etc.)

**Ubicación:** `src/lib/hooks/useProductionOrders.ts:158-261` (patrón referencia)

---

### 2. Real-time Subscriptions
**Objetivo:** Sincronización instantánea entre pestañas.

- Suscripción a cambios en tablas filtradas por `user_id`
- Operarios ven solo sus órdenes
- Ingenieros ven todas las órdenes
- Actualizaciones en <2 segundos
- Cleanup automático al desmontar componentes

**Ubicación:** `src/lib/hooks/useProductionOrders.ts:88-137`

---

### 3. Field Mapping (snake_case ↔ camelCase)
**Objetivo:** TypeScript idiomático, BD estándar.

- BD: `snake_case` (PostgreSQL)
- App: `camelCase` (TypeScript)
- Funciones `transform*FromDB()` en cada hook
- Transformación automática en fetch/upsert

**Ejemplo:**
```typescript
transformOrderFromDB(dbOrder): ProductionOrder {
  return {
    id: dbOrder.id,                    // same
    userId: dbOrder.user_id,           // snake → camel
    createdAt: dbOrder.created_at,     // snake → camel
    // ...
  }
}
```

---

### 4. Two-layer Filtering
**Objetivo:** Defensa en profundidad + performance.

- **Backend (Source of Truth):** Supabase RLS filtra por `user_id` y `role`
- **Frontend (Conveniencia):** Búsqueda por texto, filtros por estado, fecha, tipo, etc.
- Ambas capas deben trabajar juntas

**Importante:** RLS es la autoridad final. El frontend puede ser bypasseado.

---

### 5. Role-based Access Control (RBAC)
**Objetivo:** Separación clara de responsabilidades.

- Campo `role` en `profiles` (operator, engineer, admin)
- **Nota:** No se usa middleware para proteger rutas (no necesario en arquitectura actual)
- Hooks filtran automáticamente según `userRole` pasado como prop
- Componentes renderizan UI/acciones según `userRole`
- **Ejemplo:** `ProductionOrderList.tsx:102-106` - `canEdit()` función

**Arquitectura de seguridad:**
```typescript
// Tres capas:
1. RLS (DB) → Filtra datos en el origen
2. Hooks (query) → Añaden filtros user_id para operators
3. UI (condicional) → Ocultán acciones/campos según rol
```

---

## 🧪 Testing

### Pruebas Manuales Recomendadas (Checklist)

**CRÍTICO - Ejecutar antes de cualquier despliegue:**

#### 1. Real-time (2 pestañas)
- [ ] Operario crea orden → aparece en dashboard de ingeniero en <2s
- [ ] Ingeniero aprueba orden → status cambia en pestaña de operario en <2s
- [ ] Editar orden → cambios reflejados en otras pestañas

#### 2. RLS & Roles (Aislamiento de datos)
- [ ] Login como operario → solo ve sus propias órdenes
- [ ] Login como ingeniero → ve todas las órdenes
- [ ] Operario NO puede acceder a rutas de admin (verificación manual)
- [ ] Intentar modificar `userRole` en localStorage → no debe acceder a datos de otros

#### 3. Rollback (Manejo de errores)
- [ ] Desconectar internet
- [ ] Crear orden → debe mostrar error
- [ ] UI debe revertir al estado anterior (no queda "fantasma")
- [ ] Re-conectar → operación funciona

#### 4. Cálculo de Costos (Precisión)
- [ ] Crear orden con materiales/equipo/team Known
- [ ] Verificar que total_cost = material_cost + labor_cost + equipment_cost + energy + maintenance
- [ ] Comparar con cálculo manual en Excel → debe coincidir

#### 5. Sincronización de Inventario
- [ ] Aprobar orden → materiales deben deductarse del inventario
- [ ] Stock insuficiente → warning en formulario (si implementado)
- [ ] Verificar transacción atómica (pending → aprobado + inventario actualizado o nada)

#### 6. Responsive (Mobile)
- [ ] Probar en <768px (Chrome DevTools)
- [ ] Navegación móvil (menú hamburguesa)
- [ ] Formularios legibles, inputs grandes (≥44px)
- [ ] Tablas con scroll horizontal
- [ ] Gráficos responsive

#### 7. Accesibilidad Básica
- [ ] Navegación solo con teclado (Tab, Enter)
- [ ] Focus visible en todos los elementos interactivos
- [ ] Screen reader básico (VoiceOver/NVDA) → leer contendores
- [ ] Contraste ≥ 4.5:1 (verificar con DevTools Lighthouse)

#### 8. Vulnerabilidades de Seguridad
- [ ] **Costos ocultos:** Operario NO ve costos en lista, detalles, dashboard ( Tasks #20-23)
- [ ] **SQL Injection:** Intentar inyección en campos de texto → debe fallar safe
- [ ] **XSS:** Injectar `<script>alert('xss')</script>` en notas → no debe ejecutar
- [ ] **Rate limiting:** Enviar 6 logins fallidos seguidos → debe bloquear (pending implementación)
- [ ] **Logging de auditoría:** Verificar que acciones críticas se registran en `audit_logs` (pending implementación)

---

### Comandos Útiles

```bash
npm run dev       # Desarrollo (http://localhost:3000)
npm run build     # Build producción
npm run lint      # Linter (fix errores)
npm run lint:fix  # Auto-fix cuando sea posible
```

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

- TypeScript strict mode (sin `any`)
- Componentes con `'use client'` explícito
- snake_case en BD ↔ camelCase en app
- PascalCase para componentes
- Funciones `useCallback` para handlers en useEffect
- Async/await siempre (no callbacks)
- Comentarios solo cuando sea necesario explicar el **porqué**, no el qué
- Optimistic updates siempre con rollback
- Real-time subscriptions con cleanup en useEffect
- Validación de entradas con Zod schemas

**Leer:** `rules/CLAUDE.md` para directrices completas de desarrollo.

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

## 📚 Documentación del Proyecto

La documentación detallada se encuentra en la carpeta `memory/`:

- **`SECURITY_FIRST_SUMMARY.md`** - 📖 **LEER PRIMERO** - Análisis de seguridad y criterios de lanzamiento
- **`TASKS.md`** - ✅ Lista completa de tareas con prioridades, estimaciones y criterios de aceptación
- **`cybersecurity-compliance.md`** - 🛡️ Matriz OWASP Top 10 y roadmap de seguridad
- **`role-separation-analysis.md`** - 🔐 Análisis detallado de separación de roles (operario vs ingeniero)
- **`project-context.md`** - Visión general, estructura, flujos de usuario
- **`active-tasks.md`** - Lista de tareas activas (seguimiento en Claude Tasks)

**Recomendación:** Leer `SECURITY_FIRST_SUMMARY.md` antes de despliegue.

---

**Desarrollado con ❤️ para la industria de la construcción.**
