import { createClient } from '@supabase/supabase-js';

// Service-role client — bypasses RLS; server-only
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface AuditEventParams {
  action: string;
  userId?: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: object;
  ip?: string;
}

/**
 * Log a security-relevant event to the audit_logs table.
 * Failures are silent — audit logging must not break the request flow.
 */
export async function logAuditEvent(params: AuditEventParams): Promise<void> {
  const { action, userId, resourceType, resourceId, metadata, ip } = params;

  try {
    await adminClient.from('audit_logs').insert({
      action,
      user_id: userId ?? null,
      resource_type: resourceType ?? null,
      resource_id: resourceId ?? null,
      metadata: metadata ?? {},
      ip_address: ip ?? null,
    });
  } catch (err) {
    // Log to server console but never throw — audit failure must not block requests
    console.error('Audit log failed:', err);
  }
}
