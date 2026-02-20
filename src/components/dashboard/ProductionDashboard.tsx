'use client';

import { useProductionOrders } from '@/lib/hooks/useProductionOrders';
import { useInventoryMaterials } from '@/lib/hooks/useInventoryMaterials';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MetricCard } from '@/components/ui/MetricCard';

interface ProductionDashboardProps {
  userRole?: 'operator' | 'engineer' | 'admin' | null;
}

export function ProductionDashboard({ userRole = 'operator' }: ProductionDashboardProps) {
  useAuth();

  const {
    orders,
    loading: ordersLoading,
  } = useProductionOrders({ userRole });

  const {
    materials: inventoryMaterials,
  } = useInventoryMaterials({ userRole });

  // Calculate KPIs
  const totalOrders = orders.length;
  const totalBlocksProduced = orders.reduce((sum, order) => sum + order.quantity_produced, 0);
  const avgCostPerOrder = totalOrders > 0
    ? orders.reduce((sum, order) => sum + order.total_cost, 0) / totalOrders
    : 0;

  // Data for charts
  const ordersByStatus = [
    { name: 'Borrador', value: orders.filter(o => o.status === 'draft').length },
    { name: 'Enviadas', value: orders.filter(o => o.status === 'submitted').length },
    { name: 'Aprobadas', value: orders.filter(o => o.status === 'approved').length },
    { name: 'Rechazadas', value: orders.filter(o => o.status === 'rejected').length },
  ];

  const productionByType = Array.from(
    orders.reduce((acc, order) => {
      acc.set(order.block_type, (acc.get(order.block_type) || 0) + order.quantity_produced);
      return acc;
    }, new Map<string, number>())
  ).map(([name, value]) => ({ name, value }));

  const productionByMonthRaw = Array.from(
    orders.reduce((acc, order) => {
      // Skip orders without production_date or with invalid date
      if (!order.production_date) return acc;
      const date = new Date(order.production_date);
      if (isNaN(date.getTime())) {
        console.warn('Invalid production_date for order:', order.id);
        return acc;
      }
      const month = format(date, 'MMMM yyyy', { locale: es });
      const current = acc.get(month) || { quantity: 0, cost: 0 };
      acc.set(month, {
        quantity: current.quantity + order.quantity_produced,
        cost: current.cost + order.total_cost,
      });
      return acc;
    }, new Map<string, { quantity: number; cost: number }>())
  ).map(([month, data]) => ({
    month: month.charAt(0).toUpperCase() + month.slice(1),
    cantidad: data.quantity,
    costo: Math.round(data.cost),
  }))
  .reverse()
  .slice(0, 6);

  // Role-based data filtering: remove cost data for operators
  const productionByMonth = (userRole === 'operator')
    ? productionByMonthRaw.map(({ month, cantidad }) => ({ month, cantidad }))
    : productionByMonthRaw;

  const lowStockMaterials = inventoryMaterials.filter(
    m => m.current_quantity <= m.min_stock_quantity && m.current_quantity > 0
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards - Premium Metric Cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 w-full">
        <MetricCard
          title="Órdenes de Producción"
          value={totalOrders}
          description="Total registradas"
        />
        <MetricCard
          title="Bloques Producidos"
          value={totalBlocksProduced}
          description="Unidades totales"
        />
        {(userRole === 'engineer' || userRole === 'admin') && (
          <MetricCard
            title="Costo Promedio"
            value={formatCurrency(avgCostPerOrder)}
            description="Por orden"
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 auto-rows-auto">
        {/* Production Trend */}
        <Card className="flex flex-col">
          <CardHeader className="w-full flex-shrink-0">
            <CardTitle className="text-h3 text-neutral-900">Producción por Mes</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col w-full px-4 pb-0 min-h-[300px]">
            <ChartContainer
              config={{
                cantidad: {
                  label: "Cantidad",
                  color: "hsl(var(--chart-1))",
                },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={productionByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--muted-foreground)" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    className="text-neutral-500"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    className="text-neutral-500"
                  />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="cantidad"
                    stroke="var(--chart-1)"
                    fill="var(--chart-1)"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Orders by Status */}
        <Card className="flex flex-col">
          <CardHeader className="w-full flex-shrink-0">
            <CardTitle className="text-h3 text-neutral-900">Órdenes por Estado</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col w-full px-4 pb-0 min-h-[300px] flex items-center justify-center">
            <ChartContainer
              config={{
                value: {
                  label: "Cantidad",
                  color: "hsl(var(--chart-1))",
                },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ordersByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent ? percent * 100 : 0).toFixed(0)}%`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {ordersByStatus.map((_entry, index) => {
                      const colors = ['var(--chart-1)', 'var(--chart-3)', 'var(--destructive)', 'var(--muted-foreground)'];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Pie>
                  <Tooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 auto-rows-auto">
        {/* Production by Block Type */}
        <Card className="flex flex-col p-6">
          <CardHeader className="w-full flex-shrink-0">
            <CardTitle className="text-h3 text-neutral-900">Producción por Tipo de Bloque</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col w-full px-4 pb-0 min-h-[300px]">
            <ChartContainer
              config={{
                value: {
                  label: "Unidades",
                  color: "hsl(var(--chart-2))",
                },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productionByType}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--muted-foreground)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    className="text-neutral-500"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    className="text-neutral-500"
                  />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="var(--chart-2)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card className="flex flex-col min-h-0 p-6">
          <CardHeader className="w-full flex-shrink-0">
            <CardTitle className="text-h3 text-neutral-900">Alertas de Stock Bajo</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center px-0 pb-0 min-h-0">
            {lowStockMaterials.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
                <CheckCircle size={48} className="text-green-100 mb-4" />
                <p className="font-medium">Todos los materiales tienen stock suficiente</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[200px] overflow-y-auto">
                {lowStockMaterials.slice(0, 5).map((material) => (
                  <div
                    key={material.id}
                    className="flex items-center justify-between rounded-lg border border-yellow-200 bg-yellow-50 p-4"
                  >
                    <div>
                      <p className="font-medium text-neutral-900">{material.material_name}</p>
                      <p className="text-sm text-neutral-600">
                        Stock: {material.current_quantity} / Mín: {material.min_stock_quantity} {material.unit}
                      </p>
                    </div>
                    <AlertTriangle size={24} className="text-yellow-600 shrink-0" />
                  </div>
                ))}
                {lowStockMaterials.length > 5 && (
                  <p className="text-center text-sm text-neutral-500">
                    Y {lowStockMaterials.length - 5} más...
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="p-6">
        <CardHeader className="w-full">
          <CardTitle className="text-h3 text-neutral-900">Órdenes Recientes</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {ordersLoading ? (
            <div className="py-12 text-center text-neutral-500">Cargando órdenes...</div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center text-neutral-500">
              No hay órdenes registradas
            </div>
          ) : (
            <div className="rounded-xl border border-neutral-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200">
                    <th className="h-12 px-6 text-left text-xs font-semibold uppercase tracking-wider text-neutral-600">ID</th>
                    <th className="h-12 px-6 text-left text-xs font-semibold uppercase tracking-wider text-neutral-600">Tipo</th>
                    <th className="h-12 px-6 text-left text-xs font-semibold uppercase tracking-wider text-neutral-600">Cantidad</th>
                    <th className="h-12 px-6 text-left text-xs font-semibold uppercase tracking-wider text-neutral-600">Fecha</th>
                    <th className="h-12 px-6 text-left text-xs font-semibold uppercase tracking-wider text-neutral-600">Estado</th>
                    {(userRole === 'engineer' || userRole === 'admin') && (
                      <th className="h-12 px-6 text-left text-xs font-semibold uppercase tracking-wider text-neutral-600">Costo</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {orders.slice(0, 10).map((order) => {
                    const statusVariant =
                      order.status === 'approved'
                        ? 'success'
                        : order.status === 'submitted'
                        ? 'warning'
                        : order.status === 'rejected'
                        ? 'error'
                        : 'secondary';

                    return (
                      <tr key={order.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-neutral-900">
                          #{order.id.substring(0, 8)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="font-semibold text-neutral-900">{order.block_type}</p>
                          <p className="text-sm text-neutral-500">{order.block_size}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-neutral-700 tabular-nums">
                          {order.quantity_produced.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                          {order.production_date ? format(new Date(order.production_date), 'dd/MM/yyyy') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={statusVariant}>
                            {order.status === 'draft' && 'Borrador'}
                            {order.status === 'submitted' && 'Enviada'}
                            {order.status === 'approved' && 'Aprobada'}
                            {order.status === 'rejected' && 'Rechazada'}
                            {order.status === 'archived' && 'Archivada'}
                          </Badge>
                        </td>
                        {(userRole === 'engineer' || userRole === 'admin') && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-neutral-900 tabular-nums">
                            {formatCurrency(order.total_cost)}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
