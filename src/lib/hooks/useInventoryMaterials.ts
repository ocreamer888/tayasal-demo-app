import { useState, useEffect, useCallback, useMemo } from 'react';
import { InventoryMaterial } from '@/types/inventory';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/app/contexts/AuthContext';

type SortBy = 'name' | 'category' | 'quantity' | 'price';

function transformInventoryFromDB(dbMaterial: Record<string, unknown>): InventoryMaterial {
  return {
    id: dbMaterial.id as string,
    user_id: dbMaterial.user_id as string,
    material_name: dbMaterial.material_name as string,
    category: dbMaterial.category as 'cement' | 'sand' | 'aggregate' | 'additive' | 'other',
    unit: dbMaterial.unit as string,
    current_quantity: dbMaterial.current_quantity as number,
    unit_cost: dbMaterial.unit_cost as number,
    min_stock_quantity: dbMaterial.min_stock_quantity as number,
    location: dbMaterial.location as string,
    last_updated: (dbMaterial.last_updated as string) || new Date().toISOString(),
    created_at: dbMaterial.created_at as string,
    updated_at: dbMaterial.updated_at as string,
  };
}

export function useInventoryMaterials() {
  const [materials, setMaterials] = useState<InventoryMaterial[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>('all');
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  const { user } = useAuth();
  const supabaseInstance = supabase;

  const fetchMaterials = useCallback(async () => {
    if (!user) {
      setMaterials([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // ALL users see all inventory materials (data is shared)
      const { data, error: fetchError } = await supabase
        .from('inventory_materials')
        .select('*')
        .order('material_name', { ascending: true });

      if (fetchError) throw fetchError;

      const transformedData = (data || []).map(transformInventoryFromDB);
      setMaterials(transformedData);
    } catch (err) {
      console.error('Error fetching inventory materials:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar materiales de inventario');
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  // Real-time subscription - ALL users see all changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`inventory-all-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory_materials',
        },
        (payload) => {
          console.log('Inventory material change received:', payload);

          if (payload.eventType === 'INSERT') {
            const transformedMaterial = transformInventoryFromDB(payload.new);
            setMaterials(prev => {
              const exists = prev.some(m => m.id === transformedMaterial.id);
              if (exists) {
                return prev.map(m => m.id === transformedMaterial.id ? transformedMaterial : m);
              }
              return [...prev, transformedMaterial];
            });
          } else if (payload.eventType === 'UPDATE') {
            const transformedMaterial = transformInventoryFromDB(payload.new);
            setMaterials(prev =>
              prev.map(m => m.id === payload.new.id ? transformedMaterial : m)
            );
          } else if (payload.eventType === 'DELETE') {
            setMaterials(prev => prev.filter(m => m.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabaseInstance.removeChannel(channel);
    };
  }, [user, supabase]);

  // Filter and sort
  const processedMaterials = useMemo(() => {
    let filtered = [...materials];

    // Search
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(material =>
        material.material_name.toLowerCase().includes(query) ||
        material.location.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(material => material.category === categoryFilter);
    }

    // Stock filter
    if (stockFilter !== 'all') {
      filtered = filtered.filter(material => {
        const isOutOfStock = material.current_quantity === 0;
        const isLowStock = material.current_quantity <= material.min_stock_quantity && material.current_quantity > 0;

        switch (stockFilter) {
          case 'in-stock': return !isOutOfStock && !isLowStock;
          case 'low-stock': return isLowStock;
          case 'out-of-stock': return isOutOfStock;
          default: return true;
        }
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.material_name.localeCompare(b.material_name);
        case 'quantity':
          return b.current_quantity - a.current_quantity;
        case 'price':
          return b.unit_cost - a.unit_cost;
        case 'category':
        default:
          return a.category.localeCompare(b.category);
      }
    });

    return filtered;
  }, [materials, searchTerm, categoryFilter, stockFilter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(processedMaterials.length / perPage);

  const paginatedMaterials = useMemo(() => {
    const startIndex = (currentPage - 1) * perPage;
    const endIndex = startIndex + perPage;
    return processedMaterials.slice(startIndex, endIndex);
  }, [processedMaterials, currentPage, perPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, stockFilter, sortBy, perPage]);

  // CRUD Operations

  const addMaterial = useCallback(async (material: Omit<InventoryMaterial, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'last_updated'>) => {
    if (!user) {
      throw new Error('Debes iniciar sesión para agregar materiales');
    }

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    // Optimistic add
    const optimisticMaterial: InventoryMaterial = {
      ...material,
      id: tempId,
      user_id: user.id,
      last_updated: now,
      created_at: now,
      updated_at: now,
    };

    setMaterials(prev => [optimisticMaterial, ...prev]);

    try {
      const newMaterial = {
        user_id: user.id,
        ...material,
        last_updated: now,
        created_at: now,
        updated_at: now,
      };

      const { data, error: insertError } = await supabase
        .from('inventory_materials')
        .insert([newMaterial])
        .select()
        .single();

      if (insertError) throw insertError;

      const transformedData = transformInventoryFromDB(data);

      setMaterials(prev =>
        prev.map(m => m.id === tempId ? transformedData : m)
      );

      return transformedData;
    } catch (err) {
      console.error('Error adding inventory material:', err);

      // Rollback
      setMaterials(prev => prev.filter(m => m.id !== tempId));

      throw err;
    }
  }, [user, supabase]);

  const updateMaterial = useCallback(async (id: string, updates: Partial<InventoryMaterial>) => {
    if (!user) return;

    const previousMaterial = materials.find(m => m.id === id);
    if (!previousMaterial) return;

    setMaterials(prev =>
      prev.map(m =>
        m.id === id
          ? { ...m, ...updates, updated_at: new Date().toISOString() }
          : m
      )
    );

    try {
      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

      Object.keys(updates).forEach(key => {
        if (key === 'id' || key === 'user_id' || key === 'created_at' || key === 'last_updated') return;
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        updateData[dbKey] = (updates as Record<string, unknown>)[key];
      });

      const { error: updateError } = await supabase
        .from('inventory_materials')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;
    } catch (err) {
      console.error('Error updating inventory material:', err);

      // Rollback
      setMaterials(prev =>
        prev.map(m => m.id === id ? previousMaterial : m)
      );

      throw err;
    }
  }, [user, materials, supabase]);

  const updateStock = useCallback(async (id: string, quantityDelta: number, reason?: string) => {
    if (!user) return;

    const material = materials.find(m => m.id === id);
    if (!material) return;

    const newQuantity = Math.max(0, material.current_quantity + quantityDelta);

    // Optimistic update
    setMaterials(prev =>
      prev.map(m =>
        m.id === id
          ? {
              ...m,
              current_quantity: newQuantity,
              last_updated: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          : m
      )
    );

    try {
      const { error: updateError } = await supabase
        .from('inventory_materials')
        .update({
          current_quantity: newQuantity,
          last_updated: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Log stock movement (optional - could have a separate table)
      if (reason) {
        console.log(`Stock update: ${material.material_name} ${quantityDelta > 0 ? '+' : ''}${quantityDelta} (${reason})`);
      }
    } catch (err) {
      console.error('Error updating stock:', err);

      // Rollback
      setMaterials(prev =>
        prev.map(m =>
          m.id === id
            ? { ...m, current_quantity: material.current_quantity }
            : m
        )
      );

      throw err;
    }
  }, [user, materials, supabase]);

  return {
    materials,
    filteredMaterials: paginatedMaterials,
    allFilteredMaterials: processedMaterials,
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    stockFilter,
    setStockFilter,
    sortBy,
    setSortBy,
    loading,
    error,
    refetch: fetchMaterials,
    // Pagination
    currentPage,
    setCurrentPage,
    perPage,
    setPerPage,
    totalPages,
    totalFilteredCount: processedMaterials.length,
    // CRUD
    addMaterial,
    updateMaterial,
    updateStock,
  };
}
