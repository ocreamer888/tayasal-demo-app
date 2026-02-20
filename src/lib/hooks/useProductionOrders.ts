import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ProductionOrder,

} from '@/types/production-order';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/app/contexts/AuthContext';

interface UseProductionOrdersProps {
  userRole: 'operator' | 'engineer' | 'admin' | null;
}

type SortBy = 'date' | 'block_type' | 'quantity' | 'status' | 'created';

// Transform database production_order (snake_case) to app (camelCase)
function transformOrderFromDB(dbOrder: any): ProductionOrder {
  return {
    id: dbOrder.id,
    user_id: dbOrder.user_id,
    created_by_name: dbOrder.created_by_name,
    engineer_id: dbOrder.engineer_id,

    // Specs de producción
    block_type: dbOrder.block_type,
    block_size: dbOrder.block_size,
    quantity_produced: dbOrder.quantity_produced,
    production_date: dbOrder.production_date,
    production_shift: dbOrder.production_shift,

    // Tiempos
    start_time: dbOrder.start_time,
    end_time: dbOrder.end_time,
    duration_minutes: dbOrder.duration_minutes,

    // Recursos
    concrete_plant_id: dbOrder.concrete_plant_id,
    materials_used: dbOrder.materials_used || [],
    equipment_used: dbOrder.equipment_used || [],
    team_assigned: dbOrder.team_assigned || [],

    // Costos
    material_cost: dbOrder.material_cost || 0,
    labor_cost: dbOrder.labor_cost || 0,
    energy_cost: dbOrder.energy_cost || 0,
    maintenance_cost: dbOrder.maintenance_cost || 0,
    equipment_cost: dbOrder.equipment_cost || 0,
    total_cost: dbOrder.total_cost || 0,

    // Metadata
    status: dbOrder.status,
    notes: dbOrder.notes,

    createdAt: dbOrder.created_at,
    updatedAt: dbOrder.updated_at,
  };
}

