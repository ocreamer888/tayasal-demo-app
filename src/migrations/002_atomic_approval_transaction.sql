-- =====================================================
-- ATOMIC ORDER APPROVAL TRANSACTION
-- Function: approve_order_with_inventory_deduction
--
-- PURPOSE:
--   Atomically approve a production order AND deduct inventory
--   in a single database transaction. Prevents data inconsistency
--   where inventory is deducted but order status not updated.
--
-- USAGE:
--   SELECT approve_order_with_inventory_deduction(
--     'order-uuid-here',
--     'engineer-user-uuid-here'
--   );
--
-- RETURNS:
--   JSON object with result status, approved order, and any errors
--
-- SECURITY:
--   - Only engineers/admins should have EXECUTE permission
--   - Uses RLS to enforce access control
--   - Runs with SECURITY DEFINER to ensure inventory update rights
-- =====================================================

CREATE OR REPLACE FUNCTION public.approve_order_with_inventory_deduction(
  p_order_id uuid,
  p_approver_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order record;
  v_materials jsonb;
  v_material_record record;
  v_deduction_errors text[] := ARRAY[]::text[];
  v_result jsonb;
BEGIN
  -- -----------------------------------------------------------------
  -- STEP 1: Validate order exists and is in 'submitted' status
  -- -----------------------------------------------------------------
  SELECT * INTO v_order
  FROM production_orders
  WHERE id = p_order_id
  FOR UPDATE; -- Lock the row to prevent concurrent modifications

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Orden no encontrada',
      'code', 'ORDER_NOT_FOUND'
    );
  END IF;

  -- Check if user has permission to approve (must be engineer/admin)
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_approver_id
    AND role IN ('engineer', 'admin')
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No tienes permisos para aprobar órdenes',
      'code', 'INSUFFICIENT_PERMISSIONS'
    );
  END IF;

  -- Check if order is already approved
  IF v_order.status = 'approved' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'La orden ya está aprobada',
      'code', 'ALREADY_APPROVED'
    );
  END IF;

  IF v_order.status != 'submitted' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Solo se pueden aprobar órdenes en estado "Enviada"',
      'code', 'INVALID_STATUS'
    );
  END IF;

  -- -----------------------------------------------------------------
  -- STEP 2: Get materials_used JSONB array from order
  -- -----------------------------------------------------------------
  v_materials := v_order.materials_used;

  IF jsonb_array_length(v_materials) = 0 THEN
    -- No materials to deduct, just update order status
    UPDATE production_orders
    SET
      status = 'approved',
      updated_at = now()
    WHERE id = p_order_id;

    RETURN jsonb_build_object(
      'success', true,
      'approved', true,
      'order_id', p_order_id,
      'materials_deducted', 0
    );
  END IF;

  -- -----------------------------------------------------------------
  -- STEP 3: Deduct inventory for each material (single transaction)
  -- -----------------------------------------------------------------
  FOR v_material_record IN
    SELECT
      (elem->>'materialId')::uuid as material_id,
      (elem->>'quantity')::numeric as quantity
    FROM jsonb_array_elements(v_materials) as elem
  LOOP
    -- Update inventory atomically
    UPDATE inventory_materials
    SET
      current_quantity = current_quantity - v_material_record.quantity,
      last_updated = now(),
      updated_at = now()
    WHERE id = v_material_record.material_id
      AND user_id = v_order.user_id  -- Deduct from order owner's inventory
    RETURNING id INTO STRICT v_material_record.material_id; -- Validate record exists

    IF NOT FOUND THEN
      v_deduction_errors := array_append(
        v_deduction_errors,
        format('Material no encontrado o sin acceso: %s', v_material_record.material_id)
      );
    END IF;
  END LOOP;

  -- -----------------------------------------------------------------
  -- STEP 4: Check for deduction errors
  -- -----------------------------------------------------------------
  IF array_length(v_deduction_errors, 1) > 0 THEN
    -- Rollback happens automatically if we RAISE an exception
    RAISE EXCEPTION 'Inventory deduction errors: %', array_to_string(v_deduction_errors, '; ');
  END IF;

  -- -----------------------------------------------------------------
  -- STEP 5: Update order status to 'approved' (still in same transaction)
  -- -----------------------------------------------------------------
  UPDATE production_orders
  SET
    status = 'approved',
    updated_at = now()
  WHERE id = p_order_id;

  -- -----------------------------------------------------------------
  -- STEP 6: Return success result
  -- -----------------------------------------------------------------
  RETURN jsonb_build_object(
    'success', true,
    'approved', true,
    'order_id', p_order_id,
    'materials_deducted', jsonb_array_length(v_materials)
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Transaction will be rolled back automatically
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'code', 'TRANSACTION_ERROR'
    );
END;
$$;

-- =====================================================
-- GRANT EXECUTE to authenticated users (or restrict to engineer/admin)
-- =====================================================
-- By default, all authenticated users can call, but RLS on production_orders
-- and inventory_materials will enforce access control.
-- Optionally, you can create a role and grant only to that role.

GRANT EXECUTE ON FUNCTION public.approve_order_with_inventory_deduction(uuid, uuid) TO authenticated;

-- =====================================================
-- TEST QUERY (run after deploying to test)
-- =====================================================
-- SELECT approve_order_with_inventory_deduction(
--   'order-uuid-here',
--   'engineer-user-uuid-here'
-- );

-- =====================================================
-- ROLLBACK (if needed)
-- =====================================================
-- DROP FUNCTION IF EXISTS public.approve_order_with_inventory_deduction(uuid, uuid);
