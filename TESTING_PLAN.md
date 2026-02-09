# Plan de Testing - Sistema de Producción de Bloques

## Objetivo
Verificar que todos los componentes funcionan correctamente, siguiendo los principios de UX del proyecto.

## Implementación Completada (2025-02-09)

Las siguientes funcionalidades que estaban pendientes han sido implementadas:

### ✅ Cost Calculation in Form Submit
- Los costos se calculan automáticamente al crear/editar una orden
- Material: cantidad × costo unitario de cada material
- Mano de obra: horas × tarifa/hora de cada miembro
- Equipo: horas × costo/hora de cada equipo
- Costo total = suma de todos los costos

### ✅ Inventory Deduction on Approval
- Cuando un ingeniero aprueba una orden, se descuentan automáticamente los materiales del inventario del operario
- La transacción usa `user_id` del creador de la orden (no del ingeniero)
- Se valida que no haya stock negativo (constraint de base de datos)
- Si el descuento falla, no se aprueba la orden y se muestra error

### ✅ Material Selection Fix
- El dropdown de materiales ahora usa `useInventoryMaterials` en lugar de `useEquipment`
- Muestra nombre, unidad y costo unitario de cada material
- Se carga correctamente desde la tabla `inventory_materials`

### ✅ Toast Notifications
- Sistema de notificaciones implementado con contexto React
- Componentes: `ToastContext`, `ToastContainer`, `Toast`
- Se muestran en esquina superior derecha
- Se usan para:
  - Creación/edición de órdenes (éxito/error)
  - Eliminación de órdenes
  - Cambios de estado (aprobación, rechazo, etc.)
- Auto-dismiss después de 5 segundos (configurable)
- Pueden cerrarse manualmente

### 📋 Archivos Modificados/Creados
- `src/components/production/ProductionOrderForm.tsx` (cálculo de costos, selección de materiales)
- `src/lib/hooks/useProductionOrders.ts` (deducción de inventario)
- `src/app/orders/page.tsx` (toasts en handlers)
- `src/contexts/ToastContext.tsx` (nuevo)
- `src/components/ui/Toast.tsx` (nuevo)
- `src/components/ui/ToastContainer.tsx` (nuevo)
- `src/components/providers/Providers.tsx` (nuevo provider wrapper)
- `src/app/layout.tsx` (agregado Providers)
- `TESTING_PLAN.md` (actualizado)

---

## Objetivo
Verificar que todos los componentes funcionan correctamente, siguiendo los principios de UX del proyecto.

## Prerrequisitos
- ✅ Base de datos configurada con SUPABASE_SCHEMA.sql
- ✅ Variables de entorno configuradas (.env.local)
- ✅ App running en `npm run dev`

## Test Cases

### 1. Autenticación y Roles

#### TC-AUTH-01: Registro de Usuario Operario
**Steps:**
1. Ir a `/signup`
2. Completar: Nombre, Email, Contraseña, Rol = "Personal Operativo"
3. Click "Crear Cuenta"

**Expected:**
- [ ] Usuario creado exitosamente
- [ ] Redirige a `/login` con mensaje de verificación
- [ ] En Supabase, `profiles.role = 'operator'`
- [ ] Puede loguearse

#### TC-AUTH-02: Registro de Usuario Ingeniero
**Steps:**
1. Ir a `/signup`
2. Completar: Nombre, Email, Contraseña, Rol = "Ingeniero / Administrador"
3. Click "Crear Cuenta"

**Expected:**
- [ ] Usuario creado exitosamente
- [ ] `profiles.role = 'engineer'`
- [ ] Puede loguearse

#### TC-AUTH-03: Login Exitoso
**Steps:**
1. Ir a `/login`
2. Ingresar credenciales válidas
3. Click "Iniciar Sesión"

**Expected:**
- [ ] Redirige a `/dashboard`
- [ ] Muestra dashboard correspondiente al rol
- [ ] Header muestra nombre de usuario y rol

#### TC-AUTH-04: Login con Credenciales Inválidas
**Steps:**
1. Ir a `/login`
2. Ingresar email/contraseña incorrectos
3. Click "Iniciar Sesión"

**Expected:**
- [ ] Muestra mensaje de error claro
- [ ] No redirige
- [ ] Permite intentar de nuevo

---

### 2. Production Orders - CRUD

#### TC-ORDERS-01: Crear Orden (Operario)
**Steps:**
1. Login como operario
2. Ir a `/orders`
3. Click "Nueva Orden"
4. Completar formulario:
   - Tipo: "Ladrillo"
   - Tamaño: "10x20x40 cm"
   - Cantidad: 500
   - Fecha: hoy
   - Turno: "Mañana"
   - Planta: (crear una primero si no existe)
   - Materiales: agregar 1-2 materiales
   - Equipo: agregar 1 equipo
   - Equipo asignado: agregar 1 miembro
