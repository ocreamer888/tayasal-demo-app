'use client';

import { useProductionOrders } from '@/lib/hooks/useProductionOrders';
import { useInventoryMaterials } from '@/lib/hooks/useInventoryMaterials';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { Package, TrendingUp, Clock, CheckCircle, AlertTriangle, Plus } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function ProductionDashboard() {
  const { user } = useAuth();
  const userRole = (user?.user_metadata?.role as 'operator' | 'engineer' | 'admin') || 'operator';

  const {
    orders,
    loading: ordersLoading,
    allFilteredOrders,
  } = useProductionOrders({ userRole });

  const {
    materials: inventoryMaterials,
    loading: inventoryLoading,
  } = useInventoryMaterials({ userRole });

  // Calculate KPIs
  const totalOrders = orders.length;
  const totalBlocksProduced = orders.reduce((sum, order) => sum + order.quantity_produced, 0);
  const avgCostPerOrder = totalOrders > 0
    ? orders.reduce((sum, order) => sum + order.total_cost, 0) / totalOrders
    : 0;
  const pendingApprovals = orders.filter(o => o.status === 'submitted').length;
  const approvedOrders = orders.filter(o => o.status === 'approved').length;

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

  const productionByMonth = Array.from(
    orders.reduce((acc, order) => {
      const month = format(new Date(order.production_date), 'MMMM yyyy', { locale: es });
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

  const lowStockMaterials = inventoryMaterials.filter(
    m => m.current_quantity <= m.min_stock_quantity && m.current_quantity > 0
  );

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const quickStats = [
    {
      title: 'Órdenes de Producción',
      value: totalOrders,
      subtitle: 'Total registradas',
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Bloques Producidos',
      value: totalBlocksProduced.toLocaleString(),
      subtitle: 'Unidades totales',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Costo Promedio',
      value: formatCurrency(avgCostPerOrder),
      subtitle: 'Por orden',
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      title: 'Pendientes',
      value: pendingApprovals,
      subtitle: 'Aprobación requerida',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, idx) => (
          <Card key={idx} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <p className={`text-2xl font-bold ${stat.color} mt-2`}>{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.bgColor}`}>
                <stat.icon size={24} className={stat.color} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Production Trend */}
        <Card title="Producción por Mes" className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={productionByMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => [value.toLocaleString(), 'Cantidad']}
                locale="es-ES"
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="cantidad"
                stroke="#3B82F6"
                fill="#93C5FD"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Orders by Status */}
        <Card title="Órdenes por Estado" className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={ordersByStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {ordersByStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Production by Block Type */}
        <Card title="Producción por Tipo de Bloque" className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={productionByType}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => [value.toLocaleString(), 'Unidades']}
                locale="es-ES"
              />
              <Bar dataKey="value" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Low Stock Alert */}
        <Card title="Alertas de Stock Bajo" className="p-6">
          {lowStockMaterials.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
              <p>Todos los materiales tienen stock suficiente</p>
            </div>
          ) : (
            <div className="space-y-4">
              {lowStockMaterials.slice(0, 5).map((material) => (
                <div key={material.id} className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{material.material_name}</p>
                    <p className="text-sm text-gray-600">
                      Stock: {material.current_quantity} / Mín: {material.min_stock_quantity} {material.unit}
                    </p>
                  </div>
                  <AlertTriangle size={24} className="text-yellow-600" />
                </div>
              ))}
              {lowStockMaterials.length > 5 && (
                <p className="text-center text-sm text-gray-500">
                  Y {lowStockMaterials.length - 5} más...
                </p>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Recent Orders */}
      <Card title="Órdenes Recientes" className="p-6">
        {ordersLoading ? (
          <div className="text-center py-12">Cargando órdenes...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No hay órdenes registradas
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Costo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.slice(0, 10).map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      #{order.id.substring(0, 8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-medium text-gray-900">{order.block_type}</p>
                      <p className="text-sm text-gray-500">{order.block_size}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.quantity_produced.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(order.production_date), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'submitted'
                          ? 'bg-yellow-100 text-yellow-800'
                          : order.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status === 'draft' && 'Borrador'}
                        {order.status === 'submitted' && 'Enviada'}
                        {order.status === 'approved' && 'Aprobada'}
                        {order.status === 'rejected' && 'Rechazada'}
                        {order.status === 'archived' && 'Archivada'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(order.total_cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