export function useProductionOrders({ userRole }: UseProductionOrdersProps) {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  const { user } = useAuth();
  const supabaseInstance = supabase;

  // Fetch orders from Supabase
  const fetchOrders = useCallback(async () => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Build query based on user role
      let query = supabase
        .from('production_orders')
        .select('*')
        .order('production_date', { ascending: false });

      // Filter by user_id if operator (only see their own orders)
      if (userRole === 'operator') {
        query = query.eq('user_id', user.id);
      }
      // Engineers and admins see all orders

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const transformedData = (data || []).map(transformOrderFromDB);
      setOrders(transformedData);
    } catch (err) {
      console.error('Error fetching production orders:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar órdenes de producción');
    } finally {
      setLoading(false);
    }
  }, [user, userRole, supabase]);

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    // Build filter based on user role
    const filter = userRole === 'operator' ? `user_id=eq.${user.id}` : undefined;

    const channel = supabase
      .channel(`orders-${userRole || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'production_orders',
          filter: filter,
        },
        (payload) => {
          console.log('Production order change received:', payload);

          if (payload.eventType === 'INSERT') {
            const transformedOrder = transformOrderFromDB(payload.new);
            setOrders(prev => {
              const exists = prev.some(o => o.id === transformedOrder.id);
              if (exists) {
                return prev.map(o => o.id === transformedOrder.id ? transformedOrder : o);
              }
              return [transformedOrder, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const transformedOrder = transformOrderFromDB(payload.new);
            setOrders(prev =>
              prev.map(o => o.id === payload.new.id ? transformedOrder : o)
            );
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev => prev.filter(o => o.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabaseInstance.removeChannel(channel);
    };
  }, [user, userRole, supabase]);

  // Filter and sort orders - memoized
  const processedOrders = useMemo(() => {
    let filtered = [...orders];

    // Search filter
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        order.block_type.toLowerCase().includes(query) ||
        order.block_size.toLowerCase().includes(query) ||
        order.created_by_name.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'block_type':
          return a.block_type.localeCompare(b.block_type);
        case 'quantity':
          return b.quantity_produced - a.quantity_produced;
        case 'status':
          return a.status.localeCompare(b.status);
        case 'created':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return filtered;
  }, [orders, searchTerm, statusFilter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(processedOrders.length / perPage);

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * perPage;
    const endIndex = startIndex + perPage;
    return processedOrders.slice(startIndex, endIndex);
  }, [processedOrders, currentPage, perPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortBy, perPage]);

  // CRUD Operations

  const addOrder = useCallback(async (orderData: Omit<ProductionOrder, 'id' | 'createdAt' | 'updatedAt' | 'user_id' | 'created_by_name'>) => {
    if (!user) {
      throw new Error('Debes iniciar sesión para crear órdenes');
    }

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    // Create optimistic order
    const optimisticOrder: ProductionOrder = {
      ...orderData,
      id: tempId,
      user_id: user.id,
      created_by_name: user.user_metadata?.full_name || user.email || 'Usuario',
      createdAt: now,
      updatedAt: now,
    };

    // Add optimistically
    setOrders(prev => [optimisticOrder, ...prev]);

    try {
      const newOrder = {
        user_id: user.id,
        created_by_name: user.user_metadata?.full_name || user.email || 'Usuario',
        ...orderData,
        created_at: now,
        updated_at: now,
      };

      const { data, error: insertError } = await supabase
        .from('production_orders')
        .insert([newOrder])
        .select()
        .single();

      if (insertError) throw insertError;

      const transformedData = transformOrderFromDB(data);

      // Replace temp with real
      setOrders(prev =>
        prev.map(o => o.id === tempId ? transformedData : o)
      );

      return transformedData;
    } catch (err) {
      console.error('Error adding production order:', err);

      // Rollback
      setOrders(prev => prev.filter(o => o.id !== tempId));

      throw err;
    }
  }, [user, supabase]);

  const updateOrder = useCallback(async (id: string, updates: Partial<ProductionOrder>) => {
    if (!user) return;

    const previousOrder = orders.find(o => o.id === id);
    if (!previousOrder) return;

    // Update UI optimistically
    setOrders(prev =>
      prev.map(o =>
        o.id === id
          ? { ...o, ...updates, updatedAt: new Date().toISOString() }
          : o
      )
    );

    try {
      const updateData: any = { updated_at: new Date().toISOString() };

      // Map camelCase to snake_case
      Object.keys(updates).forEach(key => {
        if (key === 'id' || key === 'user_id' || key === 'created_by_name' || key === 'createdAt') return;
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        updateData[dbKey] = (updates as any)[key];
      });

      const { error: updateError } = await supabase
        .from('production_orders')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;
    } catch (err) {
      console.error('Error updating production order:', err);

      // Rollback
      setOrders(prev =>
        prev.map(o => o.id === id ? previousOrder : o)
      );

      throw err;
    }
  }, [user, orders, supabase]);

  const deleteOrder = useCallback(async (id: string) => {
    if (!user) return;

    const deletedOrder = orders.find(o => o.id === id);
    if (!deletedOrder) return;

    // Optimistic delete
    setOrders(prev => prev.filter(o => o.id !== id));

    try {
      const { error: deleteError } = await supabase
        .from('production_orders')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;
    } catch (err) {
      console.error('Error deleting production order:', err);

      // Rollback
      setOrders(prev => {
        const index = prev.findIndex(o =>
          new Date(o.createdAt) < new Date(deletedOrder.createdAt)
        );
        if (index === -1) {
          return [...prev, deletedOrder];
        }
        return [...prev.slice(0, index), deletedOrder, ...prev.slice(index)];
      });

      throw err;
    }
  }, [user, orders, supabase]);

  const updateOrderStatus = useCallback(async (id: string, status: ProductionOrder['status']) => {
    const currentOrder = orders.find(o => o.id === id);
    if (!currentOrder) {
      throw new Error('Orden no encontrada');
    }

    // Optimistic update: set status to new value immediately
    const previousStatus = currentOrder.status;
    setOrders(prev =>
      prev.map(o => o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o)
    );

    try {
      // Use atomic database function for approval
      if (status === 'approved' && previousStatus !== 'approved') {
        // Call RPC: approve_order_with_inventory_deduction
        const { data: result, error: rpcError } = await supabase.rpc(
          'approve_order_with_inventory_deduction',
          {
            p_order_id: id,
            p_approver_id: user?.id
          }
        );

        if (rpcError) {
          throw new Error(`Error aprobando orden: ${rpcError.message}`);
        }

        if (!result.success) {
          // Rollback optimistic update
          setOrders(prev =>
            prev.map(o => o.id === id ? { ...o, status: previousStatus, updatedAt: new Date().toISOString() } : o)
          );

          // Provide user-friendly error messages based on error code
          switch (result.code) {
            case 'ORDER_NOT_FOUND':
              throw new Error('Orden no encontrada');
            case 'INSUFFICIENT_PERMISSIONS':
              throw new Error('No tienes permisos para aprobar órdenes');
            case 'ALREADY_APPROVED':
              throw new Error('La orden ya está aprobada');
            case 'INVALID_STATUS':
              throw new Error('Solo se pueden aprobar órdenes en estado "Enviada"');
            default:
              throw new Error(result.error || 'Error desconocido al aprobar la orden');
          }
        }

        // Success: result includes materials_deducted count
        console.log(`Order ${id} approved, ${result.materials_deducted} materials deducted`);
      } else {
        // For non-approval status changes, use regular updateOrder
        await updateOrder(id, { status });
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      // Rollback already handled above for approval case
      // For non-approval, updateOrder has its own rollback
      throw err;
    }
  }, [orders, user, supabase, updateOrder]);

  return {
    orders,
    filteredOrders: paginatedOrders,
    allFilteredOrders: processedOrders,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    loading,
    error,
    refetch: fetchOrders,
    // Pagination
    currentPage,
    setCurrentPage,
    perPage,
    setPerPage,
    totalPages,
    totalFilteredCount: processedOrders.length,
    // CRUD
    addOrder,
    updateOrder,
    deleteOrder,
    updateOrderStatus,
  };
}