5. Click "Crear Orden"

**Expected:**
- [ ] Formulario valida campos requeridos
- [ ] Orden creada con status = 'draft'
- [ ] Aparece en la lista inmediatamente (optimistic)
- [ ] Contador de órdenes se actualiza
- [ ] Costos calculados y mostrados en modal de detalles

#### TC-ORDERS-02: Ver Orden (Operario)
**Steps:**
1. Como operario, tener al menos 1 orden
2. Click en ícono "Ver" (ojo) en una orden
3. Revisar modal de detalles

**Expected:**
- [ ] Modal abre correctamente
- [ ] Muestra toda la información:
  - Especificaciones de producción
  - Materiales con costos
  - Equipo asignado con costos
  - Equipos utilizados
  - Desglose de costos completo
- [ ] Botón "Editar" visible si status = 'draft'
- [ ] Botones "Aprobar/Rechazar" NO visibles (solo ingeniero)

#### TC-ORDERS-03: Editar Orden Propia (Operario)
**Steps:**
1. Como operario, tener orden en estado 'draft'
2. Click en ícono "Editar"
3. Modificar: cantidad o materiales
4. Guardar cambios

**Expected:**
- [ ] Formulario carga con datos actuales
- [ ] Cambios se guardan exitosamente
- [ ] Optimistic update funciona
- [ ] Si error, rollback a datos anteriores

#### TC-ORDERS-04: Enviar Orden a Revisión (Operario)
**Steps:**
1. Como operario, tener orden en estado 'draft'
2. Click en ícono de "Enviar a revisión" (reloj) en la tabla
3. Confirmar

**Expected:**
- [ ] Status cambia a 'submitted'
- [ ] Ya no puede editar la orden
- [ ] Ya no puede eliminar la orden

#### TC-ORDERS-05: Ver Todas las Órdenes (Ingeniero)
**Steps:**
1. Login como ingeniero
2. Ir a `/orders`
3. Ver lista

**Expected:**
- [ ] Ve órdenes de TODOS los operarios
- [ ] Filtros funcionan (tipo, estado, búsqueda)
- [ ] Puede ver detalles completos de cualquier orden
- [ ] Botones "Aprobar/Rechazar" visibles para órdenes 'submitted'
- [ ] Puede editar cualquier orden

#### TC-ORDERS-06: Aprobar/Rechazar Orden (Ingeniero)
**Steps:**
1. Como ingeniero, tener una orden en estado 'submitted'
2. En modal de detalles, click "Aprobar" o "Rechazar"

**Expected:**
- [ ] Status cambia inmediatamente
- [ ] Ya no aparecen botones de aprobación
- [ ] Cambio se refleja en tiempo real (si operario tiene pestaña abierta)

---

### 3. Real-time Sync

#### TC-REALTIME-01: Dos Pestañas - Operario crea, Ingeniero ve
**Steps:**
1. Abrir pestaña A: Login como ingeniero → `/orders`
2. Abrir pestaña B: Login como operario → `/orders`
3. En pestaña B, crear nueva orden
4. Observar pestaña A

**Expected:**
- [ ] Orden aparece en pestaña A en menos de 1 segundo
- [ ] Sin refrescar la página
- [ ] Contador se actualiza automáticamente

#### TC-REALTIME-02: Ingeniero aprueba, Operario ve
**Steps:**
1. Operario envía orden a revisión (status = 'submitted')
2. En pestaña de ingeniero, aprobar la orden
3. Observar pestaña de operario

**Expected:**
- [ ] Status cambia a 'approved' en tiempo real
- [ ] Operario ya no puede editar (se pierde botón editar)

#### TC-REALTIME-03: Edición concurrente
**Steps:**
1. Dos pestañas con mismo usuario (ingeniero)
2. En pestaña A, editar una orden
3. En pestaña B, editar la misma orden
4. Guardar en ambas

**Expected:**
- [ ] Última escritura gana (last-write-wins)
- [ ] No hay errores de validación
- [ ] Datos consistentes en ambas pestañas después de sync

---

### 4. Dashboard y Gráficos

#### TC-DASHBOARD-01: KPIs Correctos
**Steps:**
1. Login como ingeniero
2. Ir a `/dashboard`
3. Verificar tarjetas de estadísticas

**Expected:**
- [ ] "Órdenes de Producción" = total de órdenes en BD
- [ ] "Bloques Producidos" = suma de quantity_produced
- [ ] "Costo Promedio" = total_cost / count
- [ ] "Pendientes" = órdenes con status = 'submitted'

#### TC-DASHBOARD-02: Gráficos Renderizan
**Steps:**
1. En dashboard, ver cada gráfico

**Expected:**
- [ ] Producción por Mes (AreaChart) renderiza
- [ ] Órdenes por Estado (PieChart) renderiza
- [ ] Producción por Tipo (BarChart) renderiza
- [ ] Alertas de Stock Bajo renderiza (con mensaje apropiado si no hay)
- [ ] Tabla de Órdenes Recientes muestra datos

#### TC-DASHBOARD-03: Responsive Dashboard
**Steps:**
1. Redimensionar ventana (desktop → tablet → mobile)
2. Verificar grids

**Expected:**
- [ ] Stats cards se reorganizan (1 col → 2 → 4)
- [ ] Gráficos se redimensionan correctamente
- [ ] No se rompe el layout
- [ ] Tablas usan scroll horizontal en mobile

---

### 5. Inventario

#### TC-INVENTORY-01: Agregar Material
**Steps:**
1. Ir a `/inventory`
2. Tab "Materiales"
3. Click "Agregar Material" (TODO: implementar formulario)
4. Completar datos

**Expected:**
- [ ] Material agregado a la lista
- [ ] Aparece instantáneamente (optimistic)
- [ ] Campos requeridos validados

#### TC-INVENTORY-02: Ver Stock Status
**Steps:**
1. Tener materiales con diferentes cantidades
2. Revisar tabla de inventario

**Expected:**
- [ ] Material con quantity = 0 → "Sin Stock" (rojo)
- [ ] Material quantity <= min_quantity → "Stock Bajo" (amarillo)
- [ ] Material quantity > min_quantity → "Disponible" (verde)

#### TC-INVENTORY-03: Gestión de Plantas
**Steps:**
1. Tab "Plantas"
2. Agregar nueva planta
3. Editar/eliminar planta

**Expected:**
- [ ] CRUD completo funciona
- [ ] Planta aparece en dropdown de formulario de órdenes

---

### 6. Cost Calculation

#### TC-COST-01: Orden con Materiales Calcula Costos
**Steps:**
1. Crear orden con:
   - Material A: 100 unidades × $500/unit = $50,000
   - Material B: 50 unidades × $1,000/unit = $50,000
2. Ver modal de detalles

**Expected:**
- [ ] "Total Materiales" = $100,000
- [ ] Se suma correctamente cada línea

#### TC-COST-02: Orden con Equipo Calcula Costos
**Steps:**
1. En orden, agregar equipo:
   - Equipo X: 5 horas × $15,000/h = $75,000
2. Ver detalles

**Expected:**
- [ ] "Total Equipos" = $75,000
- [ ] Costo por hora correcto

#### TC-COST-03: Orden con Team Calcula Costos
**Steps:**
1. En orden, agregar miembro:
   - Juan Pérez: 8h × $12,000/h = $96,000
2. Ver detalles

**Expected:**
- [ ] "Total Mano de Obra" = $96,000
- [ ] Se multiplica horas × tarifa

#### TC-COST-04: Costo Total Completo
**Steps:**
1. Crear orden con materiales, equipo y team
2. Verificar suma total

**Expected:**
- [ ] Costo Total = Material + Labor + Equipo + Energía + Mantenimiento
- [ ] Se muestra correctamente en badge verde grande

---

### 7. Validación de Formularios

#### TC-VALID-01: Campos Requeridos
**Steps:**
1. Intentar crear orden sin completar campos obligatorios
2. Click "Crear Orden"

**Expected:**
- [ ] Muestra errores bajo cada campo
- [ ] Resalta campos en rojo
- [ ] Formulario NO se envía
- [ ] Errores específicos por campo

#### TC-VALID-02: Números Positivos
**Steps:**
1. En cantidad, ingresar -10
2. Intentar guardar

**Expected:**
- [ ] Error: "Cantidad debe ser mayor a 0"
- [ ] No permite valores negativos

---

### 8. Rollback y Manejo de Errores

#### TC-ROLLBACK-01: Desconectar Internet
**Steps:**
1. Desconectar internet (o modo avión)
2. Intentar crear una orden
3. Click "Crear Orden"

**Expected:**
- [ ] Muestra error de conexión
- [ ] UI revierte (orden no aparece en lista)
- [ ] Mensaje de error específico
- [ ] Permite reintentar

#### TC-ROLLBACK-02: Error 500 del Servidor
**Steps:**
1. Simular error (p. ej., enviar datos inválidos)
2. Verificar rollback

**Expected:**
- [ ] Orden NO aparece en lista si el insert falló
- [ ] No quedan datos inconsistentes
- [ ] Mensaje de error claro

---

### 9. UI/UX

#### TC-UX-01: Empty States
**Steps:**
1. En una lista vacía (sin órdenes)

**Expected:**
- [ ] Muestra icono/friendly illustration
- [ ] Mensaje explicativo: "No hay órdenes..."
- [ ] Botón de acción principal visible

#### TC-UX-02: Loading States
**Steps:**
1. Cargar página de órdenes por primera vez

**Expected:**
- [ ] Spinner visible mientras carga
- [ ] Texto "Cargando órdenes..."
- [ ] No parpadea inestablemente

#### TC-UX-03: Success Messages
**Steps:**
1. Crear orden exitosamente

**Expected:**
- [ ] Toast/mensaje de éxito aparece
- [ ] Dice: "Orden de producción creada exitosamente"
- [ ] Desaparece después de 3-5 segundos
- [ ] Puede cerrarse manualmente

---

### 10. Responsive Design

#### TC-RESP-01: Mobile Orders
**Steps:**
1. Abrir Chrome DevTools
2. Activar dispositivo móvil (iPhone 14)
3. Ir a `/orders`

**Expected:**
- [ ] Layout de una columna (tabla scrollable)
- [ ] Botones tocables ≥ 44px
- [ ] Scroll horizontal en tablas
- [ ] Formulario usa ancho completo
- [ ] Header responsive

#### TC-RESP-02: Tablet
**Steps:**
1. Activar iPad en DevTools
2. Verificar layout

**Expected:**
- [ ] Grid stats 2 columnas
- [ ] Tablas legibles
- [ ] Sin overflow horizontal innecesario

---

## Test Execution Checklist

### Pre-Test Setup
- [ ] SUPABASE_SCHEMA.sql ejecutado
- [ ] Realtime habilitado en Supabase
- [ ] .env.local configurado
- [ ] `npm run dev` corriendo sin errores
- [ ] 2 usuarios creados (operario@test.com, ingeniero@test.com)

### Test Results

| Test ID | Status | Notes | Fails |
|---------|--------|-------|-------|
| TC-AUTH-01 | ⬜ | | |
| TC-AUTH-02 | ⬜ | | |
| TC-AUTH-03 | ⬜ | | |
| TC-AUTH-04 | ⬜ | | |
| TC-ORDERS-01 | ⬜ | | |
| TC-ORDERS-02 | ⬜ | | |
| TC-ORDERS-03 | ⬜ | | |
| TC-ORDERS-04 | ⬜ | | |
| TC-ORDERS-05 | ⬜ | | |
| TC-ORDERS-06 | ⬜ | | |
| TC-REALTIME-01 | ⬜ | | |
| TC-REALTIME-02 | ⬜ | | |
| TC-REALTIME-03 | ⬜ | | |
| TC-DASHBOARD-01 | ⬜ | | |
| TC-DASHBOARD-02 | ⬜ | | |
| TC-DASHBOARD-03 | ⬜ | | |
| TC-INVENTORY-01 | ⬜ | | |
| TC-INVENTORY-02 | ⬜ | | |
| TC-INVENTORY-03 | ⬜ | | |
| TC-COST-01 | ⬜ | | |
| TC-COST-02 | ⬜ | | |
| TC-COST-03 | ⬜ | | |
| TC-COST-04 | ⬜ | | |
| TC-VALID-01 | ⬜ | | |
| TC-VALID-02 | ⬜ | | |
| TC-ROLLBACK-01 | ⬜ | | |
| TC-ROLLBACK-02 | ⬜ | | |
| TC-UX-01 | ⬜ | | |
| TC-UX-02 | ⬜ | | |
| TC-UX-03 | ⬜ | | |
| TC-RESP-01 | ⬜ | | |
| TC-RESP-02 | ⬜ | | |

### Known Issues
- [x] Cost calculation in form submit - **IMPLEMENTED** (material_cost, labor_cost, equipment_cost, total_cost calculated automatically)
- [x] Inventory deduction on approval - **IMPLEMENTED** (when order approved, materials deducted from inventory)
- [x] Material selection shows equipment instead - **FIXED** (dropdown now correctly shows inventory materials)
- [ ] PDF export not implemented
- [x] Toast notifications missing - **IMPLEMENTED** (toast context and components added, used in order operations)

### Blockers
- ⬜ Database not configured
- ⬜ Supabase credentials missing
- ⬜ Realtime not enabled

---

## Quick Smoke Test (Prioritario)

Ejecutar primero estos 5:

1. ✅ Login/Logout funciona
2. ✅ Crear orden como operario
3. ✅ Ver orden en dashboard como ingeniero
4. ✅ Cambiar status (aprobar/rechazar)
5. ✅ Real-time sync entre pestañas

Si estos 5 pasan → MVP funcional. El resto es pulido.
